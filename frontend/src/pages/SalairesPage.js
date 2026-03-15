import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const MOIS_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const SalairesPage = () => {
  const [salaires, setSalaires] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [calculating, setCalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, annee]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salairesRes, employesRes] = await Promise.all([
        apiClient.get('/salaires', { params: { mois, annee } }),
        apiClient.get('/employes'),
      ]);
      setSalaires(salairesRes.data);
      setEmployes(employesRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3000);
  };

  const handleCalculateAll = async () => {
    setCalculating(true);
    setErrorMsg('');
    try {
      await Promise.all(employes.map(emp =>
        apiClient.post('/salaires/calculate', { employe_id: emp._id, mois, annee })
      ));
      showMsg(setSuccessMsg, `✅ Salaires calculés pour ${employes.length} employé(s) — ${MOIS_LABELS[mois - 1]} ${annee}`);
      loadData();
    } catch (error) {
      showMsg(setErrorMsg, "Erreur lors du calcul");
    } finally {
      setCalculating(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      await apiClient.put(`/salaires/${id}/validate`);
      showMsg(setSuccessMsg, '✅ Salaire validé et marqué comme payé');
      loadData();
    } catch (error) {
      showMsg(setErrorMsg, "Erreur lors de la validation");
    }
  };

  const handleValidateAll = async () => {
    if (!window.confirm(`Voulez-vous valider TOUS les salaires calculés pour ${MOIS_LABELS[mois - 1]} ${annee} ?`)) return;
    setCalculating(true);
    try {
      const res = await apiClient.put('/salaires/validate-all', { mois, annee });
      showMsg(setSuccessMsg, `✅ ${res.data.count} salaire(s) validé(s) avec succès`);
      loadData();
    } catch (error) {
      showMsg(setErrorMsg, "Erreur lors de la validation groupée");
    } finally {
      setCalculating(false);
    }
  };

  const handlePrint = (salaire) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Bulletin de Paie - ${salaire.employe.prenom} ${salaire.employe.nom}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-info h1 { margin: 0; color: #6366f1; }
            .bulletin-title { text-align: center; margin: 30px 0; text-transform: uppercase; letter-spacing: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .info-box h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; background: #f9fafb; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .total-row { font-weight: bold; background: #f3f4f6; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; color: #666; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>RH Application</h1>
              <p>123 Rue de l'Entreprise<br>75000 Paris, France</p>
            </div>
            <div class="period-info" style="text-align: right">
              <h2>BULLETIN DE PAIE</h2>
              <p>Période : <strong>${MOIS_LABELS[salaire.mois - 1]} ${salaire.annee}</strong></p>
              <p>Date d'édition : ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <h3>Employeur</h3>
              <p><strong>RH Solutions S.A.</strong><br>Siret : 123 456 789 00012<br>Code APE : 6201Z</p>
            </div>
            <div class="info-box">
              <h3>Salarié</h3>
              <p><strong>${salaire.employe.prenom} ${salaire.employe.nom}</strong><br>
              Matricule : ${salaire.employe.matricule}<br>
              Poste : ${salaire.employe.poste || 'Employé'}<br>
              Service : ${salaire.employe.service?.nom_service || 'N/A'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Nombre / Base</th>
                <th>Taux</th>
                <th>Gain (DT)</th>
                <th>Retenue (DT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Salaire de base</td>
                <td>${salaire.heures_normales} h</td>
                <td>${salaire.prix_heure}</td>
                <td>${(salaire.heures_normales * salaire.prix_heure).toFixed(2)}</td>
                <td></td>
              </tr>
              <tr>
                <td>Heures supplémentaires (150%)</td>
                <td>${salaire.heures_supp} h</td>
                <td>${(salaire.prix_heure * 1.5).toFixed(2)}</td>
                <td>${(salaire.heures_supp * salaire.prix_heure * 1.5).toFixed(2)}</td>
                <td></td>
              </tr>
              <tr>
                <td>Primes exceptionnelles</td>
                <td>1</td>
                <td>${salaire.primes_total}</td>
                <td>${salaire.primes_total.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr>
                <td>Absences</td>
                <td>${salaire.absences || 0} jours</td>
                <td>—</td>
                <td></td>
                <td>${(salaire.absences_deductions || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Retards</td>
                <td>—</td>
                <td>—</td>
                <td></td>
                <td>${(salaire.retards_deductions || 0).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td>${salaire.salaire_brut.toFixed(2)}</td>
                <td>${salaire.deductions.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end; margin-top: 20px">
            <div style="background: #1e1b4b; color: white; padding: 20px 40px; border-radius: 8px; text-align: center">
              <p style="margin: 0; font-size: 14px; text-transform: uppercase; opacity: 0.8">Net à Payer</p>
              <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: 800">${salaire.salaire_net.toFixed(2)} DT</p>
            </div>
          </div>

          <div class="footer">
            <p>Signature de l'employeur</p>
            <p>Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.</p>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Summary stats
  const totalBrut = salaires.reduce((a, s) => a + (s.salaire_brut || 0), 0);
  const totalNet = salaires.reduce((a, s) => a + (s.salaire_net || 0), 0);
  const totalDeductions = salaires.reduce((a, s) => a + (s.deductions || 0), 0);
  const payes = salaires.filter(s => s.statut === 'paye').length;
  const calcules = salaires.filter(s => s.statut === 'calcule').length;

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement des salaires...</div>;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Gestion des Salaires</h1>
          <p className="page-subtitle">Calcul et validation des fiches de paie mensuelles</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={mois}
            onChange={e => setMois(parseInt(e.target.value))}
            style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13.5,
            }}
          >
            {MOIS_LABELS.map((label, i) => (
              <option key={i + 1} value={i + 1}>{label}</option>
            ))}
          </select>
          <select
            value={annee}
            onChange={e => setAnnee(parseInt(e.target.value))}
            style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13.5,
            }}
          >
            {[2024, 2025, 2026, 2027].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleCalculateAll} disabled={calculating}>
            {calculating ? '⏳ Calcul en cours...' : '🧮 Calculer Tous'}
          </button>
          {calcules > 0 && (
            <button className="btn-success" onClick={handleValidateAll} disabled={calculating} style={{ padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--success)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
              ✅ Valider Tout ({calcules})
            </button>
          )}
        </div>
      </div>

      {successMsg && <div className="success-message">{successMsg}</div>}
      {errorMsg && <div className="error-message">⚠️ {errorMsg}</div>}

      {/* KPI Cards */}
      <div className="kpi-container">
        <div className="kpi-card kpi-info">
          <div className="kpi-card-top"><div className="kpi-icon-box">💼</div></div>
          <div>
            <p className="kpi-label">Masse Salariale Brute</p>
            <p className="kpi-value" style={{ fontSize: 22 }}>{totalBrut.toFixed(2)} DT</p>
            <p className="kpi-subtitle">{MOIS_LABELS[mois - 1]} {annee}</p>
          </div>
        </div>
        <div className="kpi-card kpi-danger">
          <div className="kpi-card-top"><div className="kpi-icon-box">📉</div></div>
          <div>
            <p className="kpi-label">Total Déductions</p>
            <p className="kpi-value" style={{ fontSize: 22 }}>{totalDeductions.toFixed(2)} DT</p>
            <p className="kpi-subtitle">absences + retards</p>
          </div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-card-top"><div className="kpi-icon-box">💰</div></div>
          <div>
            <p className="kpi-label">Masse Salariale Nette</p>
            <p className="kpi-value" style={{ fontSize: 22 }}>{totalNet.toFixed(2)} DT</p>
            <p className="kpi-subtitle">à payer</p>
          </div>
        </div>
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top"><div className="kpi-icon-box">✅</div></div>
          <div>
            <p className="kpi-label">Salaires Validés</p>
            <p className="kpi-value">{payes} / {salaires.length}</p>
            <p className="kpi-subtitle">fiches de paie</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="section-card">
        <h3>📋 Fiches de Paie — {MOIS_LABELS[mois - 1]} {annee}
          <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>
            {salaires.length} fiche(s)
          </span>
        </h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Heures Norm.</th>
                <th>Heures Supp.</th>
                <th>Salaire Brut</th>
                <th>Déductions</th>
                <th>Salaire Net</th>
                <th>Statut</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {salaires.length > 0 ? salaires.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--primary-glow)', color: 'var(--primary)',
                        fontWeight: 700, fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {s.employe?.prenom?.[0]}{s.employe?.nom?.[0]}
                      </div>
                      <div>
                        <strong>{s.employe?.prenom} {s.employe?.nom}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.employe?.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.heures_normales}h</td>
                  <td>
                    {(s.heures_supp || 0) > 0
                      ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.heures_supp}h</span>
                      : '0h'
                    }
                  </td>
                  <td>{s.salaire_brut?.toFixed(2)} DT</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>- {s.deductions?.toFixed(2)} DT</td>
                  <td style={{ color: 'var(--success)', fontWeight: 800 }}>{s.salaire_net?.toFixed(2)} DT</td>
                  <td>
                    {s.statut === 'paye'
                      ? <span className="badge badge-success">✅ Payé</span>
                      : s.statut === 'calcule'
                        ? <span className="badge badge-warning">🧮 Calculé</span>
                        : <span className="badge badge-neutral">⏳ En attente</span>
                    }
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {s.statut === 'calcule' && (
                        <button className="btn-approve" onClick={() => handleValidate(s._id)} title="Valider">
                          ✅
                        </button>
                      )}
                      {s.statut === 'paye' && (
                        <button className="btn-view" onClick={() => handlePrint(s)} title="Imprimer Bulletin" style={{ padding: '6px 10px' }}>
                          🖨️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    📭 Aucun salaire calculé pour {MOIS_LABELS[mois - 1]} {annee}.<br />
                    <span style={{ fontSize: 12 }}>Cliquez sur "Calculer Tous les Salaires" pour générer les fiches.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalairesPage;
