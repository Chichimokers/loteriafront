import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/user/Login';
import Register from './pages/user/Register';
import UserLayout from './pages/user/UserLayout';
import Dashboard from './pages/user/Dashboard';
import Betting from './pages/user/Betting';
import History from './pages/user/History';
import Profile from './pages/user/Profile';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAcreditaciones from './pages/admin/AdminAcreditaciones';
import AdminExtracciones from './pages/admin/AdminExtracciones';
import AdminLoterias from './pages/admin/AdminLoterias';
import AdminTiradas from './pages/admin/AdminTiradas';
import AdminResultados from './pages/admin/AdminResultados';
import AdminModalidades from './pages/admin/AdminModalidades';
import AdminApuestas from './pages/admin/AdminApuestas';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user.is_staff) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <UserLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="apuestas" element={<Betting />} />
        <Route path="historial" element={<History />} />
        <Route path="perfil" element={<Profile />} />
      </Route>
      
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<AdminUsers />} />
        <Route path="apuestas" element={<AdminApuestas />} />
        <Route path="acreditaciones" element={<AdminAcreditaciones />} />
        <Route path="extracciones" element={<AdminExtracciones />} />
        <Route path="loterias" element={<AdminLoterias />} />
        <Route path="tiradas" element={<AdminTiradas />} />
        <Route path="resultados" element={<AdminResultados />} />
        <Route path="modalidades" element={<AdminModalidades />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
