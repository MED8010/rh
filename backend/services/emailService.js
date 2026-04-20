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

/**
 * Envoyer un email de notification pour une demande de document
 * @param {string} to - adresse email du destinataire
 * @param {string} employeNom - nom complet de l'employé
 * @param {string} statut - 'traite' ou 'rejete'
 * @param {object} demande - objet DocumentRequest
 */
const sendDocumentNotificationEmail = async (to, employeNom, statut, demande) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return;
  }

  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'https://rh-omega-rose.vercel.app';

    const isProcessed = statut === 'traite';
    const typeLabel = demande.type_document?.replace('_', ' ') || 'Document';

    const subject = isProcessed
      ? `✅ Votre document est disponible (${typeLabel})`
      : `❌ Votre demande de document a été rejetée`;

    const color = isProcessed ? '#10b981' : '#ef4444';
    const icon = isProcessed ? '📄' : '❌';
    const statusText = isProcessed ? 'TRAITÉE / DISPONIBLE' : 'REJETÉE';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:${color};padding:30px 20px;text-align:center;color:#ffffff;">
      <div style="font-size:48px;margin-bottom:10px;">${icon}</div>
      <h1 style="margin:0;font-size:20px;font-weight:700;text-transform:uppercase;">${statusText}</h1>
    </div>
    <div style="padding:30px 20px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 15px;">Bonjour <strong>${employeNom}</strong>,</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">
        ${isProcessed 
          ? `Nous avons le plaisir de vous informer que votre demande pour le document <strong>"${typeLabel}"</strong> a été complétée.` 
          : `Nous vous informons que votre demande pour le document <strong>"${typeLabel}"</strong> n'a pas pu être satisfaite.`
        }
      </p>
      ${isProcessed ? `
      <div style="text-align:center;margin:30px 0;">
        <a href="${frontendUrl}/mes-documents" style="background:${color};color:#ffffff;padding:12px 25px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">Accéder à mes documents</a>
      </div>
      ` : ''}
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
    console.log(`📧 Email envoyé à ${to} (Document: ${statut})`);
  } catch (error) {
    console.error('❌ Erreur envoi email document:', error.message);
  }
};

/**
 * Envoyer un email de notification aux administrateurs pour une nouvelle demande
 * @param {string} to - adresse email de l'admin
 * @param {string} employeNom - nom de l'employé demandeur
 * @param {string} typeDemande - 'conge' ou 'document'
 * @param {object} details - infos supp (type de doc, dates conge, etc)
 */
const sendAdminNewRequestEmail = async (to, employeNom, typeDemande, details) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return;
  }

  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'https://rh-omega-rose.vercel.app';
    
    const isConge = typeDemande === 'conge';
    const subject = isConge 
      ? `🔔 Nouvelle demande de congé de ${employeNom}`
      : `🔔 Nouvelle demande de document de ${employeNom}`;

    const infoLabel = isConge ? 'Dates' : 'Type de document';
    const infoValue = isConge 
      ? `Du ${new Date(details.date_debut).toLocaleDateString('fr-FR')} au ${new Date(details.date_fin).toLocaleDateString('fr-FR')}` 
      : (details.type_document || 'Non spécifié').replace('_', ' ');

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px;">
        <h2 style="color: #0366d6;">Une nouvelle demande nécessite votre attention</h2>
        <p><strong>Employé :</strong> ${employeNom}</p>
        <p><strong>Type de demande :</strong> ${typeDemande === 'conge' ? 'Congé' : 'Document'}</p>
        <p><strong>${infoLabel} :</strong> ${infoValue}</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${frontendUrl}/${isConge ? 'conges' : 'admin-documents'}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accéder au tableau de bord</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Système RH - Alertes" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📧 Alerte email envoyée à l'admin ${to}`);
  } catch (error) {
    console.error('❌ Erreur envoi email admin:', error.message);
  }
};

module.exports = { 
  sendCongeNotificationEmail,
  sendDocumentNotificationEmail,
  sendAdminNewRequestEmail
};
