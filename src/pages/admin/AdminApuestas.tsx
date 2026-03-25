import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw } from 'lucide-react';

interface Apuesta {
  id: number;
  usuario: number;
  loteria: number;
  loteria_nombre: string;
  modalidad: number;
  modalidad_nombre: string;
  tirada: number;
  numeros: string[];
  combinaciones_generadas: string[][] | null;
  monto_total: string;
  monto_por_numero: string;
  premiados: { numero: string; premio: number; tipo: string }[] | null;
  premio_total: string;
  paga: boolean;
  fecha: string;
  resultado: { pick_3: string; pick_4: string } | null;
}

interface Usuario {
  id: number;
  email: string;
  movil: string;
}

const AdminApuestas: React.FC = () => {
  const [apuestas, setApuestas] = useState<Apuesta[]>([]);
  const [usuarios, setUsuarios] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'ganadas' | 'perdidas' | 'pendientes'>('todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apuestasRes, usuariosRes] = await Promise.all([
        api.get('/apuestas/'),
        api.get('/usuarios/'),
      ]);

      const apuestasData = Array.isArray(apuestasRes.data) 
        ? apuestasRes.data 
        : (apuestasRes.data as { results?: Apuesta[] }).results || [];
      setApuestas(apuestasData);

      const usuariosArr = Array.isArray(usuariosRes.data)
        ? usuariosRes.data
        : (usuariosRes.data as { results?: Usuario[] }).results || [];
      
      const usuariosMap = new Map<number, string>();
      usuariosArr.forEach((u: Usuario) => {
        usuariosMap.set(u.id, u.email);
      });
      setUsuarios(usuariosMap);
    } catch (err) {
      console.error('Error loading apuestas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApuestas = () => {
    let filtered = [...apuestas];

    if (filtro === 'ganadas') {
      filtered = filtered.filter(a => a.paga);
    } else if (filtro === 'perdidas') {
      filtered = filtered.filter(a => !a.paga && a.resultado !== null);
    } else if (filtro === 'pendientes') {
      filtered = filtered.filter(a => a.resultado === null);
    }

    if (busqueda) {
      const search = busqueda.toLowerCase();
      filtered = filtered.filter(a => 
        a.loteria_nombre.toLowerCase().includes(search) ||
        a.modalidad_nombre.toLowerCase().includes(search) ||
        a.numeros.some(n => n.includes(search)) ||
        usuarios.get(a.usuario)?.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => b.id - a.id);
  };

  const getStatusInfo = (apuesta: Apuesta) => {
    if (apuesta.resultado === null && !apuesta.paga) {
      return { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' };
    }
    if (apuesta.resultado !== null && !apuesta.paga) {
      return { label: 'Perdida', class: 'bg-red-100 text-red-800' };
    }
    if (apuesta.paga) {
      return { label: 'Ganada', class: 'bg-green-100 text-green-800' };
    }
    return { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' };
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredApuestas = getFilteredApuestas();
  const stats = {
    total: apuestas.length,
    ganadas: apuestas.filter(a => a.paga).length,
    perdidas: apuestas.filter(a => !a.paga && a.resultado !== null).length,
    pendientes: apuestas.filter(a => a.resultado === null).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Apuestas</h1>
        <button onClick={loadData} className="btn btn-ghost">
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Ganadas</p>
          <p className="text-2xl font-bold text-green-600">{stats.ganadas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Perdidas</p>
          <p className="text-2xl font-bold text-red-600">{stats.perdidas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'ganadas', label: 'Ganadas' },
            { key: 'perdidas', label: 'Perdidas' },
            { key: 'pendientes', label: 'Pendientes' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key as typeof filtro)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filtro === f.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar por lotería, modalidad, número o usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg"
        />
      </div>

      {/* Cards para móvil */}
      <div className="lg:hidden space-y-3">
        {filteredApuestas.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center text-gray-500">
            No hay apuestas
          </div>
        ) : (
          filteredApuestas.map((apuesta) => {
            const status = getStatusInfo(apuesta);
            return (
              <div key={apuesta.id} className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm text-gray-500">#{apuesta.id}</span>
                    <p className="font-semibold text-gray-900">{apuesta.loteria_nombre}</p>
                    <p className="text-sm text-gray-500">{usuarios.get(apuesta.usuario) || apuesta.usuario}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {apuesta.combinaciones_generadas && apuesta.combinaciones_generadas.length > 0 ? (
                    apuesta.combinaciones_generadas.map((par, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                        {par[0]}-{par[1]}
                      </span>
                    ))
                  ) : Array.isArray(apuesta.numeros[0]) ? (
                    (apuesta.numeros as unknown as string[][]).map((par, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                        {par[0]}-{par[1]}
                      </span>
                    ))
                  ) : (
                    apuesta.numeros.map((num, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                        {num}
                      </span>
                    ))
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Modalidad</p>
                    <p className="font-medium">{apuesta.modalidad_nombre}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Monto</p>
                    <p className="font-medium">{apuesta.monto_total} CUP</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Premio</p>
                    <p className={`font-medium ${parseFloat(apuesta.premio_total) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {apuesta.premio_total} CUP
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha</p>
                    <p className="font-medium">{formatFecha(apuesta.fecha)}</p>
                  </div>
                </div>
                {apuesta.resultado && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Resultados</p>
                    <div className="flex gap-3 text-sm">
                      {apuesta.resultado.pick_3 && (
                        <span className="font-medium">Pick 3: {apuesta.resultado.pick_3}</span>
                      )}
                      {apuesta.resultado.pick_4 && (
                        <span className="font-medium">Pick 4: {apuesta.resultado.pick_4}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tabla para PC */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Usuario</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Lotería</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Modalidad</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Números</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Monto</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Premio</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Fecha</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApuestas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No hay apuestas
                  </td>
                </tr>
              ) : (
                filteredApuestas.map((apuesta) => {
                  const status = getStatusInfo(apuesta);
                  return (
                    <tr key={apuesta.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm font-medium text-gray-900">#{apuesta.id}</td>
                      <td className="p-4 text-sm text-gray-600">{usuarios.get(apuesta.usuario) || apuesta.usuario}</td>
                      <td className="p-4 text-sm text-gray-900">{apuesta.loteria_nombre}</td>
                      <td className="p-4 text-sm text-gray-600">{apuesta.modalidad_nombre}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {apuesta.combinaciones_generadas && apuesta.combinaciones_generadas.length > 0 ? (
                            apuesta.combinaciones_generadas.map((par, i) => (
                              <span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                {par[0]}-{par[1]}
                              </span>
                            ))
                          ) : Array.isArray(apuesta.numeros[0]) ? (
                            (apuesta.numeros as unknown as string[][]).map((par, i) => (
                              <span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                {par[0]}-{par[1]}
                              </span>
                            ))
                          ) : (
                            apuesta.numeros.map((num, i) => (
                              <span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                {num}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900">{apuesta.monto_total} CUP</td>
                      <td className={`p-4 text-sm font-bold ${parseFloat(apuesta.premio_total) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {apuesta.premio_total} CUP
                      </td>
                      <td className="p-4 text-sm text-gray-600">{formatFecha(apuesta.fecha)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminApuestas;
