import React, { useState, useEffect } from 'react';
import { lotteryService, resultadoService } from '../../services/api';
import './AdminResultados.css';

interface Tirada {
  id: number;
  loteria_nombre?: string;
  hora: string;
  fecha: string;
  activa: boolean;
  pick_3?: string;
  pick_4?: string;
}

const AdminResultados: React.FC = () => {
  const [tiradas, setTiradas] = useState<Tirada[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tirada_id: 0,
    pick_3: '',
    pick_4: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTiradas();
  }, []);

  const loadTiradas = async () => {
    try {
      const data = await lotteryService.getTiradasActivas();
      const arr = Array.isArray(data) ? data : (data as { results?: Tirada[] }).results || [];
      setTiradas(arr);
    } catch (err) {
      console.error('Error loading tiradas:', err);
    } finally {
      setLoading(false);
    }
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
      await loadTiradas();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al ingresar resultados';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-resultados">Cargando...</div>;
  }

  return (
    <div className="admin-resultados">
      <h2>Ingresar Resultados</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="resultados-form">
        <div className="form-group">
          <label>Tirada</label>
          <select
            value={formData.tirada_id}
            onChange={(e) => setFormData({ ...formData, tirada_id: Number(e.target.value) })}
            required
          >
            <option value={0}>Seleccionar Tirada</option>
            {tiradas.map((tirada) => (
              <option key={tirada.id} value={tirada.id}>
                {tirada.loteria_nombre} - {tirada.hora} - {tirada.fecha}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Pick 3</label>
          <input
            type="text"
            value={formData.pick_3}
            onChange={(e) => setFormData({ ...formData, pick_3: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            placeholder="3 dígitos"
            maxLength={3}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Pick 4</label>
          <input
            type="text"
            value={formData.pick_4}
            onChange={(e) => setFormData({ ...formData, pick_4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            placeholder="4 dígitos"
            maxLength={4}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Resultados'}
        </button>
      </form>
    </div>
  );
};

export default AdminResultados;
