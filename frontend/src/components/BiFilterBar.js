import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const BiFilterBar = ({ onFilterChange }) => {
  const [services, setServices] = useState([]);
  const [uaps, setUaps] = useState([]);
  const [filters, setFilters] = useState({
    service: '',
    uap: '',
    startDate: '',
    endDate: '',
    period: 'rolling_month' // rolling_month, ytd, custom
  });

  useEffect(() => {
    // Charger services et UAP pour les filtres
    const loadStructure = async () => {
      try {
        const [servRes, uapRes] = await Promise.all([
          apiClient.get('/structure/services'),
          apiClient.get('/structure/uaps')
        ]);
        setServices(servRes.data);
        setUaps(uapRes.data);
      } catch (err) { }
    };
    loadStructure();
  }, []);

  const handleApply = () => {
    let finalFilters = { ...filters };
    
    // Logique de période prédéfinie
    const today = new Date();
    if (filters.period === 'rolling_month') {
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      finalFilters.startDate = lastMonth.toISOString().split('T')[0];
      finalFilters.endDate = today.toISOString().split('T')[0];
    } else if (filters.period === 'ytd') {
      finalFilters.startDate = `${today.getFullYear()}-01-01`;
      finalFilters.endDate = today.toISOString().split('T')[0];
    }

    onFilterChange(finalFilters);
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="section-card" style={{ marginBottom: 24, padding: '18px 24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>📊 Période :</span>
          <select 
            name="period" 
            value={filters.period} 
            onChange={handleChange}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
          >
            <option value="rolling_month">Mois Glissant</option>
            <option value="ytd">Cumul Annuel (YTD)</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        {filters.period === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input 
              type="date" 
              name="startDate" 
              value={filters.startDate} 
              onChange={handleChange}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
            />
            <span>→</span>
            <input 
              type="date" 
              name="endDate" 
              value={filters.endDate} 
              onChange={handleChange}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
            />
          </div>
        )}

        <div style={{ height: 30, width: 1, background: 'var(--border)' }}></div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 200 }}>
          <select 
            name="service" 
            value={filters.service} 
            onChange={handleChange}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
          >
            <option value="">Tous les Services</option>
            {services.map(s => <option key={s._id} value={s._id}>{s.nom_service}</option>)}
          </select>

          <select 
            name="uap" 
            value={filters.uap} 
            onChange={handleChange}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
          >
            <option value="">Toutes les UAP</option>
            {uaps.map(u => <option key={u._id} value={u._id}>{u.nom_uap}</option>)}
          </select>
        </div>

        <button 
          onClick={handleApply}
          className="btn-primary"
          style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          🔄 Appliquer les filtres
        </button>
      </div>
    </div>
  );
};

export default BiFilterBar;
