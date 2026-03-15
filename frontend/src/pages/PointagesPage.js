import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const PointagesPage = () => {
  const [retards, setRetards] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [allPointages, setAllPointages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('retards');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [retardsRes, absencesRes] = await Promise.all([
        apiClient.get('/pointages/stats/retards-day'),
        apiClient.get('/pointages/stats/absences-day'),
      ]);
      setRetards(retardsRes.data);
      setAbsences(absencesRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement des pointages...</div>;

  const totalPresents = retards.length + absences.length;

  const filteredRetards = retards.filter(r =>
    `${r.employe?.prenom} ${r.employe?.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredAbsences = absences.filter(a =>
    `${a.employe?.prenom} ${a.employe?.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Suivi des Pointages</h1>
          <p className="page-subtitle">📅 {today}</p>
        </div>
        <button className="btn-primary" onClick={loadData}>🔄 Actualiser</button>
      </div>

      {/* KPI Summary */}
      <div className="kpi-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="kpi-card kpi-warning">
          <div className="kpi-card-top">
            <div className="kpi-icon-box">⚠️</div>
          </div>
          <div>
            <p className="kpi-label">Retards</p>
            <p className="kpi-value">{retards.length}</p>
            <p className="kpi-subtitle">aujourd'hui</p>
          </div>
        </div>
        <div className="kpi-card kpi-danger">
          <div className="kpi-card-top">
            <div className="kpi-icon-box">❌</div>
          </div>
          <div>
            <p className="kpi-label">Absences</p>
            <p className="kpi-value">{absences.length}</p>
            <p className="kpi-subtitle">aujourd'hui</p>
          </div>
        </div>
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top">
            <div className="kpi-icon-box">📊</div>
          </div>
          <div>
            <p className="kpi-label">Total Signalés</p>
            <p className="kpi-value">{totalPresents}</p>
            <p className="kpi-subtitle">retards + absences</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 20, maxWidth: 400 }}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`tab-btn${activeTab === 'retards' ? ' active' : ''}`} onClick={() => setActiveTab('retards')}>
          ⚠️ Retards ({retards.length})
        </button>
        <button className={`tab-btn${activeTab === 'absences' ? ' active' : ''}`} onClick={() => setActiveTab('absences')}>
          ❌ Absences ({absences.length})
        </button>
      </div>

      {/* Retards Tab */}
      {activeTab === 'retards' && (
        <div className="tab-content">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Matricule</th>
                  <th>Service</th>
                  <th>Heure d'Entrée</th>
                  <th>Retard</th>
                  <th>Sévérité</th>
                </tr>
              </thead>
              <tbody>
                {filteredRetards.length > 0 ? filteredRetards.map(r => {
                  const mins = r.retard_minutes || 0;
                  const severity = mins > 30 ? 'danger' : mins > 15 ? 'warning' : 'neutral';
                  return (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--warning-bg)', color: 'var(--warning)',
                            fontWeight: 700, fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {r.employe?.prenom?.[0]}{r.employe?.nom?.[0]}
                          </div>
                          <span><strong>{r.employe?.prenom} {r.employe?.nom}</strong></span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.employe?.matricule || '—'}</td>
                      <td>{r.employe?.service?.nom_service || '—'}</td>
                      <td><strong>{r.heure_entree}</strong></td>
                      <td>
                        <span style={{ color: 'var(--warning)', fontWeight: 700 }}>
                          +{mins} min
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${severity}`}>
                          {mins > 30 ? '🔴 Grave' : mins > 15 ? '🟡 Modéré' : '🟢 Léger'}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      {searchTerm ? '🔍 Aucun résultat' : '🎉 Aucun retard aujourd\'hui !'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Absences Tab */}
      {activeTab === 'absences' && (
        <div className="tab-content">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Matricule</th>
                  <th>Service</th>
                  <th>Motif</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredAbsences.length > 0 ? filteredAbsences.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--danger-bg)', color: 'var(--danger)',
                          fontWeight: 700, fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {a.employe?.prenom?.[0]}{a.employe?.nom?.[0]}
                        </div>
                        <span><strong>{a.employe?.prenom} {a.employe?.nom}</strong></span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.employe?.matricule || '—'}</td>
                    <td>{a.employe?.service?.nom_service || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.motif_absence || '—'}</td>
                    <td><span className="badge badge-danger">❌ Absent</span></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      {searchTerm ? '🔍 Aucun résultat' : '🎉 Aucune absence aujourd\'hui !'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointagesPage;
