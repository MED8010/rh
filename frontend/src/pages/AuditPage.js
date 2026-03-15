import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const ACTION_BADGE = {
  CREATE: <span className="badge badge-success">➕ Créer</span>,
  UPDATE: <span className="badge badge-info">✏️ Modifier</span>,
  DELETE: <span className="badge badge-danger">🗑️ Supprimer</span>,
  LOGIN: <span className="badge badge-primary">🔐 Connexion</span>,
  LOGOUT: <span className="badge badge-neutral">🚪 Déconnexion</span>,
};

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const response = await apiClient.get('/audit');
      setLogs(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement des logs d'audit...</div>;

  const modules = [...new Set(logs.map(l => l.module).filter(Boolean))];

  const filtered = logs.filter(log => {
    const matchSearch = !searchTerm ||
      log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchModule = !filterModule || log.module === filterModule;
    return matchSearch && matchModule;
  });

  const successCount = logs.filter(l => l.status === 'success').length;
  const errorCount = logs.filter(l => l.status !== 'success').length;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Journal d'Audit</h1>
          <p className="page-subtitle">Historique complet de toutes les actions système</p>
        </div>
        <button className="btn-primary" onClick={loadLogs}>🔄 Actualiser</button>
      </div>

      {/* KPIs */}
      <div className="kpi-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top"><div className="kpi-icon-box">📋</div></div>
          <div>
            <p className="kpi-label">Total Actions</p>
            <p className="kpi-value">{logs.length}</p>
            <p className="kpi-subtitle">dans le journal</p>
          </div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-card-top"><div className="kpi-icon-box">✅</div></div>
          <div>
            <p className="kpi-label">Succès</p>
            <p className="kpi-value">{successCount}</p>
            <p className="kpi-subtitle">opérations réussies</p>
          </div>
        </div>
        <div className="kpi-card kpi-danger">
          <div className="kpi-card-top"><div className="kpi-icon-box">❌</div></div>
          <div>
            <p className="kpi-label">Erreurs</p>
            <p className="kpi-value">{errorCount}</p>
            <p className="kpi-subtitle">opérations échouées</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher utilisateur, action, description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterModule}
          onChange={e => setFilterModule(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13.5,
          }}
        >
          <option value="">Tous les modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="section-card">
        <h3>📋 Logs d'Audit
          <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>
            {filtered.length} / {logs.length} entrées
          </span>
        </h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(log => (
                <tr key={log._id}>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(log.date_action).toLocaleDateString('fr-FR')}<br />
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.date_action).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: 13 }}>{log.user?.email || '—'}</strong>
                  </td>
                  <td>
                    {ACTION_BADGE[log.action] || <span className="badge badge-neutral">{log.action}</span>}
                  </td>
                  <td>
                    <span style={{
                      background: 'var(--primary-glow)', color: 'var(--primary)',
                      padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600
                    }}>
                      {log.module || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300 }}>
                    {log.description || '—'}
                  </td>
                  <td>
                    {log.status === 'success'
                      ? <span className="badge badge-success">✅ Succès</span>
                      : <span className="badge badge-danger">❌ Erreur</span>
                    }
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    {searchTerm || filterModule ? '🔍 Aucun résultat trouvé' : '📭 Aucun log disponible'}
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

export default AuditPage;
