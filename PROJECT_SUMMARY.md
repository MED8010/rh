# 📋 Résumé du Projet — Application de Gestion des Ressources Humaines

---

## ✅ Ce qui a été créé

### Backend Express.js (Node.js)

#### Modèles de Données (16)
- ✅ **User.js** — Authentification, rôles, compte utilisateur
- ✅ **Employe.js** — Profil employé (matricule, solde congés, photo, etc.)
- ✅ **Service.js** — Services / Départements
- ✅ **UAP.js** — Unités Autonomes de Production
- ✅ **Pointage.js** — Suivi du temps de travail (manual + biométrique)
- ✅ **Conge.js** — Demandes et gestion des congés
- ✅ **Salaire.js** — Fiches de paie et calculs automatiques
- ✅ **Prime.js** — Primes et bonus (assujettis à PrimeType)
- ✅ **PrimeType.js** — Bibliothèque des types de primes (CRUD)
- ✅ **Discipline.js** — Données de discipline horaire
- ✅ **AuditLog.js** — Journal de traçabilité complet
- ✅ **Notification.js** — Notifications in-app (10 types)
- ✅ **DocumentRequest.js** — Demandes de documents administratifs
- ✅ **DocumentType.js** — Types de documents dynamiques (CRUD)
- ✅ **BiometricDevice.js** — Gestion des pointeuses ZKTeco
- ✅ **ZkLog.js** — Logs de synchronisation biométrique
- ✅ **StageRequest.js** — Demandes de stage

#### Controllers (12)
- ✅ **authController.js** — Inscription, connexion, profil
- ✅ **employeController.js** — CRUD employés, stats, import/export Excel
- ✅ **pointageController.js** — Pointages, analyses, Top 10 disciplinés
- ✅ **congeController.js** — Demandes, approbations, refus, emails
- ✅ **salaireController.js** — Calcul automatique, validation, analytics
- ✅ **primeController.js** — Gestion des types et attribution des primes employé
- ✅ **structureController.js** — Gestion services & UAPs
- ✅ **auditController.js** — Journal d'audit et statistiques
- ✅ **notificationController.js** — CRUD notifications, marquage lu/non-lu
- ✅ **documentController.js** — Demandes de documents + email notification
- ✅ **documentTypeController.js** — Types de documents dynamiques
- ✅ **stageController.js** — Gestion des stages
- ✅ **userController.js** — Gestion des comptes utilisateurs

#### Routes API (13 modules — 50+ endpoints)
- ✅ **authRoutes.js** — 3 endpoints
- ✅ **employeRoutes.js** — 8 endpoints (+ import/export)
- ✅ **pointageRoutes.js** — 6 endpoints (+ top-disciplined)
- ✅ **congeRoutes.js** — 5 endpoints
- ✅ **salaireRoutes.js** — 5 endpoints
- ✅ **structureRoutes.js** — 8 endpoints
- ✅ **auditRoutes.js** — 3 endpoints
- ✅ **notifications.js** — 4 endpoints
- ✅ **documentRoutes.js** — 4 endpoints
- ✅ **documentTypeRoutes.js** — 3 endpoints
- ✅ **zkRoutes.js** — 6 endpoints (biométrie)
- ✅ **primeRoutes.js** — 6 endpoints (types & attributions)
- ✅ **userRoutes.js** — 3 endpoints
- ✅ **stages.js** — 4 endpoints

#### Middlewares
- ✅ **auth.js** — Vérification JWT (Bearer Token)
- ✅ **roles.js** — Contrôle d'accès basé sur les rôles (RBAC)
- ✅ **audit.js** — Journalisation automatique de toutes les actions

#### Services
- ✅ **emailService.js** — Emails automatiques via Gmail SMTP (Nodemailer)
  - `sendCongeNotificationEmail` — Email congé approuvé/refusé
  - `sendDocumentNotificationEmail` — Email document traité/rejeté
