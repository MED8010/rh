import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import datavizService from '../services/datavizService';
import '../styles/Dashboard.css';

const DatavizPage = () => {
    const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-mode'));
    const [loading, setLoading] = useState(true);
    const [heatmapData, setHeatmapData] = useState([]);
    const [treemapData, setTreemapData] = useState([]);
    const [ganttData, setGanttData] = useState([]);
    const [radarData, setRadarData] = useState({ labels: [], series: [] });
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        // Détection dynamique du mode sombre
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        const loadAllCharts = async () => {
            setLoading(true);
            try {
                const [heat, tree, gantt, radar, trend] = await Promise.all([
                    datavizService.getHeatmap(),
                    datavizService.getTreemap(),
                    datavizService.getGantt(),
                    datavizService.getRadar(),
                    datavizService.getTrend()
                ]);
                setHeatmapData(heat);
                setTreemapData(tree);
                setGanttData(gantt);
                setRadarData(radar);
                setTrendData(trend);
            } catch (err) {
                console.error("Erreur de chargement Dataviz", err);
            } finally {
                setLoading(false);
            }
        };
        loadAllCharts();

        return () => observer.disconnect();
    }, []);

    if (loading) {
        return <div className="spinner" style={{ margin: '100px auto' }}></div>;
    }

    return (
        <div className="dashboard-container">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div className="page-title-group">
                    <h1>Dataviz Avancée 🧩</h1>
                    <p className="page-subtitle">Visualisations métier interactives (Treemap, Heatmap, Gantt)</p>
                </div>
            </div>

            {/* Bandes d'intégration BI */}
            <div className="section-card" style={{ marginBottom: 30, borderLeft: '4px solid var(--primary)', background: 'var(--bg-hover)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--text-primary)' }}>🔄 Outils BI (PowerBI, Tableau, Google Looker Studio)</h3>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                            Connectez vos outils externes directement sur le DataWarehouse RH.  
                            Utilisez le header <code>x-api-key: HR_SECURE_BI_KEY_2026</code> pour accéder aux endpoints JSON via PowerBI.
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: 11, fontWeight: 'bold', color: 'var(--text-primary)' }}>Lien Google Sheets / Looker (Live CSV) :</p>
                        <code style={{ background: 'var(--border)', padding: '6px 12px', borderRadius: '4px', fontSize: 11, color: 'var(--primary)', display: 'inline-block' }}>
                            =IMPORTDATA("{process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/bi-export/csv/attendance?apiKey=HR_SECURE_BI_KEY_2026")
                        </code>
                    </div>
                </div>
            </div>

            {/* Ligne 1: Treemap & Heatmap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 30 }}>
                {/* Heatmap Congés */}
                <div className="section-card">
                    <div className="section-header">
                        <h3 style={{ margin: 0, fontSize: 16 }}>🔴 Heatmap des Absences</h3>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Concentration par mois et service</p>
                    </div>
                    <div style={{ padding: '10px 0' }}>
                        <ReactApexChart 
                            type="heatmap" 
                            height={300}
                            series={heatmapData}
                            options={{
                                chart: { type: 'heatmap', toolbar: { show: false } },
                                theme: { mode: isDarkMode ? 'dark' : 'light' },
                                dataLabels: { enabled: false },
                                colors: ["#ef4444"],
                                title: { text: '' },
                                plotOptions: { heatmap: { shadeIntensity: 0.5, radius: 4 } }
                            }}
                        />
                    </div>
                </div>

                {/* Treemap Salaires */}
                <div className="section-card">
                    <div className="section-header">
                        <h3 style={{ margin: 0, fontSize: 16 }}>🟩 Treemap Masse Salariale</h3>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Masse salariale répartie par employé par service</p>
                    </div>
                    <div style={{ padding: '10px 0' }}>
                        <ReactApexChart 
                            type="treemap" 
                            height={300}
                            series={treemapData}
                            options={{
                                chart: { type: 'treemap', toolbar: { show: true } },
                                theme: { mode: isDarkMode ? 'dark' : 'light' },
                                legend: { show: true },
                                plotOptions: { treemap: { enableShades: true, shadeIntensity: 0.5 } }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Ligne 2: Gantt & Radar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 30 }}>
                {/* Gantt Congés */}
                <div className="section-card">
                    <div className="section-header">
                        <h3 style={{ margin: 0, fontSize: 16 }}>📅 Diagramme de Gantt</h3>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Planification des congés et absences approuvées</p>
                    </div>
                    <div style={{ padding: '10px 0' }}>
                        <ReactApexChart 
                            type="rangeBar" 
                            height={350}
                            series={ganttData}
                            options={{
                                chart: { type: 'rangeBar' },
                                theme: { mode: isDarkMode ? 'dark' : 'light' },
                                plotOptions: { bar: { horizontal: true } },
                                xaxis: { type: 'datetime' },
                                tooltip: { x: { format: 'dd MMM yyyy' } }
                            }}
                        />
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="section-card">
                    <div className="section-header">
                        <h3 style={{ margin: 0, fontSize: 16 }}>🕸️ Profil Radar des Services</h3>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Assiduité, Ponctualité, Rétention</p>
                    </div>
                    <div style={{ padding: '10px 0' }}>
                        <ReactApexChart 
                            type="radar" 
                            height={350}
                            series={radarData.series}
                            options={{
                                chart: { type: 'radar', dropShadow: { enabled: true, blur: 1, left: 1, top: 1 } },
                                theme: { mode: isDarkMode ? 'dark' : 'light' },
                                labels: radarData.labels,
                                stroke: { width: 2 },
                                fill: { opacity: 0.1 },
                                markers: { size: 4 }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Ligne 3: Trend & Confidence */}
            <div className="section-card">
                <div className="section-header">
                    <h3 style={{ margin: 0, fontSize: 16 }}>📈 Tendance des retards et Normalité Statistique</h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Évolution de la moyenne des retards avec l'intervalle de confiance (Loi Normale +/- 1 écart-type)</p>
                </div>
                <div style={{ padding: '10px 0' }}>
                    <ReactApexChart 
                        type="line" 
                        height={350}
                        series={trendData}
                        options={{
                            chart: { type: 'line', stacked: false, toolbar: { show: true } },
                            theme: { mode: isDarkMode ? 'dark' : 'light' },
                            stroke: { width: [3, 0, 0], curve: 'smooth' },
                            plotOptions: { bar: { columnWidth: '50%' } },
                            fill: {
                                opacity: [1, 0.2, 0.2],
                                gradient: { inverseColors: false, shade: 'light', type: "vertical", opacityFrom: 0.85, opacityTo: 0.55, stops: [0, 100, 100, 100] }
                            },
                            colors: ['#4f73fc', '#a855f7', '#a855f7'],
                            xaxis: { type: 'category' },
                            legend: { position: 'top', horizontalAlign: 'left' }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DatavizPage;
