const { Parser } = require('json2csv');
const DW_FactSalary = require('../models/DW_FactSalary');
const DW_FactAttendance = require('../models/DW_FactAttendance');
const DW_DimEmploye = require('../models/DW_DimEmploye');

exports.exportSalaryTrendsJSON = async (req, res) => {
    try {
        // Obtenir la donnée plate (Flat) idéale pour PowerBI / Tableau
        const data = await DW_FactSalary.aggregate([
            { $lookup: { from: 'dw_dimemployes', localField: 'employe_key', foreignField: '_id', as: 'emp' } },
            { $unwind: '$emp' },
            { $project: {
                _id: 0,
                Mois: "$month_year_key",
                Matricule: "$emp.matricule",
                Prenom: "$emp.prenom",
                Nom: "$emp.nom",
                Service: "$emp.service_nom",
                Age: "$emp.tranche_age",
                Genre: "$emp.genre",
                Anciennete: "$emp.anciennete_annees",
                SalaireBase: "$base_salary",
                HeuresSupAmnt: "$overtime_amount",
                PrimesTotales: "$prime_total",
                SalaireNetPayer: "$net_payable"
            }}
        ]);

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'export JSON", msg: error.message });
    }
};

exports.exportAttendanceCSV = async (req, res) => {
    try {
        // Exporter 100% des pointages pour "Looker Studio" sous forme CSV
        const data = await DW_FactAttendance.aggregate([
            { $lookup: { from: 'dw_dimemployes', localField: 'employe_key', foreignField: '_id', as: 'emp' } },
            { $unwind: '$emp' },
            { $project: {
                _id: 0,
                Date: "$date_key",
                Matricule: "$emp.matricule",
                Prenom: "$emp.prenom",
                Nom: "$emp.nom",
                Service: "$emp.service_nom",
                Genre: "$emp.genre",
                MinutesRetard: "$late_minutes",
                MinutesHeuresSup: "$overtime_minutes",
                EstAbsent: { $cond: ["$is_absent", "Oui", "Non"] },
                ScoreProductivite: "$productivity_score"
            }}
        ]);

        if (!data || data.length === 0) {
            return res.status(200).send("No data");
        }

        // json2csv
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment('hr_attendance_export.csv');
        return res.send(csv);

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'export CSV", msg: error.message });
    }
};
