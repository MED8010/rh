import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const STATUT_BADGE = {
  actif: <span className="badge badge-success">● Actif</span>,
  inactif: <span className="badge badge-danger">● Inactif</span>,
  conge: <span className="badge badge-warning">● Congé</span>,
  suspendu: <span className="badge badge-neutral">● Suspendu</span>,
};

const EmployesPage = () => {
  const navigate = useNavigate();
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterUap, setFilterUap] = useState('');

  const emptyForm = {
    matricule: '', nom: '', prenom: '', date_embauche: '',
    prix_heure: '', service: '', uap: '', email: '',
    telephone: '', adresse: '', statut: 'actif',
    solde_conge_total: '22', password: '', role: 'employe'
  };
  const [formData, setFormData] = useState(emptyForm);
  const [services, setServices] = useState([]);
  const [uaps, setUaps] = useState([]);

  useEffect(() => {
    loadEmployes();
    loadStructures();
  }, []);

  const loadEmployes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/employes');
      setEmployes(response.data);
    } catch (error) {
      setError('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const loadStructures = async () => {
    try {
      const [servRes, uapRes] = await Promise.all([
        apiClient.get('/structure/services'),
        apiClient.get('/structure/uaps'),
      ]);
      setServices(servRes.data);
      setUaps(uapRes.data);
    } catch (error) {
      console.error('Erreur structures:', error);
    }
  };

  const generateNewMatricule = () => {
    const year = new Date().getFullYear();
    if (employes.length === 0) return `EMP-${year}-0001`;

    // Find the highest numeric part for the current year
    const yearPrefix = `EMP-${year}-`;
    const yearMatricules = employes
      .map(e => e.matricule)
      .filter(m => m.startsWith(yearPrefix))
      .map(m => parseInt(m.split('-')[2]))
      .filter(n => !isNaN(n));

    const nextNumber = yearMatricules.length > 0 ? Math.max(...yearMatricules) + 1 : 1;
    return `${yearPrefix}${nextNumber.toString().padStart(4, '0')}`;
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, matricule: generateNewMatricule() }));
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setError('');
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.matricule || !formData.nom || !formData.prenom || !formData.service || !formData.uap || !formData.prix_heure) {
      setError('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }
    if (parseFloat(formData.prix_heure) <= 0) {
      setError('Le prix/heure doit être positif');
      return;
    }
    if (!editingId && formData.password && !formData.email) {
      setError('Email est obligatoire si vous créez un compte utilisateur');
      return;
    }
    if (!editingId && formData.email && !formData.password) {
      setError('Mot de Passe obligatoire pour créer un compte utilisateur');
      return;
    }

    try {
      if (editingId) {
        await apiClient.put(`/employes/${editingId}`, formData);
        showSuccess('✅ Employé modifié avec succès');
      } else {
        await apiClient.post('/employes', formData);
        showSuccess('✅ Employé créé avec succès');
      }
      resetForm();
      setShowForm(false);
      loadEmployes();
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Erreur lors de l'opération");
    }
  };

  const handleEdit = (emp) => {
    setFormData({
      matricule: emp.matricule,
      nom: emp.nom,
      prenom: emp.prenom,
      sexe: emp.sexe || 'H',
      date_embauche: emp.date_embauche.split('T')[0],
      prix_heure: emp.prix_heure,
      service: emp.service?._id || '',
      uap: emp.uap?._id || '',
      email: emp.email || '',
      telephone: emp.telephone || '',
      adresse: emp.adresse || '',
      statut: emp.statut,
      solde_conge_total: emp.solde_conge_total || '22',
      password: '',
      role: emp.user?.role || 'employe'
    });
    setEditingId(emp._id);
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, nomComplet) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${nomComplet}?`)) {
      try {
        await apiClient.delete(`/employes/${id}`);
        showSuccess('Employé supprimé avec succès');
        loadEmployes();
      } catch (error) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement des employés...</div>;

  const employesFiltres = employes.filter(emp => {
    const matchSearch = (emp.matricule || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatut = !filterStatut || emp.statut === filterStatut;
    const matchService = !filterService || (emp.service && emp.service._id === filterService);
    const matchUap = !filterUap || (emp.uap && emp.uap._id === filterUap);
    return matchSearch && matchStatut && matchService && matchUap;
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Gestion des Employés</h1>
          <p className="page-subtitle">
            {employes.length} employé(s) enregistré(s) · {employes.filter(e => e.statut === 'actif').length} actif(s)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            onClick={handleAddNew}
          >
            {showForm && !editingId ? '✕ Annuler' : '➕ Ajouter un Employé'}
          </button>
          {showForm && editingId && (
            <button className="btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>
              ✕ Annuler
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <div className="error-message">⚠️ {error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content large-modal animate-slide-in">
            <div className="modal-header">
              <h3>{editingId ? '✏️ Modifier l\'Employé' : '👤 Nouveau Collaborateur'}</h3>
              <button className="close-btn" onClick={() => { resetForm(); setShowForm(false); }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="premium-form">
              <div className="form-sections-container">

                {/* Section 1: Identité */}
                <div className="form-section-group">
                  <h4 className="section-title"><span className="icon">🆔</span> Identité & Contact</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Matricule <span className="required">*</span></label>
                      <input type="text" name="matricule" value={formData.matricule}
                        onChange={handleChange} placeholder="ex: EMP-2024-001"
                        disabled={!!editingId} required />
                      <small className="field-hint">Identifiant unique interne</small>
                    </div>
                    <div className="form-group">
                      <label>Prénom <span className="required">*</span></label>
                      <input type="text" name="prenom" value={formData.prenom}
                        onChange={handleChange} placeholder="ex: Jean" required />
                    </div>
                    <div className="form-group">
                      <label>Nom <span className="required">*</span></label>
                      <input type="text" name="nom" value={formData.nom}
                        onChange={handleChange} placeholder="ex: Dupont" required />
                    </div>
                    <div className="form-group">
                      <label>Sexe</label>
                      <select name="sexe" value={formData.sexe || 'H'} onChange={handleChange}>
                        <option value="H">Homme</option>
                        <option value="F">Femme</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Email Professional {!editingId && <span className="required">*</span>}</label>
                      <div className="input-with-icon">
                        <span className="input-icon">📧</span>
                        <input type="email" name="email" value={formData.email}
                          onChange={handleChange} placeholder="nom.prenom@entreprise.com"
                          required={!editingId} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Téléphone</label>
                      <div className="input-with-icon">
                        <span className="input-icon">📞</span>
                        <input type="tel" name="telephone" value={formData.telephone}
                          onChange={handleChange} placeholder="06 00 00 00 00" />
                      </div>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Adresse Résidentielle</label>
                      <div className="input-with-icon">
                        <span className="input-icon">📍</span>
                        <input type="text" name="adresse" value={formData.adresse}
                          onChange={handleChange} placeholder="ex: 123 Rue de la Liberté, Tunis" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Organisation */}
                <div className="form-section-group">
                  <h4 className="section-title"><span className="icon">🏢</span> Affectation & Poste</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Service <span className="required">*</span></label>
                      <select name="service" value={formData.service} onChange={handleChange} required>
                        <option value="">Sélectionner un service...</option>
                        {services.map(s => <option key={s._id} value={s._id}>{s.nom_service}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Unité Autonome (UAP) <span className="required">*</span></label>
                      <select name="uap" value={formData.uap} onChange={handleChange} required>
                        <option value="">Sélectionner une UAP...</option>
                        {uaps.map(u => <option key={u._id} value={u._id}>{u.nom_uap}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date d'Embauche <span className="required">*</span></label>
                      <input type="date" name="date_embauche" value={formData.date_embauche}
                        onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Statut Actuel</label>
                      <select name="statut" value={formData.statut} onChange={handleChange}>
                        <option value="actif">✅ Actif</option>
                        <option value="inactif">❌ Inactif</option>
                        <option value="conge">🏖️ En Congé</option>
                        <option value="suspendu">🚫 Suspendu</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Rémunération & Congés */}
                <div className="form-section-group">
                  <h4 className="section-title"><span className="icon">💰</span> Paramètres RH</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Prix / Heure (DT) <span className="required">*</span></label>
                      <div className="input-with-icon">
                        <span className="input-icon">💵</span>
                        <input type="number" name="prix_heure" value={formData.prix_heure}
                          onChange={handleChange} placeholder="0.00" step="0.01" min="0" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Droit aux Congés (Annuel)</label>
                      <input type="number" name="solde_conge_total" value={formData.solde_conge_total}
                        onChange={handleChange} step="1" min="0" placeholder="22" />
                      <small className="field-hint">Nombre de jours par an</small>
                    </div>
                  </div>
                </div>

                {/* Section 4: Sécurité & Accès (Only on creation) */}
                {!editingId && (
                  <div className="form-section-group special-section">
                    <h4 className="section-title"><span className="icon">🔐</span> Sécurité & Accès</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Mot de Passe <span className="required">*</span></label>
                        <input type="password" name="password" value={formData.password}
                          onChange={handleChange} placeholder="••••••••"
                          required minLength="6" />
                        <small className="field-hint">Min. 6 caractères</small>
                      </div>
                      <div className="form-group">
                        <label>Rôle Système <span className="required">*</span></label>
                        <select name="role" value={formData.role} onChange={handleChange} required>
                          <option value="employe">Collaborateur (Standard)</option>
                          <option value="chef_service">Responsable (Chef de Service)</option>
                          <option value="admin">Gestionnaire (Admin RH)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary premium-submit">
                  {editingId ? '💾 Enregistrer les modifications' : '🚀 Créer la fiche employé'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & filter bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap'
      }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '300px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par matricule, nom, prénom ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterService}
          onChange={e => setFilterService(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', fontSize: 13.5, fontFamily: 'inherit',
            cursor: 'pointer', minWidth: 160
          }}
        >
          <option value="">Tous les Services</option>
          {services.map(s => <option key={s._id} value={s._id}>{s.nom_service}</option>)}
        </select>
        <select
          value={filterUap}
          onChange={e => setFilterUap(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', fontSize: 13.5, fontFamily: 'inherit',
            cursor: 'pointer', minWidth: 160
          }}
        >
          <option value="">Toutes les UAPs</option>
          {uaps.map(u => <option key={u._id} value={u._id}>{u.nom_uap}</option>)}
        </select>
        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', fontSize: 13.5, fontFamily: 'inherit',
            cursor: 'pointer', minWidth: 160
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="conge">Congé</option>
          <option value="suspendu">Suspendu</option>
        </select>
      </div>

      {/* Table */}
      <div className="section-card">
        <h3>📋 Liste des Employés
          <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>
            {employesFiltres.length} / {employes.length}
          </span>
        </h3>

        {employesFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            {employes.length === 0 ? '📭 Aucun employé créé.' : '🔍 Aucun résultat pour cette recherche.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom Complet</th>
                  <th>Email</th>
                  <th>Service</th>
                  <th>UAP</th>
                  <th>Ville / Adresse</th>
                  <th>Prix/h</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employesFiltres.map(emp => (
                  <tr key={emp._id}>
                    <td><strong style={{ color: 'var(--primary)' }}>{emp.matricule}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--primary-glow)',
                          color: 'var(--primary)', fontWeight: 700, fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {emp.prenom[0]}{emp.nom[0]}
                        </div>
                        <span>{emp.prenom} <strong>{emp.nom}</strong></span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {emp.email || '—'}
                    </td>
                    <td>{emp.service?.nom_service || '—'}</td>
                    <td>{emp.uap?.nom_uap || '—'}</td>
                    <td>
                      <div title={emp.adresse} style={{
                        fontSize: 12, color: 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', gap: 4,
                        maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        <span>📍</span> {(() => {
                          if (!emp.adresse) return '—';
                          const parts = emp.adresse.split(',');
                          if (parts.length >= 2) return parts[parts.length - 2].trim();
                          return emp.adresse.trim();
                        })()}
                      </div>
                    </td>
                    <td><strong>{emp.prix_heure} DT</strong></td>
                    <td>{STATUT_BADGE[emp.statut] || emp.statut}</td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-view" onClick={() => navigate(`/employes/${emp._id}`)} title="Consulter le profil complet">
                          <span style={{ fontSize: '14px' }}>👤</span> Voir
                        </button>
                        <button className="btn-edit" onClick={() => handleEdit(emp)} title="Modifier">
                          ✏️ Modifier
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(emp._id, `${emp.prenom} ${emp.nom}`)} title="Supprimer">
                          🗑️ Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployesPage;
