import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Service pour la génération de rapports PDF professionnels.
 */
class PDFService {
  /**
   * Génère l'en-tête standard du document.
   */
  _addHeader(doc, title, period = '') {
    const pageWidth = doc.internal.pageSize.width;
    
    // Logo / Nom de l'entreprise
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241); // Couleur Indigo
    doc.text('RH Application', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('123 Rue de l\'Entreprise, 75000 Paris', 14, 28);
    
    // Titre du document
    doc.setFontSize(18);
    doc.setTextColor(30);
    doc.text(title.toUpperCase(), pageWidth / 2, 45, { align: 'center' });
    
    if (period) {
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Période : ${period}`, pageWidth / 2, 52, { align: 'center' });
    }
    
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 14, 20, { align: 'right' });
    
    // Ligne de séparation
    doc.setDrawColor(200);
    doc.line(14, 60, pageWidth - 14, 60);
  }

  /**
   * Génère le pied de page avec numérotation.
   */
  _addFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} sur ${pageCount} - RH Application - Document confidentiel`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  /**
   * Export des SALAIRES.
   */
  exportSalairesReport(salaires, moisLabel, annee) {
    const doc = new jsPDF('landscape');
    this._addHeader(doc, 'Rapport des Salaires Mensuels', `${moisLabel} ${annee}`);
    
    const tableData = salaires.map(s => [
      s.employe?.matricule || 'N/A',
      `${s.employe?.prenom} ${s.employe?.nom}`,
      s.employe?.service?.nom_service || 'N/A',
      `${s.heures_normales}h`,
      `${s.heures_supp}h`,
      `${s.salaire_brut.toFixed(2)} DT`,
      `${s.deductions.toFixed(2)} DT`,
      `${s.salaire_net.toFixed(2)} DT`,
      s.statut.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Matricule', 'Employé', 'Service', 'H. Norm', 'H. Supp', 'Salaire Brut', 'Déductions', 'Net à Payer', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        5: { fontStyle: 'bold' },
        7: { fontStyle: 'bold', textColor: [22, 163, 74] }
      }
    });

    this._addFooter(doc);
    doc.save(`Rapport_Salaires_${moisLabel}_${annee}.pdf`);
  }

  /**
   * Export des POINTAGES (Retards/Absences).
   */
  exportPointagesReport(data, type, dateStr) {
    const doc = new jsPDF();
    const title = type === 'retards' ? 'Rapport Quotitien des Retards' : 'Rapport Quotitien des Absences';
    this._addHeader(doc, title, dateStr);

    const head = type === 'retards' 
      ? [['Employé', 'Matricule', 'Service', 'Heure Entrée', 'Retard (min)']]
      : [['Employé', 'Matricule', 'Service', 'Motif Absence']];

    const body = type === 'retards'
      ? data.map(r => [`${r.employe?.prenom} ${r.employe?.nom}`, r.employe?.matricule, r.employe?.service?.nom_service || '-', r.heure_entree, `+${r.retard_minutes}`])
      : data.map(a => [`${a.employe?.prenom} ${a.employe?.nom}`, a.employe?.matricule, a.employe?.service?.nom_service || '-', a.motif_absence || 'N/A']);

    autoTable(doc, {
      startY: 65,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: type === 'retards' ? [245, 158, 11] : [220, 38, 38] }
    });

    this._addFooter(doc);
    doc.save(`Rapport_${type}_${dateStr}.pdf`);
  }

  /**
   * Génération du BILAN MENSUEL GLOBAL.
   */
  generateMonthlyBilan(stats) {
    const doc = new jsPDF();
    this._addHeader(doc, 'Bilan Récapitulatif Mensuel', `${stats.moisLabel} ${stats.annee}`);

    // Section Statistiques Financières
    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.text('1. RÉSUMÉ FINANCIER', 14, 75);
    
    autoTable(doc, {
      startY: 80,
      body: [
        ['Masse Salariale Brute', `${stats.masseBrute.toFixed(2)} DT`],
        ['Total des Déductions', `${stats.totalDeductions.toFixed(2)} DT`],
        ['Total Net à Payer', `${stats.masseNette.toFixed(2)} DT`],
        ['Nombre de Fiches Traitées', stats.nombreFiches]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
    });

    // Section Présence & Discipline
    doc.setFontSize(14);
    doc.text('2. PRÉSENCE & DISCIPLINE', 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 125);
    
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 130,
      body: [
        ['Total des Heures Supplémentaires', `${stats.totalHSupp} h`],
        ['Cumul des Retards (Minutes)', `${stats.totalRetards} min`],
        ['Total des Absences Signalées', `${stats.totalAbsences} jours`]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 5 }
    });

    // Section Congés
    doc.setFontSize(14);
    doc.text('3. MOUVEMENTS RH', 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 185);
    
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 190,
      body: [
        ['Demandes de Congés Approuvées', stats.congesApprouves],
        ['Nouveaux Employés Embauchés', stats.nouveauxEmployes]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 5 }
    });

    this._addFooter(doc);
    doc.save(`Bilan_Mensuel_${stats.moisLabel}_${stats.annee}.pdf`);
  }

  /**
   * Export des CONGÉS.
   */
  exportCongesReport(conges, title = 'Rapport des Congés') {
    const doc = new jsPDF('landscape');
    this._addHeader(doc, title);

    const tableData = conges.map(c => [
      `${c.employe?.prenom} ${c.employe?.nom}`,
      c.employe?.matricule || '-',
      c.type_conge || '-',
      new Date(c.date_debut).toLocaleDateString(),
      new Date(c.date_fin).toLocaleDateString(),
      c.jours_pris || '-',
      c.statut.toUpperCase(),
      c.motif_refus || '-'
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Employé', 'Matricule', 'Type', 'Début', 'Fin', 'Jours', 'Statut', 'Note/Motif']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }
    });

    this._addFooter(doc);
    doc.save(`Rapport_Conges_${new Date().toLocaleDateString()}.pdf`);
  }
}

const pdfService = new PDFService();
export default pdfService;
