const mongoose = require('mongoose');

const factSalarySchema = new mongoose.Schema({
  month_year_key: { type: Number, required: true }, // FK (YYYYMM)
  employe_key: { type: mongoose.Schema.Types.ObjectId, ref: 'DW_DimEmploye', required: true },
  original_salaire_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Salaire' },
  
  // Dimensions IDs for direct grouping
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  uap_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UAP' },
  
  // Measures
  base_salary: { type: Number, default: 0 },
  prime_total: { type: Number, default: 0 },
  deductions_total: { type: Number, default: 0 },
  net_payable: { type: Number, default: 0 },
  cost_per_hour: { type: Number, default: 0 }, // net_payable / worked_hours
  
  // Status tracking
  statut: String,
  is_validated: Boolean
});

factSalarySchema.index({ month_year_key: 1, employe_key: 1 });
factSalarySchema.index({ service_id: 1, month_year_key: 1 });

module.exports = mongoose.model('DW_FactSalary', factSalarySchema);
