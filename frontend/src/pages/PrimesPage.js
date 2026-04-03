import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const PrimesPage = () => {
  const [activeTab, setActiveTab] = useState('assignment');
  const [employes, setEmployes] = useState([]);
  const [primeTypes, setPrimeTypes] = useState([]);
  const [primes, setPrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ summary: { totalMontant: 0, count: 0 } });

  // Filter State
  const [filterMois, setFilterMois] = useState(new Date().getMonth() + 1);
  const [filterAnnee, setFilterAnnee] = useState(new Date().getFullYear());

  // Assignment Form State
  const [assignmentData, setAssignmentData] = useState({
    employe: '',
    type_prime: '',
    montant: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    description: ''
  });

  // Type Form State
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [typeData, setTypeData] = useState({
    nom: '',
    description: '',
    categorie: 'autre',
    montant_par_defaut: 0,
    est_imposable: true
  });

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, typesRes] = await Promise.all([
        apiClient.get('/employes'),
        apiClient.get('/primes/types')
      ]);
      setEmployes(empRes.data);
      setPrimeTypes(typesRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des données initiales');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrimes = useCallback(async () => {
    try {
      const res = await apiClient.get('/primes', { params: { mois: filterMois, annee: filterAnnee } });
      setPrimes(res.data);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
    }
  }, [filterMois, filterAnnee]);

  const loadStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/primes/stats', { params: { mois: filterMois, annee: filterAnnee } });
      setStats(res.data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  }, [filterMois, filterAnnee]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadPrimes();
    loadStats();
  }, [loadPrimes, loadStats]);

  const showFeedback = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleAssignPrime = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/primes', assignmentData);
      showFeedback('✅ Prime attribuée avec succès');
      setAssignmentData({ ...assignmentData, montant: '', description: '' });
      loadPrimes();
      loadStats();
    } catch (err) {
      showFeedback('❌ Erreur lors de l\'attribution', true);
    }
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTypeId) {
        await apiClient.put(`/primes/types/${editingTypeId}`, typeData);
        showFeedback('✅ Type de prime mis à jour');
      } else {
        await apiClient.post('/primes/types', typeData);
        showFeedback('✅ Nouveau type de prime créé');
      }
      setShowTypeModal(false);
      loadInitialData();
    } catch (err) {
      showFeedback('❌ Erreur lors de l\'opération sur le type', true);
    }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm('Voulez-vous supprimer ce type de prime ?')) return;
    try {
      await apiClient.delete(`/primes/types/${id}`);
      showFeedback('✅ Type de prime supprimé');
      loadInitialData();
    } catch (err) {
      showFeedback(err.response?.data?.message || '❌ Erreur suppression', true);
    }
  };

  if (loading && activeTab === 'assignment' && employes.length === 0) {
    return <div className="loading"><div className="spinner"></div>Chargement...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Gestion des Primes</h1>
          <p className="page-subtitle">Configurez les types de primes et attribuez-les aux employés</p>
        </div>
      </div>

      {error && <div className="error-message animate-fade-in">{error}</div>}
      {success && <div className="success-message animate-fade-in">{success}</div>}

      <div className="filter-bar-card section-card" style={{ marginBottom: 24, padding: '15px 20px' }}>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 12 }}>Période d'analyse</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <select 
                value={filterMois} 
                onChange={e => setFilterMois(parseInt(e.target.value))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr-FR', {month: 'long'})}</option>
                ))}
              </select>
              <input 
                type="number" 
                value={filterAnnee} 
                onChange={e => setFilterAnnee(parseInt(e.target.value))}
                style={{ width: 100, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <button className="btn-primary" onClick={() => { loadPrimes(); loadStats(); }} style={{ padding: '10px 15px', marginTop: 18 }}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      <div className="kpi-container" style={{ marginBottom: 24 }}>
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top"><div className="kpi-icon-box">💰</div></div>
          <div>
            <p className="kpi-label">Total des Primes</p>
            <p className="kpi-value">{(stats.summary?.totalMontant || 0).toLocaleString()} DT</p>
            <p className="kpi-subtitle">versées ce mois</p>
          </div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-card-top"><div className="kpi-icon-box">👥</div></div>
          <div>
            <p className="kpi-label">Bénéficiaires</p>
            <p className="kpi-value">{stats.summary?.count || 0}</p>
            <p className="kpi-subtitle">employés primés</p>
          </div>
        </div>
        <div className="kpi-card kpi-warning">
          <div className="kpi-card-top"><div className="kpi-icon-box">📊</div></div>
          <div>
            <p className="kpi-label">Prime Moyenne</p>
            <p className="kpi-value">
              {stats.summary?.count > 0 
                ? (stats.summary.totalMontant / stats.summary.count).toFixed(0) 
                : 0} DT
            </p>
            <p className="kpi-subtitle">par bénéficiaire</p>
          </div>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${activeTab === 'assignment' ? 'active' : ''}`} onClick={() => setActiveTab('assignment')}>
          <span className="tab-icon">➕</span> Attribution
        </button>
        <button className={`tab-btn ${activeTab === 'types' ? 'active' : ''}`} onClick={() => setActiveTab('types')}>
          <span className="tab-icon">⚙️</span> Configuration des Types
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <span className="tab-icon">📜</span> Historique
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'assignment' && (
          <div className="section-card animate-slide-in">
            <h3>Attribuer une Prime</h3>
            <form onSubmit={handleAssignPrime} className="prime-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label>Employé</label>
                  <select 
                    required 
                    value={assignmentData.employe} 
                    onChange={e => setAssignmentData({...assignmentData, employe: e.target.value})}
                  >
                    <option value="">Sélectionner un employé</option>
                    {employes.map(e => <option key={e._id} value={e._id}>{e.prenom} {e.nom} ({e.matricule})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type de Prime</label>
                  <select 
                    required 
                    value={assignmentData.type_prime} 
                    onChange={e => {
                      const type = primeTypes.find(t => t._id === e.target.value);
                      setAssignmentData({
                        ...assignmentData, 
                        type_prime: e.target.value,
                        montant: type ? type.montant_par_defaut : ''
                      });
                    }}
                  >
                    <option value="">Sélectionner un type</option>
                    {primeTypes.map(t => <option key={t._id} value={t._id}>{t.nom}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Montant (DT)</label>
                  <input 
                    type="number" 
                    required 
                    value={assignmentData.montant} 
                    onChange={e => setAssignmentData({...assignmentData, montant: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Période (Mois/Année)</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select value={assignmentData.mois} onChange={e => setAssignmentData({...assignmentData, mois: e.target.value})}>
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr-FR', {month: 'long'})}</option>
                      ))}
                    </select>
                    <input type="number" style={{ width: 100 }} value={assignmentData.annee} onChange={e => setAssignmentData({...assignmentData, annee: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Commentaire / Note</label>
                <textarea 
                  value={assignmentData.description} 
                  onChange={e => setAssignmentData({...assignmentData, description: e.target.value})}
                  placeholder="Justification ou détail de la prime..."
                ></textarea>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 10 }}>
                Valider l'attribution
              </button>
            </form>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="section-card animate-slide-in">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>Types de Primes Configurés</h3>
              <button className="btn-primary" onClick={() => { setEditingTypeId(null); setTypeData({ nom:'', description:'', categorie:'autre', montant_par_defaut:0, est_imposable:true }); setShowTypeModal(true); }}>
                + Nouveau Type
              </button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Montant Défaut</th>
                    <th>Imposable</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {primeTypes.map(t => (
                    <tr key={t._id}>
                      <td><strong>{t.nom}</strong><br/><small>{t.description}</small></td>
                      <td><span className="badge badge-neutral">{t.categorie}</span></td>
                      <td>{t.montant_par_defaut} DT</td>
                      <td>{t.est_imposable ? 'Oui' : 'Non'}</td>
                      <td>
                        <button className="btn-view" onClick={() => { setEditingTypeId(t._id); setTypeData(t); setShowTypeModal(true); }}>✏️</button>
                        <button className="btn-delete" onClick={() => handleDeleteType(t._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="section-card animate-slide-in">
            <h3>Historique des Attributions</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employé</th>
                    <th>Type de Prime</th>
                    <th>Montant</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {primes.map(p => (
                    <tr key={p._id}>
                      <td>{p.mois}/{p.annee}</td>
                      <td><strong>{p.employe?.prenom} {p.employe?.nom}</strong><br/><small>{p.employe?.matricule}</small></td>
                      <td>{p.type_prime?.nom}</td>
                      <td><span style={{ fontWeight: 700, color: 'var(--success)' }}>{p.montant} DT</span></td>
                      <td style={{ fontSize: 13 }}>{p.description || '—'}</td>
                    </tr>
                  ))}
                  {primes.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune prime trouvée pour cette période</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Type Modal */}
      {showTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingTypeId ? 'Modifier Type de Prime' : 'Nouveau Type de Prime'}</h3>
            <form onSubmit={handleTypeSubmit}>
              <div className="form-group">
                <label>Nom</label>
                <input required type="text" value={typeData.nom} onChange={e => setTypeData({...typeData, nom: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select value={typeData.categorie} onChange={e => setTypeData({...typeData, categorie: e.target.value})}>
                  <option value="exceptionnelle">Exceptionnelle</option>
                  <option value="rendement">Rendement</option>
                  <option value="transport">Transport</option>
                  <option value="panier">Panier</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Montant par défaut (DT)</label>
                <input type="number" value={typeData.montant_par_defaut} onChange={e => setTypeData({...typeData, montant_par_defaut: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={typeData.description} onChange={e => setTypeData({...typeData, description: e.target.value})}></textarea>
              </div>
              <div className="form-group checkbox-group">
                <input type="checkbox" checked={typeData.est_imposable} onChange={e => setTypeData({...typeData, est_imposable: e.target.checked})} />
                <label>Prime Imposable</label>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTypeModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrimesPage;
