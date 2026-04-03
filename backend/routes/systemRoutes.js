const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

// Super Admin only routes
router.get('/metrics', verifyToken, checkRole(['super_admin']), systemController.getSystemMetrics);
router.get('/configs', verifyToken, checkRole(['super_admin']), systemController.getConfigs);
router.post('/configs', verifyToken, checkRole(['super_admin']), systemController.updateConfig);

module.exports = router;
