import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/ToastContext';
import { lotteryService, apuestaService } from '../../services/api';
import { Wallet, Dices, Plus, X, CheckCircle2, Lock, Clock } from 'lucide-react';

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
      const [loteriasData, tiradasData, modalidadesData] = await Promise.all([
        lotteryService.getLoterias(),
        lotteryService.getTiradas(),
        lotteryService.getModalidades(),
      ]);

      const loteriasArr = Array.isArray(loteriasData)
        ? loteriasData
        : (loteriasData as { results?: Loteria[] }).results || [];
      setLoterias(loteriasArr.filter((l: Loteria) => l.activa));

      const tiradasArr = Array.isArray(tiradasData)
        ? tiradasData
        : (tiradasData as { results?: Tirada[] }).results || [];
      setTiradas(tiradasArr);

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

  const formatHora = (hora: string) => {
    if (!hora) return '-';
    return hora.substring(0, 5);
  };

  if (!user || typeof user.saldo_principal !== 'number') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Realizar Apuesta</h1>
        <div className="bg-indigo-50 px-4 py-2 rounded-full flex items-center gap-2">
          <Wallet className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-indigo-600">
            {user.saldo_principal.toFixed(2)} CUP
          </span>
        </div>
      </div>

      <form onSubmit={handleApostar} className="space-y-6">

        {/* Step 1: Loterías */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
            <h2 className="text-lg font-bold text-gray-900">Lotería</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {loterias.map((loteria) => (
              <button
                key={loteria.id}
                type="button"
                onClick={() => {
                  setSelectedLoteria(loteria.id);
                  setSelectedTirada(null);
                  setSelectedModalidad(null);
                }}
                className={`relative p-3 rounded-xl border-2 transition-all text-center ${
                  selectedLoteria === loteria.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                {loteria.foto ? (
                  <img src={loteria.foto} alt={loteria.nombre} className="w-12 h-12 rounded-lg object-cover mx-auto mb-2" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-2 text-white font-bold">
                    {loteria.nombre.charAt(0)}
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-900 truncate">{loteria.nombre}</p>
                {selectedLoteria === loteria.id && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Tiradas */}
        {selectedLoteria && tiradas.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <h2 className="text-lg font-bold text-gray-900">Horario</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {tiradas.map((tirada) => {
                const cerrada = tirada.resultado_hoy !== null;
                const isSelected = selectedTirada === tirada.id;
                return (
                  <button
                    key={tirada.id}
                    type="button"
                    disabled={cerrada}
                    onClick={() => {
                      if (!cerrada) setSelectedTirada(tirada.id);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                      cerrada
                        ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <Clock className={`w-6 h-6 mx-auto mb-1 ${cerrada ? 'text-gray-400' : 'text-indigo-500'}`} />
                    <p className={`text-lg font-bold ${cerrada ? 'text-gray-400' : 'text-gray-900'}`}>
                      {formatHora(tirada.hora)}
                    </p>
                    {cerrada ? (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium">Cerrada</span>
                      </div>
                    ) : (
                      <p className="text-xs text-green-600 font-medium mt-1">Abierta</p>
                    )}
                    {isSelected && !cerrada && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Modalidades en Cards */}
        {selectedTirada && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <h2 className="text-lg font-bold text-gray-900">Modalidad</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {modalidades.map((modalidad) => {
                const isSelected = selectedModalidad === modalidad.id;
                return (
                  <button
                    key={modalidad.id}
                    type="button"
                    onClick={() => setSelectedModalidad(modalidad.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className={`font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {modalidad.nombre}
                    </p>
                    <p className={`text-sm mt-1 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                      Premio: <span className="font-semibold">{modalidad.premio_por_peso}x</span> el monto
                    </p>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
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
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
              <h2 className="text-lg font-bold text-gray-900">Números</h2>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={numeroInput}
                onChange={(e) => setNumeroInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="000"
                maxLength={3}
                className="flex-1 p-3 border border-gray-300 rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={agregarNumero}
                disabled={numeroInput.length !== 3}
                className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </div>

            {numeros.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {numeros.map((num) => (
                  <div key={num} className="relative group">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md">
                      {num}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarNumero(num)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Monto */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Monto por número</label>
                  <input
                    type="number"
                    min="1"
                    value={montoPorNumero}
                    onChange={(e) => setMontoPorNumero(Number(e.target.value))}
                    className="w-28 p-2 border border-gray-300 rounded-lg text-center font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{montoTotal.toFixed(2)} <span className="text-lg text-gray-500">CUP</span></p>
                </div>
              </div>
            </div>

            {/* Botón Apostar */}
            <button
              type="submit"
              disabled={loading || numeros.length === 0}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Dices className="w-6 h-6" />
                  APOSTAR {montoTotal.toFixed(2)} CUP
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Betting;
