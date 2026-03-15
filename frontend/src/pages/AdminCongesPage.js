import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const REJECT_REASONS = [
  'Effectifs insuffisants durant cette période',
  'Chevauchement avec d\'autres congés',
  'Période non autorisée',
  'Autre raison',
];

const AdminCongesPage = () => {
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employes, setEmployes] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filters, setFilters] = useState({ statut: 'tous', employe_id: '', type: 'tous' });
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadConges(); }, [filters]); // eslint-disable-line

  const loadData = async () => {
    try {
      const res = await apiClient.get('/employes');
      setEmployes(res.data);
    } catch (err) { console.error(err); }
  };

  const loadConges = async () => {
    try {
      setLoading(true);
      let params = {};
      if (filters.statut !== 'tous') params.statut = filters.statut;
      if (filters.employe_id) params.employe_id = filters.employe_id;
      if (filters.type !== 'tous') params.type = filters.type;
      const res = await apiClient.get('/conges', { params });
      setConges(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.put(`/conges/${id}/approve`);
      showFeedback('✅ Congé approuvé avec succès');
      loadConges();
    } catch (err) {
      showFeedback('❌ Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await apiClient.put(`/conges/${rejectModal}/reject`, { commentaire_rejet: rejectReason });
      showFeedback('Congé refusé');
      setRejectModal(null);
      setRejectReason('');
      loadConges();
    } catch (err) {
      showFeedback('❌ Erreur lors du refus');
    }
  };

  const stats = {
    total: conges.length,
    enAttente: conges.filter(c => c.statut === 'demande').length,
    approuves: conges.filter(c => c.statut === 'approuve').length,
    refuses: conges.filter(c => c.statut === 'refuse').length,
  };

  const selectStyle = {
    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13.5,
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement des congés...</div>;

  return (
    <div className="dashboard-container">
      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>❌ Refuser la Demande de Congé</h3>
              <button className="modal-close" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
                Veuillez indiquer la raison du refus :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {REJECT_REASONS.map(r => (
                  <label key={r} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${rejectReason === r ? 'var(--primary)' : 'var(--border)'}`,
                    background: rejectReason === r ? 'var(--primary-glow)' : 'var(--bg-hover)',
                  }}>
                    <input type="radio" value={r} checked={rejectReason === r} onChange={() => setRejectReason(r)} />
                    <span style={{ fontSize: 13.5 }}>{r}</span>
                  </label>
                ))}
              </div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ou saisissez une raison personnalisée..."
                style={{
                  width: '100%', padding: 12, borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-hover)',
                  color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical', minHeight: 80
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>Annuler</button>
                <button className="btn-delete" style={{ flex: 1 }} onClick={handleReject}>Confirmer le Refus</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Gestion des Congés</h1>
          <p className="page-subtitle">Toutes les demandes de congé — approbation et suivi</p>
        </div>
      </div>

      {feedbackMsg && <div className="success-message">{feedbackMsg}</div>}

      {/* KPIs */}
      <div className="kpi-container">
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top"><div className="kpi-icon-box">📋</div></div>
          <div><p className="kpi-label">Total Demandes</p><p className="kpi-value">{stats.total}</p></div>
        </div>
        <div className="kpi-card kpi-warning">
          <div className="kpi-card-top"><div className="kpi-icon-box">⏳</div></div>
          <div><p className="kpi-label">En Attente</p><p className="kpi-value">{stats.enAttente}</p><p className="kpi-subtitle">à traiter</p></div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-card-top"><div className="kpi-icon-box">✅</div></div>
          <div><p className="kpi-label">Approuvés</p><p className="kpi-value">{stats.approuves}</p></div>
        </div>
        <div className="kpi-card kpi-danger">
          <div className="kpi-card-top"><div className="kpi-icon-box">❌</div></div>
          <div><p className="kpi-label">Refusés</p><p className="kpi-value">{stats.refuses}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12, marginBottom: 20, padding: 16,
        background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)'
      }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Statut</label>
          <select style={selectStyle} value={filters.statut} onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))}>
            <option value="tous">Tous</option>
            <option value="demande">En Attente</option>
            <option value="approuve">Approuvé</option>
            <option value="refuse">Refusé</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Type</label>
          <select style={selectStyle} value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="tous">Tous</option>
            <option value="annuel">Annuel</option>
            <option value="maladie">Maladie</option>
            <option value="maternite">Maternité</option>
            <option value="paternite">Paternité</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Employé</label>
          <select style={selectStyle} value={filters.employe_id} onChange={e => setFilters(f => ({ ...f, employe_id: e.target.value }))}>
            <option value="">Tous les employés</option>
            {employes.map(e => <option key={e._id} value={e._id}>{e.prenom} {e.nom}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn-secondary" style={{ width: '100%' }}
            onClick={() => setFilters({ statut: 'tous', employe_id: '', type: 'tous' })}>
            ↻ Réinitialiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="section-card">
        <h3>📋 Demandes de Congé
          <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>
            {conges.length} résultat(s)
          </span>
        </h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Service</th>
                <th>Du</th>
                <th>Au</th>
                <th>Type</th>
                <th>Jours</th>
                <th>Motif</th>
                <th>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conges.length > 0 ? conges.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'var(--primary-glow)', color: 'var(--primary)',
                        fontWeight: 700, fontSize: 11,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {c.employe?.prenom?.[0]}{c.employe?.nom?.[0]}
                      </div>
                      <strong>{c.employe?.prenom} {c.employe?.nom}</strong>
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    {typeof c.employe?.service === 'object' ? c.employe?.service?.nom_service : c.employe?.service || '—'}
                  </td>
                  <td>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                  <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                  <td><span className="badge badge-neutral">{c.type}</span></td>
                  <td><strong>{c.nombre_jours} j</strong></td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.motif || '—'}</td>
                  <td>
                    {c.statut === 'approuve' && <span className="badge badge-success">✅ Approuvé</span>}
                    {c.statut === 'refuse' && <span className="badge badge-danger">❌ Refusé</span>}
                    {c.statut === 'demande' && <span className="badge badge-warning">⏳ En attente</span>}
                  </td>
                  <td>
                    {c.statut === 'demande' ? (
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-approve" onClick={() => handleApprove(c._id)}>
                          ✅ Approuver
                        </button>
                        <button className="btn-delete" onClick={() => { setRejectModal(c._id); setRejectReason(''); }}>
                          ❌ Refuser
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    📭 Aucune demande de congé correspondant aux filtres
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

export default AdminCongesPage;
