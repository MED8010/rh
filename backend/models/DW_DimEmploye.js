const mongoose = require('mongoose');

const dimEmployeSchema = new mongoose.Schema({
  employe_key: { type: String, required: true }, // mat_v1, mat_v2...
  original_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employe' },
  matricule: String,
  nom: String,
  prenom: String,
  service_nom: String,
  uap_nom: String,
  prix_heure: Number,
  genre: String, // 'M', 'F' (Simulé ou réel)
  tranche_age: String, // '20-30', '30-40', '40-50', '50+' (Simulé ou réel)
  anciennete_annees: Number, // Calculé à l'insertion
  valid_from: { type: Date, required: true },
  valid_to: { type: Date, default: null }, // Null if current
  is_current: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
});

// Index for SCD2 lookup
dimEmployeSchema.index({ original_id: 1, is_current: 1 });
dimEmployeSchema.index({ original_id: 1, valid_from: 1, valid_to: 1 });

module.exports = mongoose.model('DW_DimEmploye', dimEmployeSchema);
