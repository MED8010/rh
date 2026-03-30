const express = require('express');
const { createService, getServices, updateService, deleteService, createUAP, getUAPs, updateUAP, deleteUAP } = require('../controllers/structureController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

// Services
router.post('/services', verifyToken, checkRole(['admin', 'super_admin']), createService);
router.get('/services', verifyToken, getServices);
router.put('/services/:id', verifyToken, checkRole(['admin', 'super_admin']), updateService);
router.delete('/services/:id', verifyToken, checkRole(['admin', 'super_admin']), deleteService);

// UAP
router.post('/uaps', verifyToken, checkRole(['admin', 'super_admin']), createUAP);
router.get('/uaps', verifyToken, getUAPs);
router.put('/uaps/:id', verifyToken, checkRole(['admin', 'super_admin']), updateUAP);
router.delete('/uaps/:id', verifyToken, checkRole(['admin', 'super_admin']), deleteUAP);

module.exports = router;
