import React, { useState } from 'react';
import apiClient from '../services/api';
import '../styles/Dashboard.css';

const ImportPointagesModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setMessage('❌ Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        setMessageType('error');
        return;
      }
      setFile(selectedFile);
      setMessage('');
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await apiClient.get('/import/pointages/template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Pointage_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage('❌ Erreur lors du téléchargement du template');
      setMessageType('error');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage('❌ Veuillez sélectionner un fichier');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/import/pointages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessage(`✅ ${response.data.message}`);
        setMessageType('success');
        setFile(null);
        document.getElementById('pointageFileInput').value = '';
        
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setMessage('❌ Erreur lors de l\'importation');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.error || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0 }}>📥 Importer les Pointages</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 24, 
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: 20 }}>
          
          {/* Message */}
          {message && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              background: messageType === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
              color: messageType === 'success' ? 'var(--success)' : 'var(--danger)',
              fontSize: 14
            }}>
              {message}
            </div>
          )}

          {/* Template Download */}
          <div style={{
            padding: 16,
            background: 'var(--bg-hover)',
            borderRadius: 8,
            marginBottom: 16,
            textAlign: 'center',
            border: '2px dashed var(--border)'
          }}>
            <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              📋 Vous n'avez pas de fichier?
            </p>
            <button 
              onClick={downloadTemplate}
              style={{
                padding: '8px 16px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500
              }}
            >
              📥 Télécharger le Template
            </button>
          </div>

          {/* File Input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
              Sélectionner un fichier Excel
            </label>
            <input 
              id="pointageFileInput"
              type="file" 
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-hover)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            />
            {file && (
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>
                ✅ Fichier sélectionné: {file.name}
              </p>
            )}
          </div>

          {/* Instructions */}
          <div style={{
            padding: 12,
            background: 'var(--bg-hover)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 16
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>📝 Instructions:</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Remplissez le fichier avec les colonnes: Matricule, Date, Heure Entrée, Heure Sortie, etc.</li>
              <li>Format des dates: DD/MM/YYYY</li>
              <li>Format des heures: HH:MM (ex: 08:30)</li>
              <li>Max 10MB par fichier</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ 
          display: 'flex', 
          gap: 10, 
          padding: 16,
          borderTop: '1px solid var(--border)',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)'
            }}
          >
            Annuler
          </button>
          <button 
            onClick={handleImport}
            disabled={loading || !file}
            style={{
              padding: '10px 24px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading || !file ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
              opacity: loading || !file ? 0.5 : 1
            }}
          >
            {loading ? '⏳ Importation...' : '📥 Importer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPointagesModal;
