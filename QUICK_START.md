# Guide de Démarrage Rapide

## Installation Complète

### 1. Prérequis
- Node.js v18+ (vérifier avec `node --version`)
- MongoDB en cours d'exécution
  - **Option 1**: MongoDB local - Télécharger depuis https://www.mongodb.com/try/download/community
  - **Option 2**: MongoDB Atlas (Cloud) - https://www.mongodb.com/cloud/atlas

### 2. Configuration MongoDB

#### Si vous utilisez MongoDB local:
```bash
# Démarrer MongoDB (Windows)
mongod

# Ou via le service Windows
net start MongoDB
```

#### Si vous utilisez MongoDB Atlas:
1. Aller sur https://www.mongodb.com/cloud/atlas
2. Créer un compte/cluster
3. Copier la connection string
4. Éditer le fichier `.env` et remplacer:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rh-system
   ```

### 3. Démarrage du Backend

```bash
# Aller dans le répertoire principal
cd c:\Users\dellhp\Desktop\pfe

# Les dépendances sont déjà installées
# Modifier le fichier .env si nécessaire

# Initialiser la base de données avec des données de test
node seed.js

# Démarrer le serveur
npm start
```

Le serveur démarre sur `http://localhost:5000`

### 4. Démarrage du Frontend

En ouvrant un nouveau terminal:

```bash
cd c:\Users\dellhp\Desktop\pfe\frontend

# Installer les dépendances (peut prendre quelques minutes)
npm install

# Démarrer le serveur de développement
npm start
```

Le frontend s'ouvre automatiquement sur `http://localhost:3000`

## Premiers Pas

### Comptes de Test

Après avoir exécuté `node seed.js`, vous avez accès à ces comptes:

**Administrateur:**
- Email: `admin@rh.app`
- Mot de passe: `admin123456`

**Employé 1:**
- Email: `jean.dupont@rh.app`
- Mot de passe: `emp123456`

**Employé 2:**
- Email: `marie.martin@rh.app`
- Mot de passe: `emp123456`

### Flux d'utilisation Admin

1. **Connexion** → Dashboard Admin
2. **Gestion des Employés** → Ajouter/Modifier/Supprimer
3. **Pointages** → Voir retards et absences du jour
4. **Congés** → Approuver/Refuser les demandes
5. **Salaires** → Calculer et valider les salaires
6. **Audit** → Consulter les logs d'activité

### Flux d'utilisation Employé

1. **Connexion** → Mon Dashboard
2. **Mes Pointages** → Consulter l'historique
3. **Mes Congés** → Demander un congé
4. **Mon Salaire** → Consulter les salaires
5. **Solde de Congés** → Voir ce qui reste

## Troubleshooting

### Erreur de connexion MongoDB
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Assurez-vous que MongoDB s'exécute
- Vérifier: `mongosh` dans un terminal
- Ou redémarrer le service MongoDB

### Port 5000 déjà utilisé
```bash
# Utiliser un autre port
# Éditer le fichier .env et changer PORT=5001
```

### Erreur React: "react-scripts not found"
```bash
cd frontend
npm install react-scripts
npm start
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Vérifier que le backend est en cours d'exécution sur le port 5000

## Variables d'Environnement (.env)

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/rh-system

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Serveur
PORT=5000
NODE_ENV=development
```

## Architecture API

### Authentification
- Chaque requête doit avoir un header `Authorization: Bearer TOKEN`
- Les tokens sont générés lors de la connexion
- Les tokens expirent après 7 jours

### Rôles et Permissions
- **admin**: Accès complet
- **employe**: Accès limité aux données personnelles
- **chef_service**: Accès aux données de son équipe (non implémenté)

### Format des Réponses
```json
// Succès
{
  "message": "Message de succès",
  "data": { /* données */ }
}

// Erreur
{
  "message": "Message d'erreur",
  "error": "Détails techniques"
}
```

## Structure des Dossiers

```
pfe/
├── backend/
│   ├── models/          # Schémas de données
│   ├── routes/          # Endpoints API
│   ├── controllers/      # Logique métier
│   ├── middleware/       # Auth, validation
│   └── config/          # Configuration DB
├── frontend/
│   ├── src/
│   │   ├── pages/       # Pages principales
│   │   ├── components/   # Composants réutilisables
│   │   ├── context/     # State global (Auth)
│   │   ├── services/     # Appels API
│   │   └── styles/      # CSS
│   └── public/          # Assets statiques
├── server.js            # Point d'entrée backend
├── seed.js              # Script d'initialisation
├── .env                 # Variables d'environnement
└── README.md            # Documentation
```

## Développement et Débogage

### Activer les logs
```bash
# Dans .env
NODE_ENV=debug
```

### Accéder à MongoDB
```bash
# Ouvrir mongosh
mongosh

# Sélectionner la base de données
use rh-system

# Voir les collections
show collections

# Requête exemple
db.employes.find().pretty()
```

### Inspecter les requêtes API
- Ouvrir DevTools (F12) dans le navigateur
- Onglet Network → voir toutes les requêtes

## Performance

- Temps de réponse cible: **< 3 secondes**
- Cache côté client: **Implémenté via localStorage**
- Pagination: **À implémenter pour les listes longues**

## Next Steps

Pour aller plus loin:
1. Ajouter plus de services et UAPs
2. Créer des pointages de test
3. Calculer des salaires
4. Tester les workflows complets
5. Générer les rapports (PDF, Excel)

## Besoin d'aide?

1. Vérifier les logs du serveur (terminal)
2. Vérifier la console (F12 > Console)
3. Consulter le MongoDB Compass pour inspefter les données
4. Vérifier que les ports 5000 et 3000 sont disponibles

Bon développement! 🚀
