import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await apiClient.get(`/employes/${user.employe._id || user.id}`);
                setProfile(response.data);
            } catch (error) {
                console.error('Erreur profil:', error);
            } finally {
                setLoading(false);
            }
        };
        if (user?.role !== 'super_admin') {
            loadProfile();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) return <div className="loading"><div className="spinner"></div>Chargement de votre profil...</div>;

    const initials = profile ? `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase() : user.email[0].toUpperCase();

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <div className="page-title-group">
                    <h1>Mon Profil</h1>
                    <p className="page-subtitle">Informations personnelles et professionnelles</p>
                </div>
            </div>

            <div className="profile-layout">
                {/* Profile Card */}
                <div className="section-card profile-main-card">
                    <div className="profile-header-glow"></div>
                    <div className="profile-avatar-large">{initials}</div>
                    <div className="profile-identity">
                        <h2>{profile ? `${profile.prenom} ${profile.nom}` : 'Super Admin'}</h2>
                        <span className="profile-role-badge">{profile?.role || user.role}</span>
                    </div>

                    <div className="profile-details-grid">
                        <div className="detail-item">
                            <label>Email</label>
                            <span>{profile?.email || user.email}</span>
                        </div>
                        <div className="detail-item">
                            <label>Matricule</label>
                            <span>{profile?.matricule || 'N/A'}</span>
                        </div>
                        {profile && (
                            <>
                                <div className="detail-item">
                                    <label>Service</label>
                                    <span>{profile.service?.nom_service || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>UAP</label>
                                    <span>{profile.uap?.nom_uap || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Téléphone</label>
                                    <span>{profile.telephone || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Date d'embauche</label>
                                    <span>{new Date(profile.date_embauche).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Recap (if employee) */}
                {profile && (
                    <div className="profile-side-stats">
                        <div className="section-card stat-mini-card">
                            <div className="stat-icon-mini">🏖️</div>
                            <div className="stat-content-mini">
                                <label>Solde Congés</label>
                                <div className="stat-value-mini">{profile.solde_conge_restant} / {profile.solde_conge_total}</div>
                                <div className="stat-progress-bar">
                                    <div
                                        className="stat-progress-fill"
                                        style={{ width: `${(profile.solde_conge_restant / profile.solde_conge_total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="section-card stat-mini-card">
                            <div className="stat-icon-mini">⌛</div>
                            <div className="stat-content-mini">
                                <label>Statut Actuel</label>
                                <div className="stat-value-mini" style={{ textTransform: 'capitalize' }}>{profile.statut}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .profile-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
          margin-top: 20px;
        }

        @media (max-width: 900px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }
        }

        .profile-main-card {
          position: relative;
          overflow: hidden;
          padding: 40px !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .profile-header-glow {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 200%;
          height: 200px;
          background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
          z-index: 0;
        }

        .profile-avatar-large {
          width: 120px;
          height: 120px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          font-size: 40px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          border: 4px solid var(--bg-card);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          z-index: 1;
        }

        .profile-identity h2 {
          margin: 0;
          font-size: 28px;
          color: var(--text-primary);
        }

        .profile-role-badge {
          display: inline-block;
          padding: 4px 12px;
          background: var(--primary-glow);
          color: var(--primary);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          width: 100%;
          margin-top: 40px;
          text-align: left;
          padding-top: 40px;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 600px) {
          .profile-details-grid {
            grid-template-columns: 1fr;
          }
        }

        .detail-item label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .detail-item span {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .stat-mini-card {
          display: flex;
          gap: 16px;
          padding: 20px !important;
          margin-bottom: 20px;
          align-items: center;
        }

        .stat-icon-mini {
          font-size: 24px;
          width: 48px;
          height: 48px;
          background: var(--bg-body);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .stat-content-mini label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .stat-value-mini {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .stat-progress-bar {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          width: 160px;
          margin-top: 10px;
          overflow: hidden;
        }

        .stat-progress-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 2px;
        }
      `}</style>
        </div>
    );
};

export default ProfilePage;
