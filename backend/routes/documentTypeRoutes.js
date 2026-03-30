const express = require('express');
const router = express.Router();
const documentTypeController = require('../controllers/documentTypeController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

router.use(verifyToken); // All routes protected

router.get('/', documentTypeController.getAllTypes);

router.post('/', checkRole(['admin', 'super_admin']), documentTypeController.createType);
router.delete('/:id', checkRole(['admin', 'super_admin']), documentTypeController.deleteType);

module.exports = router;
