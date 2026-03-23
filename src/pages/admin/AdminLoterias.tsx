import React, { useState, useEffect, useRef } from 'react';
import { lotteryService } from '../../services/api';
import api from '../../services/api';
import './AdminLoterias.css';

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

      if (false) { // editingId - not implemented yet
        await api.patch(`/loterias/loterias/${0}/`, formDataToSend);
      } else {
        await api.post('/loterias/loterias/', formDataToSend);
      }
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
    return <div className="admin-loterias">Cargando...</div>;
  }

  return (
    <div className="admin-loterias">
      <h2>Gestión de Loterías</h2>
      
      <button onClick={() => setShowForm(!showForm)} className="btn-add">
        {showForm ? 'Cancelar' : 'Nueva Lotería'}
      </button>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="loteria-form">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Nombre de la lotería"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Imagen</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
              />
              Activa
            </label>
          </div>
          <button type="submit">Guardar</button>
        </form>
      )}
      
      <div className="loterias-grid">
        {loterias.map((loteria) => (
          <div key={loteria.id} className="loteria-card">
            <div className="loteria-img">
              {loteria.foto ? (
                <img src={loteria.foto} alt={loteria.nombre} />
              ) : (
                <div className="loteria-img-placeholder">📷</div>
              )}
            </div>
            <div className="loteria-info">
              <h3>{loteria.nombre}</h3>
              <span className={`estado ${loteria.activa ? 'activa' : 'inactiva'}`}>
                {loteria.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="loteria-actions">
              <button onClick={() => handleToggleActiva(loteria)}>
                {loteria.activa ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => handleDelete(loteria.id)} className="btn-delete">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLoterias;
