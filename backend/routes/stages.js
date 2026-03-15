const express = require('express');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const {
  createStageRequest,
  getMyStageRequests,
  getAllStageRequests,
  approveStagRequest,
  rejectStageRequest
} = require('../controllers/stageController');

const router = express.Router();

// Routes protégées - Employé crée sa demande
router.post('/', verifyToken, createStageRequest);
router.get('/my-requests', verifyToken, getMyStageRequests);

// Routes protégées - Admin/Chef voit toutes les demandes
router.get('/', verifyToken, getAllStageRequests);
router.put('/:id/approve', verifyToken, approveStagRequest);
router.put('/:id/reject', verifyToken, rejectStageRequest);

module.exports = router;

