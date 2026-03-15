const express = require('express');
const { requestConge, getConges, approveConge, rejectConge, getCongeBalance } = require('../controllers/congeController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

router.post('/', verifyToken, checkRole(['employe', 'chef_service']), requestConge);
router.get('/', verifyToken, getConges);
router.get('/balance/:employe_id', verifyToken, getCongeBalance);
router.put('/:id/approve', verifyToken, checkRole(['admin']), approveConge);
router.put('/:id/reject', verifyToken, checkRole(['admin']), rejectConge);

module.exports = router;
