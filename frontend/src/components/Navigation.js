import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

const NAV_CONFIG = {
  super_admin: [
    {
      section: 'Tableaux de Bord',
      items: [
        { path: '/super-admin', icon: '🔧', label: 'Gestion Système' },
        { path: '/dashboard', icon: '📊', label: 'Dashboard Admin' },
      ]
    },
    {
      section: 'Analytiques',
      items: [
        { path: '/time-discipline', icon: '⏱️', label: 'Temps & Discipline' },
        { path: '/salary-analytics', icon: '💰', label: 'Analyse Salaires' },
      ]
    },
    {
      section: 'Gestion RH',
      items: [
        { path: '/employes', icon: '👥', label: 'Employés' },
        { path: '/pointages', icon: '✅', label: 'Pointages' },
        { path: '/conges', icon: '🏖️', label: 'Congés' },
        { path: '/salaires', icon: '💳', label: 'Salaires' },
      ]
    },
    {
      section: 'Sécurité',
      items: [
        { path: '/audit', icon: '📋', label: 'Journal Audit' },
        { path: '/notifications', icon: '🔔', label: 'Notifications', hasNotif: true },
      ]
    },
  ],
  admin: [
    {
      section: 'Tableaux de Bord',
      items: [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
      ]
    },
    {
      section: 'Analytiques',
      items: [
        { path: '/time-discipline', icon: '⏱️', label: 'Temps & Discipline' },
        { path: '/salary-analytics', icon: '💰', label: 'Analyse Salaires' },
      ]
    },
    {
      section: 'Gestion RH',
      items: [
        { path: '/employes', icon: '👥', label: 'Employés' },
        { path: '/pointages', icon: '✅', label: 'Pointages' },
        { path: '/conges', icon: '🏖️', label: 'Congés' },
        { path: '/salaires', icon: '💳', label: 'Salaires' },
      ]
    },
    {
      section: 'Sécurité',
      items: [
        { path: '/audit', icon: '📋', label: 'Journal Audit' },
        { path: '/notifications', icon: '🔔', label: 'Notifications', hasNotif: true },
      ]
    },
  ],
  employe: [
    {
      section: 'Personnel',
      items: [
        { path: '/employee-dashboard', icon: '📊', label: 'Mon Dashboard' },
        { path: '/mes-conges', icon: '🏖️', label: 'Mes Congés' },
        { path: '/notifications', icon: '🔔', label: 'Notifications', hasNotif: true },
      ]
    },
  ],
  chef_service: [
    {
      section: 'Personnel',
      items: [
        { path: '/employee-dashboard', icon: '📊', label: 'Mon Dashboard' },
        { path: '/mes-conges-chef', icon: '🏖️', label: 'Mes Congés' },
        { path: '/notifications', icon: '🔔', label: 'Notifications', hasNotif: true },
      ]
    },
  ],
};

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  chef_service: 'Chef de Service',
  employe: 'Employé',
};

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (term) => {
    setSearch(term);
    if (term.length > 1) {
      try {
        const res = await apiClient.get('/employes');
        const filtered = res.data.filter(e =>
          e.nom.toLowerCase().includes(term.toLowerCase()) ||
          e.prenom.toLowerCase().includes(term.toLowerCase()) ||
          e.matricule.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 5);
        setSearchResults(filtered);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    applyTheme(isDark);

    const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setIsCollapsed(savedCollapsed);
    if (savedCollapsed) document.body.classList.add('sidebar-collapsed');
    else document.body.classList.remove('sidebar-collapsed');
  }, []);

  // Poll notifications
  useEffect(() => {
    if (user) {
      loadUnreadNotifications();
      const interval = setInterval(loadUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      // silently fail
    }
  };

  const applyTheme = (isDark) => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const toggleDarkMode = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    applyTheme(newDark);
  };

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebarCollapsed', next.toString());
    if (next) document.body.classList.add('sidebar-collapsed');
    else document.body.classList.remove('sidebar-collapsed');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNav = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  // Get user initials
  const getInitials = () => {
    if (user?.employe?.prenom && user?.employe?.nom) {
      return `${user.employe.prenom[0]}${user.employe.nom[0]}`.toUpperCase();
    }
    if (user?.email) return user.email[0].toUpperCase();
    return '?';
  };

  const getUserDisplayName = () => {
    if (user?.employe?.prenom && user?.employe?.nom) {
      return `${user.employe.prenom} ${user.employe.nom}`;
    }
    return user?.email || 'Utilisateur';
  };

  const navConfig = NAV_CONFIG[user?.role] || [];
  const sidebarClass = [
    'sidebar',
    isCollapsed ? 'collapsed' : '',
    isMobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        style={{
          display: 'none',
          position: 'fixed',
          top: 16, left: 16,
          zIndex: 1001,
          background: '#6366f1',
          border: 'none',
          color: '#fff',
          width: 40, height: 40,
          borderRadius: 10,
          fontSize: 18,
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="mobile-hamburger"
        aria-label="Ouvrir le menu"
      >
        ☰
      </button>

      <div className={sidebarClass}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">🏢</div>
          <span className="sidebar-title">HR Manager</span>
          <button
            className="sidebar-toggle"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Agrandir' : 'Réduire'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="sidebar-search" style={{ padding: '0 16px', margin: '16px 0', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 32px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                  color: 'white', fontSize: '12px', outline: 'none'
                }}
              />
            </div>
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 16, right: 16,
                background: 'var(--bg-card)', borderRadius: 8, marginTop: 4,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 1100,
                overflow: 'hidden'
              }}>
                {searchResults.map(emp => (
                  <div
                    key={emp._id}
                    onClick={() => { navigate(`/employes/${emp._id}`); setSearch(''); setSearchResults([]); }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)'
                    }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                      {emp.prenom[0]}{emp.nom[0]}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{emp.prenom} {emp.nom}</div>
                      <div style={{ fontSize: 10, opacity: 0.6 }}>{emp.matricule}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User */}
        <div className="sidebar-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="sidebar-avatar">{getInitials()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{getUserDisplayName()}</div>
            <div className="sidebar-user-role">{ROLE_LABELS[user?.role] || 'Utilisateur'}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navConfig.map((group, gi) => (
            <div className="nav-section" key={gi}>
              <div className="nav-section-title">{group.section}</div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.path}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={() => handleNav(item.path)}
                    data-tooltip={isCollapsed ? item.label : undefined}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.hasNotif && unreadCount > 0 && (
                      <span className="notif-badge">{unreadCount}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-actions">
            <button className="sidebar-action-btn" onClick={toggleDarkMode}>
              <span className="nav-icon">{isDarkMode ? '☀️' : '🌙'}</span>
              <span className="btn-label">{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
            </button>
            <button className="sidebar-action-btn logout" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span className="btn-label">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
