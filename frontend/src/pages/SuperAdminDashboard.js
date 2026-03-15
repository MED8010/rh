import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employe'
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchUsers = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  }, [API_URL]);

  const fetchEmployes = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/employes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployes(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchUsers();
    fetchEmployes();
  }, [fetchUsers, fetchEmployes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      if (editingId) {
        await axios.put(`${API_URL}/users/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Utilisateur modifié avec succès');
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/users`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Utilisateur créé avec succès');
      }

      setFormData({ email: '', password: '', role: 'employe' });
      fetchUsers();
    } catch (error) {
      setMessage('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Utilisateur supprimé avec succès');
        fetchUsers();
      } catch (error) {
        setMessage('❌ Erreur: ' + error.message);
      }
    }
  };

  const handleEditUser = (user) => {
    setFormData({
      email: user.email,
      password: '',
      role: user.role
    });
    setEditingId(user._id);
  };

  const filteredUsers = filterRole ? users.filter(u => u.role === filterRole) : users;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👑 Super Admin Dashboard</h1>
        <p>Gestion complète du système</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👤 Gestion des Utilisateurs
        </button>
        <button
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          🏢 Gestion des Employés
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistiques
        </button>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {/* Users Management */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="form-section">
            <h2>{editingId ? '✏️ Modifier Utilisateur' : '➕ Créer Nouvel Utilisateur'}</h2>
            <form onSubmit={handleCreateUser} className="form-grid">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mot de passe {!editingId && '*'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingId}
                  placeholder={editingId ? 'Laisser vide pour ne pas modifier' : ''}
                />
              </div>
              <div className="form-group">
                <label>Rôle *</label>
                <select name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="employe">Employé</option>
                  <option value="chef_service">Chef de Service</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">
                {editingId ? '💾 Modifier' : '➕ Créer'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ email: '', password: '', role: 'employe' });
                  }}
                >
                  Annuler
                </button>
              )}
            </form>
          </div>

          <div className="list-section">
            <div className="filters-section">
              <h2>👥 Utilisateurs du Système</h2>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="">Tous les rôles</option>
                <option value="employe">Employé</option>
                <option value="chef_service">Chef de Service</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="kpi-container">
              <div className="kpi-card">
                <div className="kpi-icon">👤</div>
                <div className="kpi-content">
                  <p className="kpi-label">Total Utilisateurs</p>
                  <p className="kpi-value">{users.length}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">👥</div>
                <div className="kpi-content">
                  <p className="kpi-label">Employés</p>
                  <p className="kpi-value">{users.filter(u => u.role === 'employe').length}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">👔</div>
                <div className="kpi-content">
                  <p className="kpi-label">Chefs de Service</p>
                  <p className="kpi-value">{users.filter(u => u.role === 'chef_service').length}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">🔑</div>
                <div className="kpi-content">
                  <p className="kpi-label">Admins</p>
                  <p className="kpi-value">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</p>
                </div>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Date Création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'super_admin' && '👑 Super Admin'}
                        {user.role === 'admin' && '🔐 Admin'}
                        {user.role === 'chef_service' && '👔 Chef'}
                        {user.role === 'employe' && '👤 Employé'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user._id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employees Management */}
      {activeTab === 'employees' && (
        <div className="tab-content">
          <div className="list-section">
            <h2>🏢 Liste des Employés</h2>

            <div className="kpi-container">
              <div className="kpi-card">
                <div className="kpi-icon">👥</div>
                <div className="kpi-content">
                  <p className="kpi-label">Total Employés</p>
                  <p className="kpi-value">{employes.length}</p>
                </div>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Service</th>
                  <th>Date Embauche</th>
                </tr>
              </thead>
              <tbody>
                {employes.map(emp => (
                  <tr key={emp._id}>
                    <td>{emp.matricule}</td>
                    <td>{emp.nom}</td>
                    <td>{emp.prenom}</td>
                    <td>{emp.email}</td>
                    <td>{emp.service?.nom_service || '-'}</td>
                    <td>{new Date(emp.date_embauche).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'stats' && (
        <div className="tab-content">
          <h2>📊 Statistiques du Système</h2>

          <div className="kpi-container">
            <div className="kpi-card">
              <div className="kpi-icon">👨‍💼</div>
              <div className="kpi-content">
                <p className="kpi-label">Utilisateurs Totaux</p>
                <p className="kpi-value">{users.length}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">👥</div>
              <div className="kpi-content">
                <p className="kpi-label">Employés Actifs</p>
                <p className="kpi-value">{employes.length}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">👔</div>
              <div className="kpi-content">
                <p className="kpi-label">Chefs de Service</p>
                <p className="kpi-value">{users.filter(u => u.role === 'chef_service').length}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">🔐</div>
              <div className="kpi-content">
                <p className="kpi-label">Admins</p>
                <p className="kpi-value">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</p>
              </div>
            </div>
          </div>

          <div className="stats-container">
            <div className="stats-box">
              <h3>📈 Distribution des Rôles</h3>
              <ul>
                <li>👤 Employés: {users.filter(u => u.role === 'employe').length}</li>
                <li>👔 Chefs: {users.filter(u => u.role === 'chef_service').length}</li>
                <li>🔐 Admins: {users.filter(u => u.role === 'admin').length}</li>
                <li>👑 Super Admins: {users.filter(u => u.role === 'super_admin').length}</li>
              </ul>
            </div>

            <div className="stats-box">
              <h3>📍 Répartition Géographique (Top Régions)</h3>
              <div className="geo-list">
                {Object.entries(
                  employes.reduce((acc, emp) => {
                    if (!emp.adresse) return acc;
                    const parts = emp.adresse.split(',');
                    const city = parts.length > 2 ? parts[parts.length - 2].trim() : 'Inconnu';
                    acc[city] = (acc[city] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([city, count]) => (
                    <div key={city} className="geo-item" style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{city}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(count / employes.length) * 100}%`, background: 'var(--grad-accent)' }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
