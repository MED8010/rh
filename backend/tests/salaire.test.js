const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Salaire = require('../models/Salaire');
const Employe = require('../models/Employe');
const Pointage = require('../models/Pointage');
const Service = require('../models/Service');
const UAP = require('../models/UAP');
const { calculateSalaire } = require('../controllers/salaireController');

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

describe('Salaire Calculation Logic', () => {
  it('should calculate salary correctly with basic data', async () => {
    // 0. Create Service and UAP
    const service = await Service.create({ nom_service: 'RH' });
    const uap = await UAP.create({ nom_uap: 'UAP1' });

    // 1. Create an employee
    const employe = await Employe.create({
      nom: 'Test',
      prenom: 'User',
      matricule: 'T001',
      email: 'test@example.com',
      prix_heure: 10,
      solde_conge_total: 25,
      solde_conge_restant: 25,
      date_embauche: new Date(),
      service: service._id,
      uap: uap._id
    });

    // 2. Create pointages
    // 8 hours worked, no late
    await Pointage.create({
      employe: employe._id,
      date: new Date(2025, 0, 1),
      heure_entree: '08:00',
      heure_sortie: '16:00',
      heures_travaillees: 8,
      retard_minutes: 0
    });

    // 9 hours worked (1 hour overtime)
    await Pointage.create({
      employe: employe._id,
      date: new Date(2025, 0, 2),
      heure_entree: '08:00',
      heure_sortie: '17:00',
      heures_travaillees: 8,
      heures_supp: 1,
      retard_minutes: 0
    });

    // 8 hours worked, but 30 min late
    await Pointage.create({
      employe: employe._id,
      date: new Date(2025, 0, 3),
      heure_entree: '08:30',
      heure_sortie: '16:30',
      heures_travaillees: 8,
      retard_minutes: 30
    });

    const req = {
      body: {
        employe_id: employe._id.toString(),
        mois: 1,
        annee: 2025
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await calculateSalaire(req, res);

    expect(res.json).toHaveBeenCalled();
    const result = res.json.mock.calls[0][0].salaire;

    // Calculations:
    // heures_normales = 8 + 8 + 8 = 24
    // heures_supp = 1
    // retard_minutes = 30
    // prix_heure = 10
    // salaire_base = 24 * 10 = 240
    // heures_supp_amount = 1 * 10 * 1.5 = 15
    // retard_deductions = (30 / 60) * (10 * 0.1) = 0.5 * 1 = 0.5
    // salaire_brut = 240 + 15 = 255
    // salaire_net = 255 - 0.5 = 254.5

    expect(result.heures_normales).toBe(24);
    expect(result.heures_supp).toBe(1);
    expect(result.salaire_base).toBe(240);
    expect(result.retards_deductions).toBe(0.5);
    expect(result.salaire_brut).toBe(255);
    expect(result.salaire_net).toBe(254.5);
  });
});
