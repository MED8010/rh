import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import '../styles/Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [timeStats, setTimeStats] = useState(null);
  const [salaireStats, setSalaireStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filters
  const [services, setServices] = useState([]);
  const [uaps, setUaps] = useState([]);
  const [filters, setFilters] = useState({
    service: '',
    uap: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadStructures();
  }, []);

  const loadStats = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.service) params.append('service', filters.service);
      if (filters.uap) params.append('uap', filters.uap);
      
      if (filters.date_debut && filters.date_fin) {
        params.append('date_debut', filters.date_debut);
        params.append('date_fin', filters.date_fin);
      } else {
        params.append('mois', filters.mois);
        params.append('annee', filters.annee);
      }

      const query = `?${params.toString()}`;

      const [employeStats, timeS, analyticsS] = await Promise.all([
        apiClient.get(`/employes/stats${query}`),
        apiClient.get(`/pointages/stats/time-stats${query}`),
        apiClient.get(`/salaires/stats/analytics${query}`),
      ]);
      setStats(employeStats.data);
      setTimeStats(timeS.data);
      setSalaireStats(analyticsS.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadStructures = async () => {
    try {
      const [sRes, uRes] = await Promise.all([
        apiClient.get('/structure/services'),
        apiClient.get('/structure/uaps')
      ]);
      setServices(sRes.data);
      setUaps(uRes.data);
    } catch (error) {
      console.error('Erreur structures:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // Reset daily filter if changing month/year
    const newFilters = { ...filters, [name]: value };
    if (name === 'mois' || name === 'annee') {
       newFilters.date_debut = '';
       newFilters.date_fin = '';
    } else if (name === 'date_debut' || name === 'date_fin') {
       newFilters.mois = '';
       newFilters.annee = '';
    }
    setFilters(newFilters);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      date_debut: today,
      date_fin: today,
      mois: '',
      annee: ''
    }));
  };

  const formatDate = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const presenceData = {
    labels: ['À l\'heure', 'Retards', 'Absents'],
    datasets: [{
      data: [
        timeStats?.onTimeCount || 0,
        timeStats?.retardCount || 0,
        timeStats?.absenceCount || 0,
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          font: { size: 12, family: 'Inter' },
          color: '#64748b',
          usePointStyle: true,
          pointStyleWidth: 10,
        }
      },
      tooltip: {
        backgroundColor: '#1e1b4b',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#c4c9f7',
        cornerRadius: 8,
      }
    }
  };

  const kpis = [
    {
      icon: '👥', label: 'Total Employés', value: timeStats?.totalEmployes || stats?.totalEmployes || 0,
      subtitle: 'employés actifs', variant: 'kpi-primary',
    },
    {
      icon: '✅', label: 'Présents', value: timeStats?.presentCount || 0,
      subtitle: `Taux: ${timeStats?.tauxPresence ?? 0}%`, variant: 'kpi-success',
    },
    {
      icon: '⚠️', label: 'Retards', value: timeStats?.retardCount || 0,
      subtitle: `Taux: ${timeStats?.tauxRetard ?? 0}%`, variant: 'kpi-warning',
    },
    {
      icon: '❌', label: 'Absents', value: timeStats?.absenceCount || 0,
      subtitle: `Taux: ${timeStats?.tauxAbsenteisme ?? 0}%`, variant: 'kpi-danger',
    },
    {
      icon: '💰', label: 'Masse Salariale', value: `${(salaireStats?.masseSalariale || 0).toFixed(0)} DT`,
      subtitle: 'période sélectionnée', variant: 'kpi-primary',
    },
    {
      icon: '📊', label: 'Salaire Moyen', value: `${(salaireStats?.salaireMoyen || 0).toFixed(0)} DT`,
      subtitle: 'par employé', variant: 'kpi-purple',
    },
    {
      icon: '⏰', label: 'Heures Sup.', value: `${(salaireStats?.heuresSup?.total || 0).toFixed(1)}h`,
      subtitle: 'heures supplémentaires', variant: 'kpi-warning',
    },
    {
      icon: '💸', label: 'Coût Heures Sup.', value: `${(salaireStats?.heuresSup?.cout || 0).toFixed(0)} DT`,
      subtitle: 'budget heures sup.', variant: 'kpi-danger',
    },
    {
      icon: '🎁', label: 'Total Primes', value: `${(salaireStats?.primes?.total || 0).toFixed(0)} DT`,
      subtitle: 'primes versées', variant: 'kpi-accent',
    },
    {
      icon: '⭐', label: 'Moyenne Primes', value: `${(salaireStats?.primes?.moyenne || 0).toFixed(0)} DT`,
      subtitle: 'par employé', variant: 'kpi-purple',
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Tableau de Bord Admin</h1>
          <p className="page-subtitle">
            Bienvenue, <strong>{user?.email}</strong> — Vue d'ensemble des activités RH
          </p>
        </div>
        <div className="time-badge">
          <span className="date-display">{formatDate(currentTime)}</span>
          <span className="time-display">🕐 {formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-card section-card">
        <div className="filter-container">
          <div className="filter-group">
            <label>Service</label>
            <select name="service" value={filters.service} onChange={handleFilterChange}>
              <option value="">Tous les services</option>
              {services.map(s => <option key={s._id} value={s._id}>{s.nom_service}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>UAP</label>
            <select name="uap" value={filters.uap} onChange={handleFilterChange}>
              <option value="">Toutes les UAPs</option>
              {uaps.map(u => <option key={u._id} value={u._id}>{u.nom_uap}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Période</label>
            <div style={{ display: 'flex', gap: 8 }}>
               <input type="date" name="date_debut" value={filters.date_debut} onChange={handleFilterChange} className="date-input" />
               <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>au</span>
               <input type="date" name="date_fin" value={filters.date_fin} onChange={handleFilterChange} className="date-input" />
               <button onClick={handleToday} className="btn-today" style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                 Aujourd'hui
               </button>
            </div>
          </div>
          <div className="filter-group">
            <label>Mois (Optionnel)</label>
            <select name="mois" value={filters.mois} onChange={handleFilterChange}>
              <option value="">-- Sélectionner --</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Année (Optionnel)</label>
            <select name="annee" value={filters.annee} onChange={handleFilterChange}>
              <option value="">--</option>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <style>{`
        .date-input {
          background: var(--bg-hover) !important;
          border: 1px solid var(--border) !important;
          color: var(--text-primary) !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          outline: none !important;
        }
        .btn-today:hover {
          background: var(--primary) !important;
          color: white !important;
        }
      `}</style>

      {loading && <div className="loading-overlay"><div className="spinner"></div></div>}

      {/* KPI Grid */}
      <div className="kpi-container">
        {kpis.map((kpi, i) => (
          <div key={i} className={`kpi-card ${kpi.variant}`}>
            <div className="kpi-card-top">
              <div className="kpi-icon-box">{kpi.icon}</div>
            </div>
            <div>
              <p className="kpi-label">{kpi.label}</p>
              <p className="kpi-value">{kpi.value}</p>
              <p className="kpi-subtitle">{kpi.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-container">
        <div className="chart-wrapper">
          <h2>📊 Présence Aujourd'hui</h2>
          <Pie data={presenceData} options={chartOptions} />
        </div>

        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2>📋 Résumé Rapide</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Taux de présence', value: `${timeStats?.tauxPresence || 0}%`, color: 'var(--success)' },
                { label: 'Taux de retard', value: `${timeStats?.tauxRetard || 0}%`, color: 'var(--warning)' },
                { label: 'Taux d\'absentéisme', value: `${timeStats?.tauxAbsenteisme || 0}%`, color: 'var(--danger)' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'var(--bg-hover)',
                  borderRadius: 10, border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: 8, padding: '16px', background: 'var(--primary-glow)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
                <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>💡 MASSE SALARIALE</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                  {(salaireStats?.masseSalariale || 0).toFixed(2)} DT
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total net calculé global</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>📍 Répartition Géographique</h2>
            <div className="geo-stats-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timeStats?.distributionGeographique?.slice(0, 5).map((item, i) => (
                <div key={i} className="geo-stat-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.ville}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{item.count}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 10, overflow: 'hidden' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(item.count / (timeStats?.totalEmployes || 1)) * 100}%`,
                        height: '100%',
                        background: 'var(--grad-primary)',
                        borderRadius: 10
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {(!timeStats?.distributionGeographique || timeStats.distributionGeographique.length === 0) && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
                  Aucune donnée d'adresse disponible
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