- ✅ **zkService.js** — Synchronisation automatique des pointeuses ZKTeco (TCP/IP)
  - Polling toutes les 10 minutes
  - Calcul automatique retards + heures supp
  - Logs détaillés par appareil

---

### Frontend React (25 Pages)

#### Pages Publiques
- ✅ **Login.js** — Connexion avec redirection par rôle
- ✅ **Register.js** — Inscription avec création profil employé

#### Pages Admin
- ✅ **AdminDashboard.js** — 10 KPIs, graphique Pie présence, répartition géographique, Top 10 employés disciplinés, filtres avancés
- ✅ **EmployesPage.js** — CRUD complet, filtres, photo profil, import/export Excel, création compte
- ✅ **EmployeDetail.js** — Fiche employé avec onglets (infos, pointages, salaires, congés)
- ✅ **PointagesPage.js** — Tableau filtrable, ajout/modification manuelle, source biométrique
- ✅ **SalairesPage.js** — Calcul automatique, validation individuelle/en masse, fiches de paie
- ✅ **PrimesPage.js** — Gestion complète des primes et types de primes
- ✅ **SalaryAnalyticsDashboard.js** — Analytiques massa salariale, tendances, graphiques
- ✅ **AdminCongesPage.js** — KPIs cliquables (filtrage instantané), approbation/refus avec motif, dark mode compatible
- ✅ **AdminDocumentsPage.js** — Demandes de documents, filtres, upload fichiers, types dynamiques
- ✅ **AuditPage.js** — Journal d'audit complet filtrable
- ✅ **PointeusesPage.js** — Gestion pointeuses ZKTeco, statut, synchro manuelle, logs
- ✅ **TimeDisciplineDashboard.js** — Analyse discipline horaire, comparaisons
- ✅ **ConfigurationPage.js** — Paramètres système (services, UAPs, comptes, sécurité)
- ✅ **PrimesPage.js** — Gestion des types et attribution des primes (3 onglets)
- ✅ **SuperAdminDashboard.js** — Gestion globale super-admin

#### Pages Employé
- ✅ **EmployeeDashboard.js** — Stats personnelles, calendrier présence, solde congés
- ✅ **MesCongesPage.js** — Historique, nouvelle demande, solde restant
- ✅ **EmployeeDocumentsPage.js** — Mes demandes, nouvelle demande, téléchargement
- ✅ **ProfilePage.js** — Modification profil, photo, changement mot de passe

#### Pages Partagées
- ✅ **NotificationsPage.js** — 3 KPIs, filtre non-lues, navigation intelligente au clic
- ✅ **ChefServiceDashboard.js** — Tableau de bord chef de service
- ✅ **CongesChefPage.js** — Validation congés par le chef service
- ✅ **GestionCongesPage.js** — Vue gestion avancée des congés
- ✅ **CongesPage.js** — Vue liste des congés
- ✅ **StagePage.js** — Gestion des stages

#### Composants Réutilisables
- ✅ **Navigation.js** — Sidebar latérale adaptative selon le rôle
- ✅ **TopNavbar.js** — Barre supérieure (recherche admin uniquement, notifications, thème, profil)
- ✅ **ProtectedRoute.js** — Garde de routes avec vérification de rôle
- ✅ **AuthContext.js** — Contexte global d'authentification

---

## 📊 Statistiques du Projet

| Catégorie | Nombre | Détails |
|-----------|--------|---------|
| **Modèles de Données** | 17 | Avec relations, validations et index |
| **Controllers Backend** | 13 | Logique métier complète |
| **Fichiers de Routes** | 14 | ~60+ endpoints REST |
| **Pages Frontend** | 26 | Tous les workflows couverts |
| **Composants** | 3 | Navigation, TopNavbar, ProtectedRoute |
| **Rôles Utilisateurs** | 4 | super_admin, admin, chef_service, employe |
| **Types de Notifications** | 10 | In-app + email automatique |
| **Lignes CSS** | 2 330 | Système de design tokens complet |
| **Lignes de Code Total** | 15 000+ | Backend + Frontend combinés |

