import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const PointeusesPage = () => {
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSyncActive, setIsSyncActive] = useState(true);
  const [message, setMessage] = useState(null);
  
  // States for Device Management
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({ name: '', ip: '', port: 4370 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, devicesRes, logsRes] = await Promise.all([
        apiClient.get('/biometric/status'),
        apiClient.get('/biometric/devices'),
        apiClient.get('/biometric/logs')
      ]);
      setIsSyncActive(statusRes.data.active);
      setDevices(devicesRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage({ type: 'info', text: 'Synchronisation en cours...' });
      const response = await apiClient.post('/biometric/sync');
      const { message: msg, summary } = response.data;
      
      let detailText = summary ? ` (${summary.success} succès, ${summary.failed} échecs)` : '';
      setMessage({ type: 'success', text: msg + detailText });
      loadData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de la synchronisation.';
      setMessage({ type: 'error', text: errorMsg });
      loadData();
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 10000);
    }
  };

  const handleToggleSync = async () => {
    try {
      setSyncing(true);
      const response = await apiClient.post('/biometric/toggle', { active: !isSyncActive });
      setIsSyncActive(response.data.active);
      setMessage({ 
        type: 'success', 
        text: `La synchronisation automatique est désormais ${response.data.active ? 'activée' : 'désactivée'}.` 
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du changement d\'état de synchronisation.' });
    } finally {
      setSyncing(false);
    }
  };

  // Device Management Actions
  const handleOpenAdd = () => {
    setEditingDevice(null);
    setFormData({ name: '', ip: '', port: 4370 });
    setShowModal(true);
  };

  const handleOpenEdit = (device) => {
    setEditingDevice(device);
    setFormData({ name: device.name, ip: device.ip, port: device.port || 4370 });
    setShowModal(true);
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette pointeuse ?')) return;
    try {
      setSyncing(true);
      await apiClient.delete(`/biometric/devices/${id}`);
      setMessage({ type: 'success', text: 'Pointeuse supprimée avec succès.' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    try {
      setSyncing(true);
      if (editingDevice) {
        await apiClient.put(`/biometric/devices/${editingDevice._id}`, formData);
        setMessage({ type: 'success', text: 'Pointeuse mise à jour.' });
      } else {
        await apiClient.post('/biometric/devices', formData);
        setMessage({ type: 'success', text: 'Pointeuse ajoutée.' });
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur lors de la sauvegarde.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Gestion des Pointeuses</h1>
          <p className="page-subtitle">Configurez et surveillez vos terminaux ZKTeco</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleOpenAdd} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ➕ Ajouter une pointeuse
          </button>
          <button 
            className={`btn-${isSyncActive ? 'danger' : 'success'}`}
            onClick={handleToggleSync}
            disabled={syncing}
          >
            {isSyncActive ? '⏹️ Arrêter la Sync' : '▶️ Démarrer la Sync'}
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSync} 
            disabled={syncing || !isSyncActive}
            title={!isSyncActive ? "Activez la sync automatique d'abord" : ""}
          >
            {syncing ? '🔄 Synchronisation...' : '🔃 Synchroniser maintenant'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`${message.type}-message`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="charts-container mb-4">
            {devices.length === 0 && (
               <div className="empty-state" style={{ padding: '60px', textAlign: 'center', width: '100%', border: '2px dashed var(--border)', borderRadius: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Aucune pointeuse configurée. Cliquez sur le bouton "Ajouter" pour commencer.</p>
               </div>
            )}
            {devices.map((device, index) => (
              <div key={index} className={`chart-wrapper device-card ${device.online ? 'online' : 'offline'}`}>
                <div className="device-header">
                  <div className={`status-indicator ${device.online ? 'online' : 'offline'}`}></div>
                  <h3>{device.name}</h3>
                  <div className="device-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="icon-btn action-edit" onClick={() => handleOpenEdit(device)} title="Modifier">✏️</button>
                    <button className="icon-btn action-delete" onClick={() => handleDeleteDevice(device._id)} title="Supprimer">🗑️</button>
                    <span className={`badge ${device.online ? 'badge-success' : 'badge-danger'}`}>
                      {device.online ? 'En Ligne' : 'Hors Ligne'}
                    </span>
                  </div>
                </div>
                <div className="device-body">
                  <div className="info-row">
                    <span className="label">Adresse IP</span>
                    <span className="value">{device.ip}</span>
                  </div>
                  
                  {device.online ? (
                    <div className="device-stat-grid">
                      <div className="device-stat-item">
                        <span className="device-stat-value">{device.userCount}</span>
                        <span className="device-stat-label">Collaborateurs</span>
                      </div>
                      <div className="device-stat-item">
                        <span className="device-stat-value">{device.logCount}</span>
                        <span className="device-stat-label">Pointages</span>
                      </div>
                    </div>
                  ) : (
                    <div className="error-card" style={{ marginTop: '10px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
                      <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
                        ⚠️ {device.error || 'Impossible de se connecter.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="chart-wrapper">
            <div className="device-header">
              <h3>Derniers Logs de Synchronisation</h3>
              <button className="refresh-btn" onClick={loadData} title="Rafraîchir les données">🔄</button>
            </div>
            <div className="logs-container">
              {logs.length === 0 ? (
                <p className="empty-logs">Aucun journal disponible.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Date & Heure</th>
                        <th>Appareil</th>
                        <th>Opération</th>
                        <th>Statut</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td className="time-cell">{new Date(log.timestamp).toLocaleString()}</td>
                          <td>{log.deviceName} <small style={{ opacity: 0.6 }}>({log.deviceIp})</small></td>
                          <td>
                            <span className={`type-tag ${log.type}`}>
                              {log.type === 'sync' ? 'Synchronisation' : 'Vérification'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-tag ${log.status}`}>
                              {log.status === 'success' ? 'Succès' : 'Erreur'}
                            </span>
                          </td>
                          <td className="message-cell">{log.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingDevice ? 'Modifier la pointeuse' : 'Ajouter une pointeuse'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveDevice}>
              <div className="form-group">
                <label>Nom de l'appareil</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="ex: Entrée Principale"
                  required
                />
              </div>
              <div className="form-group">
                <label>Adresse IP</label>
                <input 
                  type="text" 
                  value={formData.ip} 
                  onChange={(e) => setFormData({...formData, ip: e.target.value})}
                  placeholder="ex: 192.168.1.201"
                  required
                />
              </div>
              <div className="form-group">
                <label>Port (défaut: 4370)</label>
                <input 
                  type="number" 
                  value={formData.port} 
                  onChange={(e) => setFormData({...formData, port: e.target.value})}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={syncing}>
                  {syncing ? 'Patientez...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .header-actions .btn-success { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .header-actions .btn-danger { background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .header-actions button:hover { opacity: 0.9; transform: translateY(-1px); }
        .header-actions button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .modal-content {
          background: var(--bg-card);
          padding: 32px;
          border-radius: 20px;
          width: 100%;
          max-width: 450px;
          border: 1px solid var(--border);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .modal-header h2 { font-size: 20px; margin: 0; }
        .close-btn { background: none; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; }
        
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary); }
        .form-group input {
          width: 100%;
          padding: 12px;
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
        }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        
        /* Icon Buttons */
        .icon-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-edit:hover { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border-color: #3b82f6; }
        .action-delete:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: #ef4444; }

        .refresh-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-primary);
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .refresh-btn:hover { background: var(--bg-hover); transform: rotate(180deg); }

        .device-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 15px;
        }
        .device-stat-item {
          background: rgba(255, 255, 255, 0.03);
          padding: 12px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px solid var(--border);
        }
        .device-stat-value { font-size: 20px; font-weight: 700; color: var(--accent); }
        .device-stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

        .mb-4 { margin-bottom: 24px; }
        .device-card {
          padding: 24px;
          min-height: 200px;
        }
        .device-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .status-indicator.online { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .status-indicator.offline { background: #ef4444; }
        .device-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        .info-row .label { color: var(--text-secondary); }
        .info-row .value { font-weight: 600; }
        
        .logs-container {
          max-height: 400px;
          overflow-y: auto;
        }
        .logs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .logs-table th {
          text-align: left;
          padding: 12px 16px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .logs-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        .time-cell { white-space: nowrap; color: var(--text-secondary); }
        .message-cell { color: var(--text-primary); }
        
        .type-tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .type-tag.sync { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .type-tag.status_check { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        
        .status-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }
        .status-tag.success { color: #10b981; }
        .status-tag.error { color: #ef4444; }
        .empty-logs { padding: 40px; text-align: center; color: var(--text-muted); }
      `}} />
    </div>
  );
};

export default PointeusesPage;
