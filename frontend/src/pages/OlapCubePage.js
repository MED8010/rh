import React, { useState, useEffect } from 'react';
import olapService from '../services/olapService';
import { Bar } from 'react-chartjs-2';
import '../styles/Dashboard.css';

const AVAILABLE_DIMENSIONS = [
  { id: 'service_nom', label: 'Service', icon: '🏢' },
  { id: 'uap_nom', label: 'UAP', icon: '🏭' },
  { id: 'genre', label: 'Genre', icon: '🚻' },
  { id: 'tranche_age', label: 'Tranche d\'Âge', icon: '🎂' },
  { id: 'anciennete_annees', label: 'Ancienneté (Années)', icon: '⏳' }
];

const AVAILABLE_MEASURES = [
  { id: 'worked_hours', label: 'Heures Travaillées', icon: '⏱️', agg: ['sum', 'avg'] },
  { id: 'overtime_hours', label: 'Heures Supp.', icon: '⚡', agg: ['sum', 'avg', 'stdDev'] },
  { id: 'net_payable', label: 'Masse Salariale', icon: '💰', agg: ['sum', 'avg', 'median'], cube: 'salary' }
];

const OlapCubePage = () => {
    const [cubeSource, setCubeSource] = useState('attendance');
    const [rows, setRows] = useState([]);
    const [values, setValues] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initial default layout
    useEffect(() => {
        setRows([AVAILABLE_DIMENSIONS[0]]); // Service
        setValues([{...AVAILABLE_MEASURES[0], selectedAgg: 'sum'}]); // worked_hours sum
    }, []);

    const fetchCubeData = async () => {
        if (rows.length === 0 || values.length === 0) return;
        setLoading(true);
        try {
            const query = {
                cube: cubeSource,
                dimensions: rows.map(r => r.id),
                measures: values.map(v => ({ field: v.id, type: v.selectedAgg, name: `${v.id}_${v.selectedAgg}` }))
            };
            const response = await olapService.queryCube(query);
            
            // Format results for table (sorting by first metric descending)
            const firstMetric = `${values[0].id}_${values[0].selectedAgg}`;
            const sortedData = response.data.sort((a, b) => (b[firstMetric] || 0) - (a[firstMetric] || 0));
            
            setResults(sortedData);
        } catch (err) {
            console.error('Erreur OLAP:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (rows.length > 0 && values.length > 0) {
            fetchCubeData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, values, cubeSource]);

    // Drag and Drop Handlers
    const handleDragStart = (e, item, type) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ item, type }));
    };

    const handleDrop = (e, targetZone) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        
        if (targetZone === 'rows' && !rows.find(r => r.id === data.item.id)) {
            setRows([...rows, data.item]);
            if(data.type === 'existing_row') setRows(prev => prev.filter(r => r.id !== data.item.id).concat([data.item]));
        }
        if (targetZone === 'values' && data.item.agg) {
            const newItem = { ...data.item, selectedAgg: data.item.agg[0] };
            setValues([...values, newItem]);
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    const removeItem = (zone, id) => {
        if (zone === 'rows') setRows(rows.filter(r => r.id !== id));
        if (zone === 'values') setValues(values.filter(v => v.id !== id));
    };

    // Auto-Chart Generation
    const generateChartData = () => {
        if (!results || results.length === 0 || rows.length === 0 || values.length === 0) return null;

        const mainDim = rows[0].id; // Grouper par la première dimension
        const firstMetric = `${values[0].id}_${values[0].selectedAgg}`;

        return {
            labels: results.map(r => r._id[mainDim] || 'Inconnu'),
            datasets: [
                {
                    label: values[0].label + ' (' + values[0].selectedAgg.toUpperCase() + ')',
                    data: results.map(r => r[firstMetric]),
                    backgroundColor: '#4f73fc',
                    borderRadius: 4
                }
            ]
        };
    };

    return (
        <div className="dashboard-container">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div className="page-title-group">
                    <h1>Moteur OLAP 🎛️</h1>
                    <p className="page-subtitle">Analyse multidimensionnelle (Glisser - Déposer)</p>
                </div>
                <select 
                    className="form-control" 
                    style={{ width: 250 }} 
                    value={cubeSource} 
                    onChange={e => { setCubeSource(e.target.value); setValues([]); }}
                >
                    <option value="attendance">Cube Présence & Discipline</option>
                    <option value="salary">Cube Masse Salariale & Primes</option>
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 20 }}>
                {/* Panel des champs disponibles */}
                <div className="section-card" style={{ padding: 15 }}>
                    <h4 style={{ margin: '0 0 15px', fontSize: 14 }}>⚙️ Dimensions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {AVAILABLE_DIMENSIONS.map(dim => (
                            <div 
                                key={dim.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, dim, 'dimension')}
                                style={{ padding: '8px 12px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 4, cursor: 'grab', fontSize: 13 }}
                            >
                                {dim.icon} {dim.label}
                            </div>
                        ))}
                    </div>

                    <h4 style={{ margin: '25px 0 15px', fontSize: 14 }}>🔢 Mesures ({cubeSource})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {AVAILABLE_MEASURES.filter(m => !m.cube || m.cube === cubeSource).map(m => (
                            <div 
                                key={m.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, m, 'measure')}
                                style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: 4, cursor: 'grab', fontSize: 13 }}
                            >
                                {m.icon} {m.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Zones de dépôt */}
                    <div className="section-card" style={{ padding: 15, display: 'flex', gap: 20, background: '#f8fafc' }}>
                        <div 
                            style={{ flex: 1, minHeight: 80, border: '2px dashed #4f73fc', borderRadius: 8, padding: 15 }}
                            onDrop={(e) => handleDrop(e, 'rows')}
                            onDragOver={handleDragOver}
                        >
                            <h5 style={{ margin: '0 0 10px', fontSize: 13, color: '#4f73fc' }}>Lignes (Grouper par)</h5>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {rows.map(r => (
                                    <div key={r.id} style={{ background: '#4f73fc', color: 'white', padding: '4px 10px', borderRadius: 15, fontSize: 12, display: 'flex', alignItems: 'center' }}>
                                        {r.label}
                                        <button onClick={() => removeItem('rows', r.id)} style={{ background: 'none', border: 'none', color: 'white', marginLeft: 6, cursor: 'pointer' }}>×</button>
                                    </div>
                                ))}
                                {rows.length === 0 && <span style={{ color: '#94a3b8', fontSize: 12 }}>Glissez des dimensions ici...</span>}
                            </div>
                        </div>

                        <div 
                            style={{ flex: 1, minHeight: 80, border: '2px dashed #22c55e', borderRadius: 8, padding: 15 }}
                            onDrop={(e) => handleDrop(e, 'values')}
                            onDragOver={handleDragOver}
                        >
                            <h5 style={{ margin: '0 0 10px', fontSize: 13, color: '#22c55e' }}>Valeurs (Agrégations)</h5>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {values.map((v, idx) => (
                                    <div key={idx} style={{ background: '#22c55e', color: 'white', padding: '4px 10px', borderRadius: 15, fontSize: 12, display: 'flex', alignItems: 'center' }}>
                                        {v.label}
                                        <select 
                                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', marginLeft: 6, borderRadius: 4, outline: 'none' }}
                                            value={v.selectedAgg}
                                            onChange={(e) => {
                                                const newVals = [...values];
                                                newVals[idx].selectedAgg = e.target.value;
                                                setValues(newVals);
                                            }}
                                        >
                                            {v.agg.map(a => <option key={a} value={a} style={{color: 'black'}}>{a.toUpperCase()}</option>)}
                                        </select>
                                        <button onClick={() => removeItem('values', v.id)} style={{ background: 'none', border: 'none', color: 'white', marginLeft: 6, cursor: 'pointer' }}>×</button>
                                    </div>
                                ))}
                                {values.length === 0 && <span style={{ color: '#94a3b8', fontSize: 12 }}>Glissez des mesures ici...</span>}
                            </div>
                        </div>
                    </div>

                    {/* Chart Automatique */}
                    {results && results.length > 0 && rows.length > 0 && values.length > 0 && (
                        <div className="section-card" style={{ height: 250, padding: 15 }}>
                             <Bar 
                                data={generateChartData()} 
                                options={{ maintainAspectRatio: false, plugins: { legend: { display: true } } }} 
                            />
                        </div>
                    )}

                    {/* Tableau Résultat */}
                    <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
                       {loading ? <div className="spinner" style={{ margin: '50px auto' }}></div> : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="custom-table" style={{ width: '100%', margin: 0 }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            {rows.map(r => <th key={r.id}>{r.label}</th>)}
                                            {values.map(v => <th key={v.id}>{v.label} ({v.selectedAgg})</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results?.length === 0 && <tr><td colSpan={rows.length + values.length} style={{textAlign: 'center', padding: 20}}>Aucune donnée trouvée</td></tr>}
                                        {results?.map((row, idx) => (
                                            <tr key={idx}>
                                                {rows.map(r => <td key={r.id}><strong>{row._id[r.id] || 'N/A'}</strong></td>)}
                                                {values.map(v => {
                                                    const val = row[`${v.id}_${v.selectedAgg}`];
                                                    return <td key={v.id}>{typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : val}</td>
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                       )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OlapCubePage;
