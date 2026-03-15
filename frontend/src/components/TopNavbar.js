import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

const TopNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkMode(savedTheme === 'dark');
    
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

  const toggleDarkMode = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    if (newDark) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  };

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
      } catch (err) {}
    } else {
      setSearchResults([]);
    }
  };

  const getInitials = () => {
    if (user?.employe?.prenom && user?.employe?.nom) {
      return `${user.employe.prenom[0]}${user.employe.nom[0]}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || '?';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="top-navbar">
      <div className="top-navbar-left">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(emp => (
                <div
                  key={emp._id}
                  className="search-result-item"
                  onClick={() => { navigate(`/employes/${emp._id}`); setSearch(''); setSearchResults([]); }}
                >
                  <div className="result-avatar">{emp.prenom[0]}{emp.nom[0]}</div>
                  <div className="result-info">
                    <div className="result-name">{emp.prenom} {emp.nom}</div>
                    <div className="result-meta">{emp.matricule}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="top-navbar-right">
        <button className="nav-action-btn" onClick={toggleDarkMode} title="Toggle Theme">
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <div className="nav-action-btn notification-btn" onClick={() => navigate('/notifications')} title="Notifications">
          🔔
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </div>

        <div className="user-profile-dropdown">
          <div className="profile-toggle" onClick={() => setShowProfile(!showProfile)}>
            <div 
              className="avatar" 
              style={user?.employe?.photo ? { 
                backgroundImage: `url(${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/profiles/${user.employe.photo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'transparent'
              } : {}}
            >
              {!user?.employe?.photo && getInitials()}
            </div>
            <span className="user-name">{user?.employe?.prenom || 'User'}</span>
            <span className="chevron">{showProfile ? '▲' : '▼'}</span>
          </div>

          {showProfile && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <p className="name">{user?.employe?.prenom} {user?.employe?.nom}</p>
                <p className="role">{user?.role}</p>
              </div>
              <div className="dropdown-divider"></div>
              <button onClick={() => { navigate('/profile'); setShowProfile(false); }}>
                👤 Mon Profil
              </button>
              <button className="logout-item" onClick={handleLogout}>
                🚪 Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
