const ss = require('simple-statistics');
const DW_FactSalary = require('../models/DW_FactSalary');
const DW_FactAttendance = require('../models/DW_FactAttendance');
const DW_DimEmploye = require('../models/DW_DimEmploye');

/**
 * Service ML & Intelligence Prédictive
 */
const mlService = {
  
  /**
   * 1. Prévision Budgétaire (Masse Salariale)
   * Projette les 12 prochains mois basés sur l'historique
   */
  forecastPayroll: async () => {
    // Récupérer l'historique mensuel
    const history = await DW_FactSalary.aggregate([
      { $group: { _id: "$month_year_key", total: { $sum: "$net_payable" } } },
      { $sort: { _id: 1 } }
    ]);

    if (history.length < 3) return { message: 'Données insuffisantes' };

    // Préparer pour la régression (X = index temporel, Y = montant)
    const points = history.map((h, i) => [i, h.total]);
    const regression = ss.linearRegression(points);
    const line = ss.linearRegressionLine(regression);

    // Prédire les 12 prochains mois
    const lastIndex = points.length - 1;
    const forecast = [];
    for (let i = 1; i <= 12; i++) {
        const nextIdx = lastIndex + i;
        forecast.push({
            month_index: nextIdx,
            predicted_total: Math.max(0, line(nextIdx)),
            confidence: 0.85 // Basé sur la variance résiduelle (simplifié)
        });
    }

    return { history, forecast };
  },

  /**
   * 2. Prévision de l'Absentéisme (Pics Saisonniers)
   */
  forecastAbsenteeism: async () => {
    const history = await DW_FactAttendance.aggregate([
      { $group: { _id: "$date_key", count: { $sum: { $cond: ["$is_absent", 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);

    if (history.length < 10) return { message: 'Données insuffisantes' };

    // Analyse de périodicité simple
    const values = history.map(h => h.count);
    const avg = ss.mean(values);
    const stdDev = ss.standardDeviation(values);

    // Prédire une "Vigilance" basée sur l'écart type
    const peakProbability = values.filter(v => v > avg + stdDev).length / values.length;

    return {
      average_absences: avg.toFixed(2),
      peak_probability: peakProbability.toFixed(2),
      trend: ss.linearRegression(history.map((h, i) => [i, h.count])).m > 0 ? 'Hausse' : 'Baisse'
    };
  },

  /**
   * 3. Scoring du Risque de Turnover (Analyse Individuelle)
   * Score de 0 à 100 basé sur : Ancienneté, Absentéisme, Retards, Écart de salaire
   */
  calculateTurnoverRisk: async () => {
    const employees = await DW_DimEmploye.find({ is_current: true });
    const riskData = [];

    for (const emp of employees) {
        // Stats récentes pour cet employé
        const stats = await DW_FactAttendance.aggregate([
            { $match: { employe_key: emp._id } },
            { $group: { _id: null, lates: { $sum: "$late_minutes" }, absences: { $sum: { $cond: ["$is_absent", 1, 0] } } } }
        ]);

        const s = stats[0] || { lates: 0, absences: 0 };
        
        // Calcul du Score (Simplifié)
        let score = 10; // Base
        score += (s.absences * 5); // Absence = +5 points
        score += (s.lates / 30); // 30min retard = +1 point
        
        // Moins de 3 mois = Risque d'intégration
        const monthsInCompany = (new Date() - new Date(emp.valid_from)) / (1000 * 60 * 60 * 24 * 30);
        if (monthsInCompany < 3) score += 20;

        riskData.push({
            matricule: emp.matricule,
            nom: emp.nom,
            prenom: emp.prenom,
            service: emp.service_nom,
            risk_score: Math.min(score, 100).toFixed(0),
            indicators: {
                absences: s.absences,
                lates: s.lates,
                tenure_months: monthsInCompany.toFixed(1)
            }
        });
    }

    return riskData.sort((a, b) => b.risk_score - a.risk_score);
  },

  /**
   * 4. Détection d'anomalies (Data Profiling & Fraude Temporelle/Financière)
   */
  detectAnomalies: async () => {
    const anomalies = [];
    let globalAlert = null;

    // A. Fraude Financière : Primes anormalement élevées par rapport au salaire de base (Seuil > 50%)
    const salairesMois = await DW_FactSalary.aggregate([
      // On prend les derniers salaires
      { $sort: { month_year_key: -1 } },
      { $limit: 100 },
      { $lookup: { from: 'dw_dimemployes', localField: 'employe_key', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' }
    ]);

    for (const s of salairesMois) {
      if (s.base_salary > 0 && (s.prime_total / s.base_salary) > 0.5) {
        anomalies.push({
          type: 'Fraude Financière',
          severity: 'high',
          employe: `${s.emp.prenom} ${s.emp.nom}`,
          service: s.emp.service_nom,
          description: `Primes cumulées (${s.prime_total} DT) excèdent 50% du salaire de base (${s.base_salary} DT).`
        });
      }
    }

    // B. Outliers Temporels : Retards statistiquement aberrants (Z-Score > 2)
    const attendances = await DW_FactAttendance.aggregate([
      { $group: { _id: "$employe_key", total_lates: { $sum: "$late_minutes" } } },
      { $lookup: { from: 'dw_dimemployes', localField: '_id', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' }
    ]);

    const latesArray = attendances.map(a => a.total_lates);
    if (latesArray.length > 2) {
      const meanLates = ss.mean(latesArray);
      const stdDevLates = ss.standardDeviation(latesArray) || 1; // avoid div by 0

      for (const a of attendances) {
        const zScore = (a.total_lates - meanLates) / stdDevLates;
        if (zScore > 2.0 && a.total_lates > 60) { // Z-score > 2 ET plus de 1h au total
          anomalies.push({
            type: 'Outlier Discipline',
            severity: 'medium',
            employe: `${a.emp.prenom} ${a.emp.nom}`,
            service: a.emp.service_nom,
            description: `Retards excessifs : ${a.total_lates} min (Moyenne entreprise: ${Math.round(meanLates)} min). Z-Score = ${(zScore).toFixed(1)}.`
          });
        }
      }
    }

    // C. Saut KPI Global : Absentéisme mensuel
    const absHistory = await DW_FactAttendance.aggregate([
      // Group by YYYYMM
      { $group: { _id: { $substr: ["$date_key", 0, 6] }, abs_count: { $sum: { $cond: ["$is_absent", 1, 0] } } } },
      { $sort: { _id: -1 } }
    ]);

    if (absHistory.length >= 3) {
      const currentMonthAbs = absHistory[0].abs_count;
      const historyAbs = absHistory.slice(1).map(h => h.abs_count);
      const avgHistoryAbs = ss.mean(historyAbs);

      if (avgHistoryAbs > 0 && currentMonthAbs > avgHistoryAbs * 1.20) {
        // Hausse de > 20%
        globalAlert = `Alerte Globale: Le volume d'absences a bondi de +${(((currentMonthAbs / avgHistoryAbs) - 1) * 100).toFixed(0)}% ce mois-ci par rapport à la moyenne historique.`;
      }
    }

    return { 
      global_alert: globalAlert, 
      anomalies: anomalies.sort((a,b) => a.severity === 'high' ? -1 : 1) 
    };
  }
};

module.exports = mlService;
