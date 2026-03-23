import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lotteryService, apuestaService } from '../../services/api';
import './Betting.css';

interface Loteria {
  id: number;
  nombre: string;
  foto: string;
  activa: boolean;
}

interface Tirada {
  id: number;
  loteria: number;
  loteria_nombre: string;
  hora: string;
  activa: boolean;
}

interface Modalidad {
  id: number;
  nombre: string;
  premio_por_peso: number;
}

const Betting: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loterias, setLoterias] = useState<Loteria[]>([]);
  const [tiradas, setTiradas] = useState<Tirada[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  
  const [selectedLoteria, setSelectedLoteria] = useState<number | null>(null);
  const [selectedTirada, setSelectedTirada] = useState<number | null>(null);
  const [selectedModalidad, setSelectedModalidad] = useState<number | null>(null);
  
  const [numeros, setNumeros] = useState<string[]>([]);
  const [numeroInput, setNumeroInput] = useState('');
  const [montoPorNumero, setMontoPorNumero] = useState<number>(10);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLoterias();
    loadModalidades();
  }, []);

  useEffect(() => {
    if (selectedLoteria) {
      loadTiradasPorLoteria();
    } else {
      setTiradas([]);
      setSelectedTirada(null);
    }
  }, [selectedLoteria]);

  const loadLoterias = async () => {
    try {
      const data = await lotteryService.getLoterias();
      const arr = Array.isArray(data) ? data : (data as { results?: Loteria[] }).results || [];
      const activas = arr.filter((l: Loteria) => l.activa);
      setLoterias(activas);
    } catch (err) {
      console.error('Error loading loterias:', err);
    }
  };

  const loadModalidades = async () => {
    try {
      const data = await lotteryService.getModalidades();
      const arr = Array.isArray(data) ? data : (data as { results?: Modalidad[] }).results || [];
      setModalidades(arr);
    } catch (err) {
      console.error('Error loading modalidades:', err);
    }
  };

  const loadTiradasPorLoteria = async () => {
    try {
      const data = await lotteryService.getTiradas();
      const arr = Array.isArray(data) ? data : (data as { results?: Tirada[] }).results || [];
      const filtradas = arr.filter((t: Tirada) => t.loteria === selectedLoteria && t.activa);
      setTiradas(filtradas);
    } catch (err) {
      console.error('Error loading tiradas:', err);
    }
  };

  const agregarNumero = () => {
    const num = numeroInput.trim();
    if (num.length !== 3) {
      setError('El número debe tener exactamente 3 dígitos');
      return;
    }
    if (numeros.includes(num)) {
      setError('El número ya está agregado');
      return;
    }
    if (numeros.length >= 10) {
      setError('Máximo 10 números por apuesta');
      return;
    }
    setNumeros([...numeros, num]);
    setNumeroInput('');
    setError('');
  };

  const eliminarNumero = (num: string) => {
    setNumeros(numeros.filter((n) => n !== num));
  };

  const montoTotal = numeros.length * montoPorNumero;

  const handleApostar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!selectedTirada || !selectedModalidad) {
      setError('Por favor complete todos los campos');
      setLoading(false);
      return;
    }

    if (numeros.length === 0) {
      setError('Agregue al menos un número');
      setLoading(false);
      return;
    }

    if (montoTotal > (user?.saldo_principal || 0)) {
      setError('Saldo insuficiente');
      setLoading(false);
      return;
    }

    try {
      await apuestaService.createApuesta({
        tirada_id: selectedTirada,
        modalidad_id: selectedModalidad,
        numeros: numeros,
        monto_por_numero: montoPorNumero,
      });
      setMessage('Apuesta realizada con éxito');
      await refreshUser();
      setNumeros([]);
      setNumeroInput('');
      setSelectedTirada(null);
      setSelectedModalidad(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al realizar apuesta';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || typeof user.saldo_principal !== 'number') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="betting-page">
      <h2>Realizar Apuesta</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleApostar} className="betting-form">
        <div className="selection-step">
          <h3>1. Selecciona una Lotería</h3>
          <div className="loterias-grid">
            {loterias.map((loteria) => (
              <div
                key={loteria.id}
                className={`loteria-option ${selectedLoteria === loteria.id ? 'selected' : ''}`}
                onClick={() => setSelectedLoteria(loteria.id)}
              >
                {loteria.foto ? (
                  <img src={loteria.foto} alt={loteria.nombre} />
                ) : (
                  <div className="loteria-placeholder">{loteria.nombre.charAt(0)}</div>
                )}
                <span>{loteria.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedLoteria && (
          <div className="selection-step">
            <h3>2. Selecciona el Horario</h3>
            <div className="form-group">
              <select
                value={selectedTirada || ''}
                onChange={(e) => setSelectedTirada(Number(e.target.value) || null)}
                required
              >
                <option value="">Seleccionar Horario</option>
                {tiradas.map((tirada) => (
                  <option key={tirada.id} value={tirada.id}>
                    {tirada.hora}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedTirada && (
          <div className="selection-step">
            <h3>3. Selecciona la Modalidad</h3>
            <div className="form-group">
              <select
                value={selectedModalidad || ''}
                onChange={(e) => setSelectedModalidad(Number(e.target.value) || null)}
                required
              >
                <option value="">Seleccionar Modalidad</option>
                {modalidades.map((modalidad) => (
                  <option key={modalidad.id} value={modalidad.id}>
                    {modalidad.nombre} (Premio: {modalidad.premio_por_peso}x)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedModalidad && (
          <>
            <div className="numeros-section">
              <h3>4. Ingresa tus números (3 dígitos cada uno)</h3>
              <div className="numeros-input">
                <input
                  type="text"
                  value={numeroInput}
                  onChange={(e) => setNumeroInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="123"
                  maxLength={3}
                />
                <button type="button" onClick={agregarNumero} className="btn-agregar">
                  Agregar
                </button>
              </div>
              
              <div className="numeros-list">
                {numeros.map((num) => (
                  <div key={num} className="numero-card">
                    <span>{num}</span>
                    <button type="button" onClick={() => eliminarNumero(num)} className="btn-eliminar">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="monto-section">
              <div className="form-group">
                <label>Monto por número</label>
                <input
                  type="number"
                  value={montoPorNumero}
                  onChange={(e) => setMontoPorNumero(Number(e.target.value))}
                  min="1"
                  required
                />
              </div>
              <div className="monto-total">
                <p>Monto total: <strong>{montoTotal.toFixed(2)} CUP</strong></p>
                <p className="saldo-actual">Saldo disponible: {user.saldo_principal.toFixed(2)} CUP</p>
              </div>
            </div>

            <button type="submit" disabled={loading || numeros.length === 0} className="btn-apostar">
              {loading ? 'Procesando...' : `APOSTAR ${montoTotal.toFixed(2)} CUP`}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default Betting;
