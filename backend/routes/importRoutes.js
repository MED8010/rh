const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const importController = require('../controllers/importController');

// Configuration multer pour l'upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `import_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accepter seulement les fichiers Excel
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Import des pointages
router.post('/pointages', 
  auth, 
  checkRole(['admin', 'super_admin']), 
  upload.single('file'), 
  importController.importPointagesExcel
);

// Télécharger le template (accessible à tous les utilisateurs authentifiés)
router.get('/pointages/template', 
  auth,
  importController.exportPointageTemplate
);

module.exports = router;
