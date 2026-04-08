const express = require('express');
const router = express.Router();
const biController = require('../controllers/biController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

/**
 * Routes BI & Décisionnel
 */

// Déclenchement manuel de l'ETL (Admin uniquement)
router.post('/etl/trigger', verifyToken, checkRole(['admin', 'super_admin']), biController.triggerETL);

// Récupérer les données du DW_DimEmploye (pour debugging/monitoring)
router.get('/dw-employes', verifyToken, checkRole(['admin', 'super_admin']), biController.getDWEmployes);

// Statistiques globales de l'entrepôt
router.get('/stats', verifyToken, checkRole(['admin', 'super_admin']), biController.getDWStats);

// Tendances de présence
router.get('/attendance-trend', verifyToken, checkRole(['admin', 'super_admin']), biController.getAttendanceTrend);

// Evolution paie
router.get('/payroll-evolution', verifyToken, checkRole(['admin', 'super_admin']), biController.getPayrollEvolution);

// Drill-down data
router.get('/drill-down', verifyToken, checkRole(['admin', 'super_admin']), biController.getDrillDownData);

module.exports = router;
