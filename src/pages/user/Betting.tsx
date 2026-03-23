import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lotteryService, apuestaService } from '../../services/api';
import './Betting.css';

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
  const [tiradas, setTiradas] = useState<Tirada[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  
  const [selectedTirada, setSelectedTirada] = useState<number | null>(null);
  const [selectedModalidad, setSelectedModalidad] = useState<number | null>(null);
  
  const [numeros, setNumeros] = useState<string[]>([]);
  const [numeroInput, setNumeroInput] = useState('');
  const [montoPorNumero, setMontoPorNumero] = useState<number>(10);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tiradasData, modalidadesData] = await Promise.all([
        lotteryService.getTiradasActivas(),
        lotteryService.getModalidades(),
      ]);
      const tiradasArr = Array.isArray(tiradasData) ? tiradasData : (tiradasData as { results?: Tirada[] }).results || [];
      const modalidadesArr = Array.isArray(modalidadesData) ? modalidadesData : (modalidadesData as { results?: Modalidad[] }).results || [];
      setTiradas(tiradasArr);
      setModalidades(modalidadesArr);
    } catch (err) {
      console.error('Error loading data:', err);
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
        <div className="form-row">
          <div className="form-group">
            <label>Seleccionar Tirada</label>
            <select
              value={selectedTirada || ''}
              onChange={(e) => setSelectedTirada(Number(e.target.value) || null)}
              required
            >
              <option value="">Seleccionar Horario</option>
              {tiradas.map((tirada) => (
                <option key={tirada.id} value={tirada.id}>
                  {tirada.loteria_nombre} - {tirada.hora}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Modalidad</label>
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

        <div className="numeros-section">
          <h3>Ingrese sus números (3 dígitos cada uno)</h3>
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
      </form>
    </div>
  );
};

export default Betting;
