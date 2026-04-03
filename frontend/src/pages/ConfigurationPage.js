import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const ConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState('structure');
  const [services, setServices] = useState([]);
  const [uaps, setUaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showUapModal, setShowUapModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingUapId, setEditingUapId] = useState(null);
  const [serviceData, setServiceData] = useState({ nom_service: '', description: '' });
  const [uapData, setUapData] = useState({ nom_uap: '', description: '' });

  // System Settings state
  const [systemSettings, setSystemSettings] = useState({
    jwt_expiry: '24h',
    smtp_enabled: true,
    maintenance_mode: false,
    backup_frequency: 'weekly',
    login_attempts: '5',
    default_role: 'employe',
    password_complexity: true,
    idle_timeout: '30m',
    public_registration: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servRes, uapRes, configRes] = await Promise.all([
        apiClient.get('/structure/services'),
        apiClient.get('/structure/uaps'),
        apiClient.get('/system/configs')
      ]);
      setServices(servRes.data);
      setUaps(uapRes.data);
      
      if (configRes.data && configRes.data.length > 0) {
          const configMap = {};
          configRes.data.forEach(c => configMap[c.key] = c.value);
          setSystemSettings(prev => ({ ...prev, ...configMap }));
      }
      
    } catch (error) {
      setError('Erreur lors du chargement des données de configuration');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // --- ACTIONS ---
  const handleConfigUpdate = async (key, value) => {
    try {
        await apiClient.post('/system/configs', { key, value });
        setSystemSettings(prev => ({ ...prev, [key]: value }));
        showSuccess('Paramètre système mis à jour');
    } catch (err) {
        setError('Erreur lors de la mise à jour système');
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingServiceId) {
        await apiClient.put(`/structure/services/${editingServiceId}`, serviceData);
        showSuccess('Service mis à jour');
      } else {
        await apiClient.post('/structure/services', serviceData);
        showSuccess('Service créé');
      }
      setShowServiceModal(false);
      loadData();
    } catch (error) {
      setError('Erreur opération service');
    }
  };

  const handleUapSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUapId) {
        await apiClient.put(`/structure/uaps/${editingUapId}`, uapData);
        showSuccess('UAP mise à jour');
      } else {
        await apiClient.post('/structure/uaps', uapData);
        showSuccess('UAP créée');
      }
      setShowUapModal(false);
      loadData();
    } catch (error) {
      setError('Erreur opération UAP');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement de la configuration...</div>;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>⚙️ Paramètres du Système</h1>
          <p className="page-subtitle">Gestion de la structure organisationnelle et des variables d'environnement</p>
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Tabs */}
      <div className="tabs-container" style={{ margin: '20px 0' }}>
         <button className={`tab-btn ${activeTab === 'structure' ? 'active' : ''}`} onClick={() => setActiveTab('structure')}>🏢 Structure RH</button>
         <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>🛠️ Variables Système</button>
      </div>

      {/* TAB: STRUCTURE */}
      {activeTab === 'structure' && (
        <div className="config-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Services */}
          <div className="section-card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>🏢 Services</h3>
              <button className="btn-primary btn-sm" onClick={() => { setServiceData({nom_service:'', description:''}); setEditingServiceId(null); setShowServiceModal(true); }}>➕ Ajouter</button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Nom</th><th>Description</th><th>Actions</th></tr></thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s._id}>
                      <td><strong>{s.nom_service}</strong></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.description || '—'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => { setServiceData({nom_service:s.nom_service, description:s.description||''}); setEditingServiceId(s._id); setShowServiceModal(true); }}>✏️</button>
                          <button className="btn-delete" onClick={() => {/* Delete logic */}}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* UAPs */}
          <div className="section-card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>🏗️ UAPs</h3>
              <button className="btn-primary btn-sm" onClick={() => { setUapData({nom_uap:'', description:''}); setEditingUapId(null); setShowUapModal(true); }}>➕ Ajouter</button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Nom</th><th>Description</th><th>Actions</th></tr></thead>
                <tbody>
                  {uaps.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.nom_uap}</strong></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.description || '—'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => { setUapData({nom_uap:u.nom_uap, description:u.description||''}); setEditingUapId(u._id); setShowUapModal(true); }}>✏️</button>
                          <button className="btn-delete" onClick={() => {/* Delete logic */}}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SYSTEM */}
      {activeTab === 'system' && (
        <div className="section-card animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
          <h3>🛠️ Paramètres Système Avancés</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 25 }}>
            Ces variables impactent directement le comportement global de l'application et la sécurité.
          </p>

          <div className="settings-list" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* JWT Expiry */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Durée de Session (JWT)</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Délai après lequel l'utilisateur doit se reconnecter.</span>
              </div>
              <select 
                value={systemSettings.jwt_expiry} 
                onChange={(e) => handleConfigUpdate('jwt_expiry', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
              >
                <option value="1h">1 Heure (Strict)</option>
                <option value="8h">8 Heures (Bureau)</option>
                <option value="24h">24 Heures (Standard)</option>
                <option value="7d">7 Jours (Longue durée)</option>
              </select>
            </div>

            {/* SMTP Toggle */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Notifications Email (SMTP)</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Activer ou désactiver l'envoi automatique d'emails.</span>
              </div>
              <label className="switch">
                 <input 
                  type="checkbox" 
                  checked={systemSettings.smtp_enabled} 
                  onChange={(e) => handleConfigUpdate('smtp_enabled', e.target.checked)} 
                 />
                 <span className="slider round"></span>
              </label>
            </div>

            {/* Backup Frequency */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Fréquence de Sauvegarde Automatique</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Intervalle de création des archives de la base de données.</span>
              </div>
              <select 
                value={systemSettings.backup_frequency} 
                onChange={(e) => handleConfigUpdate('backup_frequency', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
              >
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>

            {/* Maintenance Mode */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--danger)' }}>🚨 Mode Maintenance</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bloquer l'accès à tous les utilisateurs sauf les Super Admins.</span>
              </div>
              <label className="switch">
                 <input 
                  type="checkbox" 
                  checked={systemSettings.maintenance_mode} 
                  onChange={(e) => handleConfigUpdate('maintenance_mode', e.target.checked)} 
                 />
                 <span className="slider round"></span>
              </label>
            </div>

            <div style={{ margin: '20px 0', borderBottom: '2px solid var(--border)', opacity: 0.5 }}></div>
            <h4 style={{ fontSize: 14, color: 'var(--primary)', marginBottom: 10 }}>🔒 Sécurité & Accès</h4>

            {/* Login Attempts */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Tentatives de Connexion</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nombre maximal d'erreurs avant blocage temporaire (Brute Force).</span>
              </div>
              <select 
                value={systemSettings.login_attempts} 
                onChange={(e) => handleConfigUpdate('login_attempts', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
              >
                <option value="3">3 Tentatives</option>
                <option value="5">5 Tentatives</option>
                <option value="10">10 Tentatives</option>
                <option value="999">Illimité</option>
              </select>
            </div>

            {/* Idle Timeout */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Auto-Déconnexion (Inactivité)</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Déconnexion automatique après inactivité prolongée.</span>
              </div>
              <select 
                value={systemSettings.idle_timeout} 
                onChange={(e) => handleConfigUpdate('idle_timeout', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
              >
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Heure</option>
                <option value="never">Jamais</option>
              </select>
            </div>

            {/* Password Complexity */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Complexité des Mots de Passe</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Exiger majuscules, chiffres et caractères spéciaux.</span>
              </div>
              <label className="switch">
                 <input 
                  type="checkbox" 
                  checked={systemSettings.password_complexity} 
                  onChange={(e) => handleConfigUpdate('password_complexity', e.target.checked)} 
                 />
                 <span className="slider round"></span>
              </label>
            </div>

            <div style={{ margin: '20px 0', borderBottom: '2px solid var(--border)', opacity: 0.5 }}></div>
            <h4 style={{ fontSize: 14, color: 'var(--primary)', marginBottom: 10 }}>👥 Utilisateurs & Rôles</h4>

            {/* Default Role */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Rôle par Défaut</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rôle attribué automatiquement aux nouveaux utilisateurs.</span>
              </div>
              <select 
                value={systemSettings.default_role} 
                onChange={(e) => handleConfigUpdate('default_role', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
              >
                <option value="employe">Employé (Standard)</option>
                <option value="infirmier">Infirmier / Pointage</option>
                <option value="chef_service">Chef de Service</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            {/* Public Registration */}
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Autoriser l'Inscription Publique</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permettre aux utilisateurs de créer leur propre compte.</span>
              </div>
              <label className="switch">
                 <input 
                  type="checkbox" 
                  checked={systemSettings.public_registration} 
                  onChange={(e) => handleConfigUpdate('public_registration', e.target.checked)} 
                 />
                 <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-in">
             <div className="modal-header">
               <h2>{editingServiceId ? '✏️ Modifier Service' : '🏢 Nouveau Service'}</h2>
               <button className="close-btn" onClick={() => setShowServiceModal(false)}>✕</button>
             </div>
             <form onSubmit={handleServiceSubmit} className="premium-form" style={{ padding: 20 }}>
               <div className="form-group">
                 <label>Nom <span className="required">*</span></label>
                 <input type="text" value={serviceData.nom_service} onChange={e => setServiceData({...serviceData, nom_service: e.target.value})} required />
               </div>
               <div className="form-group">
                 <label>Description</label>
                 <textarea value={serviceData.description} onChange={e => setServiceData({...serviceData, description: e.target.value})} rows="3" />
               </div>
               <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                 <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowServiceModal(false)}>Annuler</button>
                 <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingServiceId ? 'Mettre à jour' : 'Créer'}</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* UAP Modal (similar to Service Modal) */}
      {showUapModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-in">
             <div className="modal-header">
               <h2>{editingUapId ? '✏️ Modifier UAP' : '🏗️ Nouvelle UAP'}</h2>
               <button className="close-btn" onClick={() => setShowUapModal(false)}>✕</button>
             </div>
             <form onSubmit={handleUapSubmit} className="premium-form" style={{ padding: 20 }}>
               <div className="form-group">
                 <label>Nom de l'UAP <span className="required">*</span></label>
                 <input type="text" value={uapData.nom_uap} onChange={e => setUapData({...uapData, nom_uap: e.target.value})} required />
               </div>
               <div className="form-group">
                 <label>Description</label>
                 <textarea value={uapData.description} onChange={e => setUapData({...uapData, description: e.target.value})} rows="3" />
               </div>
               <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                 <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowUapModal(false)}>Annuler</button>
                 <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingUapId ? 'Mettre à jour' : 'Créer'}</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;