---

## 🎯 Fonctionnalités Implémentées

### Authentification & Sécurité
- ✅ Authentification JWT (configurable : 7j par défaut)
- ✅ Hachage des mots de passe (bcrypt, 10 rounds)
- ✅ RBAC — 4 niveaux de rôles
- ✅ Routes protégées côté client ET serveur
- ✅ Journalisation automatique de toutes les actions (audit)

### Gestion des Employés
- ✅ CRUD complet avec validation
- ✅ Upload photo de profil
- ✅ Affectation Service & UAP
- ✅ Import en masse via Excel (.xlsx)
- ✅ Export de la liste en Excel
- ✅ Création automatique du compte utilisateur
- ✅ Fiche détaillée avec 4 onglets

### Gestion du Temps (Pointages)
- ✅ Saisie manuelle entrée/sortie
- ✅ Synchronisation automatique ZKTeco (toutes les 10 min)
- ✅ Calcul automatique des retards (référence 08:00)
- ✅ Calcul des heures travaillées et heures supplémentaires
- ✅ Filtres avancés (service, UAP, date, période)
- ✅ Source traçée (manuelle ou biométrique)

### Gestion des Congés
- ✅ Demande multi-type (annuel, maladie, maternité, paternité, autre)
- ✅ Approbation/refus admin avec motif sélectionnable
- ✅ Déduction automatique du solde de congés
- ✅ Notification in-app + email automatique à l'employé
- ✅ KPIs cliquables pour filtrage instantané (mode dark compatible)
- ✅ Validation par chef de service

### Gestion de la Paie
- ✅ Calcul automatique mensuel
- ✅ Formule : (Heures normales × Prix/h) + (H.Supp × 1.5 × Prix/h) + Primes − Déductions
- ✅ Déductions absences, retards, disciplines
- ✅ Primes et bonus
- ✅ Validation individuelle et en masse
- ✅ Impression des bulletins de salaire
- ✅ Dashboard analytique salaires

### Gestion des Documents
- ✅ Demande de documents par l'employé
- ✅ Types de documents dynamiques (admin peut ajouter/supprimer)
- ✅ Upload et envoi de document par l'admin
- ✅ Notification in-app + email automatique (approuvé ou rejeté)
- ✅ Téléchargement côté employé
- ✅ Filtres avancés côté admin

### Tableau de Bord Admin
- ✅ 10 KPIs cliquables (employés, présence, retards, absences, masse salariale, heures sup, coût H.Supp, primes, salaire moyen)
- ✅ Graphique Pie — Répartition présence du jour
- ✅ Répartition géographique par ville
- ✅ **Top 10 Collaborateurs Disciplinés** (agrégation MongoDB)
- ✅ Filtres avancés (service, UAP, dates) synchronisés avec tous les indicateurs

### Système de Notifications
- ✅ 10 types d'événements
- ✅ Compteur temps réel dans la NavBar (polling 15 secondes)
- ✅ Navigation intelligente : clic → page concernée
- ✅ Marquage automatique comme lu au clic
- ✅ Filtrage non-lues uniquement

### Notifications Avancées 🔔
- ✅ **Notifications Push (Web Push)** : Alertes en temps réel via Service Worker (même onglet fermé)
- ✅ **Rappels Automatisés (Cron)** :
  - Rappel fin de congé (J-3)
  - Relance documents en attente (> 3 jours)
  - Alertes absences/retards matinales
- ✅ **Centre de Notifications** : Filtrage par catégories (RH, Paie, Pointage, Discipline, Système)
- ✅ **Gestion des Abonnements** : Inscription sécurisée par terminal/navigateur

