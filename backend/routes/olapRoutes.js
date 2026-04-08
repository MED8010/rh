const express = require('express');
const router = express.Router();
const olapController = require('../controllers/olapController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

/**
 * Route OLAP Analyse Multidimensionnelle
 */

// Interroger le cube avec une requête dynamique
router.post('/query', verifyToken, checkRole(['admin', 'super_admin']), olapController.queryCube);

module.exports = router;
