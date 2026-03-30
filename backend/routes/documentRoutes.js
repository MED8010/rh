const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const { 
  createRequest, 
  getRequests, 
  updateRequest, 
  deleteRequest 
} = require('../controllers/documentController');

// Routes pour tout le monde (employé et admin)
router.get('/', verifyToken, getRequests);
router.post('/', verifyToken, createRequest);

// Routes admin uniquement
router.put('/:id', verifyToken, checkRole(['admin', 'super_admin']), updateRequest);
router.delete('/:id', verifyToken, checkRole(['admin', 'super_admin']), deleteRequest);

module.exports = router;