### Emails Automatiques
- ✅ Congé approuvé/refusé → email à l'employé (template HTML premium)
- ✅ Document traité/rejeté → email à l'employé avec lien de téléchargement
- ✅ Configuration SMTP Gmail via `.env`
- ✅ Ne bloque pas l'application en cas d'erreur

### Gestion des Primes 💰
- ✅ Bibliothèque dynamique des types de primes (Performance, Risque, etc.)
- ✅ Attribution individuelle aux employés par mois/année
- ✅ Historique complet et annulation facile
- ✅ Intégration directe dans le calcul du salaire mensuel
- ✅ Contrôle des droits (Admin & Chef de Service)

### Biométrie (ZKTeco)
- ✅ Gestion multi-appareils
- ✅ Synchronisation automatique toutes les 10 minutes
- ✅ Activable/désactivable à la volée
- ✅ Logs détaillés par synchronisation
- ✅ Statut en temps réel des appareils

### UX / Design
- ✅ Mode sombre / Mode clair (bascule en temps réel)
- ✅ Sidebar responsive et rétractable
- ✅ Recherche globale d'employés (admin uniquement dans la TopBar)
- ✅ Animations CSS et micro-interactions
- ✅ Design tokens CSS complet (variables)
- ✅ Google Fonts — Inter
- ✅ Glassmorphism et dark mode sur tous les modals

---

## 🔧 Stack Technologique Complète

```
Backend (Node.js):
├── express 5.2.1         — Serveur HTTP / Routes
├── mongoose 9.2.3        — ODM MongoDB
├── jsonwebtoken 9.0.3    — Auth JWT
├── bcryptjs 3.0.3        — Hachage mots de passe
├── cors 2.8.6            — Cross-Origin Resource Sharing
├── dotenv 17.3.1         — Variables d'environnement
├── multer 2.1.1          — Upload de fichiers
├── nodemailer 8.0.3      — Emails SMTP
├── node-zklib 1.3.0      — Pointeuses ZKTeco
├── xlsx 0.18.5           — Import/Export Excel
└── nodemon               — Hot-reload développement

Frontend (React):
├── react 19.2.4          — Framework UI
├── react-dom 19.2.4      — Rendu DOM
├── react-router-dom 7.13.1 — Routing SPA
├── axios 1.13.5          — Client HTTP
├── chart.js 4.5.1        — Graphiques
├── react-chartjs-2 5.3.1 — Wrapper Chart.js
├── jspdf 2.5.1            — Génération PDF
├── jspdf-autotable 3.8.2  — Tableaux PDF documentés
├── web-push 3.6.6         — Notifications Push Navigateur [NEW]
├── node-cron 3.0.3        — Tâches planifiées (Rappels) [NEW]
├── bootstrap 5.3.8       — CSS complémentaire
├── @fullcalendar/react 6.1.20  — Calendrier
├── @fullcalendar/daygrid 6.1.20 — Vue grille
└── react-scripts 5.0.1   — Tooling CRA

Base de Données:
└── MongoDB Atlas (Cloud) — Via Mongoose ODM

Email:
└── Gmail SMTP — Port 587, TLS

Biométrie:
└── ZKTeco TCP/IP — Port 4370 (node-zklib)
```

---

## 📈 Formules de Calcul Implémentées

### Salaire Net
```
Salaire Net = (Heures Normales × Prix/h)
            + (Heures Supp × Prix/h × 1.5)
            + Primes
            − Déductions (absences + retards + disciplines)

Absences    = Jours absents × 8h × Prix/h
Retards     = (Minutes retard / 60) × (Prix/h × 0.1)
```

### Détection Retards
```
Retard (min) = Max(0, Heure_Entrée − 08:00)
```

### Heures Supplémentaires
```
Si Heures_Travaillées > 8 :
  H.Supp = Heures_Travaillées − 8
  H.Normales = 8
Sinon :
  H.Supp = 0
```

