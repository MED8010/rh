const DW_FactAttendance = require('../models/DW_FactAttendance');
const DW_FactSalary = require('../models/DW_FactSalary');
const DW_DimEmploye = require('../models/DW_DimEmploye');
const Conge = require('../models/Conge');
const ss = require('simple-statistics');

exports.getHeatmapConges = async (req, res) => {
    try {
        // Obtenir l'absentéisme global par service et par mois
        const heatmapData = await DW_FactAttendance.aggregate([
            { $match: { is_absent: true } },
            { $lookup: { from: 'dw_dimemployes', localField: 'employe_key', foreignField: '_id', as: 'emp' } },
            { $unwind: '$emp' },
            { $group: {
                _id: { 
                    service: "$emp.service_nom", 
                    month: { $substr: ["$date_key", 4, 2] } // Récupère le mois MM de YYYYMMDD
                },
                absences: { $sum: 1 }
            }}
        ]);

        // Formater pour ApexCharts Heatmap
        // series: [{ name: 'Service A', data: [{ x: '01', y: 5 }, ...] }]
        const seriesMap = {};
        heatmapData.forEach(item => {
            const service = item._id.service || 'Inconnu';
            const month = item._id.month;
            if (!seriesMap[service]) seriesMap[service] = [];
            seriesMap[service].push({ x: month, y: item.absences });
        });

        const series = Object.keys(seriesMap).map(service => ({
            name: service,
            data: seriesMap[service].sort((a,b) => a.x.localeCompare(b.x))
        }));

        res.json(series);
    } catch (error) {
        res.status(500).json({ message: 'Erreur Heatmap', error: error.message });
    }
};

exports.getTreemapSalaire = async (req, res) => {
    try {
        // Masse salariale répartie par Service, puis par Employé
        const treemapData = await DW_FactSalary.aggregate([
            { $sort: { month_year_key: -1 } },
            { $limit: 100 }, // Les derniers salaires (représentatif complet du mois M)
            { $lookup: { from: 'dw_dimemployes', localField: 'employe_key', foreignField: '_id', as: 'emp' } },
            { $unwind: '$emp' },
            { $group: {
                _id: { service: "$emp.service_nom", employe: { nom: "$emp.nom", prenom: "$emp.prenom" } },
                valeur: { $sum: "$net_payable" }
            }}
        ]);

        const seriesMap = {};
        treemapData.forEach(item => {
            const service = item._id.service || 'Inconnu';
            if (!seriesMap[service]) seriesMap[service] = []; // Chaque service = une série
            
            seriesMap[service].push({
                x: `${item._id.employe.prenom} ${item._id.employe.nom}`,
                y: parseInt(item.valeur)
            });
        });

        const series = Object.keys(seriesMap).map(service => ({
            name: service,
            data: seriesMap[service]
        }));

        res.json(series);
    } catch (error) {
        res.status(500).json({ message: 'Erreur Treemap', error: error.message });
    }
};

exports.getGanttConges = async (req, res) => {
    try {
        // On récupère les congés approuvés récents ou futurs
        const conges = await Conge.find({ 
            statut: 'approuve', 
            date_debut: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }).populate('employe').limit(50);

        // Format ApexCharts rangeBar (Gantt)
        const series = [{
            name: 'Période de Congé',
            data: conges.filter(c => c.employe).map(c => ({
                x: `${c.employe.prenom} ${c.employe.nom}`,
                y: [new Date(c.date_debut).getTime(), new Date(c.date_fin).getTime()],
                fillColor: c.type === 'maladie' ? '#ef4444' : '#3b82f6'
            }))
        }];

        res.json(series);
    } catch (error) {
        res.status(500).json({ message: 'Erreur Gantt', error: error.message });
    }
};

exports.getRadarProfile = async (req, res) => {
    try {
        // Radar pour la santé moyenne de l'entreprise par service
        // Axes: Assiduité (100 - Absences), Ponctualité (100 - Retards réguliers), Rétention (Ancienneté)
        // C'est un exercice de normalisation de l'échelle à 100
        
        const stats = await DW_DimEmploye.aggregate([
            { $match: { is_current: true } },
            { $lookup: { 
                from: 'dw_factattendances', 
                localField: '_id', 
                foreignField: 'employe_key', 
                as: 'atts' 
            }},
            { $unwind: { path: '$atts', preserveNullAndEmptyArrays: true } },
            { $group: {
                _id: "$service_nom",
                avg_anciennete: { $avg: "$anciennete_annees" },
                total_lates: { $sum: "$atts.late_minutes" },
                total_abs: { $sum: { $cond: ["$atts.is_absent", 1, 0] } },
                emp_count: { $addToSet: "$matricule" } // Nombre d'employés unique
            }}
        ]);

        const labels = ['Assiduité', 'Ponctualité', 'Stabilité (Rétention)', 'Productivité Nette'];
        
        const series = stats.map(s => {
            if (!s._id) return null;
            const empTotal = s.emp_count.length || 1;
            
            // Normalisation arbitraire sur 100 pour donner un beau visuel Radar
            const assiduite = Math.max(0, 100 - ((s.total_abs / empTotal) * 1.5));
            const ponctualite = Math.max(0, 100 - ((s.total_lates / empTotal) * 0.1));
            const stabilite = Math.min(100, s.avg_anciennete * 10); // ex: 10 ans = 100%
            const productivite = Math.min(100, Math.max(0, (assiduite * 0.7) + (ponctualite * 0.3)));

            return {
                name: s._id,
                data: [Math.round(assiduite), Math.round(ponctualite), Math.round(stabilite), Math.round(productivite)]
            };
        }).filter(a => a);

        res.json({ labels, series: series.slice(0, 4) }); // On limite à 4 services pour la lisibilité
    } catch (error) {
        res.status(500).json({ message: 'Erreur Radar', error: error.message });
    }
};

exports.getTrendRetards = async (req, res) => {
    try {
        // Courbe moyenne des retards quotidiens sur les 30 derniers jours avec intervalle de confiance
        const trends = await DW_FactAttendance.aggregate([
            { $group: { _id: "$date_key", avg_late: { $avg: "$late_minutes" }, std_late: { $stdDevPop: "$late_minutes" } } },
            { $sort: { _id: 1 } },
            { $limit: 30 } // Les 30 derniers jours enregistrés
        ]);

        // Séries: Moyenne et Écart (+/ -)
        const lineData = [];
        const confidenceMax = [];
        const confidenceMin = [];

        trends.forEach(t => {
            const date = `${t._id.toString().substring(6, 8)}/${t._id.toString().substring(4, 6)}`;
            const mean = t.avg_late || 0;
            const std = t.std_late || 0;

            lineData.push({ x: date, y: parseFloat(mean.toFixed(1)) });
            // Zone de confiance (Standard Deviation +/- 1, soit environ 68% de confiance stat)
            // Apexcharts accepte une range comme ça si configuré en rangeBar ou mixed, 
            // mais on fera 3 courbes pour du mixed chart facile (Ligne Principale, Ligne Haute Ombree, Ligne Basse)
            confidenceMax.push({ x: date, y: parseFloat((mean + std).toFixed(1)) });
            confidenceMin.push({ x: date, y: Math.max(0, parseFloat((mean - std).toFixed(1))) });
        });

        res.json([
            { name: 'Retard Moyen (min)', type: 'line', data: lineData },
            { name: 'Limite Haute (Normalité)', type: 'area', data: confidenceMax },
            { name: 'Limite Basse', type: 'area', data: confidenceMin }
        ]);

    } catch (error) {
        res.status(500).json({ message: 'Erreur Tendances', error: error.message });
    }
};
