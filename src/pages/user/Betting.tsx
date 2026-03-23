import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lotteryService, apuestaService } from '../../services/api';

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
      setMessage('¡Apuesta realizada con éxito! Mucha suerte 🍀');
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Realizar Apuesta</h1>
        <div className="bg-primary/10 px-4 py-2 rounded-full">
          <span className="text-sm font-medium text-primary">
            💰 Saldo: {user.saldo_principal.toFixed(2)} CUP
          </span>
        </div>
      </div>

      {message && (
        <div className="success-message">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {message}
        </div>
      )}
      {error && (
        <div className="error-message">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleApostar} className="space-y-8">
      <div className="card">
        {/* Step 1: Loterías */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">1</div>
            <h2 className="text-xl font-bold text-gray-900">Selecciona una Lotería</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loterias.map((loteria) => (
              <button
                key={loteria.id}
                onClick={() => setSelectedLoteria(loteria.id)}
                className={`
                  relative p-4 rounded-2xl border-2 transition-all duration-200 text-center
                  ${selectedLoteria === loteria.id 
                    ? 'border-primary bg-primary/5 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}
                `}
              >
                {loteria.foto ? (
                  <img 
                    src={loteria.foto} 
                    alt={loteria.nombre} 
                    className="w-16 h-16 rounded-xl object-cover mx-auto mb-2 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-2 text-white text-2xl font-bold shadow-md">
                    {loteria.nombre.charAt(0)}
                  </div>
                )}
                <p className="font-semibold text-gray-900 text-sm">{loteria.nombre}</p>
                {selectedLoteria === loteria.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Horario */}
        {selectedLoteria && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">2</div>
              <h2 className="text-xl font-bold text-gray-900">Selecciona el Horario</h2>
            </div>
            <select
              value={selectedTirada || ''}
              onChange={(e) => setSelectedTirada(Number(e.target.value) || null)}
              className="select"
            >
              <option value="">Seleccionar Horario</option>
              {tiradas.map((tirada) => (
                <option key={tirada.id} value={tirada.id}>
                  {tirada.hora}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Modalidad */}
        {selectedTirada && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">3</div>
              <h2 className="text-xl font-bold text-gray-900">Selecciona la Modalidad</h2>
            </div>
            <select
              value={selectedModalidad || ''}
              onChange={(e) => setSelectedModalidad(Number(e.target.value) || null)}
              className="select"
            >
              <option value="">Seleccionar Modalidad</option>
              {modalidades.map((modalidad) => (
                <option key={modalidad.id} value={modalidad.id}>
                  {modalidad.nombre} - Premio: {modalidad.premio_por_peso}x
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 4: Números */}
        {selectedModalidad && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">4</div>
              <h2 className="text-xl font-bold text-gray-900">Ingresa tus Números</h2>
            </div>

            {/* Input números */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={numeroInput}
                  onChange={(e) => setNumeroInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="000"
                  maxLength={3}
                  className="input text-center text-2xl font-bold tracking-widest"
                />
              </div>
              <button 
                type="button" 
                onClick={agregarNumero}
                disabled={numeroInput.length !== 3}
                className="btn btn-primary px-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar
              </button>
            </div>

            {/* Lista de números */}
            {numeros.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {numeros.map((num) => (
                  <div 
                    key={num} 
                    className="relative group"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg transform group-hover:scale-110 transition-transform">
                      {num.split('').map((digit, i) => (
                        <span key={i} className="text-shadow">{digit}</span>
                      ))}
                    </div>
                    <button 
                      onClick={() => eliminarNumero(num)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Monto y Apuesta */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Monto por número (CUP)</label>
                  <input
                    type="number"
                    min="1"
                    value={montoPorNumero}
                    onChange={(e) => setMontoPorNumero(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Monto Total</p>
                    <p className="text-4xl font-bold text-gray-900">{montoTotal.toFixed(2)} CUP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Apostar */}
            <button 
              type="submit" 
              disabled={loading || numeros.length === 0}
              className="btn btn-primary w-full py-5 text-lg font-bold"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-2xl mr-2">🎰</span>
                  APOSTAR {montoTotal.toFixed(2)} CUP
                  <span className="text-2xl ml-2">🎰</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      </form>
    </div>
  );
};

export default Betting;
