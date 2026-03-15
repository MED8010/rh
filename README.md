# Application RH - Temps, Discipline & Paie

Une application web complète pour la gestion des ressources humaines, du temps de travail, des congés et de la paie.

## Fonctionnalités

### Pour l'Admin
- ✅ Dashboard avec KPI et statistiques
- ✅ Gestion complète des employés
- ✅ Suivi des pointages et retards
- ✅ Gestion des congés (approbation/refus)
- ✅ Calcul automatique des salaires
- ✅ Journal d'audit
- ✅ Gestion des services et UAP

### Pour les Employés
- ✅ Dashboard personnel
- ✅ Consultation des pointages
- ✅ Demande de congés
- ✅ Consultation des salaires
- ✅ Suivi du solde de congés

## Stack Technique

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Frontend**: React.js, Bootstrap
- **Authentication**: JWT avec bcrypt
- **Charting**: Chart.js

## Installation

### Prérequis
- Node.js v18+
- MongoDB en cours d'exécution (locale ou cloud)

### Setup Backend

```bash
cd c:\Users\dellhp\Desktop\pfe

# Installer les dépendances (déjà faites)
npm install

# Configurer les variables d'environnement
# Éditer le fichier .env et configurer:
# - MONGODB_URI=mongodb://localhost:27017/rh-system
# - JWT_SECRET=your_secret_key
# - PORT=5000

# Démarrer le serveur
npm start
```

Le serveur démarre sur `http://localhost:5000`

### Setup Frontend

```bash
cd frontend

# Installer les dépendances (déjà faites)
npm install

# Démarrer le serveur de développement
npm start
```

Le frontend démarre sur `http://localhost:3000`

## Accès à l'Application

### Compte Admin (à créer)
```
Email: admin@example.com
Password: Admin123
Role: admin
```

### Compte Employé (à créer)
```
Email: employee@example.com
Password: Emp123
Role: employe
```

## Structure de l'Application

```
pfe/
├── backend/
│   ├── models/           # Modèles Mongoose
│   ├── routes/           # Routes API
│   ├── controllers/       # Logique métier
│   ├── middleware/        # Auth, Audit, Roles
│   └── config/           # Configuration DB
├── frontend/
│   ├── src/
│   │   ├── pages/        # Pages React
│   │   ├── components/   # Composants React
│   │   ├── context/      # Context API (Auth)
│   │   ├── services/     # Services API
│   │   └── styles/       # CSS
│   └── public/           # Assets statiques
└── server.js             # Point d'entrée backend
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil actuel

### Employés
- `GET /api/employes` - Liste des employés
- `POST /api/employes` - Créer un employé
- `PUT /api/employes/:id` - Modifier un employé
- `DELETE /api/employes/:id` - Supprimer un employé

### Pointages
- `POST /api/pointages` - Enregistrer un pointage
- `GET /api/pointages/employe/:id` - Pointages d'un employé
- `GET /api/pointages/stats/retards-day` - Retards du jour
- `GET /api/pointages/stats/absences-day` - Absences du jour
- `GET /api/pointages/stats/time-stats` - Statistiques du temps

### Congés
- `POST /api/conges` - Demander un congé
- `GET /api/conges` - Liste des congés
- `PUT /api/conges/:id/approve` - Approuver
- `PUT /api/conges/:id/reject` - Refuser
- `GET /api/conges/balance/:id` - Solde de congés

### Salaires
- `POST /api/salaires/calculate` - Calculer le salaire
- `GET /api/salaires` - Liste des salaires
- `PUT /api/salaires/:id/validate` - Valider un salaire
- `GET /api/salaires/stats` - Statistiques salariales

### Audit
- `GET /api/audit` - Logs d'audit
- `GET /api/audit/stats` - Statistiques d'audit

### Structure
- `GET /api/structure/services` - Services
- `POST /api/structure/services` - Créer service
- `GET /api/structure/uaps` - UAPs
- `POST /api/structure/uaps` - Créer UAP

## Formules de Calcul

### Salaire Net
```
Salaire Net = (Heures * Prix/h + Heures Supp * Prix/h * 1.5 + Primes) - Déductions
```

### Déductions
- Absences: 1 jour = 8 heures * Prix/h
- Retards: (minutes / 60) * (Prix/h * 0.1)
- Disciplines: Montant configuré

## Notes Importantes

1. Assurez-vous que MongoDB est en cours d'exécution avant de démarrer le serveur
2. Les tokens JWT expirent après 7 jours
3. Les mots de passe sont hashés avec bcrypt
4. Tous les accès sont journalisés dans la base de données

## Développement Futur

- [ ] Application mobile
- [ ] Intégration pointeuse biométrique
- [ ] Rapports PDF automatiques
- [ ] Notifications email
- [ ] Prédictions avec IA
- [ ] Intégration comptable

## Support

Pour des questions ou problèmes, veuillez vérifier les logs et la console du navigateur.
