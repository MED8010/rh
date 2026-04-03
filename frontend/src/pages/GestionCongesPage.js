import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const GestionCongesPage = () => {
  const { user } = useAuth();
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('demande');

  useEffect(() => {
    loadConges();
  }, [filterStatut]);

  const loadConges = async () => {
    try {
      setLoading(true);
      const params = filterStatut === 'tous' ? {} : { statut: filterStatut };
      const response = await apiClient.get('/conges', { params });
      setConges(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approuver cette demande de congé?')) return;

    try {
      await apiClient.put(`/conges/${id}/approve`);
      alert('Congé approuvé avec succès!');
      loadConges();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id) => {
    const commentaire = prompt('Raison du refus:');
    if (commentaire === null) return;

    try {
      await apiClient.put(`/conges/${id}/reject`, { commentaire_rejet: commentaire || 'Refus de la demande' });
      alert('Congé refusé!');
      loadConges();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors du refus');
    }
  };

  if (loading && conges.length === 0) {
    return <div className="loading"><div className="spinner"></div>Chargement des demandes...</div>;
  }

  const pendingCount = conges.filter(c => c.statut === 'demande').length;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>🌴 Gestion des Congés</h1>
          <p className="page-subtitle">
            Vous avez <strong>{pendingCount}</strong> demande(s) en attente de validation
          </p>
        </div>
      </div>

      <div className="admin-tabs" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-btn ${filterStatut === 'demande' ? 'active' : ''}`}
          onClick={() => setFilterStatut('demande')}
        >
          ⏳ En Attente ({conges.filter(c => c.statut === 'demande').length})
        </button>
        <button
          className={`tab-btn ${filterStatut === 'approuve' ? 'active' : ''}`}
          onClick={() => setFilterStatut('approuve')}
        >
          ✅ Approuvés
        </button>
        <button
          className={`tab-btn ${filterStatut === 'refuse' ? 'active' : ''}`}
          onClick={() => setFilterStatut('refuse')}
        >
          ❌ Refusés
        </button>
        <button
          className={`tab-btn ${filterStatut === 'tous' ? 'active' : ''}`}
          onClick={() => setFilterStatut('tous')}
        >
          📋 Tous
        </button>
      </div>

      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Période</th>
                <th>Type</th>
                <th style={{ textAlign: 'center' }}>Jours</th>
                <th>Motif</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conges.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <strong style={{ color: 'var(--text-primary)' }}>{c.employe?.prenom} {c.employe?.nom}</strong>
                       <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.employe?.matricule}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                       {new Date(c.date_debut).toLocaleDateString('fr-FR')} 
                       <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>→</span>
                       {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td><span className="badge badge-info">{c.type}</span></td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{c.nombre_jours}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {c.motif || <em style={{ color: 'var(--text-muted)' }}>Sans motif</em>}
                  </td>
                  <td>
                    <span className={`badge ${
                      c.statut === 'approuve' ? 'badge-success' : 
                      c.statut === 'refuse' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {c.statut === 'demande' ? '⏳ En attente' : 
                       c.statut === 'approuve' ? '✅ Approuvé' : '❌ Refusé'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                      {c.statut === 'demande' ? (
                        <>
                          <button className="btn-approve" onClick={() => handleApprove(c._id)} title="Approuver">✅</button>
                          <button className="btn-reject" onClick={() => handleReject(c._id)} title="Refuser">❌</button>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
                          {c.statut === 'approuve' ? 'Approuvé le ' : 'Refusé le '}
                          {new Date(c.date_validation || c.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {conges.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Aucune demande de congé trouvée dans cette catégorie.
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

export default GestionCongesPage;
