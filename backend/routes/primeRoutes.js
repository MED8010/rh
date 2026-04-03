const express = require('express');
const { 
  getPrimeTypes, createPrimeType, updatePrimeType, deletePrimeType,
  assignPrime, getPrimes, deletePrime, getPrimeStats 
} = require('../controllers/primeController');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roles');

const router = express.Router();

// Types de Primes (CRUD)
router.get('/types', verifyToken, getPrimeTypes);
router.post('/types', verifyToken, checkRole(['admin', 'super_admin']), createPrimeType);
router.put('/types/:id', verifyToken, checkRole(['admin', 'super_admin']), updatePrimeType);
router.delete('/types/:id', verifyToken, checkRole(['admin', 'super_admin']), deletePrimeType);

// Attributions des Primes
router.get('/', verifyToken, getPrimes);
router.post('/', verifyToken, checkRole(['admin', 'super_admin', 'chef_service']), assignPrime);
router.delete('/:id', verifyToken, checkRole(['admin', 'super_admin']), deletePrime);
router.get('/stats', verifyToken, checkRole(['admin', 'super_admin']), getPrimeStats);

module.exports = router;
