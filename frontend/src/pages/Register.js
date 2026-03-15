import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    matricule: '',
    service: '',
    uap: '',
    prix_heure: 0,
  });
  const [services, setServices] = useState([]);
  const [uaps, setUaps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      apiClient.get('/structure/services'),
      apiClient.get('/structure/uaps'),
    ])
      .then(([servicesRes, uapsRes]) => {
        setServices(servicesRes.data);
        setUaps(uapsRes.data);
      })
      .catch(err => console.error('Erreur lors du chargement des données:', err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(
        formData.email, formData.password, formData.nom, formData.prenom,
        formData.matricule, formData.service, formData.uap, parseFloat(formData.prix_heure)
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-side" style={{ width: '100%' }}>
        <div className="auth-card wide">
          <div className="auth-card-header">
            <div className="auth-card-icon">📝</div>
            <h1>Créer un Compte</h1>
            <h2>Inscrivez-vous sur la plateforme RH</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required placeholder="Votre prénom" />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} required placeholder="Votre nom" />
              </div>
            </div>

            <div className="form-group">
              <label>Adresse Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="votre@email.com" />
            </div>

            <div className="form-group">
              <label>Mot de Passe</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Minimum 8 caractères" />
            </div>

            <div className="form-group">
              <label>Matricule</label>
              <input type="text" name="matricule" value={formData.matricule} onChange={handleChange} required placeholder="EMP-0001" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Service</label>
                <select name="service" value={formData.service} onChange={handleChange} required>
                  <option value="">Sélectionnez...</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.nom_service}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>UAP</label>
                <select name="uap" value={formData.uap} onChange={handleChange} required>
                  <option value="">Sélectionnez...</option>
                  {uaps.map(u => <option key={u._id} value={u._id}>{u.nom_uap}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Prix par Heure (DT)</label>
              <input type="number" name="prix_heure" value={formData.prix_heure} onChange={handleChange} required min="0" step="0.01" placeholder="Ex: 5.50" />
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px' }}>
              {loading ? '⏳ Inscription en cours...' : "✨ S'inscrire"}
            </button>
          </form>

          <p className="login-link">
            Vous avez déjà un compte ? <a href="/login">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
