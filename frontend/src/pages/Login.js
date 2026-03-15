import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      const userRole = response?.user?.role;

      if (userRole === 'super_admin') {
        navigate('/super-admin');
      } else if (userRole === 'admin') {
        navigate('/dashboard');
      } else if (userRole === 'chef_service') {
        navigate('/employee-dashboard');
      } else if (userRole === 'employe') {
        navigate('/employee-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Branding side */}
      <div className="auth-branding">
        <div className="auth-logo-mark">🏢</div>
        <h1>
          Gestion des <span className="highlight">Ressources</span> Humaines
        </h1>
        <p>
          Plateforme complète pour la gestion de vos employés, pointages, congés et salaires — en temps réel.
        </p>
        <div className="auth-features">
          <div className="auth-feature-item">
            <div className="auth-feature-icon">👥</div>
            Gestion centralisée des employés
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">⏱️</div>
            Suivi des pointages et présences
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">💰</div>
            Calcul automatique des salaires
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">📊</div>
            Tableaux de bord et KPIs temps réel
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-icon">🔐</div>
            <h1>Connexion</h1>
            <h2>Accédez à votre espace de travail</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Adresse Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Mot de Passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.6s linear infinite'
                  }}></span>
                  Connexion en cours...
                </>
              ) : (
                <>🚀 Se Connecter</>
              )}
            </button>
          </form>

          <p className="register-link">
            Pas encore de compte ?{' '}
            <a href="/register">Créer un compte</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
