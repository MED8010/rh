const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Envoyer un email de notification de congé
 * @param {string} to - adresse email du destinataire
 * @param {string} employeNom - nom complet de l'employé
 * @param {string} statut - 'approuve' ou 'refuse'
 * @param {object} conge - objet congé
 */
const sendCongeNotificationEmail = async (to, employeNom, statut, conge) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email non configuré - notification email ignorée');
    return;
  }

  try {
    const transporter = createTransporter();

    const isApproved = statut === 'approuve';
    const dateDebut = new Date(conge.date_debut).toLocaleDateString('fr-FR');
    const dateFin = new Date(conge.date_fin).toLocaleDateString('fr-FR');

    const subject = isApproved
      ? `✅ Votre demande de congé a été approuvée`
      : `❌ Votre demande de congé a été refusée`;

    const color = isApproved ? '#22c55e' : '#ef4444';
    const icon = isApproved ? '✅' : '❌';
    const statusText = isApproved ? 'APPROUVÉE' : 'REFUSÉE';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">${icon}</div>
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
        Demande de Congé ${statusText}
      </h1>
      <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Système RH — Notification automatique</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#334155;font-size:16px;margin:0 0 20px;">Bonjour <strong>${employeNom}</strong>,</p>
      <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
        ${isApproved
          ? `Nous avons le plaisir de vous informer que votre demande de congé a été <strong style="color:${color}">approuvée</strong> par l'administration.`
          : `Nous vous informons que votre demande de congé a été <strong style="color:${color}">refusée</strong> par l'administration.`
        }
      </p>

      <!-- Details Card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#1e293b;font-size:14px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.8px;">
          📋 Détails de la demande
        </h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Type de congé</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${conge.type || 'Annuel'}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Date de début</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${dateDebut}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Date de fin</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${dateFin}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Nombre de jours</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${conge.nombre_jours} jour${conge.nombre_jours > 1 ? 's' : ''}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Statut</td>
            <td style="padding:8px 0;border-top:1px solid #e2e8f0;">
              <span style="background:${color}22;color:${color};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">
                ${statusText}
              </span>
            </td>
          </tr>
          ${conge.commentaire_rejet ? `
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Motif du refus</td>
            <td style="padding:8px 0;color:#ef4444;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${conge.commentaire_rejet}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
        Cet email est envoyé automatiquement par le système RH. Merci de ne pas y répondre directement.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© 2025 Système de Gestion RH — Tous droits réservés</p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Système RH" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log(`📧 Email envoyé à ${to} (${statut})`);
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    // Ne pas bloquer l'application si l'email échoue
  }
};

module.exports = { sendCongeNotificationEmail };
