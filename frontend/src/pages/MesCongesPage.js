import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const MesCongesPage = () => {
  const { user } = useAuth();
  const [conges, setConges] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    date_debut: '', date_fin: '', type: 'annuel', motif: ''
  });

  useEffect(() => { loadData(); }, [user]); // eslint-disable-line

  const loadData = async () => {
    if (!user?.employe?._id) return;
    try {
      const [congesRes, balanceRes] = await Promise.all([
        apiClient.get(`/conges?employe_id=${user.employe._id}`),
        apiClient.get(`/conges/balance/${user.employe._id}`)
      ]);
      setConges(congesRes.data);
      setBalance(balanceRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (setter, msg) => { setter(msg); setTimeout(() => setter(''), 4000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const start = new Date(formData.date_debut);
      const end = new Date(formData.date_fin);
      if (end < start) {
        showFeedback(setErrorMsg, 'La date de fin doit être après la date de début');
        setSubmitting(false);
        return;
      }
      const nombreJours = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (formData.type === 'annuel' && balance?.solde_restant < nombreJours) {
        showFeedback(setErrorMsg, `Solde insuffisant — vous avez ${balance.solde_restant} jours disponibles`);
        setSubmitting(false);
        return;
      }
      await apiClient.post('/conges', {
        employe_id: user.employe._id,
        ...formData
      });
      showFeedback(setFeedbackMsg, '✅ Demande de congé soumise avec succès !');
      setFormData({ date_debut: '', date_fin: '', type: 'annuel', motif: '' });
      setShowForm(false);
      loadData();
    } catch (error) {
      showFeedback(setErrorMsg, error.response?.data?.message || 'Erreur lors de la création de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement de vos congés...</div>;

  const totalJours = balance?.solde_total || 22;
  const restants = balance?.solde_restant ?? totalJours;
  const utilises = balance?.utilise ?? 0;
  const progPct = Math.round(((totalJours - restants) / totalJours) * 100);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Mes Demandes de Congé</h1>
          <p className="page-subtitle">
            Gérez vos congés annuels et suivez vos demandes
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(f => !f)}>
          {showForm ? '✕ Annuler' : '➕ Nouvelle Demande'}
        </button>
      </div>

      {feedbackMsg && <div className="success-message">{feedbackMsg}</div>}
      {errorMsg && <div className="error-message">⚠️ {errorMsg}</div>}

      {/* Balance KPIs */}
      <div className="kpi-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top"><div className="kpi-icon-box">📅</div></div>
          <div>
            <p className="kpi-label">Solde Total Annuel</p>
            <p className="kpi-value">{totalJours}</p>
            <p className="kpi-subtitle">jours accordés</p>
          </div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-card-top"><div className="kpi-icon-box">🏖️</div></div>
          <div>
            <p className="kpi-label">Jours Restants</p>
            <p className="kpi-value">{restants}</p>
            <p className="kpi-subtitle">disponibles</p>
          </div>
          <div className="kpi-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${100 - progPct}%` }}></div>
            </div>
          </div>
        </div>
        <div className="kpi-card kpi-warning">
          <div className="kpi-card-top"><div className="kpi-icon-box">✈️</div></div>
          <div>
            <p className="kpi-label">Jours Utilisés</p>
            <p className="kpi-value">{utilises}</p>
            <p className="kpi-subtitle">cette année</p>
          </div>
        </div>
        <div className="kpi-card kpi-info">
          <div className="kpi-card-top"><div className="kpi-icon-box">⏳</div></div>
          <div>
            <p className="kpi-label">En Attente</p>
            <p className="kpi-value">{conges.filter(c => c.statut === 'demande').length}</p>
            <p className="kpi-subtitle">demande(s)</p>
          </div>
        </div>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="form-section">
          <h3>📝 Nouvelle Demande de Congé</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Date de Début <span className="required">*</span></label>
                <input type="date" name="date_debut" value={formData.date_debut}
                  onChange={e => setFormData(f => ({ ...f, date_debut: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Date de Fin <span className="required">*</span></label>
                <input type="date" name="date_fin" value={formData.date_fin}
                  onChange={e => setFormData(f => ({ ...f, date_fin: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Type de Congé <span className="required">*</span></label>
                <select name="type" value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}>
                  <option value="annuel">🏖️ Annuel</option>
                  <option value="maladie">🏥 Maladie</option>
                  <option value="maternite">👶 Maternité</option>
                  <option value="paternite">👨‍👦 Paternité</option>
                  <option value="autre">📌 Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Motif (Optionnel)</label>
                <input type="text" name="motif" value={formData.motif}
                  onChange={e => setFormData(f => ({ ...f, motif: e.target.value }))}
                  placeholder="Précisez votre motif si nécessaire" />
              </div>
            </div>
            {formData.date_debut && formData.date_fin && (
              <div style={{
                padding: '12px 16px', background: 'var(--primary-glow)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, marginBottom: 16,
                fontSize: 13.5, color: 'var(--primary)', fontWeight: 600
              }}>
                📊 Durée estimée :{' '}
                <strong>
                  {Math.ceil(Math.abs(new Date(formData.date_fin) - new Date(formData.date_debut)) / (1000 * 60 * 60 * 24)) + 1} jour(s)
                </strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '⏳ Envoi en cours...' : '✅ Soumettre la Demande'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Table */}
      <div className="section-card">
        <h3>📋 Historique des Demandes
          <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>
            {conges.length} demande(s)
          </span>
        </h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Du</th>
                <th>Au</th>
                <th>Type</th>
                <th>Jours</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              {conges.length > 0 ? conges.map(c => (
                <tr key={c._id}>
                  <td><strong>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</strong></td>
                  <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                  <td><span className="badge badge-neutral">{c.type}</span></td>
                  <td><strong>{c.nombre_jours} j</strong></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.motif || '—'}</td>
                  <td>
                    {c.statut === 'approuve' && <span className="badge badge-success">✅ Approuvé</span>}
                    {c.statut === 'refuse' && <span className="badge badge-danger">❌ Refusé</span>}
                    {c.statut === 'demande' && <span className="badge badge-warning">⏳ En attente</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {c.date_validation ? new Date(c.date_validation).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    📭 Aucune demande de congé. Cliquez "Nouvelle Demande" pour commencer.
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

export default MesCongesPage;
