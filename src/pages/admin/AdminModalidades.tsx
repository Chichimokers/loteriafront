import React, { useState, useEffect } from 'react';
import { lotteryService, modalidadService } from '../../services/api';
import { RefreshCw, FileText } from 'lucide-react';

interface Modalidad {
  id: number;
  nombre: string;
  descripcion: string;
  premio_por_peso: number;
}

const AdminModalidades: React.FC = () => {
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ premio_por_peso: 600 });

  useEffect(() => {
    loadModalidades();
  }, []);

  const loadModalidades = async () => {
    try {
      const data = await lotteryService.getModalidades();
      const arr = Array.isArray(data) ? data : (data as { results?: Modalidad[] }).results || [];
      setModalidades(arr);
    } catch (err) {
      console.error('Error loading modalidades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (modalidad: Modalidad) => {
    setEditingId(modalidad.id);
    setEditData({ premio_por_peso: modalidad.premio_por_peso });
  };

  const handleSave = async (id: number) => {
    try {
      await modalidadService.updateModalidad(id, editData);
      await loadModalidades();
      setEditingId(null);
    } catch (err) {
      console.error('Error updating modalidad:', err);
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
        <h1 className="text-2xl font-bold text-gray-900">Modalidades</h1>
        <button onClick={loadModalidades} className="btn btn-ghost">
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {modalidades.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">No hay modalidades configuradas</p>
        </div>
      ) : (
        <>
          {/* Tabla PC */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">ID</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Nombre</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Descripción</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Premio por Peso</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {modalidades.map((modalidad) => (
                  <tr key={modalidad.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-900">{modalidad.id}</td>
                    <td className="p-4 text-sm font-medium text-gray-900">{modalidad.nombre}</td>
                    <td className="p-4 text-sm text-gray-600">{modalidad.descripcion}</td>
                    <td className="p-4 text-sm">
                      {editingId === modalidad.id ? (
                        <input
                          type="number"
                          value={editData.premio_por_peso}
                          onChange={(e) => setEditData({ premio_por_peso: Number(e.target.value) })}
                          className="w-24 p-2 border border-gray-200 rounded-lg"
                        />
                      ) : (
                        <span className="font-bold text-indigo-500">{modalidad.premio_por_peso}x</span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === modalidad.id ? (
                        <button
                          onClick={() => handleSave(modalidad.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium"
                        >
                          Guardar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(modalidad)}
                          className="px-3 py-1 bg-indigo-500 text-white rounded text-xs font-medium"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards Móvil */}
          <div className="lg:hidden space-y-3">
            {modalidades.map((modalidad) => (
              <div key={modalidad.id} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{modalidad.nombre}</p>
                    <p className="text-sm text-gray-500">{modalidad.descripcion}</p>
                  </div>
                  <span className="text-xs text-gray-400">ID: {modalidad.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Premio por Peso</p>
                    {editingId === modalidad.id ? (
                      <input
                        type="number"
                        value={editData.premio_por_peso}
                        onChange={(e) => setEditData({ premio_por_peso: Number(e.target.value) })}
                        className="w-20 p-1 border border-gray-200 rounded text-lg font-bold"
                      />
                    ) : (
                      <p className="text-lg font-bold text-indigo-500">{modalidad.premio_por_peso}x</p>
                    )}
                  </div>
                  {editingId === modalidad.id ? (
                    <button
                      onClick={() => handleSave(modalidad.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
                    >
                      Guardar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(modalidad)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminModalidades;
