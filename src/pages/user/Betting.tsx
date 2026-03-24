import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/ToastContext';
import { lotteryService, apuestaService } from '../../services/api';
import { Wallet, Dices, Plus, X, CheckCircle2, Lock, Clock, ChevronRight, Gift, Minus } from 'lucide-react';
import { formatMonto, formatHora } from '../../utils/format';

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
  resultado_hoy: {
    pick_3: string;
    pick_4: string;
    fecha: string;
  } | null;
}

interface Modalidad {
  id: number;
  nombre: string;
  premio_por_peso: number;
}

const Betting: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
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

  useEffect(() => {
    loadData();
    refreshUser();
  }, []);

  useEffect(() => {
    if (selectedLoteria) {
      filterTiradas();
    } else {
      setTiradas([]);
      setSelectedTirada(null);
    }
  }, [selectedLoteria]);

  const loadData = async () => {
    try {
      const [loteriasData, , modalidadesData] = await Promise.all([
        lotteryService.getLoterias(),
        lotteryService.getTiradas(),
        lotteryService.getModalidades(),
      ]);

      const loteriasArr = Array.isArray(loteriasData)
        ? loteriasData
        : (loteriasData as { results?: Loteria[] }).results || [];
      setLoterias(loteriasArr.filter((l: Loteria) => l.activa));

      const modalidadesArr = Array.isArray(modalidadesData)
        ? modalidadesData
        : (modalidadesData as { results?: Modalidad[] }).results || [];
      setModalidades(modalidadesArr);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const filterTiradas = () => {
    if (!selectedLoteria) return;
    lotteryService.getTiradas().then((data) => {
      const arr = Array.isArray(data) ? data : (data as { results?: Tirada[] }).results || [];
      const filtradas = arr.filter((t: Tirada) => t.loteria === selectedLoteria && t.activa);
      setTiradas(filtradas);
    });
  };

  const agregarNumero = () => {
    const num = numeroInput.trim();
    if (num.length !== 3) {
      toast.showToast('El número debe tener exactamente 3 dígitos', 'warning');
      return;
    }
    if (numeros.includes(num)) {
      toast.showToast('El número ya está agregado', 'warning');
      return;
    }
    if (numeros.length >= 10) {
      toast.showToast('Máximo 10 números por apuesta', 'warning');
      return;
    }
    setNumeros([...numeros, num]);
    setNumeroInput('');
  };

  const eliminarNumero = (num: string) => {
    setNumeros(numeros.filter((n) => n !== num));
  };

  const montoTotal = numeros.length * montoPorNumero;

  const handleApostar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedTirada || !selectedModalidad) {
      toast.showToast('Por favor complete todos los campos', 'warning');
      setLoading(false);
      return;
    }

    if (numeros.length === 0) {
      toast.showToast('Agregue al menos un número', 'warning');
      setLoading(false);
      return;
    }

    if (montoTotal > (user?.saldo_principal || 0)) {
      toast.showToast('Saldo insuficiente', 'error');
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
      toast.showToast('¡Apuesta realizada con éxito!', 'success');
      await refreshUser();
      setNumeros([]);
      setNumeroInput('');
      setSelectedTirada(null);
      setSelectedModalidad(null);
    } catch (err: unknown) {
      toast.showToast(err instanceof Error ? err.message : 'Error al realizar apuesta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loteriaSeleccionada = loterias.find(l => l.id === selectedLoteria);
  const tiradaSeleccionada = tiradas.find(t => t.id === selectedTirada);
  const modalidadSeleccionada = modalidades.find(m => m.id === selectedModalidad);

  if (!user || typeof user.saldo_principal !== 'number') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header sticky con saldo */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Apostar</h1>
          <div className="bg-indigo-500 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold shadow-md">
            <Wallet className="w-4 h-4" />
            {formatMonto(user.saldo_principal)} CUP
          </div>
        </div>
      </div>

      <form onSubmit={handleApostar}>
        {/* Step 1: Loterías - Scroll horizontal */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <h2 className="text-base font-bold text-gray-900">Elige tu Lotería</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {loterias.map((loteria) => {
              const isSelected = selectedLoteria === loteria.id;
              return (
                <button
                  key={loteria.id}
                  type="button"
                  onClick={() => {
                    setSelectedLoteria(loteria.id);
                    setSelectedTirada(null);
                    setSelectedModalidad(null);
                  }}
                  className={`flex-shrink-0 w-24 p-3 rounded-2xl border-2 transition-all text-center ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {loteria.foto ? (
                    <img src={loteria.foto} alt={loteria.nombre} className="w-14 h-14 rounded-xl object-cover mx-auto mb-2" />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-2 text-white text-xl font-bold ${
                      isSelected ? 'bg-indigo-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'
                    }`}>
                      {loteria.nombre.charAt(0)}
                    </div>
                  )}
                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {loteria.nombre}
                  </p>
                  {isSelected && (
                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mt-1">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Horarios */}
        {selectedLoteria && tiradas.length > 0 && (
          <div className="px-4 pt-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
              <h2 className="text-base font-bold text-gray-900">Horario de <span className="text-indigo-600">{loteriaSeleccionada?.nombre}</span></h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {tiradas.map((tirada) => {
                const horaActual = new Date().toTimeString().substring(0, 8);
                const cerrada = tirada.resultado_hoy !== null || tirada.hora < horaActual;
                const isSelected = selectedTirada === tirada.id;
                return (
                  <button
                    key={tirada.id}
                    type="button"
                    disabled={cerrada}
                    onClick={() => {
                      if (!cerrada) setSelectedTirada(tirada.id);
                    }}
                    className={`relative p-3 rounded-xl border-2 transition-all ${
                      cerrada
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 bg-white active:scale-95'
                    }`}
                  >
                    <p className={`text-2xl font-bold ${cerrada ? 'text-gray-300' : isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {formatHora(tirada.hora)}
                    </p>
                    {cerrada ? (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium">Cerrada</span>
                      </div>
                    ) : (
                      <p className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-indigo-500' : 'text-green-500'}`}>
                        {isSelected ? '✓ Seleccionada' : 'Abierta'}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Modalidades */}
        {selectedTirada && (
          <div className="px-4 pt-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
              <h2 className="text-base font-bold text-gray-900">Modalidad</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {modalidades.map((modalidad) => {
                const isSelected = selectedModalidad === modalidad.id;
                return (
                  <button
                    key={modalidad.id}
                    type="button"
                    onClick={() => setSelectedModalidad(modalidad.id)}
                    className={`flex-shrink-0 min-w-[140px] p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className={`w-4 h-4 ${isSelected ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <p className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {modalidad.nombre}
                      </p>
                    </div>
                    <p className={`text-xs ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                      Ganas <span className="font-bold">{modalidad.premio_por_peso}x</span> tu apuesta
                    </p>
                    {isSelected && (
                      <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center mt-2">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Números */}
        {selectedModalidad && (
          <div className="px-4 pt-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
              <h2 className="text-base font-bold text-gray-900">Tus Números</h2>
              {numeros.length > 0 && (
                <span className="ml-auto text-xs text-gray-500">{numeros.length}/10</span>
              )}
            </div>

            {/* Input grande para móvil */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={numeroInput}
                onChange={(e) => setNumeroInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="000"
                maxLength={3}
                inputMode="numeric"
                className="flex-1 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-center text-3xl font-bold tracking-[0.3em] focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={agregarNumero}
                disabled={numeroInput.length !== 3}
                className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30 shadow-md"
              >
                <Plus className="w-7 h-7" />
              </button>
            </div>

            {/* Bolas de números */}
            {numeros.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {numeros.map((num) => (
                  <div key={num} className="relative group">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg active:scale-95 transition-transform">
                      {num}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarNumero(num)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Monto por número */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-sm text-gray-500 mb-2">Monto por número</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMontoPorNumero(Math.max(1, montoPorNumero - 5))}
                  className="w-12 h-12 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    min="1"
                    value={montoPorNumero}
                    onChange={(e) => setMontoPorNumero(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center text-2xl font-bold bg-transparent border-none focus:outline-none"
                  />
                  <p className="text-xs text-gray-400">CUP</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMontoPorNumero(montoPorNumero + 5)}
                  className="w-12 h-12 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra inferior fija con resumen y botón */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          {/* Resumen de selección */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto text-xs" style={{ scrollbarWidth: 'none' }}>
            {loteriaSeleccionada && (
              <span className="flex-shrink-0 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
                {loteriaSeleccionada.nombre}
              </span>
            )}
            {tiradaSeleccionada && (
              <span className="flex-shrink-0 bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatHora(tiradaSeleccionada.hora)}
              </span>
            )}
            {modalidadSeleccionada && (
              <span className="flex-shrink-0 bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium">
                {modalidadSeleccionada.nombre}
              </span>
            )}
            {numeros.length > 0 && (
              <span className="flex-shrink-0 bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                {numeros.length} Nº
              </span>
            )}
          </div>

          {/* Botón apostar */}
          <button
            type="submit"
            disabled={loading || numeros.length === 0 || !selectedTirada || !selectedModalidad}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100 shadow-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Dices className="w-5 h-5" />
                Apostar {montoTotal > 0 ? `${formatMonto(montoTotal)} CUP` : ''}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Betting;
