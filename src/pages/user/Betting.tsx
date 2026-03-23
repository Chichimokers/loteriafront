import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lotteryService, apuestaService } from '../../services/api';
import './Betting.css';

interface Loteria {
  id: number;
  nombre: string;
  foto: string;
}

interface Tirada {
  id: number;
  loteria: number;
  loteria_nombre?: string;
  hora: string;
  fecha: string;
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
    loadData();
  }, []);

  useEffect(() => {
    if (selectedLoteria) {
      loadTiradas();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLoteria]);

  const loadData = async () => {
    try {
      const [loteriasData, tiradasData, modalidadesData] = await Promise.all([
        lotteryService.getLoterias(),
        lotteryService.getTiradasActivas(),
        lotteryService.getModalidades(),
      ]);
      setLoterias(loteriasData as Loteria[]);
      setTiradas(tiradasData as Tirada[]);
      setModalidades(modalidadesData as Modalidad[]);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const loadTiradas = async () => {
    try {
      const data = await lotteryService.getTiradas();
      const filtradas = (data as Tirada[]).filter((t: Tirada) => t.loteria === selectedLoteria && t.activa);
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

    if (!selectedLoteria || !selectedTirada || !selectedModalidad) {
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
        loteria: selectedLoteria,
        modalidad: selectedModalidad,
        tirada: selectedTirada,
        numeros: numeros,
        monto_por_numero: montoPorNumero,
      });
      setMessage('Apuesta realizada con éxito');
      await refreshUser();
      setNumeros([]);
      setNumeroInput('');
      setSelectedLoteria(null);
      setSelectedTirada(null);
      setSelectedModalidad(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al realizar apuesta';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredTiradas = selectedLoteria 
    ? tiradas.filter((t) => t.loteria === selectedLoteria)
    : [];

  return (
    <div className="betting-page">
      <h2>Realizar Apuesta</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleApostar} className="betting-form">
        <div className="form-row">
          <div className="form-group">
            <label>Lotería</label>
            <select
              value={selectedLoteria || ''}
              onChange={(e) => {
                setSelectedLoteria(Number(e.target.value) || null);
                setSelectedTirada(null);
              }}
              required
            >
              <option value="">Seleccionar Lotería</option>
              {loterias.map((loteria) => (
                <option key={loteria.id} value={loteria.id}>
                  {loteria.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Horario</label>
            <select
              value={selectedTirada || ''}
              onChange={(e) => setSelectedTirada(Number(e.target.value) || null)}
              disabled={!selectedLoteria}
              required
            >
              <option value="">Seleccionar Horario</option>
              {filteredTiradas.map((tirada) => (
                <option key={tirada.id} value={tirada.id}>
                  {tirada.hora} - {tirada.fecha}
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
            <p className="saldo-actual">Saldo disponible: {user?.saldo_principal.toFixed(2)} CUP</p>
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
