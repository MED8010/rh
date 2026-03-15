import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import EmployesPage from './pages/EmployesPage';
import PointagesPage from './pages/PointagesPage';
import CongesPage from './pages/CongesPage';
import SalairesPage from './pages/SalairesPage';
import AuditPage from './pages/AuditPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import NotificationsPage from './pages/NotificationsPage';
import MesCongesPage from './pages/MesCongesPage';
import GestionCongesPage from './pages/GestionCongesPage';
import AdminCongesPage from './pages/AdminCongesPage';
import CongesChefPage from './pages/CongesChefPage';
import TimeDisciplineDashboard from './pages/TimeDisciplineDashboard';
import SalaryAnalyticsDashboard from './pages/SalaryAnalyticsDashboard';
import ProfilePage from './pages/ProfilePage';
import EmployeDetail from './pages/EmployeDetail';

import './styles/Dashboard.css';

// Layout wrapper for authenticated pages with sidebar
const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Navigation />
    <main className="main-content">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Super Admin */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AppLayout><SuperAdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><AdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/employes" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><EmployesPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/employes/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><EmployeDetail /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/pointages" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><PointagesPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/conges" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><AdminCongesPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/salaires" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><SalairesPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/audit" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><AuditPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/time-discipline" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><TimeDisciplineDashboard /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/salary-analytics" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><SalaryAnalyticsDashboard /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/gestion-conges" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AppLayout><AdminCongesPage /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Employee / Chef routes */}
          <Route path="/employee-dashboard" element={
            <ProtectedRoute allowedRoles={['employe', 'chef_service']}>
              <AppLayout><EmployeeDashboard /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/mes-conges" element={
            <ProtectedRoute allowedRoles={['employe']}>
              <AppLayout><MesCongesPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/mes-conges-chef" element={
            <ProtectedRoute allowedRoles={['chef_service']}>
              <AppLayout><CongesChefPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['employe', 'chef_service', 'admin', 'super_admin']}>
              <AppLayout><NotificationsPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['employe', 'chef_service', 'admin', 'super_admin']}>
              <AppLayout><ProfilePage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
