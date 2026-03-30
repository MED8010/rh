const express = require('express');
const { 
  createEmploye, 
  getEmployes, 
  getEmploye, 
  updateEmploye, 
  deleteEmploye, 
  getEmployeStats,
  exportEmployes,
  importEmployes,
  uploadExcel
} = require('../controllers/employeController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

router.get('/export', verifyToken, checkRole(['admin', 'super_admin']), exportEmployes);
router.post('/import', verifyToken, checkRole(['admin', 'super_admin']), uploadExcel, importEmployes);

router.post('/', verifyToken, checkRole(['admin', 'super_admin']), createEmploye);
router.get('/', verifyToken, getEmployes);
router.get('/stats', verifyToken, checkRole(['admin', 'super_admin']), getEmployeStats);
router.get('/:id', verifyToken, getEmploye);
router.put('/:id', verifyToken, updateEmploye);
router.delete('/:id', verifyToken, checkRole(['admin', 'super_admin']), deleteEmploye);

module.exports = router;
