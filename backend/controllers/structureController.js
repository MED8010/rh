const Service = require('../models/Service');
const UAP = require('../models/UAP');

// Services
const createService = async (req, res) => {
  try {
    const { nom_service, description } = req.body;
    const service = new Service({ nom_service, description });
    await service.save();
    res.status(201).json({ message: 'Service créé avec succès', service });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du service', error: error.message });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des services', error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { nom_service, description } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { nom_service, description },
      { new: true }
    );
    res.json({ message: 'Service mis à jour avec succès', service });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du service', error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du service', error: error.message });
  }
};

// UAP
const createUAP = async (req, res) => {
  try {
    const { nom_uap, description } = req.body;
    const uap = new UAP({ nom_uap, description });
    await uap.save();
    res.status(201).json({ message: 'UAP créée avec succès', uap });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'UAP', error: error.message });
  }
};

const getUAPs = async (req, res) => {
  try {
    const uaps = await UAP.find();
    res.json(uaps);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des UAP', error: error.message });
  }
};

const updateUAP = async (req, res) => {
  try {
    const { nom_uap, description } = req.body;
    const uap = await UAP.findByIdAndUpdate(
      req.params.id,
      { nom_uap, description },
      { new: true }
    );
    res.json({ message: 'UAP mise à jour avec succès', uap });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'UAP', error: error.message });
  }
};

const deleteUAP = async (req, res) => {
  try {
    await UAP.findByIdAndDelete(req.params.id);
    res.json({ message: 'UAP supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'UAP', error: error.message });
  }
};

module.exports = { createService, getServices, updateService, deleteService, createUAP, getUAPs, updateUAP, deleteUAP };
