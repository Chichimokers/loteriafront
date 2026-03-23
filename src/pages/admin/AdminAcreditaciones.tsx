import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { acreditacionService } from '../../services/api';
import { RefreshCw, Wallet, Check, X as XIcon } from 'lucide-react';
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
        <div className="space-y-4">
          {acreditaciones.map((acreditacion) => {
            const montoNum = typeof acreditacion.monto === 'string' ? parseFloat(acreditacion.monto) : acreditacion.monto;
            return (
              <div key={acreditacion.id} className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
                {/* Email */}
                <p className="text-lg font-bold text-indigo-600">{acreditacion.usuario_email}</p>

                {/* Monto card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-center text-white shadow-lg">
                  <p className="text-sm opacity-80 mb-1">Monto</p>
                  <p className="text-4xl font-bold">{formatMonto(montoNum)} CUP</p>
                </div>

                {/* Info fields */}
                <div className="space-y-3 pt-2">
                  <div className="flex">
                    <span className="text-sm font-semibold text-gray-500 w-32 flex-shrink-0">Tarjeta:</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{formatTarjeta(acreditacion.tarjeta_numero)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-semibold text-gray-500 w-32 flex-shrink-0">ID Transferencia:</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{acreditacion.id_transferencia || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-semibold text-gray-500 w-32 flex-shrink-0">SMS:</span>
                    <span className="text-sm text-gray-900 break-all leading-relaxed">{acreditacion.sms_confirmacion || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-semibold text-gray-500 w-32 flex-shrink-0">Fecha:</span>
                    <span className="text-sm text-gray-600">{formatFecha(acreditacion.fecha)}</span>
                  </div>
                </div>

                {/* Acciones */}
                {filter === 'pendiente' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(acreditacion.id)}
                      className="flex-1 py-3.5 bg-green-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md"
                    >
                      <Check className="w-5 h-5" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(acreditacion.id)}
                      className="flex-1 py-3.5 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md"
                    >
                      <XIcon className="w-5 h-5" />
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
