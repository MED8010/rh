# 📌 Exemples de Requêtes API

## Authentification

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rh.app",
    "password": "admin123456"
  }'
```

**Réponse:**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "admin@rh.app",
    "role": "admin"
  }
}
```

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemployee@rh.app",
    "password": "password123",
    "nom": "Dupont",
    "prenom": "Jean",
    "matricule": "EMP999",
    "service": "SERVICE_ID",
    "uap": "UAP_ID",
    "prix_heure": 300
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Gestion des Employés

### Créer un employé
```bash
curl -X POST http://localhost:5000/api/employes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matricule": "EMP004",
    "nom": "Durand",
    "prenom": "Pierre",
    "date_embauche": "2024-02-01",
    "prix_heure": 350,
    "service": "SERVICE_ID",
    "uap": "UAP_ID",
    "email": "pierre@rh.app",
    "telephone": "0123456789"
  }'
```

### Obtenir tous les employés
```bash
curl -X GET http://localhost:5000/api/employes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrer par service
```bash
curl -X GET "http://localhost:5000/api/employes?service=SERVICE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtenir un employé spécifique
```bash
curl -X GET http://localhost:5000/api/employes/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Modifier un employé
```bash
curl -X PUT http://localhost:5000/api/employes/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prix_heure": 400,
    "statut": "actif"
  }'
```

### Supprimer un employé
```bash
curl -X DELETE http://localhost:5000/api/employes/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Pointages

### Enregistrer un pointage
```bash
curl -X POST http://localhost:5000/api/pointages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employe_id": "EMPLOYEE_ID",
    "date": "2024-02-27",
    "heure_entree": "08:15",
    "heure_sortie": "17:00",
    "absence": false
  }'
```

### Enregistrer une absence
```bash
curl -X POST http://localhost:5000/api/pointages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employe_id": "EMPLOYEE_ID",
    "date": "2024-02-27",
    "absence": true,
    "motif_absence": "Maladie"
  }'
```

### Obtenir les pointages d'un employé
```bash
curl -X GET "http://localhost:5000/api/pointages/employe/EMPLOYEE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Avec dates spécifiques
```bash
curl -X GET "http://localhost:5000/api/pointages/employe/EMPLOYEE_ID?startDate=2024-02-01&endDate=2024-02-28" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Retards du jour
```bash
curl -X GET http://localhost:5000/api/pointages/stats/retards-day \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Absences du jour
```bash
curl -X GET http://localhost:5000/api/pointages/stats/absences-day \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Statistiques du temps
```bash
curl -X GET http://localhost:5000/api/pointages/stats/time-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Congés

### Demander un congé
```bash
curl -X POST http://localhost:5000/api/conges \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employe_id": "EMPLOYEE_ID",
    "date_debut": "2024-03-15",
    "date_fin": "2024-03-22",
    "type": "annuel",
    "motif": "Vacances"
  }'
```

### Obtenir les demandes de congés
```bash
curl -X GET http://localhost:5000/api/conges \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrer par statut
```bash
curl -X GET "http://localhost:5000/api/conges?statut=demande" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approuver un congé
```bash
curl -X PUT http://localhost:5000/api/conges/CONGE_ID/approve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Refuser un congé
```bash
curl -X PUT http://localhost:5000/api/conges/CONGE_ID/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commentaire_rejet": "Raison du refus"
  }'
```

### Obtenir le solde de congés
```bash
curl -X GET http://localhost:5000/api/conges/balance/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Salaires

### Calculer le salaire d'un employé
```bash
curl -X POST http://localhost:5000/api/salaires/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employe_id": "EMPLOYEE_ID",
    "mois": 2,
    "annee": 2024
  }'
```

### Obtenir les salaires
```bash
curl -X GET http://localhost:5000/api/salaires \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrer par mois/année
```bash
curl -X GET "http://localhost:5000/api/salaires?mois=2&annee=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtenir les salaires d'un employé
```bash
curl -X GET "http://localhost:5000/api/salaires?employe_id=EMPLOYEE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Valider un salaire
```bash
curl -X PUT http://localhost:5000/api/salaires/SALARY_ID/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtenir les statistiques salariales
```bash
curl -X GET "http://localhost:5000/api/salaires/stats?mois=2&annee=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Services et UAP

### Créer un service
```bash
curl -X POST http://localhost:5000/api/structure/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom_service": "Nouveau Service",
    "description": "Description du service"
  }'
```

### Obtenir les services
```bash
curl -X GET http://localhost:5000/api/structure/services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer une UAP
```bash
curl -X POST http://localhost:5000/api/structure/uaps \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom_uap": "Nouvelle UAP",
    "description": "Description de l'\''UAP"
  }'
```

### Obtenir les UAP
```bash
curl -X GET http://localhost:5000/api/structure/uaps \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Audit

### Obtenir les logs d'audit
```bash
curl -X GET http://localhost:5000/api/audit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrer par module
```bash
curl -X GET "http://localhost:5000/api/audit?module=employes" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrer par action
```bash
curl -X GET "http://localhost:5000/api/audit?action=create" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Statistiques d'audit
```bash
curl -X GET http://localhost:5000/api/audit/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes Importantes

1. **Token**: Remplacer `YOUR_TOKEN` par le token obtenu lors de la connexion
2. **IDs**: Remplacer les `*_ID` par les vrais IDs retournés par l'API
3. **Headers**: Toujours incluire `Authorization: Bearer TOKEN` pour les routes protégées
4. **Content-Type**: Utiliser `application/json` pour les requêtes POST/PUT

## Codes de Réponse HTTP

- `200 OK` - Succès
- `201 Created` - Ressource créée
- `400 Bad Request` - Requête invalide
- `401 Unauthorized` - Token manquant ou invalide
- `403 Forbidden` - Accès refusé (permissions insuffisantes)
- `404 Not Found` - Ressource non trouvée
- `500 Internal Server Error` - Erreur serveur

## Outils Recommandés pour Tester

- **Postman** - Interface graphique pour tester l'API
- **curl** - Ligne de commande (exemples ci-dessus)
- **Thunder Client** - Extension VS Code
- **REST Client** - Extension VS Code

## Flux Complet Exemple

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rh.app","password":"admin123456"}' | jq -r '.token')

# 2. Créer un employé
curl -X POST http://localhost:5000/api/employes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matricule":"TEST001","nom":"Test","prenom":"User","prix_heure":300,"service":"SERVICE_ID","uap":"UAP_ID"}'

# 3. Voir les employés
curl -X GET http://localhost:5000/api/employes \
  -H "Authorization: Bearer $TOKEN"
```

---
Tous les endpoints sont documentés et testables avec ces exemples.
