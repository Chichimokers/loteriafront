import React, { useState, useEffect } from 'react';
import { extraccionService, usuarioService } from '../../services/api';

interface Extraccion {
  id: number;
  usuario: number;
  usuario_email: string;
  monto: number | string;
  estado: string;
  fecha: string;
}

interface Usuario {
  id: number;
  movil: string;
  tarjeta_bancaria: string;
}

const AdminExtracciones: React.FC = () => {
  const [extracciones, setExtracciones] = useState<Extraccion[]>([]);
  const [usuarios, setUsuarios] = useState<Map<number, Usuario>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pendiente' | 'aprobada' | 'rechazada'>('pendiente');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [extraccionesData, usuariosData] = await Promise.all([
        extraccionService.getExtracciones(filter),
        usuarioService.getUsuarios(),
      ]);
      
      const arr = Array.isArray(extraccionesData) ? extraccionesData : (extraccionesData as { results?: Extraccion[] }).results || [];
      setExtracciones(arr);

      const usuariosArr = Array.isArray(usuariosData) ? usuariosData : (usuariosData as { results?: Usuario[] }).results || [];
      const usuariosMap = new Map<number, Usuario>();
      usuariosArr.forEach((u: Usuario) => usuariosMap.set(u.id, u));
      setUsuarios(usuariosMap);
    } catch (err) {
      console.error('Error loading extracciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await extraccionService.approveExtraccion(id);
      await loadData();
    } catch (err) {
      console.error('Error approving extraccion:', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await extraccionService.rejectExtraccion(id);
      await loadData();
    } catch (err) {
      console.error('Error rejecting extraccion:', err);
    }
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

  const getUsuarioInfo = (usuarioId: number) => {
    return usuarios.get(usuarioId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Extracciones</h1>
        <button onClick={loadData} className="btn btn-ghost">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
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
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {extracciones.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center">
          <span className="text-4xl">💸</span>
          <p className="mt-2 text-gray-600">No hay extracciones en este estado</p>
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
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Teléfono</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Tarjeta</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Monto</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Fecha</th>
                  {filter === 'pendiente' && <th className="text-left p-4 text-sm font-semibold text-gray-600">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {extracciones.map((extraccion) => {
                  const montoNum = typeof extraccion.monto === 'string' ? parseFloat(extraccion.monto) : extraccion.monto;
                  const usuarioInfo = getUsuarioInfo(extraccion.usuario);
                  return (
                    <tr key={extraccion.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-900">#{extraccion.id}</td>
                      <td className="p-4 text-sm text-gray-600">{extraccion.usuario_email}</td>
                      <td className="p-4 text-sm text-gray-600">{usuarioInfo?.movil || '-'}</td>
                      <td className="p-4 text-sm text-gray-600 font-mono">{usuarioInfo?.tarjeta_bancaria || '-'}</td>
                      <td className="p-4 text-sm font-bold text-gray-900">{montoNum.toFixed(2)} CUP</td>
                      <td className="p-4 text-sm text-gray-600">{extraccion.estado}</td>
                      <td className="p-4 text-sm text-gray-600">{formatFecha(extraccion.fecha)}</td>
                      {filter === 'pendiente' && (
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(extraccion.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleReject(extraccion.id)}
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
            {extracciones.map((extraccion) => {
              const montoNum = typeof extraccion.monto === 'string' ? parseFloat(extraccion.monto) : extraccion.monto;
              const usuarioInfo = getUsuarioInfo(extraccion.usuario);
              return (
                <div key={extraccion.id} className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">#{extraccion.id} - {extraccion.usuario_email}</p>
                      <p className="text-sm text-gray-500">{extraccion.estado}</p>
                    </div>
                    <span className="text-lg font-bold text-primary">{montoNum.toFixed(2)} CUP</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Teléfono</p>
                      <p className="font-medium">{usuarioInfo?.movil || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tarjeta</p>
                      <p className="font-medium font-mono">{usuarioInfo?.tarjeta_bancaria || '-'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{formatFecha(extraccion.fecha)}</p>
                  {filter === 'pendiente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(extraccion.id)}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleReject(extraccion.id)}
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

export default AdminExtracciones;
