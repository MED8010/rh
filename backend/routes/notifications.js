const express = require('express');
const verifyToken = require('../middleware/auth');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllReadNotifications
} = require('../controllers/notificationController');

const router = express.Router();

// Routes protégées
router.get('/', verifyToken, getMyNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.put('/mark-all/read', verifyToken, markAllAsRead);
router.delete('/:id', verifyToken, deleteNotification);
router.delete('/delete-all/read', verifyToken, deleteAllReadNotifications);

module.exports = router;

