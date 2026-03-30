import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const AdminDocumentsPage = () => {
  const [requests, setRequests] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    statut: 'traite',
    commentaire_admin: ''
  });
  
  // Type Management States
  const [newType, setNewType] = useState({ name: '', label: '' });
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    type: ''
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchTypes();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/documents');
      setRequests(res.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des demandes', err);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await apiClient.get('/document-types');
      setDocumentTypes(res.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des types', err);
    }
  };

  const handleOpenUpload = (request) => {
    setSelectedRequest(request);
    setFormData({ statut: 'traite', commentaire_admin: request.commentaire_admin || '' });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('statut', formData.statut);
      formDataUpload.append('commentaire_admin', formData.commentaire_admin);
      if (file) {
        formDataUpload.append('file', file);
      }

      await apiClient.put(`/documents/${selectedRequest._id}`, formDataUpload, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccessMessage('✅ Demande mise à jour avec succès');
      setShowModal(false);
      setFile(null);
      fetchRequests();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Erreur lors de la mise à jour de la demande');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette demande ?')) {
      try {
        await apiClient.delete(`/documents/${id}`);
        setSuccessMessage('Demande supprimée');
        fetchRequests();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  // Type Management Actions
  const handleAddType = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/document-types', newType);
      setNewType({ name: '', label: '' });
      fetchTypes();
      setSuccessMessage('Type ajouté avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Erreur lors de l\'ajout du type');
    }
  };

  const handleDeleteType = async (id) => {
    if (window.confirm('Supprimer ce type de document ?')) {
      try {
        await apiClient.delete(`/document-types/${id}`);
        fetchTypes();
      } catch (err) {
        setError('Erreur lors de la suppression du type');
      }
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.employe?.prenom.toLowerCase().includes(filters.search.toLowerCase()) ||
      req.employe?.nom.toLowerCase().includes(filters.search.toLowerCase()) ||
      req.employe?.matricule.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatut = filters.statut === '' || req.statut === filters.statut;
    const matchesType = filters.type === '' || req.type_document === filters.type;

    return matchesSearch && matchesStatut && matchesType;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente': return <span className="badge badge-warning">● En attente</span>;
      case 'traite': return <span className="badge badge-success">● Traité</span>;
      case 'rejete': return <span className="badge badge-danger">● Rejeté</span>;
      case 'annule': return <span className="badge badge-neutral">● Annulé</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement des demandes...</div>;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Gestion des Demandes de Documents</h1>
          <p className="page-subtitle">Visualisez et traitez les demandes de documents des employés</p>
        </div>
        <div className="header-actions">
           <button className="btn-secondary" onClick={() => setShowTypeModal(true)}>
            ⚙️ Gérer les Types
          </button>
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Filter Bar */}
      <div className="filter-bar-card" style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div className="filter-group">
            <label>Recherche Employé</label>
            <input 
              type="text" 
              placeholder="Nom, Prénom ou Matricule..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="filter-group">
            <label>Filtrer par Statut</label>
            <select 
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="traite">Traité</option>
              <option value="rejete">Rejeté</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Type de Document</label>
            <select 
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
            >
              <option value="">Tous les types</option>
              {documentTypes.map(t => (
                <option key={t._id} value={t.name}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h3>📋 Toutes les Demandes ({filteredRequests.length})</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Matricule</th>
                <th>Type de Document</th>
                <th>Message</th>
                <th>Date de Demande</th>
                <th>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{request.employe?.prenom[0]}{request.employe?.nom[0]}</div>
                      <span>{request.employe?.prenom} <strong>{request.employe?.nom}</strong></span>
                    </div>
                  </td>
                  <td><strong>{request.employe?.matricule}</strong></td>
                  <td>
                    {documentTypes.find(t => t.name === request.type_document)?.label || request.type_document}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {request.message || '—'}
                  </td>
                  <td>{new Date(request.date_demande).toLocaleDateString()}</td>
                  <td>{getStatusBadge(request.statut)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-edit" onClick={() => handleOpenUpload(request)}>
                        📤 Traiter
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(request._id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Aucune demande trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Process Request */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-in">
            <div className="modal-header">
              <h3>⚙️ Traiter la Demande</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="premium-form">
              <div className="form-group">
                <label>Statut</label>
                <select 
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  required
                >
                  <option value="traite">Traité (Prêt)</option>
                  <option value="rejete">Rejeté</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>
              <div className="form-group">
                <label>Commentaire Administration</label>
                <textarea 
                  placeholder="Ex: Document disponible, motif du rejet, etc."
                  value={formData.commentaire_admin}
                  onChange={(e) => setFormData({ ...formData, commentaire_admin: e.target.value })}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Joindre le Document (PDF, Word, Image)</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <small className="field-hint">Le document sera téléchargeable par l'employé.</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Valider les changements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Types */}
      {showTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>⚙️ Gérer les Types de Documents</h3>
              <button className="close-btn" onClick={() => setShowTypeModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddType} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-hover)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Ajouter un nouveau type</h4>
              <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <input 
                  type="text" 
                  placeholder="ID (ex: attestation_travail)"
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                />
                <input 
                  type="text" 
                  placeholder="Libellé (ex: Attestation de Travail)"
                  value={newType.label}
                  onChange={(e) => setNewType({ ...newType, label: e.target.value })}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px' }}>Ajouter</button>
              </div>
            </form>

            <div className="types-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {documentTypes.map(type => (
                <div key={type._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{type.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {type.name}</div>
                  </div>
                  <button className="btn-delete" onClick={() => handleDeleteType(type._id)} style={{ padding: '5px' }}>🗑️</button>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTypeModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentsPage;
