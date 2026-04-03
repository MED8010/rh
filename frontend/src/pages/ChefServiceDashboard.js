import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const REJECT_REASONS = [
  'Effectifs insuffisants durant cette période',
  'Chevauchement avec d\'autres congés',
  'Période non autorisée',
  'Autre raison',
];

const ChefServiceDashboard = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equipe');
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadTeamData(); }, []); // eslint-disable-line

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/employes/my-team');
      setTeamData(res.data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement équipe:', err);
      setError('Erreur lors du chargement des données de l\'équipe');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleApproveConge = async (id) => {
    try {
      await apiClient.put(`/conges/${id}/approve`);
      showFeedback('✅ Congé approuvé avec succès');
      loadTeamData();
    } catch (err) {
      showFeedback('❌ Erreur lors de l\'approbation');
    }
  };

  const handleRejectConge = async () => {
    if (!rejectReason.trim()) return;
    try {
      await apiClient.put(`/conges/${rejectModal}/reject`, { commentaire_rejet: rejectReason });
      showFeedback('Congé refusé');
      setRejectModal(null);
      setRejectReason('');
      loadTeamData();
    } catch (err) {
      showFeedback('❌ Erreur lors du refus');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div>Chargement de votre équipe...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">⚠️ {error}</div>
        <button className="btn-primary" onClick={loadTeamData}>🔄 Réessayer</button>
      </div>
    );
  }

  const { service, stats, membres, conges } = teamData || {};
  const congesEnAttente = conges?.filter(c => c.statut === 'demande') || [];
  const congesApprouves = conges?.filter(c => c.statut === 'approuve') || [];

  const statutBadge = (statut) => {
    switch (statut) {
      case 'present': return <span className="badge badge-success">✅ Présent</span>;
      case 'absent': return <span className="badge badge-danger">❌ Absent</span>;
      case 'conge': return <span className="badge badge-warning">🏖️ En congé</span>;
      default: return <span className="badge badge-neutral">—</span>;
    }
  };

  const tabs = [
    { id: 'equipe', label: '👥 Mon Équipe', count: stats?.total },
    { id: 'pointages', label: '🕐 Présence du Jour', count: stats?.presents },
    { id: 'conges', label: '🏖️ Congés', count: congesEnAttente.length },
  ];

  return (
    <div className="dashboard-container">
      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content animate-slide-in" onClick={e => e.stopPropagation()} style={{ 
            maxWidth: 460, background: 'var(--bg-card)', border: '1px solid var(--border)'
          }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>❌ Refuser la Demande</h3>
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
                    color: 'var(--text-primary)', transition: 'all 0.2s ease'
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
                <button className="btn-delete" style={{ flex: 1 }} onClick={handleRejectConge}>Confirmer le Refus</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>📋 Dashboard Chef de Service</h1>
          <p className="page-subtitle">
            Bienvenue, {user?.employe?.prenom} {user?.employe?.nom} — Service : <strong>{service?.nom_service || '—'}</strong>
          </p>
        </div>
        <button className="btn-primary" onClick={loadTeamData}>🔄 Actualiser</button>
      </div>

      {feedbackMsg && <div className="success-message">{feedbackMsg}</div>}

      {/* KPIs */}
      <div className="kpi-container">
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top"><div className="kpi-icon-box">👥</div></div>
          <div><p className="kpi-label">Total Équipe</p><p className="kpi-value">{stats?.total || 0}</p></div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-card-top"><div className="kpi-icon-box">✅</div></div>
          <div><p className="kpi-label">Présents</p><p className="kpi-value">{stats?.presents || 0}</p><p className="kpi-subtitle">aujourd'hui</p></div>
        </div>
        <div className="kpi-card kpi-danger">
          <div className="kpi-card-top"><div className="kpi-icon-box">❌</div></div>
          <div><p className="kpi-label">Absents</p><p className="kpi-value">{stats?.absents || 0}</p></div>
        </div>
        <div className="kpi-card kpi-warning">
          <div className="kpi-card-top"><div className="kpi-icon-box">🏖️</div></div>
          <div><p className="kpi-label">En Congé</p><p className="kpi-value">{stats?.enConge || 0}</p></div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="kpi-card-top"><div className="kpi-icon-box">⏰</div></div>
          <div><p className="kpi-label">Retards</p><p className="kpi-value">{stats?.retardsAujourdhui || 0}</p><p className="kpi-subtitle">{stats?.totalRetardMinutes || 0} min au total</p></div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="kpi-card-top"><div className="kpi-icon-box">📝</div></div>
          <div><p className="kpi-label">Congés en attente</p><p className="kpi-value">{stats?.congesEnAttente || 0}</p><p className="kpi-subtitle">à traiter</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: 20 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Mon Équipe */}
      {activeTab === 'equipe' && (
        <div className="section-card">
          <h3>👥 Membres de l'équipe — {service?.nom_service}
            <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>
              {membres?.length || 0} membre(s)
            </span>
          </h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Matricule</th>
                  <th>UAP</th>
                  <th>Statut Emploi</th>
                  <th>Statut du Jour</th>
                  <th>Entrée</th>
                  <th>Sortie</th>
                  <th>Retard</th>
                </tr>
              </thead>
              <tbody>
                {membres && membres.length > 0 ? membres.map(m => (
                  <tr key={m._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: m.statut_jour === 'present' ? 'var(--success-bg)' : m.statut_jour === 'conge' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          color: m.statut_jour === 'present' ? 'var(--success)' : m.statut_jour === 'conge' ? 'var(--warning)' : 'var(--danger)',
                          fontWeight: 700, fontSize: 11,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {m.prenom?.[0]}{m.nom?.[0]}
                        </div>
                        <strong>{m.prenom} {m.nom}</strong>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 12 }}>{m.matricule}</code></td>
                    <td>{m.uap?.nom_uap || '—'}</td>
                    <td>
                      <span className={`badge ${m.statut === 'actif' ? 'badge-success' : 'badge-neutral'}`}>
                        {m.statut}
                      </span>
                    </td>
                    <td>{statutBadge(m.statut_jour)}</td>
                    <td style={{ fontWeight: 600 }}>{m.heure_entree || '—'}</td>
                    <td>{m.heure_sortie || '—'}</td>
                    <td>
                      {m.retard_minutes > 0 ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                          {m.retard_minutes} min
                        </span>
                      ) : m.statut_jour === 'present' ? (
                        <span style={{ color: 'var(--success)' }}>À l'heure</span>
                      ) : '—'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      Aucun membre dans votre équipe
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Présence du Jour */}
      {activeTab === 'pointages' && (
        <div className="section-card">
          <h3>🕐 Présence du Jour — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
          
          {/* Résumé visuel */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12, marginBottom: 24, padding: 16,
            background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>{stats?.presents || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Présents</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>{stats?.absents || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Absents</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>{stats?.enConge || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En congé</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--info)' }}>{stats?.retardsAujourdhui || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En retard</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats?.total ? Math.round((stats.presents / stats.total) * 100) : 0}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Taux de présence</div>
            </div>
          </div>

          {/* Barre de progression */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--bg-hover)' }}>
              <div style={{ width: `${stats?.total ? (stats.presents / stats.total) * 100 : 0}%`, background: 'var(--success)', transition: 'width 0.5s ease' }} />
              <div style={{ width: `${stats?.total ? (stats.enConge / stats.total) * 100 : 0}%`, background: 'var(--warning)', transition: 'width 0.5s ease' }} />
              <div style={{ width: `${stats?.total ? (stats.absents / stats.total) * 100 : 0}%`, background: 'var(--danger)', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>🟢 Présents</span>
              <span>🟡 En congé</span>
              <span>🔴 Absents</span>
            </div>
          </div>

          {/* Liste des absents/retards */}
          {(stats?.absents > 0 || stats?.retardsAujourdhui > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Absents */}
              <div style={{ padding: 16, background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)22' }}>
                <h4 style={{ color: 'var(--danger)', margin: '0 0 12px' }}>❌ Absents ({membres?.filter(m => m.statut_jour === 'absent').length})</h4>
                {membres?.filter(m => m.statut_jour === 'absent').map(m => (
                  <div key={m._id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>
                    {m.prenom} {m.nom} — <code>{m.matricule}</code>
                  </div>
                ))}
              </div>
              {/* Retards */}
              <div style={{ padding: 16, background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning)22' }}>
                <h4 style={{ color: 'var(--warning)', margin: '0 0 12px' }}>⏰ En retard ({membres?.filter(m => m.retard_minutes > 0).length})</h4>
                {membres?.filter(m => m.retard_minutes > 0).map(m => (
                  <div key={m._id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>
                    {m.prenom} {m.nom} — <strong style={{ color: 'var(--danger)' }}>{m.retard_minutes} min</strong> (arrivé à {m.heure_entree})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Congés */}
      {activeTab === 'conges' && (
        <>
          {/* Congés en attente */}
          <div className="section-card" style={{ marginBottom: 20 }}>
            <h3>📝 Demandes de Congés en Attente
              <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>
                {congesEnAttente.length} demande(s)
              </span>
            </h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Type</th>
                    <th>Du</th>
                    <th>Au</th>
                    <th>Jours</th>
                    <th>Motif</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {congesEnAttente.length > 0 ? congesEnAttente.map(c => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'var(--primary-glow)', color: 'var(--primary)',
                            fontWeight: 700, fontSize: 11,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {c.employe?.prenom?.[0]}{c.employe?.nom?.[0]}
                          </div>
                          <strong>{c.employe?.prenom} {c.employe?.nom}</strong>
                        </div>
                      </td>
                      <td><span className="badge badge-neutral">{c.type}</span></td>
                      <td>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                      <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                      <td><strong>{c.nombre_jours} j</strong></td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.motif || '—'}</td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <button className="btn-approve" onClick={() => handleApproveConge(c._id)}>
                            ✅ Approuver
                          </button>
                          <button className="btn-delete" onClick={() => { setRejectModal(c._id); setRejectReason(''); }}>
                            ❌ Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        ✅ Aucune demande de congé en attente
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Congés approuvés en cours */}
          {congesApprouves.length > 0 && (
            <div className="section-card">
              <h3>🏖️ Congés en cours (approuvés)
                <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>
                  {congesApprouves.length}
                </span>
              </h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employé</th>
                      <th>Type</th>
                      <th>Du</th>
                      <th>Au</th>
                      <th>Jours</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {congesApprouves.map(c => (
                      <tr key={c._id}>
                        <td><strong>{c.employe?.prenom} {c.employe?.nom}</strong></td>
                        <td><span className="badge badge-neutral">{c.type}</span></td>
                        <td>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                        <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                        <td><strong>{c.nombre_jours} j</strong></td>
                        <td><span className="badge badge-success">✅ Approuvé</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChefServiceDashboard;
