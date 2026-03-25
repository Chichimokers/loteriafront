import React, { useState, useEffect, useCallback } from 'react';
import { notificacionService } from '../../services/api';
import { Bell, UserPlus, Wallet, BanknoteArrowDown, Target, CheckCircle2, RefreshCw } from 'lucide-react';

interface Notificacion {
  id: number;
  usuario: number | null;
  tipo: string;
  titulo: string;
  mensaje: string;
  datos: Record<string, string> | null;
  leida: boolean;
  fecha: string;
}

const getIcono = (tipo: string) => {
  switch (tipo) {
    case 'nuevo_usuario':
      return <UserPlus className="w-6 h-6 text-blue-500" />;
    case 'acreditacion_pendiente':
      return <Wallet className="w-6 h-6 text-green-500" />;
    case 'extraccion_pendiente':
      return <BanknoteArrowDown className="w-6 h-6 text-amber-500" />;
    case 'apuesta_creada':
      return <Target className="w-6 h-6 text-indigo-500" />;
    default:
      return <Bell className="w-6 h-6 text-gray-500" />;
  }
};

const getBgColor = (tipo: string) => {
  switch (tipo) {
    case 'nuevo_usuario':
      return 'bg-blue-50 border-blue-100';
    case 'acreditacion_pendiente':
      return 'bg-green-50 border-green-100';
    case 'extraccion_pendiente':
      return 'bg-amber-50 border-amber-100';
    case 'apuesta_creada':
      return 'bg-indigo-50 border-indigo-100';
    default:
      return 'bg-white border-gray-100';
  }
};

const formatFecha = (fecha: string) => {
  const date = new Date(fecha);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-ES');
};

const AdminNotificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<string>('todas');

  const loadNotificaciones = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await notificacionService.getAdminNotificaciones();
      const arr = Array.isArray(data) ? data : (data as { results?: Notificacion[] }).results || [];
      setNotificaciones(arr);
    } catch (err) {
      console.error('Error loading admin notificaciones:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotificaciones();
    const interval = setInterval(() => loadNotificaciones(true), 30000);
    return () => clearInterval(interval);
  }, [loadNotificaciones]);

  const handleLeerTodas = async () => {
    try {
      await notificacionService.leerTodasAdmin();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getFiltered = () => {
    if (filtro === 'todas') return notificaciones;
    if (filtro === 'no_leidas') return notificaciones.filter((n) => !n.leida);
    return notificaciones.filter((n) => n.tipo === filtro);
  };

  const filtered = getFiltered();
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const stats = {
    total: notificaciones.length,
    noLeidas,
    nuevoUsuario: notificaciones.filter((n) => n.tipo === 'nuevo_usuario').length,
    acreditaciones: notificaciones.filter((n) => n.tipo === 'acreditacion_pendiente').length,
    extracciones: notificaciones.filter((n) => n.tipo === 'extraccion_pendiente').length,
    apuestas: notificaciones.filter((n) => n.tipo === 'apuesta_creada').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          {noLeidas > 0 && (
            <p className="text-sm text-gray-500">{noLeidas} sin leer</p>
          )}
        </div>
        <div className="flex gap-2">
          {noLeidas > 0 && (
            <button
              onClick={handleLeerTodas}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Leer todas
            </button>
          )}
          <button
            onClick={() => loadNotificaciones(true)}
            disabled={refreshing}
            className="btn btn-ghost"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500">Sin leer</p>
          <p className="text-xl font-bold text-indigo-600">{stats.noLeidas}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500">Nuevos usuarios</p>
          <p className="text-xl font-bold text-blue-600">{stats.nuevoUsuario}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500">Acreditaciones</p>
          <p className="text-xl font-bold text-green-600">{stats.acreditaciones}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500">Extracciones</p>
          <p className="text-xl font-bold text-amber-600">{stats.extracciones}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500">Apuestas</p>
          <p className="text-xl font-bold text-purple-600">{stats.apuestas}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 rounded-xl shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'no_leidas', label: 'Sin leer' },
            { key: 'nuevo_usuario', label: 'Usuarios' },
            { key: 'acreditacion_pendiente', label: 'Acreditaciones' },
            { key: 'extraccion_pendiente', label: 'Extracciones' },
            { key: 'apuesta_creada', label: 'Apuestas' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filtro === f.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center">
          <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                notif.leida ? 'bg-white border-gray-100' : getBgColor(notif.tipo)
              } ${!notif.leida ? 'shadow-md' : 'shadow-sm'}`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcono(notif.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold ${notif.leida ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notif.titulo}
                    </h3>
                    {!notif.leida && (
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5"></div>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${notif.leida ? 'text-gray-400' : 'text-gray-600'}`}>
                    {notif.mensaje}
                  </p>
                  {notif.datos && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(notif.datos).map(([key, value]) => (
                        <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{formatFecha(notif.fecha)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotificaciones;
