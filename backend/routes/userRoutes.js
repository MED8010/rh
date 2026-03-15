const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// Routes - Only super_admin can access these
router.get('/', verifyToken, checkRole(['super_admin']), getAllUsers);
router.post('/', verifyToken, checkRole(['super_admin']), createUser);
router.put('/:id', verifyToken, checkRole(['super_admin']), updateUser);
router.delete('/:id', verifyToken, checkRole(['super_admin']), deleteUser);

module.exports = router;
