import React, { useState, useEffect, useMemo } from 'react';
import { lotteryService, resultadoService } from '../../services/api';

interface ResultadoHoy {
  pick_3: string;
  pick_4: string;
  fecha: string;
}

interface Tirada {
  id: number;
  loteria: number;
  loteria_nombre: string;
  hora: string;
  activa: boolean;
  resultado_hoy: ResultadoHoy | null;
}

const AdminResultados: React.FC = () => {
  const [tiradas, setTiradas] = useState<Tirada[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tirada_id: 0,
    pick_3: '',
    pick_4: '',
  });
  const [selectedLoteria, setSelectedLoteria] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tiradasData = await lotteryService.getTiradasActivas();
      const tiradasArr = Array.isArray(tiradasData) ? tiradasData : (tiradasData as { results?: Tirada[] }).results || [];
      setTiradas(tiradasArr);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const tiradasPorLoteria = useMemo(() => {
    const grouped = new Map<string, Tirada[]>();
    tiradas.forEach((tirada) => {
      if (!grouped.has(tirada.loteria_nombre)) {
        grouped.set(tirada.loteria_nombre, []);
      }
      grouped.get(tirada.loteria_nombre)!.push(tirada);
    });
    grouped.forEach((tiradasList) => {
      tiradasList.sort((a, b) => a.hora.localeCompare(b.hora));
    });
    return grouped;
  }, [tiradas]);

  const tiradasFiltradas = useMemo(() => {
    if (selectedLoteria === 0) return [];
    const tirada = tiradas.find(t => t.id === selectedLoteria);
    if (!tirada) return [];
    return tiradas.filter(t => t.loteria_nombre === tirada.loteria_nombre);
  }, [tiradas, selectedLoteria]);

  const handleLoteriaChange = (loteriaId: number) => {
    setSelectedLoteria(loteriaId);
    setFormData({ ...formData, tirada_id: 0 });
  };

  const handleTiradaChange = (tiradaId: number) => {
    setFormData({ ...formData, tirada_id: tiradaId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resultadoService.createResultado(formData);
      setMessage('Resultados ingresados correctamente');
      setFormData({ tirada_id: 0, pick_3: '', pick_4: '' });
      setSelectedLoteria(0);
      await loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al ingresar resultados';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTiradaSeleccionada = () => {
    return tiradas.find(t => t.id === formData.tirada_id);
  };

  const formatHora = (hora: string | undefined | null) => {
    if (!hora) return '-';
    return String(hora).substring(0, 5);
  };

  if (loading && tiradas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Resultados</h1>
        <button onClick={loadData} className="btn btn-ghost">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {message && (
        <div className="bg-success/10 text-success p-3 rounded-lg text-sm font-medium">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Lotería</label>
          <select
            value={selectedLoteria === 0 ? '' : selectedLoteria}
            onChange={(e) => handleLoteriaChange(Number(e.target.value))}
            className="w-full p-3 border border-gray-200 rounded-lg"
          >
            <option value="">-- Seleccionar Lotería --</option>
            {Array.from(tiradasPorLoteria.keys()).map((loteriaNombre) => (
              <option key={loteriaNombre} value={tiradasPorLoteria.get(loteriaNombre)?.[0]?.id || ''}>
                {loteriaNombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Horario</label>
          <div className="flex flex-wrap gap-2">
            {tiradasFiltradas.length === 0 ? (
              <p className="text-gray-500 text-sm">Seleccione primero una lotería</p>
            ) : (
              tiradasFiltradas.map((tirada) => (
                <button
                  key={tirada.id}
                  type="button"
                  onClick={() => handleTiradaChange(tirada.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.tirada_id === tirada.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formatHora(tirada.hora)}
                  {tirada.resultado_hoy && <span className="ml-1">✓</span>}
                </button>
              ))
            )}
          </div>
          {formData.tirada_id === 0 && selectedLoteria !== 0 && (
            <p className="text-yellow-600 text-sm mt-1">Seleccione un horario</p>
          )}
        </div>

        {formData.tirada_id > 0 && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
            <span>✓</span>
            <span>{getTiradaSeleccionada()?.loteria_nombre} - {formatHora(getTiradaSeleccionada()?.hora || '')}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pick 3</label>
            <input
              type="text"
              value={formData.pick_3}
              onChange={(e) => setFormData({ ...formData, pick_3: e.target.value.replace(/\D/g, '').slice(0, 3) })}
              placeholder="3 dígitos"
              maxLength={3}
              className="w-full p-3 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pick 4</label>
            <input
              type="text"
              value={formData.pick_4}
              onChange={(e) => setFormData({ ...formData, pick_4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder="4 dígitos"
              maxLength={4}
              className="w-full p-3 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || formData.tirada_id === 0}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Resultados'}
        </button>
      </div>

      {/* Resultados de Hoy - Tabla PC */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 p-4 border-b">Resultados de Hoy</h2>
        
        {tiradas.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl">🏆</span>
            <p className="mt-2 text-gray-600">No hay tiradas activas</p>
          </div>
        ) : (
          <>
            {/* Tabla - PC */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">ID</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Lotería</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Hora</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Pick 3</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Pick 4</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tiradas.map((tirada) => (
                    <tr key={tirada.id} className={!tirada.resultado_hoy ? 'bg-yellow-50' : ''}>
                      <td className="p-4 text-sm text-gray-900">{tirada.id}</td>
                      <td className="p-4 text-sm text-gray-900">{tirada.loteria_nombre}</td>
                      <td className="p-4 text-sm text-gray-600">{formatHora(tirada.hora)}</td>
                      <td className="p-4">
                        {tirada.resultado_hoy ? (
                          <div className="flex gap-1">
                            {(tirada.resultado_hoy.pick_3 || '').split('').map((d, i) => (
                              <span key={i} className="w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendiente</span>
                        )}
                      </td>
                      <td className="p-4">
                        {tirada.resultado_hoy ? (
                          <div className="flex gap-1">
                            {(tirada.resultado_hoy.pick_4 || '').split('').map((d, i) => (
                              <span key={i} className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendiente</span>
                        )}
                      </td>
                      <td className="p-4">
                        {tirada.resultado_hoy ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completo</span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards - Móvil */}
            <div className="lg:hidden space-y-3 p-4">
              {tiradas.map((tirada) => (
                <div key={tirada.id} className={`p-4 rounded-xl ${tirada.resultado_hoy ? 'bg-white border' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{tirada.loteria_nombre}</p>
                      <p className="text-sm text-gray-500">{formatHora(tirada.hora)}</p>
                    </div>
                    {tirada.resultado_hoy ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completo</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendiente</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pick 3</p>
                      {tirada.resultado_hoy ? (
                        <div className="flex gap-1">
                          {(tirada.resultado_hoy.pick_3 || '').split('').map((d, i) => (
                            <span key={i} className="w-7 h-7 bg-amber-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pick 4</p>
                      {tirada.resultado_hoy ? (
                        <div className="flex gap-1">
                          {(tirada.resultado_hoy.pick_4 || '').split('').map((d, i) => (
                            <span key={i} className="w-7 h-7 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminResultados;
