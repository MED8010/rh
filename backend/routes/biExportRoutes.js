const express = require('express');
const router = express.Router();
const biExportController = require('../controllers/biExportController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// Ces routes n'utilisent PAS "verifyToken" (JWT Frontend), mais "apiKeyAuth" (Clé M2M)

// Export JSON plat pour PowerBI ou Tableau
router.get('/json/salary-trends', apiKeyAuth, biExportController.exportSalaryTrendsJSON);

// Export CSV Live pour Looker Studio / Excel
router.get('/csv/attendance', apiKeyAuth, biExportController.exportAttendanceCSV);

module.exports = router;
