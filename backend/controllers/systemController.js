const mongoose = require('mongoose');
const User = require('../models/User');
const Employe = require('../models/Employe');
const AuditLog = require('../models/AuditLog');
const SystemConfig = require('../models/SystemConfig');

// Get system metrics for Super Admin Dashboard
exports.getSystemMetrics = async (req, res) => {
  try {
    const [userCount, adminCount, employeCount, lastAudits, dbStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
      Employe.countDocuments(),
      AuditLog.find().sort({ date_action: -1 }).limit(5).populate('user', 'email'),
      mongoose.connection.db.stats()
    ]);

    res.json({
      metrics: {
        totalUsers: userCount,
        admins: adminCount,
        totalEmployees: employeCount,
        dbSize: (dbStats.dataSize / (1024 * 1024)).toFixed(2) + ' MB',
        collections: dbStats.collections,
        uptime: Math.floor(process.uptime()) // in seconds
      },
      recentActivity: lastAudits,
      rolesDistribution: {
        super_admin: await User.countDocuments({ role: 'super_admin' }),
        admin: await User.countDocuments({ role: 'admin' }),
        chef_service: await User.countDocuments({ role: 'chef_service' }),
        employe: await User.countDocuments({ role: 'employe' })
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des statistiques système', error: error.message });
  }
};

// Get all system configurations
exports.getConfigs = async (req, res) => {
  try {
    const configs = await SystemConfig.find();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement de la configuration', error: error.message });
  }
};

// Update or create configuration
exports.updateConfig = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    
    let config = await SystemConfig.findOne({ key });
    
    if (config) {
      config.value = value;
      if (description) config.description = description;
      config.updatedBy = req.user.id;
      config.updatedAt = Date.now();
      await config.save();
    } else {
      config = await SystemConfig.create({
        key,
        value,
        description,
        updatedBy: req.user.id
      });
    }

    res.json({ message: 'Configuration mise à jour', config });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la configuration', error: error.message });
  }
};
