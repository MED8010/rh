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
        { path: '/biometric-devices', icon: '📠', label: 'Pointeuses' },
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
        { path: '/biometric-devices', icon: '📠', label: 'Pointeuses' },
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
      section: 'Tableaux de Bord',
      items: [
        { path: '/employee-dashboard', icon: '📊', label: 'Mon Dashboard' },
        { path: '/biometric-devices', icon: '📠', label: 'Pointeuses' },
      ]
    },
    {
      section: 'Personnel',
      items: [
        { path: '/mes-conges-chef', icon: '🏖️', label: 'Mes Congés' },
        { path: '/notifications', icon: '🔔', label: 'Notifications', hasNotif: true },
      ]
    },
  ],
};

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');

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
    } catch (error) {}
  };

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebarCollapsed', next.toString());
    if (next) document.body.classList.add('sidebar-collapsed');
    else document.body.classList.remove('sidebar-collapsed');
  };

  const handleNav = (path) => {
    navigate(path);
    setIsMobileOpen(false);
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
      </div>
    </>
  );
};

export default Navigation;
