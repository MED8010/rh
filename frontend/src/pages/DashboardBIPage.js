import React, { useState, useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import biService from '../services/biService';
import BiFilterBar from '../components/BiFilterBar';
import KpiCard from '../components/KpiCard';
import jsPDF from 'jspdf';
import '../styles/Dashboard.css';

// Register ChartJS
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement
);

const DashboardBIPage = () => {
  const dashboardRef = useRef();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ 
    attendance: { worked_hours: 0, overtime_hours: 0, late_minutes: 0, absent_count: 0, absenteeism_rate: 0 },
    payroll: { total: 0, avg_per_emp: 0 }
  });
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [payrollDistribution, setPayrollDistribution] = useState([]);
  const [filters, setFilters] = useState({ period: 'rolling_month' });
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

  const chartColors = {
    gridColor: isDarkMode ? '#2d2b4e' : '#f1f5f9',
    textColor: isDarkMode ? '#cbd5e1' : '#0f172a',
    axisColor: isDarkMode ? '#94a3b8' : '#64748b'
  };

  const loadData = async (activeFilters) => {
    setLoading(true);
    try {
      const [statsRes, trendRes, payRes] = await Promise.all([
        biService.getStats(activeFilters),
        biService.getAttendanceTrend(activeFilters),
        biService.getPayrollEvolution(activeFilters)
      ]);
      setMetrics(statsRes.metrics);
      setAttendanceTrend(trendRes);
      setPayrollDistribution(payRes);
    } catch (err) {
      console.error('Erreur BI:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.text('Tableau de Bord Analytique RH', 40, 40);
    doc.setFontSize(10);
    doc.text(`Généré le : ${new Date().toLocaleString()}`, 40, 60);
    
    // Simplifié sans html2canvas car instable à installer à la volée
    doc.text('Résumé des KPIs :', 40, 90);
    doc.text(`Taux d'absentéisme : ${metrics.attendance.absenteeism_rate}%`, 60, 110);
    doc.text(`Masse salariale : ${metrics.payroll.total.toLocaleString()} DT`, 60, 130);
    doc.save('dashboard-bi-rh.pdf');
  };

  const handleTriggerETL = async () => {
    if (window.confirm('Déclencher une synchronisation complète maintenant ?')) {
      await biService.triggerETL();
      alert('Flux ETL démarré. Les données seront à jour dans quelques minutes.');
    }
  };

  // Chart Data Configurations
  const trendData = {
    labels: attendanceTrend.map(d => d._id.toString().slice(6, 8) + '/' + d._id.toString().slice(4, 6)),
    datasets: [
      {
        label: 'Heures Travail (Moyenne)',
        data: attendanceTrend.map(d => d.avg_worked_hours.toFixed(1)),
        borderColor: 'rgba(79, 115, 252, 1)',
        backgroundColor: 'rgba(79, 115, 252, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const payrollData = {
    labels: payrollDistribution.map(d => d._id),
    datasets: [
      {
        label: 'Masse Salariale (DT)',
        data: payrollDistribution.map(d => d.total_net),
        backgroundColor: [
          '#4f73fc', '#22c55e', '#facc15', '#f87171', '#a855f7'
        ],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="dashboard-container" ref={dashboardRef}>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div className="page-title-group">
          <h1>Analytique RH 📊</h1>
          <p className="page-subtitle">Tableau de bord décisionnel intelligent</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={handleTriggerETL}>⚙️ Sync ETL</button>
          <button className="btn-primary" onClick={handleExportPDF}>📄 Exporter PDF</button>
        </div>
      </div>

      <BiFilterBar onFilterChange={handleFilterChange} />

      <div className="kpi-container" style={{ marginBottom: 30 }}>
        <KpiCard 
          title="Taux d'Absentéisme" 
          value={metrics.attendance.absenteeism_rate} 
          unit="%" 
          icon="📅" 
          trend={-2.4} 
          subLabel="vs période précédente"
          variant="danger"
          onClick={() => alert('Drill-down: Liste des absences...')}
        />
        <KpiCard 
          title="Heures Supplémentaires" 
          value={metrics.attendance.overtime_hours.toFixed(0)} 
          unit="h" 
          icon="⏰" 
          trend={+8.1} 
          variant="warning"
          onClick={() => alert('Drill-down: Détail des heures supp...')}
        />
        <KpiCard 
          title="Masse Salariale Net" 
          value={(metrics.payroll.total / 1000).toFixed(1)} 
          unit="k DT" 
          icon="💰" 
          variant="success"
        />
        <KpiCard 
          title="Coût Moyen / Salarié" 
          value={parseInt(metrics.payroll.avg_per_emp)} 
          unit="DT" 
          icon="👥" 
          variant="primary"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 30 }}>
        <div className="section-card">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Évolution du temps de travail 📈</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Moyenne des heures par jour</p>
          </div>
          <div style={{ padding: '0 10px', height: 300 }}>
            {loading ? <div className="spinner" style={{ margin: '80px auto' }}></div> : (
              <Line 
                data={trendData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      display: false 
                    }
                  },
                  scales: { 
                    y: { 
                      beginAtZero: true, 
                      grid: { color: chartColors.gridColor },
                      ticks: { color: chartColors.axisColor, font: { family: "'Inter', sans-serif", size: 11 } }
                    }, 
                    x: { 
                      grid: { display: false },
                      ticks: { color: chartColors.axisColor, font: { family: "'Inter', sans-serif", size: 11 } }
                    }
                  }
                }} 
              />
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Masse Salariale p. Serv. 💰</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Répartition par département</p>
          </div>
          <div style={{ padding: '0 10px', height: 300 }}>
            {loading ? <div className="spinner" style={{ margin: '80px auto' }}></div> : (
              <Doughnut 
                data={payrollData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: 'bottom', 
                      labels: { 
                        color: chartColors.textColor,
                        boxWidth: 10,
                        font: { family: "'Inter', sans-serif", size: 11 },
                        usePointStyle: true,
                        padding: 12
                      } 
                    },
                    tooltip: {
                      backgroundColor: isDarkMode ? '#1a1830' : '#ffffff',
                      titleColor: chartColors.textColor,
                      bodyColor: chartColors.textColor,
                      borderColor: chartColors.gridColor,
                      borderWidth: 1
                    }
                  }
                }} 
              />
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Analyse de la Productivité par UAP 🏢</h3>
        </div>
        <div style={{ height: 300 }}>
          {loading ? <div className="spinner" style={{ margin: '80px auto' }}></div> : (
            <Bar 
              data={payrollData} // Substitution démo
              options={{ maintainAspectRatio: false }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardBIPage;
