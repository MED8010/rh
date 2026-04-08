# 🚀 Application RH 4.0 - Intelligence Artificielle & BI

Une plateforme RH de pointe intégrant l'Intelligence Artificielle, le Big Data et la Biométrie pour une gestion optimale des talents, du temps et de la performance.

## ✨ Fonctionnalités Majeures

### 💻 Pour l'Administration
- 📊 **Tableau de Bord Stratégique** : 10 KPIs dynamiques, répartition géographique et analyse de discipline.
- 🤖 **Intelligence Prédictive (IA)** : Prévision budgétaire à 12 mois, scoring du risque de turnover, détection d'anomalies.
- 🧩 **Explorateur OLAP** : Analyse multidimensionnelle interactive (Drag & Drop) sur les axes Genre, Âge, Ancienneté.
- 📈 **Dataviz Avancée** : Heatmaps de présence, Treemaps financiers, Radar de performance services, Gantt des congés.
- 🕒 **Biométrie Intégrée** : Synchronisation automatique avec les pointeuses ZKTeco via TCP/IP.
- 💰 **Gestion de la Paie** : Calcul automatique complexe, primes dynamiques et impression de bulletins PDF.
- 📄 **Gestion Documentaire** : Workflow complet de demande et traitement de documents administratifs.
- 🔗 **Connecteurs BI** : Export CSV live pour Google Looker Studio et API JSON pour PowerBI/Tableau.

### 👤 Pour les Employés
- 📱 **Dashboard Personnel** : Visualisation des stats de présence, calendrier et solde de congés.
- 📧 **Notifications Intelligentes** : Alertes in-app temps réel et emails automatiques (Nodemailer).
- 📅 **Gestion des Absences** : Demandes de congés multi-types avec suivi de validation en temps réel.
- 📁 **Espace Documentaire** : Téléchargement sécurisé des documents traités (Attestations, fiches de paie).

## 🛠️ Stack Technique

- **Backend**: Node.js (Express 5), Mongoose (Aggregation Pipeline, SCD Type 2)
- **Intelligence**: Simple-Statistics (Régression linéaire, Z-Score)
- **Database**: MongoDB (Structure Data Warehouse + Operational DB)
- **Frontend**: React 19, ApexCharts (Interactivité premium), Bootstrap 5
- **Communication**: JWT, Nodemailer (Gmail SMTP), Web-Push
- **IoT / Biométrie**: node-zklib (ZKTeco Protocol)

## 🚀 Installation & Démarrage

### Setup Rapide (Root)
```bash
# Installer les dépendances globales
npm install

# Setup variables d'environnement (.env)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_key
PORT=5000
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
```

### Lancement par Concurrently
```bash
# Démarre Backend + Frontend simultanément
npm start
```

## 📊 Architecture API

- `GET /api/ml/forecast/payroll` - Prédictions budgétaires
- `GET /api/ml/risk/turnover` - Analyse risque départs
- `GET /api/dataviz/heatmap` - Données de densité de présence
- `GET /api/bi-export/csv/attendance` - Connecteur Looker Studio
- `POST /api/zk/sync` - Déclenchement synchro biométrique

## 📈 Développement & Maintenance

Le projet est maintenant en **Version 4.0.0**. 
Tous les modules critiques (Paie, Temps, IA, BI) sont validés et fonctionnels.

---
© 2026 - Système RH Analytique Avancé
