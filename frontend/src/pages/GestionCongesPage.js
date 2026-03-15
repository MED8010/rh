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
      console.log('Approbation du congé:', id);
      const response = await apiClient.put(`/conges/${id}/approve`);
      console.log('Réponse approbation:', response.data);
      alert('Congé approuvé avec succès!');
      loadConges();
    } catch (error) {
      console.error('Erreur approbation:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'approbation';
      alert(errorMsg);
    }
  };

  const handleReject = async (id) => {
    const commentaire = prompt('Raison du refus:');
    if (commentaire === null) return;

    try {
      console.log('Rejet du congé:', id, 'Raison:', commentaire);
      const response = await apiClient.put(`/conges/${id}/reject`, { commentaire_rejet: commentaire || 'Refus de la demande' });
      console.log('Réponse rejet:', response.data);
      alert('Congé refusé!');
      loadConges();
    } catch (error) {
      console.error('Erreur rejet:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Erreur lors du refus';
      alert(errorMsg);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const pendingCount = conges.filter(c => c.statut === 'demande').length;

  return (
    <div className="dashboard">
      <h1>Gestion des Demandes de Congés</h1>
      <p className="welcome-text">
        En attente: <strong>{pendingCount}</strong> demande(s)
      </p>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setFilterStatut('demande')}
          style={{
            padding: '8px 16px',
            backgroundColor: filterStatut === 'demande' ? '#f39c12' : '#ecf0f1',
            color: filterStatut === 'demande' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ⏳ En Attente ({conges.filter(c => c.statut === 'demande').length})
        </button>
        <button
          onClick={() => setFilterStatut('approuve')}
          style={{
            padding: '8px 16px',
            backgroundColor: filterStatut === 'approuve' ? '#2ecc71' : '#ecf0f1',
            color: filterStatut === 'approuve' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ✅ Approuvés
        </button>
        <button
          onClick={() => setFilterStatut('refuse')}
          style={{
            padding: '8px 16px',
            backgroundColor: filterStatut === 'refuse' ? '#e74c3c' : '#ecf0f1',
            color: filterStatut === 'refuse' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ❌ Refusés
        </button>
        <button
          onClick={() => setFilterStatut('tous')}
          style={{
            padding: '8px 16px',
            backgroundColor: filterStatut === 'tous' ? '#667eea' : '#ecf0f1',
            color: filterStatut === 'tous' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📋 Tous
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Du</th>
              <th>Au</th>
              <th>Type</th>
              <th>Jours</th>
              <th>Motif</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {conges.map(c => (
              <tr key={c._id}>
                <td><strong>{c.employe?.prenom} {c.employe?.nom}</strong></td>
                <td>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                <td>{c.type}</td>
                <td>{c.nombre_jours}</td>
                <td>{c.motif || '-'}</td>
                <td style={{
                  color: c.statut === 'approuve' ? '#2ecc71' : c.statut === 'refuse' ? '#e74c3c' : '#f39c12',
                  fontWeight: 'bold'
                }}>
                  {c.statut === 'demande' && '⏳ En attente'}
                  {c.statut === 'approuve' && '✅ Approuvé'}
                  {c.statut === 'refuse' && '❌ Refusé'}
                </td>
                <td>
                  {c.statut === 'demande' && (
                    <>
                      <button
                        onClick={() => handleApprove(c._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#2ecc71',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px',
                          fontSize: '12px'
                        }}
                      >
                        ✅ Approuver
                      </button>
                      <button
                        onClick={() => handleReject(c._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ❌ Refuser
                      </button>
                    </>
                  )}
                  {c.statut !== 'demande' && (
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      Traitée le {new Date(c.date_validation).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {conges.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Aucune demande de congé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionCongesPage;
