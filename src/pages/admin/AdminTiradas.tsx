import React, { useState, useEffect } from 'react';
import { lotteryService } from '../../services/api';
import api from '../../services/api';
import './AdminTables.css';

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
    return <div className="admin-tiradas">Cargando...</div>;
  }

  return (
    <div className="admin-tiradas">
      <h2>Gestión de Tiradas</h2>
      
      <button onClick={() => setShowForm(!showForm)} className="btn-add">
        {showForm ? 'Cancelar' : 'Nueva Tirada'}
      </button>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="form-inline">
          <select
            value={formData.loteria_id}
            onChange={(e) => setFormData({ ...formData, loteria_id: Number(e.target.value) })}
            required
          >
            <option value={0}>Seleccionar Lotería</option>
            {loterias.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </select>
          <input
            type="time"
            value={formData.hora}
            onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
            required
          />
          <label>
            <input
              type="checkbox"
              checked={formData.activa}
              onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
            />
            Activa
          </label>
          <button type="submit">Guardar</button>
        </form>
      )}
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Lotería</th>
            <th>Hora</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tiradas.map((tirada) => (
            <tr key={tirada.id}>
              <td>{tirada.id}</td>
              <td>{tirada.loteria_nombre || tirada.loteria}</td>
              <td>{tirada.hora}</td>
              <td>{tirada.activa ? 'Activa' : 'Inactiva'}</td>
              <td>
                <button onClick={() => handleToggleActiva(tirada)}>
                  {tirada.activa ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => handleDelete(tirada.id)} className="btn-delete">
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

export default AdminTiradas;
