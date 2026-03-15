require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./backend/config/database');
const auditMiddleware = require('./backend/middleware/audit');

// Routes
const authRoutes = require('./backend/routes/authRoutes');
const employeRoutes = require('./backend/routes/employeRoutes');
const pointageRoutes = require('./backend/routes/pointageRoutes');
const congeRoutes = require('./backend/routes/congeRoutes');
const salaireRoutes = require('./backend/routes/salaireRoutes');
const structureRoutes = require('./backend/routes/structureRoutes');
const auditRoutes = require('./backend/routes/auditRoutes');
const notificationRoutes = require('./backend/routes/notifications');
const userRoutes = require('./backend/routes/userRoutes');
const zkRoutes = require('./backend/routes/zkRoutes');
const { initSync } = require('./backend/services/zkService');

// Connexion à la BD
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(auditMiddleware);
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employes', employeRoutes);
app.use('/api/pointages', pointageRoutes);
app.use('/api/conges', congeRoutes);
app.use('/api/salaires', salaireRoutes);
app.use('/api/structure', structureRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/biometric', zkRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur est en ligne' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Écouter sur le port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Serveur démarré sur le port ${PORT}`);
  // Initialiser la synchronisation biométrique
  initSync();
});
