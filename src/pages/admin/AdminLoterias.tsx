import React, { useState, useEffect, useRef } from 'react';
import { lotteryService } from '../../services/api';
import api from '../../services/api';

interface Loteria {
  id: number;
  nombre: string;
  foto: string;
  activa: boolean;
}

const AdminLoterias: React.FC = () => {
  const [loterias, setLoterias] = useState<Loteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', activa: true });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLoterias();
  }, []);

  const loadLoterias = async () => {
    try {
      const data = await lotteryService.getLoterias();
      const arr = Array.isArray(data) ? data : (data as { results?: Loteria[] }).results || [];
      setLoterias(arr);
    } catch (err) {
      console.error('Error loading loterias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('activa', String(formData.activa));
      if (fotoFile) {
        formDataToSend.append('foto', fotoFile);
      }

      await api.post('/loterias/loterias/', formDataToSend);
      await loadLoterias();
      setShowForm(false);
      setFormData({ nombre: '', activa: true });
      setFotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error saving loteria:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta lotería?')) return;
    try {
      await api.delete(`/loterias/loterias/${id}/`);
      await loadLoterias();
    } catch (err) {
      console.error('Error deleting loteria:', err);
    }
  };

  const handleToggleActiva = async (loteria: Loteria) => {
    try {
      await api.patch(`/loterias/loterias/${loteria.id}/`, { activa: !loteria.activa });
      await loadLoterias();
    } catch (err) {
      console.error('Error toggling loteria:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFotoFile(e.target.files[0]);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Loterías</h1>
        <button onClick={loadLoterias} className="btn btn-ghost">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
      >
        {showForm ? 'Cancelar' : '+ Nueva Lotería'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input
              type="text"
              placeholder="Nombre de la lotería"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activa"
              checked={formData.activa}
              onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor="activa" className="text-sm font-medium text-gray-700">Activa</label>
          </div>
          <button type="submit" className="w-full py-2 bg-success text-white rounded-lg font-medium">
            Guardar
          </button>
        </form>
      )}

      {loterias.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center">
          <span className="text-4xl">🎰</span>
          <p className="mt-2 text-gray-600">No hay loterías configuradas</p>
        </div>
      ) : (
        <>
          {/* Grid PC */}
          <div className="hidden lg:grid grid-cols-3 gap-4">
            {loterias.map((loteria) => (
              <div key={loteria.id} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {loteria.foto ? (
                    <img src={loteria.foto} alt={loteria.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">📷</span>
                  )}
                </div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">{loteria.nombre}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${loteria.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {loteria.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActiva(loteria)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${loteria.activa ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {loteria.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(loteria.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cards Móvil */}
          <div className="lg:hidden space-y-3">
            {loterias.map((loteria) => (
              <div key={loteria.id} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {loteria.foto ? (
                      <img src={loteria.foto} alt={loteria.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📷</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-900">{loteria.nombre}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${loteria.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {loteria.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActiva(loteria)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${loteria.activa ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                      >
                        {loteria.activa ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(loteria.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminLoterias;
