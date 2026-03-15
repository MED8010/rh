import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [pointages, setPointages] = useState([]);
  const [conges, setConges] = useState([]);
  const [salaires, setSalaires] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user?.employe?._id) return;
    try {
      const [pointagesRes, congesRes, salairesRes, balanceRes] = await Promise.all([
        apiClient.get(`/pointages/employe/${user.employe._id}`),
        apiClient.get(`/conges?employe_id=${user.employe._id}`),
        apiClient.get(`/salaires?employe_id=${user.employe._id}`),
        apiClient.get(`/conges/balance/${user.employe._id}`),
      ]);
      setPointages(pointagesRes.data);
      setConges(congesRes.data);
      setSalaires(salairesRes.data);
      setBalance(balanceRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div>Chargement de votre tableau de bord...</div>;
  }

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyPointages = pointages.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalAbsences = monthlyPointages.filter(p => p.absence).length;
  const totalRetards = monthlyPointages.filter(p => p.retard_minutes > 0).length;
  const totalHeuresSup = monthlyPointages.reduce((acc, p) => acc + (p.heures_supp || 0), 0);
  const totalHeuresTravaillees = monthlyPointages.reduce((acc, p) => acc + (p.heures_travaillees || 0), 0);
  const joursTravailles = monthlyPointages.filter(p => !p.absence).length;
  const tauxPresence = joursTravailles > 0
    ? ((joursTravailles / (joursTravailles + totalAbsences)) * 100).toFixed(1)
    : 100;

  const congesPris = conges.filter(c => c.statut === 'approuve').reduce((acc, c) => {
    const debut = new Date(c.date_debut);
    const fin = new Date(c.date_fin);
    return acc + Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
  }, 0);
  const congesPendants = conges.filter(c => c.statut === 'en_attente').length;
  const lastSalaire = salaires[0];

  const kpis = [
    {
      icon: '🏖️', label: 'Congés Restants',
      value: balance?.solde_restant ?? 0,
      subtitle: `sur ${balance?.solde_total || 22} jours`, variant: 'kpi-primary',
      progress: ((balance?.solde_restant || 0) / (balance?.solde_total || 22)) * 100
    },
    {
      icon: '📊', label: 'Taux de Présence',
      value: `${tauxPresence}%`, subtitle: 'ce mois',
      variant: tauxPresence >= 90 ? 'kpi-success' : tauxPresence >= 80 ? 'kpi-warning' : 'kpi-danger',
    },
    {
      icon: '⏰', label: 'Heures Travaillées',
      value: `${totalHeuresTravaillees.toFixed(1)}h`, subtitle: 'ce mois', variant: 'kpi-info',
    },
    {
      icon: '➕', label: 'Heures Supp.',
      value: `${totalHeuresSup.toFixed(1)}h`, subtitle: 'ce mois', variant: 'kpi-accent',
    },
    {
      icon: '❌', label: 'Absences',
      value: totalAbsences, subtitle: 'ce mois',
      variant: totalAbsences > 2 ? 'kpi-danger' : 'kpi-success',
    },
    {
      icon: '⚠️', label: 'Retards',
      value: totalRetards, subtitle: 'ce mois',
      variant: totalRetards > 1 ? 'kpi-warning' : 'kpi-success',
    },
    {
      icon: '📅', label: 'Jours Travaillés',
      value: joursTravailles, subtitle: 'ce mois', variant: 'kpi-purple',
    },
    {
      icon: '💳', label: 'Dernier Salaire',
      value: lastSalaire?.salaire_net ? `${lastSalaire.salaire_net} DT` : '—',
      subtitle: 'salaire net', variant: 'kpi-accent',
    },
  ];

  const getStatusBadge = (statut) => {
    if (statut === 'approuve') return <span className="badge badge-success">✅ Approuvé</span>;
    if (statut === 'refuse') return <span className="badge badge-danger">❌ Refusé</span>;
    return <span className="badge badge-warning">⏳ En attente</span>;
  };

  const tabs = [
    { id: 'overview', icon: '📊', label: 'Vue d\'ensemble' },
    { id: 'pointages', icon: '⏰', label: 'Pointages' },
    { id: 'conges', icon: '🏖️', label: 'Congés' },
    { id: 'salaires', icon: '💰', label: 'Salaires' },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Mon Tableau de Bord</h1>
          <p className="page-subtitle">
            Bienvenue, <strong>{user?.employe?.prenom} {user?.employe?.nom}</strong>
          </p>
        </div>
        <div style={{
          background: 'var(--primary-glow)', border: '1px solid rgba(99,102,241,0.2)',
          padding: '14px 20px', borderRadius: 'var(--radius-md)', textAlign: 'right'
        }}>
          <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, margin: '0 0 4px' }}>POSTE & SERVICE</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {user?.employe?.poste || 'N/A'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
            {user?.employe?.service?.nom_service || 'N/A'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="kpi-container">
            {kpis.map((kpi, i) => (
              <div key={i} className={`kpi-card ${kpi.variant}`}>
                <div className="kpi-card-top">
                  <div className="kpi-icon-box">{kpi.icon}</div>
                </div>
                <div>
                  <p className="kpi-label">{kpi.label}</p>
                  <p className="kpi-value">{kpi.value}</p>
                  <p className="kpi-subtitle">{kpi.subtitle}</p>
                </div>
                {kpi.progress !== undefined && (
                  <div className="kpi-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(kpi.progress, 100)}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary cards */}
          <div className="two-col-grid" style={{ marginTop: 24 }}>
            <div className="section-card">
              <h3>📊 Résumé Congés</h3>
              {[
                { label: 'Jours pris', value: `${congesPris} jours`, color: 'var(--success)' },
                { label: 'En attente d\'approbation', value: `${congesPendants} demande(s)`, color: 'var(--warning)' },
                { label: 'Total autorisé', value: `${balance?.solde_total || 22} jours`, color: 'var(--primary)' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-hover)', marginBottom: 8,
                  border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.color, fontSize: 14 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="section-card">
              <h3>💰 Résumé Salaire</h3>
              {lastSalaire ? [
                { label: 'Salaire Brut', value: `${lastSalaire.salaire_brut} DT`, color: 'var(--info)' },
                { label: 'Déductions', value: `- ${lastSalaire.deductions} DT`, color: 'var(--danger)' },
                { label: 'Salaire Net', value: `${lastSalaire.salaire_net} DT`, color: 'var(--success)' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-hover)', marginBottom: 8,
                  border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.color, fontSize: 14 }}>{row.value}</span>
                </div>
              )) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
                  Aucune donnée de salaire disponible.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pointages Tab */}
      {activeTab === 'pointages' && (
        <div className="tab-content">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Entrée</th>
                  <th>Sortie</th>
                  <th>Heures Travaillées</th>
                  <th>Heures Supp.</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {pointages.length > 0 ? pointages.map(p => (
                  <tr key={p._id}>
                    <td><strong>{new Date(p.date).toLocaleDateString('fr-FR')}</strong></td>
                    <td>{p.absence ? '—' : p.heure_entree}</td>
                    <td>{p.absence ? '—' : (p.heure_sortie || '—')}</td>
                    <td>{p.heures_travaillees || 0}h</td>
                    <td>{(p.heures_supp || 0) > 0 ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{p.heures_supp}h</span> : '0h'}</td>
                    <td>
                      {p.absence
                        ? <span className="badge badge-danger">❌ Absent</span>
                        : p.retard_minutes > 0
                          ? <span className="badge badge-warning">⚠️ Retard {p.retard_minutes}min</span>
                          : <span className="badge badge-success">✅ Présent</span>
                      }
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Aucun pointage enregistré</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Congés Tab */}
      {activeTab === 'conges' && (
        <div className="tab-content">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Du</th>
                  <th>Au</th>
                  <th>Type</th>
                  <th>Nombre de Jours</th>
                  <th>Motif</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {conges.length > 0 ? conges.map(c => {
                  const jours = Math.ceil((new Date(c.date_fin) - new Date(c.date_debut)) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <tr key={c._id}>
                      <td>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                      <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                      <td><span className="badge badge-neutral">{c.type}</span></td>
                      <td><strong>{jours} jour(s)</strong></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.motif || '—'}</td>
                      <td>{getStatusBadge(c.statut)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Aucune demande de congé</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salaires Tab */}
      {activeTab === 'salaires' && (
        <div className="tab-content">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Salaire Brut</th>
                  <th>Déductions</th>
                  <th>Salaire Net</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {salaires.length > 0 ? salaires.map(s => (
                  <tr key={s._id}>
                    <td><strong>{String(s.mois).padStart(2, '0')}/{s.annee}</strong></td>
                    <td>{s.salaire_brut} DT</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>- {s.deductions} DT</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>{s.salaire_net} DT</td>
                    <td>
                      {s.statut === 'paye'
                        ? <span className="badge badge-success">✅ Payé</span>
                        : <span className="badge badge-warning">⏳ En attente</span>
                      }
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Aucune donnée de salaire</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
