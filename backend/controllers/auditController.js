const AuditLog = require('../models/AuditLog');

// Créer une entrée d'audit
const createAuditLog = async (req, res) => {
  try {
    const { action, module, resource_type, resource_id, description, ancienne_valeur, nouvelle_valeur } = req.body;

    const auditLog = new AuditLog({
      user: req.user.id,
      action,
      module,
      resource_type,
      resource_id,
      description,
      ancienne_valeur,
      nouvelle_valeur,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      date_action: new Date(),
      status: 'success'
    });

    await auditLog.save();
    res.status(201).json({ message: 'Audit enregistré avec succès', auditLog });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'audit', error: error.message });
  }
};

// Obtenir les logs d'audit
const getAuditLogs = async (req, res) => {
  try {
    const { user, module, action, startDate, endDate } = req.query;
    let filter = {};

    if (user) filter.user = user;
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.date_action = {};
      if (startDate) filter.date_action.$gte = new Date(startDate);
      if (endDate) filter.date_action.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('user')
      .sort({ date_action: -1 })
      .limit(1000);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des logs', error: error.message });
  }
};

// Obtenir les statistiques d'audit
const getAuditStats = async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const logsByAction = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const logsByModule = await AuditLog.aggregate([
      { $group: { _id: '$module', count: { $sum: 1 } } }
    ]);

    res.json({
      totalLogs,
      logsByAction,
      logsByModule
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};

module.exports = { createAuditLog, getAuditLogs, getAuditStats };
