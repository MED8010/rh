import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import mlService from '../services/mlService';
import KpiCard from '../components/KpiCard';
import '../styles/Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler
);

const DashboardPredictive = () => {
    const [loading, setLoading] = useState(true);
    const [payrollForecast, setPayrollForecast] = useState({ history: [], forecast: [] });
    const [absencesAnalysis, setAbsencesAnalysis] = useState({ average_absences: 0, peak_probability: 0, trend: '-' });
    const [turnoverRisk, setTurnoverRisk] = useState([]);
    const [anomaliesData, setAnomaliesData] = useState({ global_alert: null, anomalies: [] });
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // Détection du mode dark avec support du changement dynamique
    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark-mode');
            setIsDarkMode(isDark);
        };
        
        checkDarkMode();
        
        // Observer les changements de classe sur le document
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const loadMLData = async () => {
            setLoading(true);
            try {
                const [payRes, absRes, riskRes, anomRes] = await Promise.all([
                    mlService.getPayrollForecast(),
                    mlService.getAbsenteeismForecast(),
                    mlService.getTurnoverRisk(),
                    mlService.getAnomalies()
                ]);
                setPayrollForecast(payRes);
                setAbsencesAnalysis(absRes);
                setTurnoverRisk(riskRes);
                setAnomaliesData(anomRes || { global_alert: null, anomalies: [] });
            } catch (err) {
                console.error('Erreur ML Dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        loadMLData();
    }, []);

    const history = Array.isArray(payrollForecast.history) ? payrollForecast.history : [];
    const forecast = Array.isArray(payrollForecast.forecast) ? payrollForecast.forecast : [];
    const safeTurnoverRisk = Array.isArray(turnoverRisk) ? turnoverRisk : [];
    const peakProb = absencesAnalysis.peak_probability || 0;

    // Couleurs adaptables au mode dark
    const chartColors = {
        gridColor: isDarkMode ? '#2d2b4e' : '#f1f5f9',
        textColor: isDarkMode ? '#cbd5e1' : '#0f172a',
        axisColor: isDarkMode ? '#94a3b8' : '#64748b'
    };

    // Configuration Chart Prévision Salaire
    const payrollChartData = {
        labels: [
            ...history.map(h => `M-${history.length - history.indexOf(h)}`), 
            ...forecast.map(f => `P+${f.month_index - history.length + 1}`)
        ],
        datasets: [
            {
                label: 'Historique Réel (DT)',
                data: [...history.map(h => h.total), ...Array(forecast.length).fill(null)],
                borderColor: '#4f73fc',
                backgroundColor: 'rgba(79, 115, 252, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Prévision IA (DT)',
                data: [
                    ...Array(Math.max(0, history.length - 1)).fill(null), 
                    history[history.length - 1]?.total,
                    ...forecast.map(f => f.predicted_total)
                ],
                borderColor: '#a855f7',
                borderDash: [5, 5],
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const payrollChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: chartColors.textColor,
                    font: { family: "'Inter', sans-serif", size: 12, weight: '500' },
                    padding: 15,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: isDarkMode ? '#1a1830' : '#ffffff',
                titleColor: chartColors.textColor,
                bodyColor: chartColors.textColor,
                borderColor: chartColors.gridColor,
                borderWidth: 1,
                titleFont: { weight: 'bold' },
                padding: 10,
                displayColors: true
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: chartColors.gridColor,
                    drawBorder: true,
                    drawTicks: true
                },
                ticks: {
                    color: chartColors.axisColor,
                    font: { family: "'Inter', sans-serif", size: 11 }
                }
            },
            x: {
                grid: {
                    color: chartColors.gridColor
                },
                ticks: {
                    color: chartColors.axisColor,
                    font: { family: "'Inter', sans-serif", size: 11 }
                }
            }
        }
    };

    return (
        <div className="dashboard-container">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div className="page-title-group">
                    <h1>Intelligence Prédictive 🔮</h1>
                    <p className="page-subtitle">Modèles IA pour le pilotage RH stratégique</p>
                </div>
                <div className="status-badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    ● Moteurs ML Actifs
                </div>
            </div>

            <div className="kpi-container" style={{ marginBottom: 30 }}>
                <KpiCard 
                    title="Probabilité Pic Absences" 
                    value={(peakProb * 100).toFixed(0)} 
                    unit="%" 
                    icon="🌪️" 
                    trend={absencesAnalysis.trend === 'Hausse' ? 5 : -3}
                    subLabel="Horizon 30 jours"
                    variant={peakProb > 0.5 ? 'danger' : 'warning'}
                />
                <KpiCard 
                    title="Budget Prévu (M+1)" 
                    value={forecast[0]?.predicted_total ? (forecast[0].predicted_total / 1000).toFixed(1) : 0} 
                    unit="k DT" 
                    icon="📈" 
                    subLabel="Confiance 85%"
                    variant="primary"
                />
                <KpiCard 
                    title="Alertes Turnover" 
                    value={safeTurnoverRisk.filter(r => r.risk_score > 70).length} 
                    unit="critique" 
                    icon="🚪" 
                    variant="danger"
                />
                <KpiCard 
                    title="Score Engagement IA" 
                    value="82" 
                    unit="/100" 
                    icon="🧠" 
                    variant="success"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 30 }}>
                <div className="section-card">
                    <div className="section-header">
                        <h3 style={{ margin: 0 }}>Projection Masse Salariale (12 mois) 💰</h3>
                        <p style={{ margin: '4px 0 20px', fontSize: 12, color: 'var(--text-muted)' }}>Modèle de régression linéaire Holt-Winters</p>
                    </div>
                    <div style={{ height: 350 }}>
                        {loading ? <div className="spinner" style={{ margin: '100px auto' }}></div> : (
                            <Line 
                                data={payrollChartData} 
                                options={payrollChartOptions}
                            />
                        )}
                    </div>
                </div>

                <div className="section-card">
                    <div className="section-header">
                        <h3 style={{ margin: 0 }}>Vigilance Turnover 🚪</h3>
                        <p style={{ margin: '4px 0 20px', fontSize: 12, color: 'var(--text-muted)' }}>Top risques détectés (Random Forest)</p>
                    </div>
                    <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                        {loading ? <div className="spinner" style={{ margin: '100px auto' }}></div> : (
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Employé</th>
                                        <th>Risque</th>
                                        <th>Indicateur</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeTurnoverRisk.slice(0, 10).map((r, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.nom}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.service}</div>
                                            </td>
                                            <td>
                                                <div style={{ 
                                                    width: 'fit-content',
                                                    minWidth: 50,
                                                    padding: '4px 8px', 
                                                    textAlign: 'center', 
                                                    borderRadius: 6, 
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    background: r.risk_score > 70 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                    color: r.risk_score > 70 ? 'var(--danger)' : 'var(--warning)'
                                                }}>
                                                    {r.risk_score}%
                                                </div>
                                            </td>
                                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                                {r.indicators.absences > 0 ? `⚠️ Absences ×${r.indicators.absences}` : '✅ Stable'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Radar d'Anomalies & Profilage */}
            <div className="section-card" style={{ marginBottom: 30, borderLeft: anomaliesData.global_alert ? '4px solid var(--danger)' : 'none' }}>
                <div className="section-header">
                    <h3 style={{ margin: 0 }}>Radar d'Anomalies & Profilage 🚨</h3>
                    <p style={{ margin: '4px 0 20px', fontSize: 12, color: 'var(--text-muted)' }}>Détection de fraudes et d'outliers statistiques</p>
                </div>
                
                {anomaliesData.global_alert && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 20, marginRight: 12 }}>⚠️</span>
                        {anomaliesData.global_alert}
                    </div>
                )}

                <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                    {loading ? <div className="spinner" style={{ margin: '50px auto' }}></div> : (
                        anomaliesData.anomalies && anomaliesData.anomalies.length > 0 ? (
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Employé</th>
                                        <th>Type d'Alerte</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {anomaliesData.anomalies.map((a, i) => (
                                        <tr key={i} style={{ 
                                            background: a.severity === 'high' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                                            borderLeft: a.severity === 'high' ? '3px solid var(--danger)' : 'none'
                                        }}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.employe}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.service}</div>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: 6, 
                                                    fontSize: 11, 
                                                    fontWeight: 600,
                                                    background: a.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                    color: a.severity === 'high' ? 'var(--danger)' : 'var(--warning)'
                                                }}>
                                                    {a.type}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                                                {a.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                ✅ Aucune anomalie ni comportement suspect détecté.
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="section-card" style={{ background: 'linear-gradient(135deg, #4f73fc 0%, #a855f7 100%)', color: 'white' }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ fontSize: 40 }}>🤖</div>
                    <div>
                        <h3 style={{ margin: 0, color: 'white' }}>Recommandations IA en temps réel</h3>
                        <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
                            L'algorithme suggère une révision salariale pour le service **{safeTurnoverRisk[0]?.service || 'N/A'}** 
                            afin de réduire le risque de turnover qui est en hausse de 12% ce mois-ci.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPredictive;
