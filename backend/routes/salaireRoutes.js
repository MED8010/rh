const express = require('express');
const { calculateSalaire, getSalaires, validateSalaire, validateAllSalaires, getSalaireStats, getSalaryAnalytics, getMonthlyTrends } = require('../controllers/salaireController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

router.post('/calculate', verifyToken, checkRole(['admin']), calculateSalaire);
router.get('/', verifyToken, getSalaires);
router.get('/stats', verifyToken, checkRole(['admin']), getSalaireStats);
router.get('/stats/analytics', verifyToken, checkRole(['admin', 'super_admin']), getSalaryAnalytics);
router.get('/stats/trends', verifyToken, checkRole(['admin', 'super_admin']), getMonthlyTrends);
router.put('/validate-all', verifyToken, checkRole(['admin']), validateAllSalaires);
router.put('/:id/validate', verifyToken, checkRole(['admin']), validateSalaire);

module.exports = router;
