import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { acreditacionService } from '../../services/api';
import { RefreshCw, Wallet, CreditCard, MessageSquare, Hash, Calendar, Check, X as XIcon } from 'lucide-react';
import { formatMonto } from '../../utils/format';

interface Acreditacion {
  id: number;
  usuario_email: string;
  tarjeta_numero: string;
  monto: number | string;
  sms_confirmacion: string;
  id_transferencia: string;
  estado: string;
  fecha: string;
}

const AdminAcreditaciones: React.FC = () => {
  const toast = useToast();
  const [acreditaciones, setAcreditaciones] = useState<Acreditacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pendiente' | 'aprobada' | 'rechazada'>('pendiente');

  const loadAcreditaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await acreditacionService.getAcreditaciones(filter);
      const arr = Array.isArray(data) ? data : (data as { results?: Acreditacion[] }).results || [];
      setAcreditaciones(arr);
    } catch (err) {
      console.error('Error loading acreditaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAcreditaciones();
  }, [loadAcreditaciones]);

  const handleApprove = async (id: number) => {
    try {
      await acreditacionService.approveAcreditacion(id);
      toast.showToast('Acreditación aprobada', 'success');
      await loadAcreditaciones();
    } catch (err) {
      toast.showToast('Error al aprobar', 'error');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await acreditacionService.rejectAcreditacion(id);
      toast.showToast('Acreditación rechazada', 'success');
      await loadAcreditaciones();
    } catch (err) {
      toast.showToast('Error al rechazar', 'error');
    }
  };

  const formatTarjeta = (numero: string | undefined | null) => {
    if (!numero) return '-';
    const cleaned = String(numero).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (!match) return String(numero);
    return [match[1], match[2], match[3], match[4]].filter(p => p).join('-');
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Acreditaciones</h1>
        <button onClick={loadAcreditaciones} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'pendiente', label: 'Pendientes', color: 'bg-amber-500' },
          { key: 'aprobada', label: 'Aprobadas', color: 'bg-green-500' },
          { key: 'rechazada', label: 'Rechazadas', color: 'bg-red-500' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === f.key
                ? `${f.color} text-white shadow-md`
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {acreditaciones.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center shadow-sm">
          <Wallet className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-3 text-gray-500 font-medium">No hay acreditaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {acreditaciones.map((acreditacion) => {
            const montoNum = typeof acreditacion.monto === 'string' ? parseFloat(acreditacion.monto) : acreditacion.monto;
            return (
              <div key={acreditacion.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header con monto destacado */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/70">#{acreditacion.id}</span>
                    <span className="text-sm font-semibold text-white truncate max-w-[180px]">
                      {acreditacion.usuario_email}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-white">{formatMonto(montoNum)} CUP</span>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Tarjeta</p>
                        <p className="text-sm font-mono font-medium text-gray-900">{formatTarjeta(acreditacion.tarjeta_numero)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Hash className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">ID Transferencia</p>
                        <p className="text-sm font-mono font-medium text-gray-900">{acreditacion.id_transferencia || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">SMS Confirmación</p>
                      <p className="text-sm text-gray-900 break-all">{acreditacion.sms_confirmacion || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatFecha(acreditacion.fecha)}</span>
                  </div>
                </div>

                {/* Acciones */}
                {filter === 'pendiente' && (
                  <div className="flex gap-2 px-4 pb-4">
                    <button
                      onClick={() => handleApprove(acreditacion.id)}
                      className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(acreditacion.id)}
                      className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <XIcon className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAcreditaciones;
