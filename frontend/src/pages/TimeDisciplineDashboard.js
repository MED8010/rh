import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const TimeDisciplineDashboard = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];

      const response = await apiClient.get('/pointages/stats/time-discipline', {
        params: {
          date_debut: dateRange.start.toISOString(),
          date_fin: dateRange.end.toISOString()
        }
      });
      setMetrics(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (type, value) => {
    const newDate = new Date(value);
    setDateRange(prev => ({
      ...prev,
      [type]: newDate
    }));
  };

  if (loading) {
    return <div className="loading">Chargement des données...</div>;
  }

  if (!metrics) {
    return <div className="loading">Aucune donnée disponible</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>📊 Temps & Discipline</h1>
          <p className="welcome-text">Analyse des indicateurs de temps et discipline</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '14px', color: '#999' }}>
          <div>
            <label style={{ marginRight: '10px' }}>Du:</label>
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('start', e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label style={{ marginRight: '10px' }}>Au:</label>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('end', e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
      </div>


      <div className="section-card" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          <h3>📊 Répartition des Absences</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
            Visualisation de la proportion entre absences justifiées et non justifiées sur la période sélectionnée.
          </p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
            <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', flex: 1 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>Justifiées</p>
              <p style={{ fontSize: '24px', fontWeight: 800 }}>{metrics.absences.justifiees}</p>
            </div>
            <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', flex: 1 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase' }}>Injustifiées</p>
              <p style={{ fontSize: '24px', fontWeight: 800 }}>{metrics.absences.nonJustifiees}</p>
            </div>
          </div>
        </div>
        <div style={{ width: '250px', height: '250px' }}>
          <Doughnut
            data={{
              labels: ['Justifiées', 'Non Justifiées'],
              datasets: [{
                data: [metrics.absences.justifiees, metrics.absences.nonJustifiees],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 10
              }]
            }}
            options={{
              cutout: '70%',
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1e1b4b',
                  padding: 12,
                  bodyFont: { size: 14, weight: 'bold' }
                }
              }
            }}
          />
        </div>
      </div>
      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-icon">🚨</div>
          <div className="kpi-content">
            <p className="kpi-label">Retards</p>
            <p className="kpi-value">{metrics.retards.employes}</p>
            <p className="kpi-subtitle">{metrics.retards.taux}% du personnel</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <p className="kpi-label">Taux de Retard</p>
            <p className="kpi-value" style={{ color: metrics.retards.taux > 20 ? '#ef4444' : '#10b981' }}>
              {metrics.retards.taux}%
            </p>
            <p className="kpi-subtitle">sur la période</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <p className="kpi-label">Absences Justifiées</p>
            <p className="kpi-value">{metrics.absences.justifiees}</p>
            <p className="kpi-subtitle">jours</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">❌</div>
          <div className="kpi-content">
            <p className="kpi-label">Absences Non Justifiées</p>
            <p className="kpi-value" style={{ color: metrics.absences.nonJustifiees > 5 ? '#ef4444' : '#10b981' }}>
              {metrics.absences.nonJustifiees}
            </p>
            <p className="kpi-subtitle">jours</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <p className="kpi-label">Taux d Absentéisme</p>
            <p className="kpi-value" style={{ color: metrics.absences.taux > 15 ? '#ef4444' : '#10b981' }}>
              {metrics.absences.taux}%
            </p>
            <p className="kpi-subtitle">sur la période</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🏖️</div>
          <div className="kpi-content">
            <p className="kpi-label">Congés Pris</p>
            <p className="kpi-value">{metrics.conges.pris}</p>
            <p className="kpi-subtitle">jours approuvés</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📅</div>
          <div className="kpi-content">
            <p className="kpi-label">Congés Restants</p>
            <p className="kpi-value">{metrics.conges.restants}</p>
            <p className="kpi-subtitle">jours disponibles</p>
          </div>
        </div>
      </div>

      {/* Tables des comparaisons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginTop: '30px' }}>
        {/* Retards par Service */}
        <div className="table-wrapper">
          <h3 style={{ padding: '16px 18px', backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0', margin: 0 }}>
            🚨 Retards par Service
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Nombre de Retards</th>
                <th>Taux (%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.retardsByService && metrics.retardsByService.length > 0 ? (
                metrics.retardsByService.map((service, idx) => (
                  <tr key={idx}>
                    <td>{service.nomService}</td>
                    <td>{service.totalRetards}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e3f2fd',
                        color: '#0d47a1',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {service.tauxRetard}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Absences par Service */}
        <div className="table-wrapper">
          <h3 style={{ padding: '16px 18px', backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0', margin: 0 }}>
            ❌ Absences par Service
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Nombre d'Absences</th>
                <th>Taux (%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.absencesByService && metrics.absencesByService.length > 0 ? (
                metrics.absencesByService.map((service, idx) => (
                  <tr key={idx}>
                    <td>{service.nomService}</td>
                    <td>{service.totalAbsences}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {service.tauxAbsenteisme}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Retards par UAP */}
        <div className="table-wrapper">
          <h3 style={{ padding: '16px 18px', backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0', margin: 0 }}>
            🚨 Retards par UAP
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>UAP</th>
                <th>Nombre de Retards</th>
                <th>Taux (%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.retardsByUAP && metrics.retardsByUAP.length > 0 ? (
                metrics.retardsByUAP.map((uap, idx) => (
                  <tr key={idx}>
                    <td>{uap.nomUAP}</td>
                    <td>{uap.totalRetards}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e3f2fd',
                        color: '#0d47a1',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {uap.tauxRetard}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Absences par UAP */}
        <div className="table-wrapper">
          <h3 style={{ padding: '16px 18px', backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0', margin: 0 }}>
            ❌ Absences par UAP
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>UAP</th>
                <th>Nombre d'Absences</th>
                <th>Taux (%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.absencesByUAP && metrics.absencesByUAP.length > 0 ? (
                metrics.absencesByUAP.map((uap, idx) => (
                  <tr key={idx}>
                    <td>{uap.nomUAP}</td>
                    <td>{uap.totalAbsences}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {uap.tauxAbsenteisme}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeDisciplineDashboard;
