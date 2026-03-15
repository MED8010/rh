const express = require('express');
const { createEmploye, getEmployes, getEmploye, updateEmploye, deleteEmploye, getEmployeStats } = require('../controllers/employeController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

router.post('/', verifyToken, checkRole(['admin']), createEmploye);
router.get('/', verifyToken, getEmployes);
router.get('/stats', verifyToken, checkRole(['admin']), getEmployeStats);
router.get('/:id', verifyToken, getEmploye);
router.put('/:id', verifyToken, checkRole(['admin']), updateEmploye);
router.delete('/:id', verifyToken, checkRole(['admin']), deleteEmploye);

module.exports = router;
