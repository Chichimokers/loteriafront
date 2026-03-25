import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { 
  Lock, 
  BarChart3, 
  Users, 
  Target, 
  Wallet, 
  BanknoteArrowDown, 
  Dices, 
  Clock, 
  Trophy, 
  FileText, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell
} from 'lucide-react';
import { notificacionService } from '../../services/api';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);

  const loadNoLeidas = useCallback(async () => {
    try {
      const data = await notificacionService.getAdminNoLeidas();
      setNoLeidas(data.no_leidas || 0);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    loadNoLeidas();
    const interval = setInterval(loadNoLeidas, 30000);
    return () => clearInterval(interval);
  }, [loadNoLeidas]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || !user.is_staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-card text-center">
          <Lock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { path: '/admin/usuarios', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
    { path: '/admin/notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" />, badge: noLeidas },
    { path: '/admin/apuestas', label: 'Apuestas', icon: <Target className="w-5 h-5" /> },
    { path: '/admin/acreditaciones', label: 'Acreditaciones', icon: <Wallet className="w-5 h-5" /> },
    { path: '/admin/extracciones', label: 'Extracciones', icon: <BanknoteArrowDown className="w-5 h-5" /> },
    { path: '/admin/loterias', label: 'Loterías', icon: <Dices className="w-5 h-5" /> },
    { path: '/admin/tiradas', label: 'Tiradas', icon: <Clock className="w-5 h-5" /> },
    { path: '/admin/resultados', label: 'Resultados', icon: <Trophy className="w-5 h-5" /> },
    { path: '/admin/modalidades', label: 'Modalidades', icon: <FileText className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">Admin</span>
          </Link>
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative
                ${isActive(item.path) 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {'badge' in item && (item as { badge: number }).badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {(item as { badge: number }).badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Ver Usuario</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <button 
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">Panel Admin</span>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
