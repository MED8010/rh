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
  const [services, setServices] = useState([]);
  const [uaps, setUaps] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedUap, setSelectedUap] = useState('');

  const loadStructures = React.useCallback(async () => {
    try {
      const [servRes, uapRes] = await Promise.all([
        apiClient.get('/structure/services'),
        apiClient.get('/structure/uaps'),
      ]);
      setServices(servRes.data);
      setUaps(uapRes.data);
    } catch (error) {
      console.error('Erreur chargement structures:', error);
    }
  }, []);

  const loadMetrics = React.useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.get('/pointages/stats/time-discipline', {
        params: {
          date_debut: dateRange.start.toISOString(),
          date_fin: dateRange.end.toISOString(),
          service: selectedService || undefined,
          uap: selectedUap || undefined
        }
      });
      setMetrics(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedService, selectedUap]);

  useEffect(() => {
    loadStructures();
  }, [loadStructures]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

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
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Structures Filters */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={selectedService} 
              onChange={(e) => setSelectedService(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="">Tous les Services</option>
              {services.map(s => <option key={s._id} value={s._id}>{s.nom_service}</option>)}
            </select>
            <select 
              value={selectedUap} 
              onChange={(e) => setSelectedUap(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="">Toutes les UAPs</option>
              {uaps.map(u => <option key={u._id} value={u._id}>{u.nom_uap}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Du:</label>
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('start', e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Au:</label>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('end', e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>
      </div>


      <div className="section-card" style={{ 
        marginTop: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '40px',
        background: 'var(--bg-card)',
        padding: '30px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Répartition des Absences</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
            Analyse comparative entre les absences justifiées (congés, maladies) et les absences non justifiées.
          </p>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
            <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', 
              borderRadius: '16px', 
              flex: 1,
              border: '1px solid rgba(16, 185, 129, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '40px', opacity: 0.1 }}>✅</div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Justifiées</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{metrics.absences.justifiees}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>jours validés</p>
            </div>
            
            <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', 
              borderRadius: '16px', 
              flex: 1,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '40px', opacity: 0.1 }}>❌</div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Injustifiées</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{metrics.absences.nonJustifiees}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>sans motif</p>
            </div>
          </div>
        </div>

        <div style={{ width: '260px', height: '260px', position: 'relative', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 0
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>Total</p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{metrics.absences.total}</p>
          </div>
          <Doughnut
            data={{
              labels: ['Justifiées', 'Non Justifiées'],
              datasets: [{
                data: [metrics.absences.justifiees, metrics.absences.nonJustifiees],
                backgroundColor: ['#10b981', '#ef4444'],
                hoverBackgroundColor: ['#059669', '#dc2626'],
                borderWidth: 0,
                hoverOffset: 15,
                borderRadius: 5
              }]
            }}
            options={{
              cutout: '75%',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(30, 27, 75, 0.95)',
                  padding: 12,
                  titleFont: { size: 12 },
                  bodyFont: { size: 14, weight: 'bold' },
                  cornerRadius: 8,
                  displayColors: false
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
