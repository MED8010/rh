require('dotenv').config();
const { sendCongeNotificationEmail } = require('./backend/services/emailService');

async function testEmail() {
  const emailToTest = process.env.EMAIL_USER; // send it to themselves
  
  const testConge = {
    type: 'Annuel',
    date_debut: new Date('2026-04-01'),
    date_fin: new Date('2026-04-05'),
    nombre_jours: 5
  };

  console.log(`Test d'envoi d'email à ${emailToTest}...`);
  try {
    await sendCongeNotificationEmail(emailToTest, 'Employé de Test', 'approuve', testConge);
    console.log('Test terminé. Vérifiez la console pour les erreurs.');
  } catch (err) {
    console.error('Erreur globale du test:', err);
  }
}

testEmail();
