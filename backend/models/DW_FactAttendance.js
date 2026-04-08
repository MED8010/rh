const mongoose = require('mongoose');

const factAttendanceSchema = new mongoose.Schema({
  date_key: { type: Number, required: true }, // FK DimDate (YYYYMMDD)
  employe_key: { type: mongoose.Schema.Types.ObjectId, ref: 'DW_DimEmploye', required: true }, // FK DimEmploye (Current version at that time)
  original_pointage_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pointage' },
  
  // Dimensions IDs for direct grouping
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  uap_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UAP' },
  
  // Measures
  worked_hours: { type: Number, default: 0 },
  overtime_hours: { type: Number, default: 0 },
  late_minutes: { type: Number, default: 0 },
  is_absent: { type: Boolean, default: false },
  
  // Calculated fact attribute
  productivity_score: { type: Number } // Example: worked_hours / standard_hours
});

factAttendanceSchema.index({ date_key: 1, employe_key: 1 });
factAttendanceSchema.index({ service_id: 1, date_key: 1 });

module.exports = mongoose.model('DW_FactAttendance', factAttendanceSchema);
