const etlService = require('../services/etlService');
const DW_FactAttendance = require('../models/DW_FactAttendance');
const DW_FactSalary = require('../models/DW_FactSalary');
const DW_DimEmploye = require('../models/DW_DimEmploye');
const mongoose = require('mongoose');

/**
 * BI Controller
 * Gère les requêtes vers l'entrepôt de données (DWH) avec filtres dynamiques
 */

// Utilitaire pour construire le filtre commun
const buildFilters = (query) => {
  const filters = {};
  
  if (query.service) filters.service_id = new mongoose.Types.ObjectId(query.service);
  if (query.uap) filters.uap_id = new mongoose.Types.ObjectId(query.uap);
  
  // Filtre temporel (DateKey YYYYMMDD ou MonthYearKey YYYYMM)
  if (query.startDate && query.endDate) {
    const start = parseInt(query.startDate.replace(/-/g, ''));
    const end = parseInt(query.endDate.replace(/-/g, ''));
    filters.date_key = { $gte: start, $lte: end };
  } else if (query.startMonth && query.endMonth) {
    filters.month_year_key = { $gte: parseInt(query.startMonth), $lte: parseInt(query.endMonth) };
  }
  
  return filters;
};

// Déclenchement manuel de l'ETL
exports.triggerETL = async (req, res) => {
  try {
    etlService.runFullETL();
    res.json({ message: 'Flux ETL démarré en arrière-plan' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur au démarrage de l\'ETL', error: error.message });
  }
};

// Statistiques globales et KPIs de haut niveau
exports.getDWStats = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    
    const [attendanceStats, salaryStats] = await Promise.all([
      DW_FactAttendance.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            total_worked: { $sum: "$worked_hours" },
            total_overtime: { $sum: "$overtime_hours" },
            total_late: { $sum: "$late_minutes" },
            absent_count: { $sum: { $cond: ["$is_absent", 1, 0] } },
            total_days: { $sum: 1 }
          }
        }
      ]),
      DW_FactSalary.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            total_payroll: { $sum: "$net_payable" },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const att = attendanceStats[0] || { total_worked: 0, total_overtime: 0, total_late: 0, absent_count: 0, total_days: 0 };
    const sal = salaryStats[0] || { total_payroll: 0, count: 0 };

    res.json({
      metrics: {
        attendance: {
          worked_hours: att.total_worked,
          overtime_hours: att.total_overtime,
          late_minutes: att.total_late,
          absent_count: att.absent_count,
          absenteeism_rate: att.total_days > 0 ? (att.absent_count / att.total_days * 100).toFixed(2) : 0
        },
        payroll: {
          total: sal.total_payroll,
          avg_per_emp: sal.count > 0 ? (sal.total_payroll / sal.count).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des stats DW', error: error.message });
  }
};

// Analyse des tendances de présence
exports.getAttendanceTrend = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    
    const results = await DW_FactAttendance.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$date_key",
          avg_worked_hours: { $avg: "$worked_hours" },
          total_overtime: { $sum: "$overtime_hours" },
          absent_count: { $sum: { $cond: ["$is_absent", 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des tendances', error: error.message });
  }
};

// Répartition de la masse salariale par service
exports.getPayrollEvolution = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    
    const results = await DW_FactSalary.aggregate([
      { $match: filters },
      {
        $lookup: {
          from: "services",
          localField: "service_id",
          foreignField: "_id",
          as: "service"
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$service.nom_service", 0] },
          total_net: { $sum: "$net_payable" },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement de l\'évolution paie', error: error.message });
  }
};

// Drill-Down : Liste détaillée des absences ou heures sup
exports.getDrillDownData = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const { type } = req.query; // 'absence' ou 'overtime' ou 'late'
    
    if (type === 'absence') filters.is_absent = true;
    else if (type === 'overtime') filters.overtime_hours = { $gt: 0 };
    else if (type === 'late') filters.late_minutes = { $gt: 0 };

    const results = await DW_FactAttendance.find(filters)
      .populate('employe_key')
      .sort({ date_key: -1 })
      .limit(100);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Erreur drill-down', error: error.message });
  }
};

// Récupérer les données de la dimension employé (DW_DimEmploye)
exports.getDWEmployes = async (req, res) => {
  try {
    const results = await DW_DimEmploye.find({ is_current: true })
      .sort({ matricule: 1 })
      .limit(1000);

    res.json({
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des employés DW', error: error.message });
  }
};
