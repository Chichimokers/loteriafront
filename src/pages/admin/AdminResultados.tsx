import React, { useState, useEffect, useMemo } from 'react';
import { lotteryService, resultadoService } from '../../services/api';
import './AdminResultados.css';

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
    return <div className="admin-resultados">Cargando...</div>;
  }

  return (
    <div className="admin-resultados">
      <h2>Ingresar Resultados</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="resultados-form">
        <div className="form-group">
          <label>Seleccionar Lotería</label>
          <select
            value={selectedLoteria === 0 ? '' : selectedLoteria}
            onChange={(e) => handleLoteriaChange(Number(e.target.value))}
            required
          >
            <option value="">-- Seleccionar Lotería --</option>
            {Array.from(tiradasPorLoteria.keys()).map((loteriaNombre) => (
              <option key={loteriaNombre} value={tiradasPorLoteria.get(loteriaNombre)?.[0]?.id || ''}>
                {loteriaNombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Seleccionar Horario</label>
          <div className="horarios-grid">
            {tiradasFiltradas.length === 0 ? (
              <p className="no-horarios">Seleccione primero una lotería</p>
            ) : (
              tiradasFiltradas.map((tirada) => (
                <button
                  key={tirada.id}
                  type="button"
                  className={`horario-btn ${formData.tirada_id === tirada.id ? 'selected' : ''}`}
                  onClick={() => handleTiradaChange(tirada.id)}
                >
                  <span className="horario-hora">{formatHora(tirada.hora)}</span>
                  {tirada.resultado_hoy && <span className="horario-check">✓</span>}
                </button>
              ))
            )}
          </div>
          {formData.tirada_id === 0 && selectedLoteria !== 0 && (
            <p className="horario-required">Seleccione un horario</p>
          )}
        </div>

        {formData.tirada_id > 0 && (
          <div className="tirada-seleccionada-info">
            <span className="info-icon">✓</span>
            <span>{getTiradaSeleccionada()?.loteria_nombre} - {formatHora(getTiradaSeleccionada()?.hora || '')}</span>
          </div>
        )}
        
        <div className="picks-inputs">
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
        </div>
        
        <button type="submit" disabled={loading || formData.tirada_id === 0}>
          {loading ? 'Guardando...' : 'Guardar Resultados'}
        </button>
      </form>

      <div className="historico-section">
        <h3>Resultados de Hoy</h3>
        
        {tiradas.length === 0 ? (
          <p className="no-resultados">No hay tiradas activas</p>
        ) : (
          <table className="historico-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lotería</th>
                <th>Hora</th>
                <th>Pick 3</th>
                <th>Pick 4</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tiradas.map((tirada) => (
                <tr key={tirada.id} className={tirada.resultado_hoy ? '' : 'row-pendiente'}>
                  <td>{tirada.id}</td>
                  <td>{tirada.loteria_nombre}</td>
                  <td>{formatHora(tirada.hora)}</td>
                  <td>
                    {tirada.resultado_hoy ? (
                      <span className="pick-display pick-3">
                        {(tirada.resultado_hoy.pick_3 || '').split('').map((d, i) => (
                          <span key={i} className="digit">{d}</span>
                        ))}
                      </span>
                    ) : (
                      <span className="badge-pendiente">Sin resultado</span>
                    )}
                  </td>
                  <td>
                    {tirada.resultado_hoy ? (
                      <span className="pick-display pick-4">
                        {(tirada.resultado_hoy.pick_4 || '').split('').map((d, i) => (
                          <span key={i} className="digit">{d}</span>
                        ))}
                      </span>
                    ) : (
                      <span className="badge-pendiente">Sin resultado</span>
                    )}
                  </td>
                  <td>
                    {tirada.resultado_hoy ? (
                      <span className="badge-completo">Completo</span>
                    ) : (
                      <span className="badge-pendiente">Pendiente</span>
                    )}
                  </td>
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
