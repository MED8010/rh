const DocumentRequest = require('../models/DocumentRequest');
const Employe = require('../models/Employe');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const Notification = require('../models/Notification');
const fs = require('fs');
const { sendDocumentNotificationEmail } = require('../services/emailService');

// ─── Helpers ────────────────────────────────────────────────────────────────
const { createNotification } = require('../services/notificationService');

// ─── Helpers ────────────────────────────────────────────────────────────────
const getAdminUsers = async () => {
  return User.find({ role: { $in: ['admin', 'super_admin'] } });
};

// Configuration de multer pour les documents générés par l'admin
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'backend/uploads/documents';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|png|jpeg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers PDF, Word et images sont autorisés'));
  }
}).single('file');

// Créer une demande de document (Employé)
const createRequest = async (req, res) => {
  try {
    const { type_document, message } = req.body;
    
    // Trouver l'employé correspondant à l'utilisateur connecté
    let employeId = req.body.employeId; // Si fourni par l'admin

    if (!employeId) {
      const user = await User.findById(req.user.id).populate('employe');
      if (!user || !user.employe) {
        return res.status(404).json({ message: 'Employé non trouvé pour cet utilisateur' });
      }
      employeId = user.employe._id;
    }

    const documentRequest = new DocumentRequest({
      employe: employeId,
      type_document,
      message,
      statut: 'en_attente'
    });

    await documentRequest.save();

    // ── Notifier tous les admins ──────────────────────────────────────────────
    try {
      const admins = await getAdminUsers();
      const employe = await Employe.findById(employeId);
      const employeNom = employe ? `${employe.prenom} ${employe.nom}` : 'Un employé';

      for (const admin of admins) {
        await createNotification(
          admin._id,
          'document_demande',
          '📄 Nouvelle demande de document',
          `${employeNom} a demandé un document (${type_document.replace('_', ' ')}).`,
          documentRequest._id
        );
      }
    } catch (notifErr) {
      console.error('Erreur notification admin:', notifErr);
    }

    res.status(201).json(documentRequest);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la demande', error: error.message });
  }
};

// Obtenir les demandes (Admin: tout, Employé: les siennes)
const getRequests = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'employe') {
      const user = await User.findById(req.user.id);
      if (!user || !user.employe) {
        return res.status(404).json({ message: 'Employé non trouvé' });
      }
      filter.employe = user.employe;
    } else {
      // Pour l'admin, on peut filtrer par employé si nécessaire
      if (req.query.employeId) {
        filter.employe = req.query.employeId;
      }
      if (req.query.statut) {
        filter.statut = req.query.statut;
      }
    }

    const requests = await DocumentRequest.find(filter)
      .populate('employe', 'nom prenom matricule')
      .populate('traite_par', 'email')
      .sort({ date_demande: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des demandes', error: error.message });
  }
};

// Mettre à jour une demande (Admin: traiter/rejeter)
const updateRequest = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { statut, commentaire_admin } = req.body;
      const request = await DocumentRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({ message: 'Demande non trouvée' });
      }

      if (statut) request.statut = statut;
      if (commentaire_admin) request.commentaire_admin = commentaire_admin;

      if (req.file) {
        // Supprimer l'ancien fichier s'il existe
        if (request.fichier_joint) {
          const oldPath = path.join('backend/uploads/documents', request.fichier_joint);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        request.fichier_joint = req.file.filename;
        request.statut = 'traite'; // Passer automatiquement à traité si un fichier est joint
      }

      request.traite_par = req.user.id;
      request.date_traitement = new Date();

      await request.save();

      // ── Notifier l'employé ──────────────────────────────────────────────
      try {
        const employeUser = await User.findOne({ employe: request.employe });
        if (employeUser) {
          const typeLabel = request.type_document.replace('_', ' ');
          const isApprouve = request.statut === 'traite';

          await createNotification(
            employeUser._id,
            isApprouve ? 'document_traite' : 'document_rejete',
            isApprouve ? '✅ Document disponible' : '❌ Demande de document rejetée',
            isApprouve
              ? `Votre demande de document (${typeLabel}) a été traitée. Vous pouvez le télécharger dès maintenant.`
              : `Votre demande de document (${typeLabel}) a été rejetée. Commentaire: ${commentaire_admin || 'Pas de motif spécifié'}.`,
            request._id
          );

          // ── Email Notification ───────────────────────────────────────────
          const employe = await Employe.findById(request.employe);
          if (employe && (employe.email || employeUser.email)) {
            const emailDest = employe.email || employeUser.email;
            const employeNom = `${employe.prenom} ${employe.nom}`;
            await sendDocumentNotificationEmail(emailDest, employeNom, request.statut, request);
          }
        }
      } catch (notifErr) {
        console.error('Erreur notification employe:', notifErr);
      }

      const populatedRequest = await DocumentRequest.findById(request._id)
        .populate('employe', 'nom prenom matricule')
        .populate('traite_par', 'email');

      res.json(populatedRequest);
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la demande', error: error.message });
  }
};

// Supprimer une demande
const deleteRequest = async (req, res) => {
  try {
    const request = await DocumentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    // Supprimer le fichier associé
    if (request.fichier_joint) {
      const filePath = path.join('backend/uploads/documents', request.fichier_joint);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await DocumentRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Demande supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
};

module.exports = {
  createRequest,
  getRequests,
  updateRequest,
  deleteRequest,
  upload // pour l'utiliser dans les routes si besoin
};
