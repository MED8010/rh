import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const NOTIF_ICONS = {
  conge_demande: '📝', conge_approuve: '✅', conge_refuse: '❌',
  stage_demande: '📚', stage_approuve: '✅', stage_refuse: '❌',
  salaire_disponible: '💰', autre: 'ℹ️'
};

const NOTIF_VARIANTS = {
  conge_demande: 'info', conge_approuve: 'success', conge_refuse: 'danger',
  stage_demande: 'info', stage_approuve: 'success', stage_refuse: 'danger',
  salaire_disponible: 'accent', autre: 'neutral'
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, lu: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (error) { }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all/read');
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (error) { }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) { }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Chargement des notifications...</div>;

  const displayed = filterUnread ? notifications.filter(n => !n.lu) : notifications;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `🔔 Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : '✅ Toutes vos notifications sont lues'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={() => setFilterUnread(f => !f)}
            style={{ fontSize: 13 }}
          >
            {filterUnread ? '📋 Toutes' : '🔔 Non lues uniquement'}
          </button>
          {unreadCount > 0 && (
            <button className="btn-primary" onClick={handleMarkAllAsRead}>
              ✓ Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 28 }}>
        <div className="kpi-card kpi-primary">
          <div className="kpi-card-top"><div className="kpi-icon-box">📬</div></div>
          <div>
            <p className="kpi-label">Total</p>
            <p className="kpi-value">{notifications.length}</p>
            <p className="kpi-subtitle">notifications</p>
          </div>
        </div>
        <div className="kpi-card kpi-warning">
          <div className="kpi-card-top"><div className="kpi-icon-box">🔔</div></div>
          <div>
            <p className="kpi-label">Non Lues</p>
            <p className="kpi-value">{unreadCount}</p>
            <p className="kpi-subtitle">en attente</p>
          </div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-card-top"><div className="kpi-icon-box">✅</div></div>
          <div>
            <p className="kpi-label">Lues</p>
            <p className="kpi-value">{notifications.length - unreadCount}</p>
            <p className="kpi-subtitle">consultées</p>
          </div>
        </div>
      </div>

      {/* Notification list */}
      {displayed.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {filterUnread ? 'Aucune notification non lue' : 'Aucune notification'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Vous êtes à jour avec toutes vos notifications.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.map(notif => {
            const variant = NOTIF_VARIANTS[notif.type] || 'neutral';
            const icon = NOTIF_ICONS[notif.type] || 'ℹ️';
            return (
              <div
                key={notif._id}
                style={{
                  background: notif.lu ? 'var(--bg-card)' : 'var(--bg-hover)',
                  border: `1px solid var(--border)`,
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  opacity: notif.lu ? 0.75 : 1,
                  transition: 'all 0.2s ease',
                  borderLeft: notif.lu ? '1px solid var(--border)' : '4px solid var(--primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `var(--${variant === 'neutral' ? 'bg-hover' : variant}-bg, var(--primary-glow))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, border: '1px solid var(--border)'
                  }}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {notif.titre}
                      </h3>
                      {!notif.lu && (
                        <span className="badge badge-primary" style={{ fontSize: 10 }}>NOUVEAU</span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      🕐 {new Date(notif.date_creation).toLocaleDateString('fr-FR')} à {' '}
                      {new Date(notif.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!notif.lu && (
                    <button
                      className="btn-primary"
                      style={{ padding: '7px 12px', fontSize: 12 }}
                      onClick={() => handleMarkAsRead(notif._id)}
                      title="Marquer comme lu"
                    >
                      ✓ Lu
                    </button>
                  )}
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(notif._id)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
