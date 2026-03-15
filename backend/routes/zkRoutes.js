const express = require('express');
const { syncLogs, getDeviceInfo, toggleSync, getSyncStatus } = require('../services/zkService');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const ZkLog = require('../models/ZkLog');

const BiometricDevice = require('../models/BiometricDevice');

const router = express.Router();

// --- GESTION DES APPAREILS (CRUD) ---

// Ajouter une nouvelle pointeuse
router.post('/devices', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), async (req, res) => {
  try {
    const { name, ip, port } = req.body;
    const device = new BiometricDevice({ name, ip, port });
    await device.save();
    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de l\'ajout de la pointeuse', error: error.message });
  }
});

// Modifier une pointeuse existante
router.put('/devices/:id', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), async (req, res) => {
  try {
    const { name, ip, port, isActive } = req.body;
    const device = await BiometricDevice.findByIdAndUpdate(
      req.params.id,
      { name, ip, port, isActive },
      { new: true, runValidators: true }
    );
    if (!device) return res.status(404).json({ message: 'Pointeuse non trouvée' });
    res.json(device);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la modification', error: error.message });
  }
});

// Supprimer une pointeuse
router.delete('/devices/:id', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), async (req, res) => {
  try {
    const device = await BiometricDevice.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ message: 'Pointeuse non trouvée' });
    res.json({ message: 'Pointeuse supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
});

// --- SYNCHRONISATION ET STATUT ---

// Route pour déclencher manuellement la synchronisation
router.post('/sync', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), async (req, res) => {
  try {
    const result = await syncLogs();
    if (result.status === 'disabled') {
       return res.status(400).json({ message: 'La synchronisation automatique est actuellement désactivée.' });
    }
    if (result.failed > 0 && result.success === 0) {
      return res.status(500).json({ 
        message: 'Échec de la synchronisation : Impossible de se connecter aux pointeuses', 
        details: result.deviceStatus 
      });
    }
    res.json({ 
      message: 'Synchronisation terminée', 
      summary: result 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur système lors de la synchronisation', error: error.message });
  }
});

// Route pour activer/désactiver la synchronisation
router.post('/toggle', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), async (req, res) => {
  console.log(`[ZK] Toggle request from ${req.user.role} (${req.user.id}):`, req.body);
  try {
    const { active } = req.body;
    const newStatus = toggleSync(active);
    res.json({ 
      message: `Synchronisation ${newStatus ? 'activée' : 'désactivée'}`, 
      active: newStatus 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du changement d\'état', error: error.message });
  }
});

// Route pour obtenir le statut actuel de la synchronisation
router.get('/status', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), async (req, res) => {
  res.json({ active: getSyncStatus() });
});

// Route pour récupérer les infos en direct des pointeuses
router.get('/devices', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), async (req, res) => {
  try {
    const devices = await getDeviceInfo();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des infos appareils', error: error.message });
  }
});

// Route pour récupérer les derniers logs de connexion
router.get('/logs', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), async (req, res) => {
  try {
    const logs = await ZkLog.find().sort({ timestamp: -1 }).limit(20);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des logs', error: error.message });
  }
});

module.exports = router;
