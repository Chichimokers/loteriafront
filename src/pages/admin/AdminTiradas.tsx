import React, { useState, useEffect } from 'react';
import { lotteryService } from '../../services/api';
import api from '../../services/api';
import { RefreshCw, Clock, Trash2, Pause, Play } from 'lucide-react';
import { formatHora } from '../../utils/format';

interface Tirada {
  id: number;
  loteria: number;
  loteria_nombre?: string;
  hora: string;
  activa: boolean;
}

const AdminTiradas: React.FC = () => {
  const [tiradas, setTiradas] = useState<Tirada[]>([]);
  const [loterias, setLoterias] = useState<Array<{id: number; nombre: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    loteria_id: 0,
    hora: '',
    activa: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tiradasData, loteriasData] = await Promise.all([
        lotteryService.getTiradas(),
        lotteryService.getLoterias(),
      ]);
      const tiradasArr = Array.isArray(tiradasData) ? tiradasData : (tiradasData as { results?: Tirada[] }).results || [];
      const loteriasArr = Array.isArray(loteriasData) ? loteriasData : (loteriasData as { results?: Array<{id: number; nombre: string}> }).results || [];
      setTiradas(tiradasArr);
      setLoterias(loteriasArr);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/loterias/tiradas/', { loteria: formData.loteria_id, hora: formData.hora, activa: formData.activa });
      await loadData();
      setShowForm(false);
      setFormData({ loteria_id: 0, hora: '', activa: true });
    } catch (err) {
      console.error('Error saving tirada:', err);
    }
  };

  const handleToggleActiva = async (tirada: Tirada) => {
    try {
      await api.patch(`/loterias/tiradas/${tirada.id}/`, { activa: !tirada.activa });
      await loadData();
    } catch (err) {
      console.error('Error toggling tirada:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta tirada?')) return;
    try {
      await api.delete(`/loterias/tiradas/${id}/`);
      await loadData();
    } catch (err) {
      console.error('Error deleting tirada:', err);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Tiradas</h1>
        <button onClick={loadData} className="btn btn-ghost">
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium"
      >
        {showForm ? '✕ Cancelar' : '+ Nueva Tirada'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lotería</label>
              <select
                value={formData.loteria_id}
                onChange={(e) => setFormData({ ...formData, loteria_id: Number(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              >
                <option value={0}>Seleccionar...</option>
                {loterias.map((l) => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="activa"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                className="w-5 h-5 accent-indigo-500"
              />
              <label htmlFor="activa" className="text-sm font-medium text-gray-700">Activa</label>
            </div>
          </div>
          <button type="submit" className="w-full md:w-auto px-6 py-2 bg-green-500 text-white rounded-lg font-medium">
            Guardar
          </button>
        </form>
      )}

      {tiradas.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center">
          <Clock className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">No hay tiradas configuradas</p>
        </div>
      ) : (
        <>
          {/* Tabla PC */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">ID</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Lotería</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Hora</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tiradas.map((tirada) => (
                  <tr key={tirada.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-900">{tirada.id}</td>
                    <td className="p-4 text-sm text-gray-900">{tirada.loteria_nombre || tirada.loteria}</td>
                    <td className="p-4 text-sm text-gray-600">{formatHora(tirada.hora)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tirada.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tirada.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActiva(tirada)}
                          className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${tirada.activa ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {tirada.activa ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {tirada.activa ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(tirada.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards Móvil */}
          <div className="lg:hidden space-y-3">
            {tiradas.map((tirada) => (
              <div key={tirada.id} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{tirada.loteria_nombre || tirada.loteria}</p>
                    <p className="text-sm text-gray-500">ID: {tirada.id} • {formatHora(tirada.hora)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${tirada.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {tirada.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActiva(tirada)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${tirada.activa ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {tirada.activa ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {tirada.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(tirada.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTiradas;
