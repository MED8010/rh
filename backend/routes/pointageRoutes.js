const express = require('express');
const { createPointage, getPointagesByEmploye, getRetardsOfDay, getAbsencesOfDay, getTimeStats, getTimeDisciplineStats } = require('../controllers/pointageController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

router.post('/', verifyToken, createPointage);
router.get('/employe/:employe_id', verifyToken, getPointagesByEmploye);
router.get('/stats/retards-day', verifyToken, getRetardsOfDay);
router.get('/stats/absences-day', verifyToken, getAbsencesOfDay);
router.get('/stats/time-stats', verifyToken, checkRole(['admin']), getTimeStats);
router.get('/stats/time-discipline', verifyToken, checkRole(['admin', 'super_admin']), getTimeDisciplineStats);

module.exports = router;
