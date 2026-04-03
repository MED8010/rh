import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const SuperAdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // User Form State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'employe' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, usersRes] = await Promise.all([
        apiClient.get('/system/metrics'),
        apiClient.get('/users')
      ]);
      setMetrics(metricsRes.data);
      setUsers(usersRes.data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Erreur lors de la récupération des données système');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccessMsg(msg);
    setTimeout(() => { setError(''); setSuccessMsg(''); }, 3000);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await apiClient.put(`/users/${editingUser._id}`, userFormData);
        showFeedback('✅ Utilisateur mis à jour');
      } else {
        await apiClient.post('/users', userFormData);
        showFeedback('✅ Utilisateur créé');
      }
      setShowUserModal(false);
      loadDashboardData();
    } catch (err) {
      showFeedback('❌ Erreur lors de l\'opération', true);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await apiClient.delete(`/users/${id}`);
      showFeedback('✅ Utilisateur supprimé');
      loadDashboardData();
    } catch (err) {
      showFeedback('❌ Erreur suppression', true);
    }
  };

  if (loading && !metrics) return <div className="loading"><div className="spinner"></div>Initialisation du cockpit système...</div>;

  const { metrics: stats, recentActivity, rolesDistribution } = metrics || {};

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>👑</span>
            <div>
              <h1>Cockpit Super Admin</h1>
              <p className="page-subtitle">Gestion de l'infrastructure et sécurité système</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
           <button className="btn-secondary" onClick={loadDashboardData}>🔄 Actualiser</button>
           <button className="btn-primary" onClick={() => { setEditingUser(null); setUserFormData({email:'', password:'', role:'employe'}); setShowUserModal(true); }}>
             👤 Nouvel Utilisateur
           </button>
        </div>
      </div>

      {error && <div className="error-message animate-fade-in">⚠️ {error}</div>}
      {successMsg && <div className="success-message animate-fade-in">{successMsg}</div>}

      {/* Main KPIs */}
      <div className="kpi-container">
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top"><div className="kpi-icon-box">👥</div></div>
          <div><p className="kpi-label">Utilisateurs</p><p className="kpi-value">{stats?.totalUsers || 0}</p><p className="kpi-subtitle">Comptes actifs</p></div>
        </div>
        <div className="kpi-card kpi-warning">
          <div className="kpi-card-top"><div className="kpi-icon-box">🔑</div></div>
          <div><p className="kpi-label">Admins</p><p className="kpi-value">{stats?.admins || 0}</p><p className="kpi-subtitle">Accès privilégiés</p></div>
        </div>
        <div className="kpi-card kpi-info">
          <div className="kpi-card-top"><div className="kpi-icon-box">🗄️</div></div>
          <div><p className="kpi-label">Base de Données</p><p className="kpi-value">{stats?.dbSize || '0 MB'}</p><p className="kpi-subtitle">{stats?.collections || 0} collections</p></div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-card-top"><div className="kpi-icon-box">⚡</div></div>
          <div><p className="kpi-label">Uptime</p><p className="kpi-value">{Math.floor(stats?.uptime / 3600)}h {Math.floor((stats?.uptime % 3600) / 60)}m</p><p className="kpi-subtitle">Disponibilité serveur</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: 30 }}>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <span className="tab-icon">📊</span>
          <span>Vue d'ensemble System</span>
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <span className="tab-icon">👤</span>
          <span>Utilisateurs ({users.length})</span>
        </button>
        <button className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>
          <span className="tab-icon">🏥</span>
          <span>Santé & Sécurité</span>
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
          {/* Recent Activity */}
          <div className="section-card">
            <h3>🛡️ Dernières Activités Système</h3>
            <div className="activity-feed">
              {recentActivity?.map((log, i) => (
                <div key={log._id} className="activity-item" style={{ 
                  display: 'flex', gap: 15, padding: '12px 0', borderBottom: i < recentActivity.length -1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-hover)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>
                    {log.action === 'login' ? '🔐' : log.action === 'create' ? '➕' : log.action === 'update' ? '✏️' : '🗑️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{log.user?.email || 'Système'}</strong>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(log.date_action).toLocaleString('fr-FR')}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0' }}>
                      {log.description}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>{log.module}</span>
                      <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                        {log.status === 'success' ? 'Succès' : 'Échec'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-text" style={{ marginTop: 15, width: '100%' }} onClick={() => window.location.href='/audit'}>
              Voir tout le journal d'audit →
            </button>
          </div>

          {/* Role Distribution Chart (Simulated with Bar) */}
          <div className="section-card">
            <h3>📊 Distribution des Rôles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 15 }}>
              {[
                { label: 'Super Admin', count: rolesDistribution?.super_admin, color: '#f59e0b' },
                { label: 'Admin', count: rolesDistribution?.admin, color: '#6366f1' },
                { label: 'Chef Service', count: rolesDistribution?.chef_service, color: '#10b981' },
                { label: 'Employé', count: rolesDistribution?.employe, color: '#64748b' }
              ].map(role => (
                <div key={role.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{role.label}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{role.count}</strong>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ 
                      width: `${(role.count / stats?.totalUsers) * 100}%`, 
                      background: role.color 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: USERS LIST */}
      {activeTab === 'users' && (
        <div className="section-card animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>👥 Liste des Comptes Utilisateurs</h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>ID Unique</th>
                  <th>Créé le</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-hover)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12
                        }}>
                          {u.email?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontWeight: 600 }}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge role-badge role-${u.role}`}>
                        {u.role.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td><code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u._id}</code></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                         <button className="btn-edit" onClick={() => { setEditingUser(u); setUserFormData({email:u.email, password:'', role:u.role}); setShowUserModal(true); }}>✏️</button>
                         <button className="btn-delete" onClick={() => handleDeleteUser(u._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: HEALTH */}
      {activeTab === 'health' && (
        <div className="section-card">
          <h3>🏥 État des Services & Systèmes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginTop: 15 }}>
            <div className="status-item" style={{ padding: 15, background: 'var(--bg-hover)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-primary)' }}>🚀 API Performance</strong>
                <span className="badge badge-success">Sain</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Latence moyenne: 45ms</p>
            </div>
            <div className="status-item" style={{ padding: 15, background: 'var(--bg-hover)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-primary)' }}>💾 Database MongoDB</strong>
                <span className="badge badge-success">Connecté</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Moteur: WiredTiger | Version: 6.0+</p>
            </div>
            <div className="status-item" style={{ padding: 15, background: 'var(--bg-hover)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-primary)' }}>📠 Pointeuses Biométriques</strong>
                <span className="badge badge-warning">Partiel</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>2/3 devices online. Vérifier réseau.</p>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-in" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>{editingUser ? '✏️ Modifier Utilisateur' : '👤 Nouvel Utilisateur'}</h2>
              <button className="close-btn" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUserSubmit} className="premium-form" style={{ padding: 20 }}>
              <div className="form-group">
                <label>Email Professionnel <span className="required">*</span></label>
                <input 
                  type="email" 
                  value={userFormData.email} 
                  onChange={e => setUserFormData({...userFormData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Mot de Passe {editingUser ? '(Laisser vide pour garder l\'actuel)' : '*'}</label>
                <input 
                  type="password" 
                  value={userFormData.password} 
                  onChange={e => setUserFormData({...userFormData, password: e.target.value})} 
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Rôle Système <span className="required">*</span></label>
                <select 
                  value={userFormData.role} 
                  onChange={e => setUserFormData({...userFormData, role: e.target.value})}
                  required
                >
                  <option value="employe">Employé</option>
                  <option value="chef_service">Chef de Service</option>
                  <option value="admin">Administrateur</option>
                  <option value="super_admin">Super Administrateur</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowUserModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingUser ? 'Sauvegarder' : 'Créer Compte'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
