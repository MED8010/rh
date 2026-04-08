const mlService = require('../services/mlService');

/**
 * ML Controller
 * Endpoint pour les prédictions et analyses IA
 */

exports.getPayrollForecast = async (req, res) => {
    try {
        const result = await mlService.forecastPayroll();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erreur ML Forecast', error: error.message });
    }
};

exports.getAbsenteeismForecast = async (req, res) => {
    try {
        const result = await mlService.forecastAbsenteeism();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erreur ML Analysis', error: error.message });
    }
};

exports.getTurnoverRisk = async (req, res) => {
    try {
        const result = await mlService.calculateTurnoverRisk();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erreur ML Scoring', error: error.message });
    }
};

exports.getAnomalies = async (req, res) => {
    try {
        const result = await mlService.detectAnomalies();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erreur ML Profiling', error: error.message });
    }
};
