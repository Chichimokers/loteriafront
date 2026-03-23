import React, { useState, useEffect } from 'react';
import { lotteryService, modalidadService } from '../../services/api';
import './AdminTables.css';

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
    return <div className="admin-modalidades">Cargando...</div>;
  }

  return (
    <div className="admin-modalidades">
      <h2>Gestión de Modalidades</h2>
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>Modalidad</th>
            <th>Premio por Peso</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {modalidades.map((modalidad) => (
            <tr key={modalidad.id}>
              <td>{modalidad.nombre}</td>
              <td>
                {editingId === modalidad.id ? (
                  <input
                    type="number"
                    value={editData.premio_por_peso}
                    onChange={(e) => setEditData({ ...editData, premio_por_peso: Number(e.target.value) })}
                  />
                ) : (
                  modalidad.premio_por_peso
                )}
              </td>
              <td>{modalidad.descripcion}</td>
              <td>
                {editingId === modalidad.id ? (
                  <button onClick={() => handleSave(modalidad.id)}>Guardar</button>
                ) : (
                  <button onClick={() => handleEdit(modalidad)}>Editar Premio</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminModalidades;
