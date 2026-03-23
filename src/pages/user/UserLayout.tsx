import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './UserLayout.css';

const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || typeof user.saldo_principal !== 'number') {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  return (
    <div className="user-layout">
      <header className="user-header">
        <div className="logo">
          <h1>Lotería</h1>
        </div>
        <nav className="user-nav">
          <Link to="/">Inicio</Link>
          <Link to="/apuestas">Apuestas</Link>
          <Link to="/historial">Historial</Link>
          <Link to="/perfil">Mi Perfil</Link>
        </nav>
        <div className="user-info">
          <span className="saldo">Saldo: {user.saldo_principal.toFixed(2)} CUP</span>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </header>
      <main className="user-content">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
