import React, { useState, useEffect } from 'react';
import { lotteryService, resultadoService } from '../../services/api';
import './AdminResultados.css';

interface Tirada {
  id: number;
  loteria: number;
  loteria_nombre: string;
  hora: string;
  activa: boolean;
}

interface Resultado {
  id: number;
  tirada: number;
  tirada_info?: {
    loteria_nombre: string;
    hora: string;
  };
  loteria_nombre?: string;
  hora?: string;
  pick_3: string;
  pick_4: string;
  fecha: string;
}

const AdminResultados: React.FC = () => {
  const [tiradas, setTiradas] = useState<Tirada[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tirada_id: 0,
    pick_3: '',
    pick_4: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tiradasData, resultadosData] = await Promise.all([
        lotteryService.getTiradasActivas(),
        resultadoService.getResultados(),
      ]);
      
      const tiradasArr = Array.isArray(tiradasData) ? tiradasData : (tiradasData as { results?: Tirada[] }).results || [];
      setTiradas(tiradasArr);
      
      const resultadosArr = Array.isArray(resultadosData) ? resultadosData : (resultadosData as { results?: Resultado[] }).results || [];
      setResultados(resultadosArr);
    } catch (err) {
      console.error('Error loading data:', err);
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
      await loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al ingresar resultados';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getLoteriaNombre = (resultado: Resultado) => {
    return resultado.tirada_info?.loteria_nombre || resultado.loteria_nombre || '-';
  };

  const getHora = (resultado: Resultado) => {
    return resultado.tirada_info?.hora || resultado.hora || '-';
  };

  if (loading && tiradas.length === 0) {
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
                {tirada.loteria_nombre} - {tirada.hora}
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

      <div className="historico-section">
        <h3>Histórico de Resultados</h3>
        
        {resultados.length === 0 ? (
          <p className="no-resultados">No hay resultados registrados</p>
        ) : (
          <table className="historico-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lotería</th>
                <th>Hora</th>
                <th>Pick 3</th>
                <th>Pick 4</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((resultado) => (
                <tr key={resultado.id}>
                  <td>{resultado.id}</td>
                  <td>{getLoteriaNombre(resultado)}</td>
                  <td>{getHora(resultado)}</td>
                  <td>
                    <span className="pick-display pick-3">
                      {(resultado.pick_3 || '').split('').map((d, i) => (
                        <span key={i} className="digit">{d}</span>
                      ))}
                    </span>
                  </td>
                  <td>
                    <span className="pick-display pick-4">
                      {(resultado.pick_4 || '').split('').map((d, i) => (
                        <span key={i} className="digit">{d}</span>
                      ))}
                    </span>
                  </td>
                  <td>{new Date(resultado.fecha).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminResultados;
