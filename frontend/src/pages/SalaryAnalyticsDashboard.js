import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalaryAnalyticsDashboard = () => {
  const [period, setPeriod] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear()
  });
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [metricsRes, trendsRes] = await Promise.all([
        apiClient.get('/salaires/stats/analytics', {
          params: { mois: period.mois, annee: period.annee }
        }),
        apiClient.get('/salaires/stats/trends')
      ]);
      setMetrics(metricsRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (type, value) => {
    setPeriod(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
  };

  if (loading) {
    return <div className="loading">Chargement des données...</div>;
  }

  if (!metrics) {
    return <div className="loading">Aucune donnée disponible</div>;
  }

  const moisNames = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>💰 Analyse des Salaires</h1>
          <p className="welcome-text">Analyse détaillée de la rémunération</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '14px', color: '#999' }}>
          <div>
            <label style={{ marginRight: '10px' }}>Mois:</label>
            <select
              value={period.mois}
              onChange={(e) => handlePeriodChange('mois', e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>{moisNames[m]}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label style={{ marginRight: '10px' }}>Année:</label>
            <select
              value={period.annee}
              onChange={(e) => handlePeriodChange('annee', e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              {[2024, 2025, 2026].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <p className="kpi-label">Salaire Moyen</p>
            <p className="kpi-value">{metrics.salaireMoyen.toFixed(0)}</p>
            <p className="kpi-subtitle">DT par employé</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <p className="kpi-label">Masse Salariale</p>
            <p className="kpi-value">{metrics.masseSalariale.toFixed(0)}</p>
            <p className="kpi-subtitle">DT total</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⏰</div>
          <div className="kpi-content">
            <p className="kpi-label">Heures Suppl.</p>
            <p className="kpi-value">{metrics.heuresSup.total.toFixed(1)}</p>
            <p className="kpi-subtitle">heures</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">💸</div>
          <div className="kpi-content">
            <p className="kpi-label">Coût Heures Sup</p>
            <p className="kpi-value">{metrics.heuresSup.cout.toFixed(0)}</p>
            <p className="kpi-subtitle">DT</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🎁</div>
          <div className="kpi-content">
            <p className="kpi-label">Primes Total</p>
            <p className="kpi-value">{metrics.primes.total.toFixed(0)}</p>
            <p className="kpi-subtitle">DT</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <p className="kpi-label">Prime Moyenne</p>
            <p className="kpi-value">{metrics.primes.moyenne.toFixed(0)}</p>
            <p className="kpi-subtitle">DT par employé</p>
          </div>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="section-card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>📈 Évolution de la Masse Salariale (6 derniers mois)</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <Line
            data={{
              labels: trends.map(t => t.label),
              datasets: [
                {
                  label: 'Masse Salariale (DT)',
                  data: trends.map(t => t.masseSalariale),
                  borderColor: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointBackgroundColor: '#fff',
                  pointBorderColor: '#6366f1',
                  pointBorderWidth: 3
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1e1b4b',
                  padding: 12,
                  bodyFont: { size: 14, weight: 'bold' },
                  callbacks: {
                    label: (context) => ` ${context.parsed.y.toLocaleString()} DT`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0,0,0,0.05)' },
                  ticks: { callback: (value) => `${value} DT` }
                },
                x: {
                  grid: { display: false }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Tables des comparaisons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginTop: '30px' }}>
        {/* Salaires moyens par service */}
        <div className="table-wrapper">
          <h3 style={{ padding: '16px 18px', backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0', margin: 0 }}>
            💼 Salaires Moyens par Service
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Salaire Moyen (DT)</th>
                <th>Employés</th>
              </tr>
            </thead>
            <tbody>
              {metrics.salaireMoyenParService && metrics.salaireMoyenParService.length > 0 ? (
                metrics.salaireMoyenParService.map((service, idx) => (
                  <tr key={idx}>
                    <td>{service.nomService}</td>
                    <td style={{ fontWeight: 'bold', color: '#10b981' }}>
                      {service.salaireMoyen.toFixed(0)} DT
                    </td>
                    <td>{service.count}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Masses salariales par service */}
        <div className="table-wrapper">
          <h3 style={{ padding: '16px 18px', backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0', margin: 0 }}>
            📊 Masses Salariales par Service
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Masse Salariale (DT)</th>
                <th>% Total</th>
              </tr>
            </thead>
            <tbody>
              {metrics.masseSalarialeParService && metrics.masseSalarialeParService.length > 0 ? (
                metrics.masseSalarialeParService.map((service, idx) => {
                  const percentage = ((service.masseSalariale / metrics.masseSalariale) * 100).toFixed(1);
                  return (
                    <tr key={idx}>
                      <td>{service.nomService}</td>
                      <td style={{ fontWeight: 'bold', color: '#0d47a1' }}>
                        {service.masseSalariale.toFixed(0)} DT
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#e3f2fd',
                          color: '#0d47a1',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Salaires moyens par UAP */}
        <div className="table-wrapper">
          <h3 style={{ padding: '16px 18px', backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0', margin: 0 }}>
            💼 Salaires Moyens par UAP
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>UAP</th>
                <th>Salaire Moyen (DT)</th>
                <th>Employés</th>
              </tr>
            </thead>
            <tbody>
              {metrics.salaireMoyenParUAP && metrics.salaireMoyenParUAP.length > 0 ? (
                metrics.salaireMoyenParUAP.map((uap, idx) => (
                  <tr key={idx}>
                    <td>{uap.nomUAP}</td>
                    <td style={{ fontWeight: 'bold', color: '#10b981' }}>
                      {uap.salaireMoyen.toFixed(0)} DT
                    </td>
                    <td>{uap.count}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Masses salariales par UAP */}
        <div className="table-wrapper">
          <h3 style={{ padding: '16px 18px', backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0', margin: 0 }}>
            📊 Masses Salariales par UAP
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>UAP</th>
                <th>Masse Salariale (DT)</th>
                <th>% Total</th>
              </tr>
            </thead>
            <tbody>
              {metrics.masseSalarialeParUAP && metrics.masseSalarialeParUAP.length > 0 ? (
                metrics.masseSalarialeParUAP.map((uap, idx) => {
                  const percentage = ((uap.masseSalariale / metrics.masseSalariale) * 100).toFixed(1);
                  return (
                    <tr key={idx}>
                      <td>{uap.nomUAP}</td>
                      <td style={{ fontWeight: 'bold', color: '#0d47a1' }}>
                        {uap.masseSalariale.toFixed(0)} DT
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#e3f2fd',
                          color: '#0d47a1',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Box */}
      <div style={{ marginTop: '30px' }}>
        <div className="stats-box">
          <h3>📋 Résumé</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(13, 71, 161, 0.1)', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', opacity: 0.8 }}>Nombre d'Employés</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0d47a1' }}>
                {metrics.nombreEmployes}
              </p>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', opacity: 0.8 }}>Période</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                {moisNames[period.mois]} {period.annee}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryAnalyticsDashboard;
