const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Pointage = require('../models/Pointage');
const Employe = require('../models/Employe');
const Service = require('../models/Service');
const UAP = require('../models/UAP');
const { createPointage } = require('../controllers/pointageController');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Pointage Logic', () => {
  it('should calculate late minutes and worked hours correctly', async () => {
    const service = await Service.create({ nom_service: 'RH' });
    const uap = await UAP.create({ nom_uap: 'UAP1' });

    const employe = await Employe.create({
      nom: 'Test',
      prenom: 'User',
      matricule: 'T002',
      prix_heure: 10,
      date_embauche: new Date(),
      service: service._id,
      uap: uap._id
    });

    const req = {
      body: {
        employe_id: employe._id,
        date: '2025-01-01',
        heure_entree: '08:45',
        heure_sortie: '17:30'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createPointage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const pointage = res.json.mock.calls[0][0].pointage;

    // Expected:
    // Entry: 08:45, Expected: 08:00 -> 45 minutes late
    // Exit: 17:30. Duration: 08:45 to 17:30 -> 8 hours and 45 minutes.
    // worked_hours (capped at 8) -> 8
    // overtime -> 0.75

    expect(pointage.retard_minutes).toBe(45);
    expect(pointage.heures_travaillees).toBe(8);
    expect(pointage.heures_supp).toBe(0.75);
  });
});
