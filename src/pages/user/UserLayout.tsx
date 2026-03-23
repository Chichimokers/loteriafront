import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || typeof user.saldo_principal !== 'number') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">🎰</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Lotería</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Link 
                to="/" 
                className="px-4 py-2 rounded-xl text-white/90 hover:bg-white/20 transition-all duration-200 font-medium"
              >
                Inicio
              </Link>
              <Link 
                to="/apuestas" 
                className="px-4 py-2 rounded-xl text-white/90 hover:bg-white/20 transition-all duration-200 font-medium"
              >
                Apostar
              </Link>
              <Link 
                to="/historial" 
                className="px-4 py-2 rounded-xl text-white/90 hover:bg-white/20 transition-all duration-200 font-medium"
              >
                Historial
              </Link>
              <Link 
                to="/perfil" 
                className="px-4 py-2 rounded-xl text-white/90 hover:bg-white/20 transition-all duration-200 font-medium"
              >
                Perfil
              </Link>
            </nav>

            {/* User Info & Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-sm font-medium">
                  💰 {user.saldo_principal.toFixed(2)} CUP
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/30 transition-all duration-200 text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Salir
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 animate-fade-in">
            <div className="px-4 py-4 space-y-2">
              <Link 
                to="/" 
                className="block px-4 py-3 rounded-xl hover:bg-white/20 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link 
                to="/apuestas" 
                className="block px-4 py-3 rounded-xl hover:bg-white/20 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Apostar
              </Link>
              <Link 
                to="/historial" 
                className="block px-4 py-3 rounded-xl hover:bg-white/20 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Historial
              </Link>
              <Link 
                to="/perfil" 
                className="block px-4 py-3 rounded-xl hover:bg-white/20 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Perfil
              </Link>
              <div className="pt-4 border-t border-white/20">
                <div className="bg-white/20 px-4 py-3 rounded-xl mb-3">
                  <span className="text-sm font-medium">
                    💰 Saldo: {user.saldo_principal.toFixed(2)} CUP
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/30 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          © 2026 Lotería. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default UserLayout;
