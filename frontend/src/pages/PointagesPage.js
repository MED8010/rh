import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import pdfService from '../services/pdfService';
import ImportPointagesModal from '../components/ImportPointagesModal';
import '../styles/Dashboard.css';

const PointagesPage = () => {
  const [retards, setRetards] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('retards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [services, setServices] = useState([]);
  const [uaps, setUaps] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedUap, setSelectedUap] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadStructures = useCallback(async () => {
    try {
      const [servRes, uapRes] = await Promise.all([
        apiClient.get('/structure/services'),
        apiClient.get('/structure/uaps'),
      ]);
      setServices(servRes.data);
      setUaps(uapRes.data);
    } catch (error) {
      console.error('Erreur structures:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        date: selectedDate,
        service: selectedService || undefined,
        uap: selectedUap || undefined
      };
      const [retardsRes, absencesRes] = await Promise.all([
        apiClient.get('/pointages/stats/retards-day', { params }),
        apiClient.get('/pointages/stats/absences-day', { params }),
      ]);
      setRetards(retardsRes.data);
      setAbsences(absencesRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedService, selectedUap]);

  useEffect(() => { 
    loadStructures();
  }, [loadStructures]);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement des pointages...</div>;

  const filteredRetards = retards.filter(r =>
    `${r.employe?.prenom} ${r.employe?.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredAbsences = absences.filter(a =>
    `${a.employe?.prenom} ${a.employe?.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Suivi des Pointages</h1>
          <p className="page-subtitle">📅 {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600 }}
          />
          <button className="btn-primary" onClick={loadData}>🔄 Actualiser</button>
          <button 
            className="btn-view" 
            onClick={() => pdfService.exportPointagesReport(activeTab === 'retards' ? filteredRetards : filteredAbsences, activeTab, new Date(selectedDate).toLocaleDateString())}
            style={{ padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            📄 Export {activeTab === 'retards' ? 'Retards' : 'Absences'}
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="kpi-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="kpi-card kpi-warning">
          <div className="kpi-card-top"><div className="kpi-icon-box">🕒</div></div>
          <div><p className="kpi-label">Total Retards</p><p className="kpi-value">{retards.length}</p></div>
        </div>
        <div className="kpi-card kpi-danger">
          <div className="kpi-card-top"><div className="kpi-icon-box">🚫</div></div>
          <div><p className="kpi-label">Total Absences</p><p className="kpi-value">{absences.length}</p></div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="section-card" style={{ marginBottom: 20, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 15 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <div className="form-group" style={{ margin: 0, minWidth: 200 }}>
            <label style={{ fontSize: 12 }}>Rechercher un employé</label>
            <input 
              type="text" 
              placeholder="Nom ou prénom..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', background: 'var(--bg-hover)' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
            <label style={{ fontSize: 12 }}>Filtrer par Service</label>
            <select 
              value={selectedService} 
              onChange={e => setSelectedService(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', background: 'var(--bg-hover)' }}
            >
              <option value="">Tous les services</option>
              {services.map(s => <option key={s._id} value={s._id}>{s.nom_service}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
            <label style={{ fontSize: 12 }}>Filtrer par UAP</label>
            <select 
              value={selectedUap} 
              onChange={e => setSelectedUap(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', background: 'var(--bg-hover)' }}
            >
              <option value="">Toutes les UAPs</option>
              {uaps.map(u => <option key={u._id} value={u._id}>{u.nom_uap}</option>)}
            </select>
          </div>
        </div>
        <button 
          onClick={() => setIsImportModalOpen(true)}
          style={{
            padding: '10px 16px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          📥 Importer Pointages
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: 20 }}>
        <button className={`tab-btn ${activeTab === 'retards' ? 'active' : ''}`} onClick={() => setActiveTab('retards')}>
          🕒 Retards ({filteredRetards.length})
        </button>
        <button className={`tab-btn ${activeTab === 'absences' ? 'active' : ''}`} onClick={() => setActiveTab('absences')}>
          🚫 Absences ({filteredAbsences.length})
        </button>
      </div>

      {/* Table */}
      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              {activeTab === 'retards' ? (
                <tr>
                  <th>Employé</th>
                  <th>Matricule</th>
                  <th>Service</th>
                  <th>UAP</th>
                  <th>Heure Entrée</th>
                  <th>Retard (min)</th>
                </tr>
              ) : (
                <tr>
                  <th>Employé</th>
                  <th>Matricule</th>
                  <th>Service</th>
                  <th>UAP</th>
                  <th>Motif</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'retards' ? (
                filteredRetards.length > 0 ? filteredRetards.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.employe?.prenom} {r.employe?.nom}</strong></td>
                    <td><span className="badge badge-neutral">{r.employe?.matricule}</span></td>
                    <td style={{ fontSize: 13 }}>{r.employe?.service?.nom_service || '—'}</td>
                    <td style={{ fontSize: 13 }}>{r.employe?.uap?.nom_uap || '—'}</td>
                    <td>{r.heure_entree}</td>
                    <td><span className="badge badge-warning" style={{ fontWeight: 700 }}>+{r.retard_minutes} min</span></td>
                  </tr>
                )) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>✅ Aucun retard signalé</td></tr>
              ) : (
                filteredAbsences.length > 0 ? filteredAbsences.map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.employe?.prenom} {a.employe?.nom}</strong></td>
                    <td><span className="badge badge-neutral">{a.employe?.matricule}</span></td>
                    <td style={{ fontSize: 13 }}>{a.employe?.service?.nom_service || '—'}</td>
                    <td style={{ fontSize: 13 }}>{a.employe?.uap?.nom_uap || '—'}</td>
                    <td style={{ fontStyle: 'italic', color: 'var(--danger)' }}>{a.motif_absence || 'Non justifié'}</td>
                  </tr>
                )) : <tr><td colSpan="5" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>✅ Aucune absence signalée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      <ImportPointagesModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};

export default PointagesPage;
