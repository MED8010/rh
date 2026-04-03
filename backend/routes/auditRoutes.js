const express = require('express');
const { createAuditLog, getAuditLogs, getAuditStats } = require('../controllers/auditController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

router.post('/', verifyToken, createAuditLog);
router.get('/', verifyToken, checkRole(['admin', 'super_admin']), getAuditLogs);
router.get('/stats', verifyToken, checkRole(['admin', 'super_admin']), getAuditStats);

module.exports = router;
