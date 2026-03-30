import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const EmployeeDocumentsPage = () => {
  const [requests, setRequests] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type_document: '',
    message: ''
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
      const res = await apiClient.get('/api/documents/my-requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des demandes', err);
      setError('Erreur lors du chargement de vos demandes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await apiClient.get('/api/document-types');
      setDocumentTypes(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, type_document: res.data[0].name }));
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des types', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    try {
      await apiClient.post('/api/documents', formData);
      setSuccessMessage('✅ Demande envoyée avec succès');
      setShowForm(false);
      setFormData({ type_document: documentTypes[0]?.name || '', message: '' });
      fetchRequests();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Erreur lors de la création de la demande');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente': return <span className="badge badge-warning">● En attente</span>;
      case 'traite': return <span className="badge badge-success">● Traité</span>;
      case 'rejete': return <span className="badge badge-danger">● Rejeté</span>;
      case 'annule': return <span className="badge badge-neutral">● Annulé</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const handleDownload = (filename) => {
    const downloadUrl = `http://localhost:5000/uploads/documents/${filename}`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement de vos documents...</div>;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Mes Documents</h1>
          <p className="page-subtitle">Gérez vos demandes d'attestations et documents administratifs</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Nouvelle Demande
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="section-card">
        <h3>📋 Historique des Demandes</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type de Document</th>
                <th>Message / Détails</th>
                <th>Date de Demande</th>
                <th>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id}>
                  <td>
                    <strong>{documentTypes.find(t => t.name === request.type_document)?.label || request.type_document}</strong>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {request.message || '—'}
                  </td>
                  <td>{new Date(request.date_demande).toLocaleDateString()}</td>
                  <td>{getStatusBadge(request.statut)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {request.statut === 'traite' && request.fichier_joint ? (
                      <button className="btn-view" onClick={() => handleDownload(request.fichier_joint)}>
                        📥 Télécharger
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>En attente...</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Aucune demande effectuée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-in">
            <div className="modal-header">
              <h3>📄 Nouvelle Demande de Document</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="premium-form">
              <div className="form-group">
                <label>Type de Document <span className="required">*</span></label>
                <select 
                  name="type_document" 
                  value={formData.type_document}
                  onChange={(e) => setFormData({ ...formData, type_document: e.target.value })}
                  required
                >
                  <option value="">-- Sélectionner un type --</option>
                  {documentTypes.map((option) => (
                    <option key={option._id} value={option.name}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Message / Précisions</label>
                <textarea
                  rows="4"
                  placeholder="Ex: Période souhaitée, motif, etc."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Envoyer la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDocumentsPage;
