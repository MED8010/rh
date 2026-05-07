import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const PARTICLES = [
  { size: 4, color: '#818cf8', left: 8,  delay: 0,    duration: 14 },
  { size: 5, color: '#c084fc', left: 15, delay: 2.5,  duration: 11 },
  { size: 3, color: '#06b6d4', left: 23, delay: 5,    duration: 16 },
  { size: 6, color: '#818cf8', left: 31, delay: 1,    duration: 13 },
  { size: 4, color: '#8b5cf6', left: 38, delay: 7,    duration: 10 },
  { size: 5, color: '#c084fc', left: 46, delay: 3,    duration: 15 },
  { size: 3, color: '#06b6d4', left: 53, delay: 9,    duration: 12 },
  { size: 6, color: '#818cf8', left: 61, delay: 4,    duration: 14 },
  { size: 4, color: '#8b5cf6', left: 69, delay: 6,    duration: 11 },
  { size: 5, color: '#c084fc', left: 76, delay: 2,    duration: 16 },
  { size: 3, color: '#818cf8', left: 83, delay: 8,    duration: 13 },
  { size: 4, color: '#06b6d4', left: 90, delay: 1,    duration: 10 },
  { size: 5, color: '#c084fc', left: 95, delay: 5,    duration: 15 },
  { size: 3, color: '#8b5cf6', left: 12, delay: 11,   duration: 12 },
  { size: 6, color: '#818cf8', left: 57, delay: 13,   duration: 9  },
];

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
      if (userRole === 'super_admin') navigate('/super-admin');
      else if (userRole === 'admin') navigate('/dashboard');
      else if (userRole === 'chef_service') navigate('/chef-dashboard');
      else if (userRole === 'employe') navigate('/employee-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Particules flottantes */}
      <div className="auth-particles">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Grille de fond animée */}
      <div className="auth-grid-overlay" />

      {/* Branding (gauche) */}
      <div className="auth-branding">
        <div className="auth-logo-wrapper">
          <div className="auth-logo-ring ring-1" />
          <div className="auth-logo-ring ring-2" />
          <div
            className="auth-logo-mark"
            style={{ background: 'transparent', boxShadow: 'none', marginBottom: 0, position: 'relative', zIndex: 1 }}
          >
            <img
              src="/lpe-logo.png"
              alt="LPE Logo"
              style={{ width: '150px', height: 'auto' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <span style={{ display: 'none', fontSize: '64px' }}>🏢</span>
          </div>
        </div>

        <h1 className="branding-title">
          Gestion des <span className="highlight">Ressources</span> Humaines
        </h1>
        <p className="branding-desc">
          Plateforme complète pour la gestion de vos employés, pointages, congés et salaires — en temps réel.
        </p>

        {/* Statistiques clés */}
        <div className="auth-stats">
          <div className="auth-stat-item">
            <span className="stat-number">4</span>
            <span className="stat-label">Modules IA</span>
          </div>
          <div className="auth-stat-divider" />
          <div className="auth-stat-item">
            <span className="stat-number">360°</span>
            <span className="stat-label">Vue RH</span>
          </div>
          <div className="auth-stat-divider" />
          <div className="auth-stat-item">
            <span className="stat-number">ML</span>
            <span className="stat-label">Prédictif</span>
          </div>
        </div>

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

      {/* Formulaire (droite) */}
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
              <div className="error-message">⚠️ {error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
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
