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
      const response = await apiClient.get('/stages/my-requests');
      setStages(response.data);
    } catch (error) {
      console.error('Erreur chargement stages:', error);
      setError('Erreur lors du chargement');
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
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      await apiClient.post('/stages', formData);
      setSuccessMessage('Demande de stage créée avec succès');
      setFormData({ titre: '', description: '', domaine: 'informatique', date_debut: '', date_fin: '', entreprise: '' });
      setShowForm(false);
      loadStages();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard">
      <h1>📚 Demandes de Stage</h1>

      {error && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '12px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ✅ {successMessage}
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: '10px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}
      >
        {showForm ? '✕ Annuler' : '➕ Nouvelle Demande'}
      </button>

      {showForm && (
        <div className="table-container" style={{ marginBottom: '20px' }}>
          <h2>Formulaire de Demande de Stage</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Titre du Stage *
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Développeur Full Stack"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Entreprise *
                </label>
                <input
                  type="text"
                  name="entreprise"
                  value={formData.entreprise}
                  onChange={handleChange}
                  placeholder="Ex: Microsoft"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Domaine *
                </label>
                <select
                  name="domaine"
                  value={formData.domaine}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option value="informatique">Informatique</option>
                  <option value="ressources_humaines">Ressources Humaines</option>
                  <option value="finance">Finance</option>
                  <option value="marketing">Marketing</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Date de Début *
                </label>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Date de Fin *
                </label>
                <input
                  type="date"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre projet de stage..."
                  rows="4"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '15px',
                padding: '12px 30px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              ✅ Soumettre Demande
            </button>
          </form>
        </div>
      )}

      <div className="table-container">
        <h2>Mes Demandes de Stage ({stages.length})</h2>
        {stages.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
            Aucune demande de stage créée
          </p>
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Titre</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Entreprise</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Domaine</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Dates</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {stages.map(stage => (
                <tr key={stage._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{stage.titre}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>{stage.entreprise}</td>
                  <td style={{ padding: '12px' }}>{stage.domaine}</td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {new Date(stage.date_debut).toLocaleDateString('fr-FR')} → {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: stage.statut === 'approuve' ? '#d4edda' : stage.statut === 'refuse' ? '#f8d7da' : '#fff3cd',
                      color: stage.statut === 'approuve' ? '#155724' : stage.statut === 'refuse' ? '#721c24' : '#856404'
                    }}>
                      {stage.statut.charAt(0).toUpperCase() + stage.statut.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StagePage;
