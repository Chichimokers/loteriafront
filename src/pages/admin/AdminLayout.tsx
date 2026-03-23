import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || !user.is_staff) {
    return <div>Acceso denegado</div>;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/usuarios">Usuarios</Link>
          <Link to="/admin/acreditaciones">Acreditaciones</Link>
          <Link to="/admin/extracciones">Extracciones</Link>
          <Link to="/admin/loterias">Loterías</Link>
          <Link to="/admin/tiradas">Tiradas</Link>
          <Link to="/admin/resultados">Resultados</Link>
          <Link to="/admin/modalidades">Modalidades</Link>
        </nav>
        <div className="sidebar-footer">
          <Link to="/">Ver Usuario</Link>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
