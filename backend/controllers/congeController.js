const Conge = require('../models/Conge');
const Employe = require('../models/Employe');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendCongeNotificationEmail, sendAdminNewRequestEmail } = require('../services/emailService');
const { createNotification, createAndSendNotification } = require('../services/notificationService');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Crée une notification en base
 */


/**
 * Retourne tous les users admin/super_admin
 */
const getAdminUsers = async () => {
  return User.find({ role: { $in: ['admin', 'super_admin'] } });
};

// ─── Controllers ────────────────────────────────────────────────────────────

// Demander un congé
const requestConge = async (req, res) => {
  try {
    const { employe_id, date_debut, date_fin, type, motif } = req.body;

    console.log('📝 Création demande congé:', { employe_id, date_debut, date_fin, type, motif });

    if (!employe_id || !date_debut || !date_fin || !type) {
      return res.status(400).json({ message: 'Champs manquants: employe_id, date_debut, date_fin, type sont obligatoires' });
    }

    const start = new Date(date_debut);
    const end = new Date(date_fin);
    const diffTime = Math.abs(end - start);
    const nombre_jours = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const employe = await Employe.findById(employe_id);
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    if (type === 'annuel' && employe.solde_conge_restant < nombre_jours) {
      return res.status(400).json({ message: `Solde insuffisant! Vous avez ${employe.solde_conge_restant} jours disponibles` });
    }

    const conge = new Conge({
      employe: employe_id,
      date_debut,
      date_fin,
      nombre_jours,
      type,
      motif,
      statut: 'demande'
    });

    await conge.save();
    await conge.populate('employe');

    // ── Notifier tous les admins ──────────────────────────────────────────────
    const admins = await getAdminUsers();
    const employeNomComplet = `${employe.prenom} ${employe.nom}`;
    const dateDebutFr = start.toLocaleDateString('fr-FR');
    const dateFinFr = end.toLocaleDateString('fr-FR');

    for (const admin of admins) {
      await createNotification(
        admin._id,
        'conge_demande',
        '📝 Nouvelle demande de congé',
        `${employeNomComplet} a soumis une demande de congé (${type}) du ${dateDebutFr} au ${dateFinFr} — ${nombre_jours} jour(s).`,
        conge._id
      );

      // ── Envoyer aussi un EMAIL à l'admin ────────────────────────────
      if (admin.email) {
        await sendAdminNewRequestEmail(admin.email, employeNomComplet, 'conge', { date_debut, date_fin });
      }
    }
    console.log(`🔔 ${admins.length} admin(s) notifié(s) de la nouvelle demande de congé`);

    res.status(201).json({ message: 'Demande de congé créée avec succès', conge });
  } catch (error) {
    console.error('❌ Erreur création congé:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la demande', error: error.message });
  }
};

// Obtenir les demandes de congés
const getConges = async (req, res) => {
  try {
    const { employe_id, statut } = req.query;
    let filter = {};

    if (employe_id) filter.employe = employe_id;
    if (statut) filter.statut = statut;

    const conges = await Conge.find(filter).populate(['employe', 'valide_par']).sort({ createdAt: -1 });
    res.json(conges);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des congés', error: error.message });
  }
};

// Approuver un congé
const approveConge = async (req, res) => {
  try {
    const { id } = req.params;
    const conge = await Conge.findById(id).populate('employe');

    if (!conge) {
      return res.status(404).json({ message: 'Congé non trouvé' });
    }

    const employe = await Employe.findById(conge.employe._id || conge.employe);

    // Déduire le solde de congé
    if (conge.type === 'annuel') {
      employe.solde_conge_restant -= conge.nombre_jours;
      if (employe.solde_conge_restant < 0) {
        return res.status(400).json({ message: 'Solde de congé insuffisant' });
      }
    }

    conge.statut = 'approuve';
    conge.valide_par = req.user.id;
    conge.date_validation = new Date();

    await conge.save();
    await employe.save();

    // ── Notifier l'employé via son compte User ────────────────────────────────
    const employeUser = await User.findOne({ employe: employe._id });
    if (employeUser) {
      const dateDebutFr = new Date(conge.date_debut).toLocaleDateString('fr-FR');
      const dateFinFr = new Date(conge.date_fin).toLocaleDateString('fr-FR');

      await createAndSendNotification(employeUser._id, {
        type: 'conge_approuve',
        category: 'RH',
        titre: '✅ Demande de congé approuvée',
        message: `Votre demande de congé du ${dateDebutFr} au ${dateFinFr} (${conge.nombre_jours} jour(s)) a été approuvée.`,
        reference_id: conge._id
      });

      // Envoyer email si l'employé a un email
      if (employeUser.email) {
        const employeNom = `${employe.prenom} ${employe.nom}`;
        await sendCongeNotificationEmail(employeUser.email, employeNom, 'approuve', conge);
      }
    }

    console.log(`✅ Congé ${id} approuvé — employé notifié`);
    res.json({ message: 'Congé approuvé avec succès', conge });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'approbation du congé', error: error.message });
  }
};

// Refuser un congé
const rejectConge = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire_rejet } = req.body;

    const conge = await Conge.findByIdAndUpdate(
      id,
      {
        statut: 'refuse',
        commentaire_rejet,
        valide_par: req.user.id,
        date_validation: new Date()
      },
      { new: true }
    ).populate(['employe', 'valide_par']);

    if (!conge) {
      return res.status(404).json({ message: 'Congé non trouvé' });
    }

    // ── Notifier l'employé via son compte User ────────────────────────────────
    const employeDoc = conge.employe;
    const employeUser = await User.findOne({ employe: employeDoc._id });

    if (employeUser) {
      const dateDebutFr = new Date(conge.date_debut).toLocaleDateString('fr-FR');
      const dateFinFr = new Date(conge.date_fin).toLocaleDateString('fr-FR');
      const motifText = commentaire_rejet ? ` Motif : ${commentaire_rejet}.` : '';

      await createNotification(
        employeUser._id,
        'conge_refuse',
        '❌ Demande de congé refusée',
        `Votre demande de congé du ${dateDebutFr} au ${dateFinFr} (${conge.nombre_jours} jour(s)) a été refusée.${motifText}`,
        conge._id
      );

      // Envoyer email si l'employé a un email
      if (employeUser.email) {
        const employeNom = `${employeDoc.prenom} ${employeDoc.nom}`;
        await sendCongeNotificationEmail(employeUser.email, employeNom, 'refuse', conge);
      }
    }

    console.log(`❌ Congé ${id} refusé — employé notifié`);
    res.json({ message: 'Congé refusé', conge });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du refus du congé', error: error.message });
  }
};

// Obtenir le solde de congé d'un employé
const getCongeBalance = async (req, res) => {
  try {
    const { employe_id } = req.params;
    const employe = await Employe.findById(employe_id);

    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    res.json({
      solde_total: employe.solde_conge_total,
      solde_restant: employe.solde_conge_restant,
      utilise: employe.solde_conge_total - employe.solde_conge_restant
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du solde', error: error.message });
  }
};

module.exports = { requestConge, getConges, approveConge, rejectConge, getCongeBalance };
