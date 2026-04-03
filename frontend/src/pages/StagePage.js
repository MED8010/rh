import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const StagePage = () => {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    domaine: 'informatique',
    date_debut: '',
    date_fin: '',
    entreprise: ''
  });

  useEffect(() => {
    loadStages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/stages/my-requests');
      setStages(response.data);
    } catch (error) {
      console.error('Erreur chargement stages:', error);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.titre || !formData.description || !formData.date_debut || !formData.date_fin || !formData.entreprise) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await apiClient.post('/stages', formData);
      setSuccessMessage('Votre demande de stage a été envoyée avec succès');
      setFormData({ titre: '', description: '', domaine: 'informatique', date_debut: '', date_fin: '', entreprise: '' });
      setShowForm(false);
      loadStages();

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création de la demande');
      console.error(error);
    }
  };

  if (loading && stages.length === 0) {
    return <div className="loading"><div className="spinner"></div>Chargement de vos demandes...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>📚 Mes Demandes de Stage</h1>
          <p className="page-subtitle">Suivez l'état de vos demandes de stage en cours</p>
        </div>
        <button
          className={showForm ? "btn-secondary" : "btn-primary"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Annuler' : '➕ Nouvelle Demande'}
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {successMessage && <div className="success-message">✅ {successMessage}</div>}

      {showForm && (
        <div className="section-card animate-slide-in" style={{ marginBottom: '28px' }}>
          <h3>📝 Formulaire de Demande</h3>
          <form onSubmit={handleSubmit} className="premium-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Titre du Stage <span className="required">*</span></label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Développeur React"
                  required
                />
              </div>

              <div className="form-group">
                <label>Entreprise <span className="required">*</span></label>
                <input
                  type="text"
                  name="entreprise"
                  value={formData.entreprise}
                  onChange={handleChange}
                  placeholder="Ex: LPE Solutions"
                  required
                />
              </div>

              <div className="form-group">
                <label>Domaine <span className="required">*</span></label>
                <select
                  name="domaine"
                  value={formData.domaine}
                  onChange={handleChange}
                  required
                >
                  <option value="informatique">Informatique</option>
                  <option value="ressources_humaines">RH / Admin</option>
                  <option value="finance">Finance / Comptabilité</option>
                  <option value="marketing">Marketing / Comm</option>
                  <option value="production">Production / Logistique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date de Début <span className="required">*</span></label>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date de Fin <span className="required">*</span></label>
                <input
                  type="date"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description du projet <span className="required">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Détaillez vos objectifs et missions prévues..."
                  rows="4"
                  required
                />
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="submit" className="btn-primary">✅ Envoyer la Demande</button>
            </div>
          </form>
        </div>
      )}

      <div className="section-card">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <h3>📋 Historique des Demandes</h3>
        </div>
        
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre / Entreprise</th>
                <th>Domaine</th>
                <th>Période</th>
                <th style={{ textAlign: 'center' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {stages.map(stage => (
                <tr key={stage._id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <strong style={{ color: 'var(--text-primary)' }}>{stage.titre}</strong>
                       <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stage.entreprise}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{stage.domaine?.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: 13 }}>
                    {new Date(stage.date_debut).toLocaleDateString('fr-FR')} 
                    <span style={{ margin: '0 5px', color: 'var(--text-muted)' }}>→</span>
                    {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${
                      stage.statut === 'approuve' ? 'badge-success' : 
                      stage.statut === 'refuse' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {stage.statut.charAt(0).toUpperCase() + stage.statut.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {stages.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Vous n'avez aucune demande de stage pour le moment.
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

export default StagePage;
