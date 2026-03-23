import React, { useState, useEffect, useCallback } from 'react';
import { acreditacionService } from '../../services/api';
import { RefreshCw, Wallet } from 'lucide-react';

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
      await loadAcreditaciones();
    } catch (err) {
      console.error('Error approving acreditacion:', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await acreditacionService.rejectAcreditacion(id);
      await loadAcreditaciones();
    } catch (err) {
      console.error('Error rejecting acreditacion:', err);
    }
  };

  const formatTarjeta = (numero: string | undefined | null) => {
    if (!numero) return '-';
    const cleaned = String(numero).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (!match) return String(numero);
    const parts = [match[1], match[2], match[3], match[4]].filter(p => p);
    return parts.join('-');
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
        <button onClick={loadAcreditaciones} className="btn btn-ghost">
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'aprobada', label: 'Aprobadas' },
          { key: 'rechazada', label: 'Rechazadas' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {acreditaciones.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center">
          <Wallet className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">No hay acreditaciones en este estado</p>
        </div>
      ) : (
        <>
          {/* Tabla PC */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">ID</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Usuario</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Tarjeta</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Monto</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">SMS</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">ID Transferencia</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Fecha</th>
                  {filter === 'pendiente' && <th className="text-left p-4 text-sm font-semibold text-gray-600">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {acreditaciones.map((acreditacion) => {
                  const montoNum = typeof acreditacion.monto === 'string' ? parseFloat(acreditacion.monto) : acreditacion.monto;
                  return (
                    <tr key={acreditacion.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-900">#{acreditacion.id}</td>
                      <td className="p-4 text-sm text-gray-600">{acreditacion.usuario_email}</td>
                      <td className="p-4 text-sm text-gray-600 font-mono">{formatTarjeta(acreditacion.tarjeta_numero)}</td>
                      <td className="p-4 text-sm font-bold text-gray-900">{montoNum.toFixed(2)} CUP</td>
                      <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate">{acreditacion.sms_confirmacion || '-'}</td>
                      <td className="p-4 text-sm text-gray-600 font-mono">{acreditacion.id_transferencia || '-'}</td>
                      <td className="p-4 text-sm text-gray-600">{formatFecha(acreditacion.fecha)}</td>
                      {filter === 'pendiente' && (
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(acreditacion.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleReject(acreditacion.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards Móvil */}
          <div className="lg:hidden space-y-3">
            {acreditaciones.map((acreditacion) => {
              const montoNum = typeof acreditacion.monto === 'string' ? parseFloat(acreditacion.monto) : acreditacion.monto;
              return (
                <div key={acreditacion.id} className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">#{acreditacion.id} - {acreditacion.usuario_email}</p>
                      <p className="text-sm text-gray-500">{formatTarjeta(acreditacion.tarjeta_numero)}</p>
                    </div>
                    <span className="text-lg font-bold text-indigo-500">{montoNum.toFixed(2)} CUP</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>SMS: {acreditacion.sms_confirmacion || '-'}</p>
                    <p>ID Transferencia: {acreditacion.id_transferencia || '-'}</p>
                    <p>{formatFecha(acreditacion.fecha)}</p>
                  </div>
                  {filter === 'pendiente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(acreditacion.id)}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleReject(acreditacion.id)}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAcreditaciones;
