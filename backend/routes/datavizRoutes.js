const express = require('express');
const router = express.Router();
const datavizController = require('../controllers/datavizController');
const verifyToken = require('../middleware/auth');

// Heatmap des congés/absences
router.get('/heatmap', verifyToken, datavizController.getHeatmapConges);

// Treemap Masse Salariale
router.get('/treemap', verifyToken, datavizController.getTreemapSalaire);

// Gantt Congés
router.get('/gantt', verifyToken, datavizController.getGanttConges);

// Radar Profile
router.get('/radar', verifyToken, datavizController.getRadarProfile);

// Tendance Retards (Confidence Interval)
router.get('/trend', verifyToken, datavizController.getTrendRetards);

module.exports = router;