### Score de Discipline (Top 10)
```
Score = Agrégation MongoDB / Employé :
  - SUM(absence) → total absences
  - SUM(retard_minutes) → total minutes de retard
Tri croissant : moins d'absences → moins de retards
```

---

## 🔐 Comptes de Test

```
Super Admin:
  Email: superadmin@rh.app
  Password: SuperAdmin123!

Admin:
  Email: admin@rh.app
  Password: admin123456

Employé:
  Email: employe@rh.app
  Password: emp123456
```

---

## 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances backend
cd med-master
npm install

# 2. Installer les dépendances frontend
cd frontend
npm install

# 3. Configurer le .env (à la racine)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
PORT=5000
EMAIL_USER=votre@gmail.com
EMAIL_PASS=votre_app_password

# 4. Démarrer (à la racine - concurrently)
npm start

# Accès
Frontend: http://localhost:3000
Backend:  http://localhost:5000/api/health
```

---

## 🌐 RBAC — Rôles et Accès

| Rôle | Pages accessibles |
|------|-------------------|
| **super_admin** | Tout + gestion des comptes globaux |
| **admin** | Dashboard, Employés, Pointages, Salaires, Congés, Documents, Audit, Pointeuses, Config |
| **chef_service** | ChefDashboard, Congés équipe, Notifications |
| **employe** | EmployeeDashboard, Mes Congés, Mes Documents, Profil, Notifications |

---

## 📝 Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | URI de connexion MongoDB Atlas |
| `JWT_SECRET` | Clé secrète JWT |
| `JWT_EXPIRE` | Durée du token (ex: `7d`, `1h`) |
| `BCRYPT_ROUNDS` | Rounds de hachage (défaut: 10) |
| `PORT` | Port backend (défaut: 5000) |
| `NODE_ENV` | Environnement (`development` / `production`) |
| `EMAIL_HOST` | Serveur SMTP (`smtp.gmail.com`) |
| `EMAIL_PORT` | Port SMTP (`587`) |
| `EMAIL_USER` | Adresse email expéditeur |
| `EMAIL_PASS` | Mot de passe d'application Gmail |

---

## 🔄 Workflows Complets

1. **Admin → Gestion Employé**
   Créer employé → Affecter service/UAP → Définir prix/h → Créer compte → Photo de profil

2. **Biométrie → Pointage automatique**
   Pointeuse ZKTeco → Synchro TCP/IP (10 min) → Calcul retard + H.Supp → Enregistrement Pointage

3. **Employé → Demande Congé**
   Demander → Admin reçoit notification in-app → Approuver/Refuser → Employé reçoit email + notification

4. **Employé → Demande Document**
   Demander → Admin reçoit notification → Uploader fichier → Employé reçoit email + peut télécharger

5. **Admin → Paie Mensuelle**
   Sélectionner période → Calculer tous salaires → Valider → Notification + fiche imprimable

---

## 🎉 Conclusion

Application RH **complète et entièrement fonctionnelle** couvrant l'ensemble des besoins d'une entreprise industrielle :

- ✅ Gestion des employés avec import/export Excel
- ✅ Suivi temps réel des pointages (manuel + biométrique ZKTeco)
- ✅ Calcul automatique des salaires avec analytics avancées
- ✅ Gestion complète des congés avec emails automatiques
- ✅ Gestion des documents administratifs avec notifications email
- ✅ Top 10 collaborateurs les plus disciplinés
- ✅ Système de notifications in-app temps réel + navigation intelligente
- ✅ Journal d'audit complet et traçabilité
- ✅ Interface moderne, responsive, mode sombre/clair
- ✅ Architecture MVC scalable et maintenable

---

Créé le : 19 Février 2026  
Mis à jour le : 03 Avril 2026  
Version : 2.3.0 (Notifications Push & Cron incl.)
Statut : ✅ Complète et Fonctionnelle  
