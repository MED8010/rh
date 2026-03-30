const DocumentType = require('../models/DocumentType');

// Get all document types
exports.getAllTypes = async (req, res) => {
  try {
    const types = await DocumentType.find().sort({ label: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new document type
exports.createType = async (req, res) => {
  const { name, label } = req.body;
  try {
    const newType = new DocumentType({ name, label });
    await newType.save();
    res.status(201).json(newType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a document type
exports.deleteType = async (req, res) => {
  try {
    await DocumentType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Type de document supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seed initial types if none exist
exports.seedTypes = async () => {
  try {
    const count = await DocumentType.countDocuments();
    if (count === 0) {
      const initialTypes = [
        { name: 'attestation_travail', label: 'Attestation de Travail' },
        { name: 'fiche_paie', label: 'Fiche de Paie' },
        { name: 'titre_conge', label: 'Titre de Congé' },
        { name: 'autre', label: 'Autre' }
      ];
      await DocumentType.insertMany(initialTypes);
      console.log('Document types seeded successfully');
    }
  } catch (err) {
    console.error('Error seeding document types:', err);
  }
};
