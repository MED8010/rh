const mongoose = require('mongoose');

const dimDateSchema = new mongoose.Schema({
  date_key: { type: Number, required: true, unique: true }, // YYYYMMDD
  full_date: { type: Date, required: true },
  day_of_week: Number, // 0-6
  day_name: String,
  day_of_month: Number,
  month: Number,
  month_name: String,
  quarter: Number,
  year: Number,
  is_weekend: Boolean,
  is_holiday: { type: Boolean, default: false },
  holiday_name: String
});

module.exports = mongoose.model('DW_DimDate', dimDateSchema);
