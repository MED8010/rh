import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const EmployeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employe, setEmploye] = useState(null);
    const [pointages, setPointages] = useState([]);
    const [conges, setConges] = useState([]);
    const [salaires, setSalaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('infos');

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);
                const [empRes, pointagesRes, congesRes, salairesRes] = await Promise.all([
                    apiClient.get(`/employes/${id}`),
                    apiClient.get(`/pointages/employe/${id}`),
                    apiClient.get(`/conges?employe_id=${id}`),
                    apiClient.get(`/salaires?employe_id=${id}`),
                ]);

                setEmploye(empRes.data);
                setPointages(pointagesRes.data);
                setConges(congesRes.data);
                setSalaires(salairesRes.data);
            } catch (error) {
                console.error('Erreur chargement données employé:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, [id]);

    if (loading) return <div className="loading"><div className="spinner"></div>Chargement du dossier employé...</div>;
    if (!employe) return <div className="error-message">Employé non trouvé.</div>;

    const initials = `${employe.prenom[0]}${employe.nom[0]}`.toUpperCase();

    return (
        <div className="dashboard-container">
            {/* Header with Back Button */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <button className="btn-secondary" onClick={() => navigate('/employes')} style={{ padding: '8px 12px' }}>
                        ← Retour
                    </button>
                    <div className="page-title-group">
                        <h1>Dossier Employé : {employe.prenom} {employe.nom}</h1>
                        <p className="page-subtitle">Matricule: <strong>{employe.matricule}</strong> · {employe.service?.nom_service}</p>
                    </div>
                </div>
            </div>

            {/* Profile Summary Card */}
            <div className="section-card" style={{ marginBottom: 24, padding: '24px !important' }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '20px',
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 800
                    }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 5 }}>
                            <h2 style={{ margin: 0, fontSize: 22 }}>{employe.prenom} {employe.nom}</h2>
                            <span className={`badge ${employe.statut === 'actif' ? 'badge-success' : 'badge-warning'}`}>
                                ● {employe.statut}
                            </span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            📧 {employe.email || 'Pas d\'email'}  ·  📞 {employe.telephone || '—'}  ·  📍 {employe.adresse || '—'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Date d'embauche</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{new Date(employe.date_embauche).toLocaleDateString()}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button className={`tab-btn ${activeTab === 'infos' ? 'active' : ''}`} onClick={() => setActiveTab('infos')}>
                    📋 Informations Générales
                </button>
                <button className={`tab-btn ${activeTab === 'pointages' ? 'active' : ''}`} onClick={() => setActiveTab('pointages')}>
                    ⏱️ Pointages ({pointages.length})
                </button>
                <button className={`tab-btn ${activeTab === 'conges' ? 'active' : ''}`} onClick={() => setActiveTab('conges')}>
                    🏖️ Congés ({conges.length})
                </button>
                <button className={`tab-btn ${activeTab === 'salaires' ? 'active' : ''}`} onClick={() => setActiveTab('salaires')}>
                    💰 Salaires ({salaires.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'infos' && (
                    <div className="grid-2">
                        <div className="section-card">
                            <h3>Détails Professionnels</h3>
                            <div className="profile-details-grid" style={{ gridTemplateColumns: '1fr', border: 'none', marginTop: 10, padding: 0 }}>
                                <div className="detail-item">
                                    <label>Prix Horaire base</label>
                                    <span>{employe.prix_heure} DT / heure</span>
                                </div>
                                <div className="detail-item">
                                    <label>Service</label>
                                    <span>{employe.service?.nom_service || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>UAP</label>
                                    <span>{employe.uap?.nom_uap || '—'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="section-card">
                            <h3>Solde de Congés</h3>
                            <div style={{ marginTop: 15 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Solde restant</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 20 }}>{employe.solde_conge_restant} jours</span>
                                </div>
                                <div className="stat-progress-bar" style={{ width: '100%', height: 10 }}>
                                    <div className="stat-progress-fill" style={{ width: `${(employe.solde_conge_restant / employe.solde_conge_total) * 100}%` }}></div>
                                </div>
                                <p style={{ marginTop: 15, fontSize: 13, color: 'var(--text-muted)' }}>
                                    Total annuel alloué : {employe.solde_conge_total} jours.
                                </p>
                            </div>
                        </div>

                        <div className="section-card" style={{ gridColumn: 'span 2' }}>
                            <h3>📅 Présence Annuelle</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 20 }}>
                                {Array.from({ length: 12 }).map((_, monthIdx) => {
                                    const daysInMonth = new Date(new Date().getFullYear(), monthIdx + 1, 0).getDate();
                                    return (
                                        <div key={monthIdx} style={{ flex: '1 0 150px' }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
                                                {new Date(0, monthIdx).toLocaleString('fr-FR', { month: 'short' })}
                                            </p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                                                {Array.from({ length: daysInMonth }).map((_, day) => {
                                                    const dateStr = new Date(new Date().getFullYear(), monthIdx, day + 1).toISOString().split('T')[0];
                                                    const pointage = pointages.find(p => p.date.split('T')[0] === dateStr);
                                                    let color = 'rgba(0,0,0,0.05)';
                                                    let title = `${day + 1}/${monthIdx + 1}`;

                                                    if (pointage) {
                                                        if (pointage.absence) {
                                                            color = 'var(--danger)';
                                                            title += ' : Absent';
                                                        } else {
                                                            color = 'var(--success)';
                                                            title += ` : Présent (${pointage.heures_travaillees}h)`;
                                                            if (pointage.retard_minutes > 0) color = 'var(--warning)';
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={day}
                                                            title={title}
                                                            style={{
                                                                width: '100%', paddingTop: '100%',
                                                                background: color, borderRadius: 2
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 15, marginTop: 15, fontSize: 11, color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, background: 'var(--success)', borderRadius: 2 }}></div> Présent</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, background: 'var(--warning)', borderRadius: 2 }}></div> Retard</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, background: 'var(--danger)', borderRadius: 2 }}></div> Absent</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pointages' && (
                    <div className="section-card">
                        <h3>Historique des Pointages</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Entrée</th>
                                        <th>Sortie</th>
                                        <th>H. Travail</th>
                                        <th>H. Supp</th>
                                        <th>Retard</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pointages.map(p => (
                                        <tr key={p._id}>
                                            <td>{new Date(p.date).toLocaleDateString()}</td>
                                            <td>{p.heure_entree || '—'}</td>
                                            <td>{p.heure_sortie || '—'}</td>
                                            <td>{p.heures_travaillees}h</td>
                                            <td style={{ color: p.heures_supp > 0 ? 'var(--success)' : 'inherit' }}>
                                                {p.heures_supp > 0 ? `+${p.heures_supp}h` : '—'}
                                            </td>
                                            <td style={{ color: p.retard_minutes > 0 ? 'var(--danger)' : 'inherit' }}>
                                                {p.retard_minutes > 0 ? `${p.retard_minutes} min` : '—'}
                                            </td>
                                            <td>
                                                {p.absence ?
                                                    <span className="badge badge-danger">Absent</span> :
                                                    <span className="badge badge-success">Présent</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    {pointages.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 30 }}>Aucun pointage trouvé.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'conges' && (
                    <div className="section-card">
                        <h3>Historique des Congés</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Période</th>
                                        <th>Jours</th>
                                        <th>Type</th>
                                        <th>Statut</th>
                                        <th>Motif</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conges.map(c => (
                                        <tr key={c._id}>
                                            <td>
                                                Du {new Date(c.date_debut).toLocaleDateString()} <br />
                                                Au {new Date(c.date_fin).toLocaleDateString()}
                                            </td>
                                            <td><strong>{c.nombre_jours} j</strong></td>
                                            <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                                            <td>
                                                <span className={`badge badge-${c.statut === 'approuve' ? 'success' : c.statut === 'refuse' ? 'danger' : 'warning'}`}>
                                                    {c.statut}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 12, maxWidth: 200 }}>{c.motif || '—'}</td>
                                        </tr>
                                    ))}
                                    {conges.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 30 }}>Aucun congé enregistré.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'salaires' && (
                    <div className="section-card">
                        <h3>Fiches de Paie</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Période</th>
                                        <th>H. Base</th>
                                        <th>H. Supp</th>
                                        <th>Primes</th>
                                        <th>Déductions</th>
                                        <th>Salaire Net</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaires.map(s => (
                                        <tr key={s._id}>
                                            <td>{new Date(0, s.mois - 1).toLocaleString('fr-FR', { month: 'long' })} {s.annee}</td>
                                            <td>{s.heures_normales}h</td>
                                            <td>{s.heures_supp}h</td>
                                            <td style={{ color: 'var(--success)' }}>+{s.primes_total} DT</td>
                                            <td style={{ color: 'var(--danger)' }}>-{s.deductions} DT</td>
                                            <td><strong style={{ fontSize: 16 }}>{s.salaire_net} DT</strong></td>
                                            <td>
                                                <span className={`badge badge-${s.statut === 'valide' ? 'success' : 'warning'}`}>
                                                    {s.statut}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {salaires.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 30 }}>Aucun historique de salaire.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .tabs-container {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 2px;
        }

        .tab-btn {
          padding: 12px 20px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border-radius: 12px 12px 0 0;
          transition: all 0.2s;
          position: relative;
        }

        .tab-btn:hover {
          color: var(--primary);
          background: var(--bg-card);
        }

        .tab-btn.active {
          color: var(--primary);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--primary);
          border-radius: 3px 3px 0 0;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 800px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default EmployeDetail;
