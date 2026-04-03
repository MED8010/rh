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
    console.log('⚠️  Email non configuré - notification email ignorée');
    return;
  }

  try {
    const transporter = createTransporter();

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
    
    <!-- Header -->
    <div style="background:${color};padding:30px 20px;text-align:center;color:#ffffff;">
      <div style="font-size:48px;margin-bottom:10px;">${icon}</div>
      <h1 style="margin:0;font-size:20px;font-weight:700;text-transform:uppercase;">${statusText}</h1>
      <p style="margin:5px 0 0;opacity:0.9;font-size:14px;">Gestion des Documents RH</p>
    </div>

    <!-- Content -->
    <div style="padding:30px 20px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 15px;">Bonjour <strong>${employeNom}</strong>,</p>
      
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">
        ${isProcessed 
          ? `Nous avons le plaisir de vous informer que votre demande pour le document <strong>"${typeLabel}"</strong> a été complétée.` 
          : `Nous vous informons que votre demande pour le document <strong>"${typeLabel}"</strong> n'a pas pu être satisfaite.`
        }
      </p>

      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:20px;">
        <h3 style="margin:0 0 10px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Résumé de la demande</h3>
        <table style="width:100%;font-size:14px;color:#1e293b;">
          <tr>
            <td style="padding:5px 0;color:#64748b;">Type:</td>
            <td style="padding:5px 0;font-weight:600;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Statut:</td>
            <td style="padding:5px 0;font-weight:600;color:${color}">${statusText}</td>
          </tr>
          ${demande.commentaire_admin ? `
          <tr>
            <td style="padding:5px 0;color:#64748b;">Commentaire:</td>
            <td style="padding:5px 0;font-style:italic;">"${demande.commentaire_admin}"</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${isProcessed ? `
      <div style="text-align:center;margin:30px 0;">
        <p style="font-size:13px;color:#64748b;margin-bottom:15px;">Vous pouvez dès à présent télécharger votre document sur votre espace employé.</p>
        <a href="http://localhost:3000/mes-documents" style="background:${color};color:#ffffff;padding:12px 25px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">Accéder à mes documents</a>
      </div>
      ` : ''}

      <p style="font-size:12px;color:#94a3b8;margin-top:20px;border-top:1px solid #f1f5f9;padding-top:10px;">
        Ceci est un message automatique, merci de ne pas y répondre. Pour toute question, contactez le service RH.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:15px;text-align:center;font-size:11px;color:#94a3b8;">
      Système de Gestion RH — MED8010
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

module.exports = { 
  sendCongeNotificationEmail,
  sendDocumentNotificationEmail
};
