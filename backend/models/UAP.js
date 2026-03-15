const mongoose = require('mongoose');

const uapSchema = new mongoose.Schema({
  nom_uap: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UAP', uapSchema);
