import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const CongesPage = () => {
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConges();
  }, []);

  const loadConges = async () => {
    try {
      const response = await apiClient.get('/conges', { params: { statut: 'demande' } });
      setConges(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.put(`/conges/${id}/approve`);
      loadConges();
    } catch (error) {
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id) => {
    try {
      await apiClient.put(`/conges/${id}/reject`, { commentaire_rejet: 'Refus de la demande' });
      loadConges();
    } catch (error) {
      alert('Erreur lors du refus');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard">
      <h1>Gestion des Congés</h1>

      <div className="table-container">
        <h2>Demandes en Attente ({conges.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Du</th>
              <th>Au</th>
              <th>Type</th>
              <th>Jours</th>
              <th>Motif</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {conges.map(c => (
              <tr key={c._id}>
                <td>{c.employe?.prenom} {c.employe?.nom}</td>
                <td>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                <td>{c.type}</td>
                <td>{c.nombre_jours}</td>
                <td>{c.motif}</td>
                <td>
                  <button className="btn btn-primary" onClick={() => handleApprove(c._id)}>Approuver</button>
                  <button className="btn btn-danger" onClick={() => handleReject(c._id)}>Refuser</button>
                </td>
              </tr>
            ))}
            {conges.length === 0 && <tr><td colSpan="7">Aucune demande en attente</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CongesPage;
