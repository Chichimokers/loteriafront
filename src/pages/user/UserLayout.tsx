import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { Dices, Wallet, LogOut, Menu, X } from 'lucide-react';

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
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Dices className="w-6 h-6" />
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
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {user.saldo_principal.toFixed(2)} CUP
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/30 transition-all duration-200 text-sm font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
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
                <div className="bg-white/20 px-4 py-3 rounded-xl mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Saldo: {user.saldo_principal.toFixed(2)} CUP
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/30 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
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
