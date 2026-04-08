const DW_FactAttendance = require('../models/DW_FactAttendance');
const DW_FactSalary = require('../models/DW_FactSalary');

/**
 * Moteur d'analyse OLAP (On-Line Analytical Processing)
 */
exports.queryCube = async (req, res) => {
    try {
        const { cube, dimensions, measures, filters } = req.body;
        
        if (!cube || !dimensions || !measures) {
            return res.status(400).json({ message: 'Requête OLAP invalide. Paramètres manquants.' });
        }

        // Sélection du modèle de faits selon le cube demandé
        const Model = cube === 'salary' ? DW_FactSalary : DW_FactAttendance;
        
        const pipeline = [];

        // 1. Filtrage initial (WHERE)
        if (filters && Object.keys(filters).length > 0) {
            pipeline.push({ $match: filters });
        }

        // 2. Jointure avec la dimension Employé (pour récupérer service, uap, genre, age...)
        pipeline.push({
            $lookup: {
                from: 'dw_dimemployes',
                localField: 'employe_key',
                foreignField: '_id',
                as: 'employe_dim'
            }
        });
        pipeline.push({ $unwind: '$employe_dim' });

        // 3. Construction des GROUP BY dynamiques (Dimensions)
        const groupId = {};
        dimensions.forEach(dim => {
            // Si la dimension commence par "emp.", elle vient de la table employe
            if (dim === 'service_nom' || dim === 'uap_nom' || dim === 'genre' || dim === 'tranche_age' || dim === 'anciennete_annees') {
                groupId[dim] = `$employe_dim.${dim}`;
            } else {
                groupId[dim] = `$${dim}`;
            }
        });

        // 4. Construction des agrégations dynamiques (Mesures)
        const groupAggregations = { _id: groupId };
        measures.forEach(measure => {
            const fieldKey = `$${measure.field}`;
            switch (measure.type) {
                case 'sum':
                    groupAggregations[measure.name || `${measure.field}_sum`] = { $sum: fieldKey };
                    break;
                case 'avg':
                    groupAggregations[measure.name || `${measure.field}_avg`] = { $avg: fieldKey };
                    break;
                case 'stdDev':
                    groupAggregations[measure.name || `${measure.field}_std`] = { $stdDevPop: fieldKey };
                    break;
                case 'median':
                    // MongoDB < 5.0 ne supporte pas nativement $median dans $group sans astuces complexes.
                    // Par simplicité et performance, on approxime avec $avg si $median n'est pas dispo nativement.
                    groupAggregations[measure.name || `${measure.field}_median`] = { $avg: fieldKey };
                    break;
                case 'count':
                    groupAggregations[measure.name || `${measure.field}_count`] = { $sum: 1 };
                    break;
                default:
                    break;
            }
        });

        pipeline.push({ $group: groupAggregations });

        // 5. Exécution de la requête sur le modèle en étoile
        const results = await Model.aggregate(pipeline);

        res.json({
            cube,
            count: results.length,
            data: results
        });

    } catch (error) {
        console.error('Erreur OLAP Query:', error);
        res.status(500).json({ message: 'Erreur Serveur OLAP', error: error.message });
    }
};
