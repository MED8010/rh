import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const ChefServiceDashboard = () => {
  const { user } = useAuth();
  const [conges, setConges] = useState([]);
  const [stages, setStages] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conges');
  const [error, setError] = useState('');
  const [selectedConge, setSelectedConge] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [motifRefus, setMotifRefus] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [congesRes, stagesRes, employesRes] = await Promise.all([
        apiClient.get('/conges?statut=en_attente'),
        apiClient.get('/stages'),
        apiClient.get('/employes')
      ]);
      setConges(congesRes.data);
      setStages(stagesRes.data);
      setEmployes(employesRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveConge = async (congeId) => {
    try {
      await apiClient.put(`/conges/${congeId}`, { statut: 'approuve' });
      setConges(conges.filter(c => c._id !== congeId));
      setError('');
    } catch (error) {
      setError('Erreur lors de l\'approbation');
    }
  };

  const handleRejectConge = async (congeId) => {
    try {
      await apiClient.put(`/conges/${congeId}`, { statut: 'refuse', motif_refus: motifRefus });
      setConges(conges.filter(c => c._id !== congeId));
      setSelectedConge(null);
      setMotifRefus('');
      setError('');
    } catch (error) {
      setError('Erreur lors du refus');
    }
  };

  const handleApproveStage = async (stageId) => {
    try {
      await apiClient.put(`/stages/${stageId}/approve`);
      setStages(stages.map(s => s._id === stageId ? { ...s, statut: 'approuve' } : s));
      setError('');
    } catch (error) {
      setError('Erreur lors de l\'approbation');
    }
  };

  const handleRejectStage = async (stageId) => {
    try {
      await apiClient.put(`/stages/${stageId}/reject`, { motif_refus: motifRefus });
      setStages(stages.map(s => s._id === stageId ? { ...s, statut: 'refuse' } : s));
      setSelectedStage(null);
      setMotifRefus('');
      setError('');
    } catch (error) {
      setError('Erreur lors du refus');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const enAttenteConges = conges.filter(c => c.statut === 'en_attente').length;
  const enAttenteStages = stages.filter(s => s.statut === 'en_attente').length;

  return (
    <div className="dashboard">
      <h1>📋 Chef de Service Dashboard</h1>
      <p className="welcome-text">
        Bienvenue, {user?.employe?.prenom} {user?.employe?.nom}
      </p>

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

      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Congés en Attente</h3>
          <div className="kpi-value" style={{ color: '#f4a261' }}>{enAttenteConges}</div>
          <p className="kpi-label">À approuver</p>
        </div>

        <div className="kpi-card">
          <h3>Demandes de Stage</h3>
          <div className="kpi-value" style={{ color: '#667eea' }}>{enAttenteStages}</div>
          <p className="kpi-label">À traiter</p>
        </div>

        <div className="kpi-card">
          <h3>Total Employés</h3>
          <div className="kpi-value">{employes.length}</div>
          <p className="kpi-label">Sous ma supervision</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('conges')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'conges' ? '#667eea' : 'transparent',
            color: activeTab === 'conges' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderBottom: activeTab === 'conges' ? '3px solid #667eea' : 'none'
          }}
        >
          🏖️ Congés ({enAttenteConges})
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'stages' ? '#667eea' : 'transparent',
            color: activeTab === 'stages' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderBottom: activeTab === 'stages' ? '3px solid #667eea' : 'none'
          }}
        >
          📚 Stages ({enAttenteStages})
        </button>
      </div>

      {/* Congés Tab */}
      {activeTab === 'conges' && (
        <div className="table-container">
          <h2>Demandes de Congés à Approuver</h2>
          {conges.filter(c => c.statut === 'en_attente').length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Aucune demande en attente</p>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Employé</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Du</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Au</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {conges.filter(c => c.statut === 'en_attente').map(conge => (
                  <tr key={conge._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{conge.employe?.prenom} {conge.employe?.nom}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(conge.date_debut).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '12px' }}>{new Date(conge.date_fin).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '12px' }}>{conge.type}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleApproveConge(conge._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#28a745',
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
                        onClick={() => setSelectedConge(conge._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ❌ Refuser
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Stages Tab */}
      {activeTab === 'stages' && (
        <div className="table-container">
          <h2>Demandes de Stage à Valider</h2>
          {stages.filter(s => s.statut === 'en_attente').length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Aucune demande en attente</p>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Employé</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Titre</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Entreprise</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Dates</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stages.filter(s => s.statut === 'en_attente').map(stage => (
                  <tr key={stage._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{stage.employe?.prenom} {stage.employe?.nom}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>{stage.titre}</td>
                    <td style={{ padding: '12px' }}>{stage.entreprise}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {new Date(stage.date_debut).toLocaleDateString('fr-FR')} → {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleApproveStage(stage._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#28a745',
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
                        onClick={() => setSelectedStage(stage._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ❌ Refuser
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Refus Congé */}
      {selectedConge && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2>Motif du Refus</h2>
            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              placeholder="Explicitez les raisons du refus..."
              rows="4"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '15px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleRejectConge(selectedConge)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Refuser
              </button>
              <button
                onClick={() => {
                  setSelectedConge(null);
                  setMotifRefus('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Refus Stage */}
      {selectedStage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2>Motif du Refus</h2>
            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              placeholder="Explicitez les raisons du refus..."
              rows="4"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '15px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleRejectStage(selectedStage)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Refuser
              </button>
              <button
                onClick={() => {
                  setSelectedStage(null);
                  setMotifRefus('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefServiceDashboard;
