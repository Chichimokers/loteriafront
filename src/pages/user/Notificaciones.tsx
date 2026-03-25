import React, { useState, useEffect, useCallback } from 'react';
import { notificacionService } from '../../services/api';
import { Bell, CheckCircle2, XCircle, DollarSign, Trophy, Frown, RefreshCw } from 'lucide-react';

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
    case 'acreditacion_aprobada':
    case 'extraccion_aprobada':
    case 'saldo_ajustado':
      return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    case 'acreditacion_rechazada':
    case 'extraccion_rechazada':
      return <XCircle className="w-6 h-6 text-red-500" />;
    case 'apuesta_ganadora':
      return <Trophy className="w-6 h-6 text-amber-500" />;
    case 'apuesta_perdedora':
      return <Frown className="w-6 h-6 text-gray-400" />;
    case 'resultado_publicado':
      return <DollarSign className="w-6 h-6 text-indigo-500" />;
    default:
      return <Bell className="w-6 h-6 text-blue-500" />;
  }
};

const getBgColor = (tipo: string) => {
  switch (tipo) {
    case 'acreditacion_aprobada':
    case 'extraccion_aprobada':
    case 'saldo_ajustado':
      return 'bg-green-50 border-green-100';
    case 'acreditacion_rechazada':
    case 'extraccion_rechazada':
      return 'bg-red-50 border-red-100';
    case 'apuesta_ganadora':
      return 'bg-amber-50 border-amber-100';
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

const Notificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotificaciones = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await notificacionService.getNotificaciones();
      const arr = Array.isArray(data) ? data : (data as { results?: Notificacion[] }).results || [];
      setNotificaciones(arr);
    } catch (err) {
      console.error('Error loading notificaciones:', err);
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

  const handleLeer = async (id: number) => {
    try {
      await notificacionService.leerNotificacion(id);
      setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleLeerTodas = async () => {
    try {
      await notificacionService.leerTodas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {notificaciones.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No tienes notificaciones</p>
          <p className="text-gray-400 text-sm mt-1">Las notificaciones aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border-2 transition-all ${
                notif.leida ? 'bg-white border-gray-100' : getBgColor(notif.tipo)
              } ${!notif.leida ? 'shadow-md' : 'shadow-sm'}`}
              onClick={() => !notif.leida && handleLeer(notif.id)}
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

export default Notificaciones;
