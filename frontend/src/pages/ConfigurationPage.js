import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const ConfigurationPage = () => {
  const [services, setServices] = useState([]);
  const [uaps, setUaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showUapForm, setShowUapForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingUapId, setEditingUapId] = useState(null);

  const [serviceData, setServiceData] = useState({ nom_service: '', description: '' });
  const [uapData, setUapData] = useState({ nom_uap: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servRes, uapRes] = await Promise.all([
        apiClient.get('/structure/services'),
        apiClient.get('/structure/uaps'),
      ]);
      setServices(servRes.data);
      setUaps(uapRes.data);
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

  // --- SERVICE ACTIONS ---
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingServiceId) {
        await apiClient.put(`/structure/services/${editingServiceId}`, serviceData);
        showSuccess('Service mis à jour avec succès');
      } else {
        await apiClient.post('/structure/services', serviceData);
        showSuccess('Service créé avec succès');
      }
      setServiceData({ nom_service: '', description: '' });
      setEditingServiceId(null);
      setShowServiceForm(false);
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de l\'opération sur le service');
    }
  };

  const handleEditService = (service) => {
    setServiceData({ nom_service: service.nom_service, description: service.description || '' });
    setEditingServiceId(service._id);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (id, name) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le service "${name}" ?`)) {
      try {
        await apiClient.delete(`/structure/services/${id}`);
        showSuccess('Service supprimé');
        loadData();
      } catch (error) {
        setError('Erreur lors de la suppression du service');
      }
    }
  };

  // --- UAP ACTIONS ---
  const handleUapSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUapId) {
        await apiClient.put(`/structure/uaps/${editingUapId}`, uapData);
        showSuccess('UAP mise à jour avec succès');
      } else {
        await apiClient.post('/structure/uaps', uapData);
        showSuccess('UAP créée avec succès');
      }
      setUapData({ nom_uap: '', description: '' });
      setEditingUapId(null);
      setShowUapForm(false);
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de l\'opération sur l\'UAP');
    }
  };

  const handleEditUap = (uap) => {
    setUapData({ nom_uap: uap.nom_uap, description: uap.description || '' });
    setEditingUapId(uap._id);
    setShowUapForm(true);
  };

  const handleDeleteUap = async (id, name) => {
    if (window.confirm(`Voulez-vous vraiment supprimer l'UAP "${name}" ?`)) {
      try {
        await apiClient.delete(`/structure/uaps/${id}`);
        showSuccess('UAP supprimée');
        loadData();
      } catch (error) {
        setError('Erreur lors de la suppression de l\'UAP');
      }
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement de la configuration...</div>;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Configuration Structurelle</h1>
          <p className="page-subtitle">Gérez les services et les unités autonomes de production (UAP)</p>
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="config-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
        
        {/* Section Services */}
        <div className="section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>🏢 Liste des Services</h3>
            <button className="btn-primary btn-sm" onClick={() => { setServiceData({ nom_service: '', description: '' }); setEditingServiceId(null); setShowServiceForm(true); }}>
              ➕ Ajouter
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Nom du Service</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.nom_service}</strong></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.description || '—'}</td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-edit" onClick={() => handleEditService(s)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDeleteService(s._id, s.nom_service)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Aucun service configuré</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Section UAPs */}
        <div className="section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>🏗️ Liste des UAPs</h3>
            <button className="btn-primary btn-sm" onClick={() => { setUapData({ nom_uap: '', description: '' }); setEditingUapId(null); setShowUapForm(true); }}>
              ➕ Ajouter
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Nom de l'UAP</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uaps.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.nom_uap}</strong></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.description || '—'}</td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-edit" onClick={() => handleEditUap(u)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDeleteUap(u._id, u.nom_uap)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {uaps.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Aucune UAP configurée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Modal */}
      {showServiceForm && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-in">
            <div className="modal-header">
              <h3>{editingServiceId ? '✏️ Modifier Service' : '➕ Nouveau Service'}</h3>
              <button className="close-btn" onClick={() => setShowServiceForm(false)}>✕</button>
            </div>
            <form onSubmit={handleServiceSubmit} className="premium-form" style={{ padding: '20px' }}>
              <div className="form-group">
                <label>Nom du Service <span className="required">*</span></label>
                <input type="text" value={serviceData.nom_service} onChange={e => setServiceData({...serviceData, nom_service: e.target.value})} required placeholder="Ex: Maintenance, RH, Production..." />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={serviceData.description} onChange={e => setServiceData({...serviceData, description: e.target.value})} placeholder="Description optionnelle..." rows="3" />
              </div>
              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowServiceForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editingServiceId ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UAP Modal */}
      {showUapForm && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-in">
            <div className="modal-header">
              <h3>{editingUapId ? '✏️ Modifier UAP' : '➕ Nouvelle UAP'}</h3>
              <button className="close-btn" onClick={() => setShowUapForm(false)}>✕</button>
            </div>
            <form onSubmit={handleUapSubmit} className="premium-form" style={{ padding: '20px' }}>
              <div className="form-group">
                <label>Nom de l'UAP <span className="required">*</span></label>
                <input type="text" value={uapData.nom_uap} onChange={e => setUapData({...uapData, nom_uap: e.target.value})} required placeholder="Ex: UAP1, Assemblage..." />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={uapData.description} onChange={e => setUapData({...uapData, description: e.target.value})} placeholder="Description optionnelle..." rows="3" />
              </div>
              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowUapForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editingUapId ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;
