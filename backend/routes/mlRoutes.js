const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

/**
 * Routes Intelligence Artificielle & Prédictions
 */

// Prévision de la masse salariale (12 mois)
router.get('/forecast/payroll', verifyToken, checkRole(['admin', 'super_admin']), mlController.getPayrollForecast);

// Analyse de l'absentéisme (Pics et Tendances)
router.get('/forecast/absences', verifyToken, checkRole(['admin', 'super_admin']), mlController.getAbsenteeismForecast);

// Scoring du risque de turnover par employé
router.get('/risk/turnover', verifyToken, checkRole(['admin', 'super_admin']), mlController.getTurnoverRisk);

// Détection d'anomalies (Data Profiling)
router.get('/risk/anomalies', verifyToken, checkRole(['admin', 'super_admin']), mlController.getAnomalies);

module.exports = router;
