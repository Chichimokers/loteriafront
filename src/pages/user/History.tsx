import React, { useState, useEffect, useCallback } from 'react';
import { apuestaService, lotteryService } from '../../services/api';
import { Dices, RefreshCw, Clock, Timer, Frown, PartyPopper } from 'lucide-react';
import { formatMonto, formatHora } from '../../utils/format';

interface Apuesta {
  id: number;
  loteria: number;
  loteria_nombre: string;
  modalidad: number;
  modalidad_nombre: string;
  tirada: number;
  numeros: string[];
  monto_total: string;
  monto_por_numero: string;
  combinaciones_generadas: string[][] | null;
  premiagos: string | null;
  premio_total: string;
  paga: boolean;
  fecha: string;
  resultado: { pick_3: string; pick_4: string } | null;
  hora_tirada?: string;
}

const History: React.FC = () => {
  const [apuestas, setApuestas] = useState<Apuesta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApuestas = async () => {
    const [apuestasData, tiradasData] = await Promise.all([
      apuestaService.getApuestas(),
      lotteryService.getTiradasActivas(),
    ]);
    const apuestasArr = Array.isArray(apuestasData) ? apuestasData : (apuestasData as { results?: Apuesta[] }).results || [];
    const tiradasMap = new Map<number, string>();
    const tiradasArr = Array.isArray(tiradasData) ? tiradasData : (tiradasData as { results?: { id: number; hora: string }[] }).results || [];
    tiradasArr.forEach((t: { id: number; hora: string }) => tiradasMap.set(t.id, t.hora));
    return apuestasArr.map((apuesta: Apuesta) => ({
      ...apuesta,
      hora_tirada: tiradasMap.get(apuesta.tirada) || undefined,
    }));
  };

  const loadApuestas = useCallback(async () => {
    try {
      const apuestasWithHora = await fetchApuestas();
      setApuestas(apuestasWithHora);
    } catch (err) {
      console.error('Error loading apuestas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApuestas();
    const intervalId = setInterval(loadApuestas, 5000);

    return () => clearInterval(intervalId);
  }, [loadApuestas]);

  const getStatusInfo = (apuesta: Apuesta): { label: string; styles: string; icon: React.ReactNode } => {
    if (apuesta.resultado === null && !apuesta.paga) {
      return { label: 'Pendiente', styles: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Timer className="w-4 h-4" /> };
    }
    if (apuesta.resultado !== null && !apuesta.paga) {
      return { label: 'Perdido', styles: 'bg-red-50 text-red-600 border-red-200', icon: <Frown className="w-4 h-4" /> };
    }
    if (apuesta.paga) {
      return { label: 'Ganado', styles: 'bg-green-500/10 text-green-500 border-success/20', icon: <PartyPopper className="w-4 h-4" /> };
    }
    return { label: 'Pendiente', styles: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Timer className="w-4 h-4" /> };
  };

  const getNum = (val: number | string | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return val;
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mi Historial</h1>
        <button
          onClick={loadApuestas}
          className="btn btn-ghost"
        >
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {/* Lista de Apuestas */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Mis Apuestas</h2>
        
        {apuestas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dices className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes apuestas aún</h3>
            <p className="text-gray-500 mb-6">¡Haz tu primera apuesta y都有可能 ganar!</p>
            <a href="/apuestas" className="btn btn-primary">
              Ir a Apostar
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {apuestas.map((apuesta) => (
              <div 
                key={apuesta.id} 
                className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Apuesta #{apuesta.id}</span>
                    <p className="text-xs text-gray-400">
                      {formatFecha(apuesta.fecha)}
                    </p>
                  </div>
                  {apuesta.hora_tirada && (
                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Tirada: {formatHora(apuesta.hora_tirada)}
                    </div>
                  )}
                  {(() => {
                    const status = getStatusInfo(apuesta);
                    return (
                      <span className={`badge border ${status.styles}`}>
                        {status.icon} {status.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Lotería</p>
                    <p className="font-semibold text-gray-900">{apuesta.loteria_nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Modalidad</p>
                    <p className="font-semibold text-gray-900">{apuesta.modalidad_nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monto Apostado</p>
                    <p className="font-semibold text-gray-900">{formatMonto(apuesta.monto_total)} CUP</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Premio</p>
                    <p className={`font-bold ${getNum(apuesta.premio_total) > 0 ? 'text-green-500' : 'text-gray-900'}`}>
                      {formatMonto(apuesta.premio_total)} CUP
                    </p>
                  </div>
                </div>

                {/* Results if available */}
                {apuesta.resultado && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">Resultados</p>
                    <div className="flex gap-4">
                      {apuesta.resultado.pick_3 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Pick 3:</span>
                          <span className="font-bold text-gray-900">{apuesta.resultado.pick_3}</span>
                        </div>
                      )}
                      {apuesta.resultado.pick_4 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Pick 4:</span>
                          <span className="font-bold text-gray-900">{apuesta.resultado.pick_4}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Números */}
                <div>
                  {apuesta.combinaciones_generadas && apuesta.combinaciones_generadas.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">Combinaciones ({apuesta.combinaciones_generadas.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {apuesta.combinaciones_generadas.map((par, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl px-3 py-2 text-white shadow-md"
                          >
                            <span className="text-lg font-bold">{par[0]}</span>
                            <span className="text-sm opacity-70">-</span>
                            <span className="text-lg font-bold">{par[1]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : Array.isArray(apuesta.numeros[0]) ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">Parejas jugadas ({apuesta.numeros.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {(apuesta.numeros as unknown as string[][]).map((par, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl px-3 py-2 text-white shadow-md"
                          >
                            <span className="text-lg font-bold">{par[0]}</span>
                            <span className="text-sm opacity-70">-</span>
                            <span className="text-lg font-bold">{par[1]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-2">Números jugados</p>
                      <div className="flex flex-wrap gap-2">
                        {apuesta.numeros.map((num) => (
                          <div
                            key={num}
                            className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
