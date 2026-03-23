import React, { useState, useEffect } from 'react';
import { lotteryService } from '../../services/api';
import api from '../../services/api';
import './AdminLoterias.css';

interface Loteria {
  id: number;
  nombre: string;
  foto: string;
}

const AdminLoterias: React.FC = () => {
  const [loterias, setLoterias] = useState<Loteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', foto: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadLoterias();
  }, []);

  const loadLoterias = async () => {
    try {
      const data = await lotteryService.getLoterias();
      setLoterias(data as Loteria[]);
    } catch (err) {
      console.error('Error loading loterias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/loterias/loterias/${editingId}/`, formData);
      } else {
        await api.post('/loterias/loterias/', formData);
      }
      await loadLoterias();
      setShowForm(false);
      setFormData({ nombre: '', foto: '' });
      setEditingId(null);
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

  if (loading) {
    return <div className="admin-loterias">Cargando...</div>;
  }

  return (
    <div className="admin-loterias">
      <h2>Gestión de Loterías</h2>
      
      <button onClick={() => setShowForm(!showForm)} className="btn-add">
        {showForm ? 'Cancelar' : 'Nueva Lotería'}
      </button>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="form-inline">
          <input
            type="text"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="URL de Foto"
            value={formData.foto}
            onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
          />
          <button type="submit">Guardar</button>
        </form>
      )}
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Foto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loterias.map((loteria) => (
            <tr key={loteria.id}>
              <td>{loteria.id}</td>
              <td>{loteria.nombre}</td>
              <td>{loteria.foto || '-'}</td>
              <td>
                <button onClick={() => handleDelete(loteria.id)} className="btn-delete">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminLoterias;
