const express = require('express');
const { createAuditLog, getAuditLogs, getAuditStats } = require('../controllers/auditController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

router.post('/', verifyToken, createAuditLog);
router.get('/', verifyToken, checkRole(['admin']), getAuditLogs);
router.get('/stats', verifyToken, checkRole(['admin']), getAuditStats);

module.exports = router;
