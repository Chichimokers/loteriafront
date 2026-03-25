import React, { useState, useEffect } from 'react';
import { lotteryService } from '../../services/api';
import { Dices, Clock, RefreshCw, Timer } from 'lucide-react';
import { formatHora } from '../../utils/format';

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

interface LoteriaInfo {
  id: number;
  nombre: string;
  foto: string;
  activa: boolean;
}

interface GrupoLoteria {
  nombre: string;
  foto: string;
  tiradas: Tirada[];
}

const Resultados: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoLoteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const intervalId = setInterval(() => loadData(true), 15000);
    return () => clearInterval(intervalId);
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [loteriasData, tiradasData] = await Promise.all([
        lotteryService.getLoterias(),
        lotteryService.getTiradas(),
      ]);

      const loteriasArr: LoteriaInfo[] = Array.isArray(loteriasData)
        ? loteriasData
        : (loteriasData as { results?: LoteriaInfo[] }).results || [];

      const loteriasMap = new Map<number, string>();
      loteriasArr.forEach((l) => loteriasMap.set(l.id, l.foto || ''));

      const tiradasArr: Tirada[] = Array.isArray(tiradasData)
        ? tiradasData
        : (tiradasData as { results?: Tirada[] }).results || [];

      const tiradasActivas = tiradasArr.filter((t) => t.activa);

      const gruposMap = new Map<number, GrupoLoteria>();

      tiradasActivas.forEach((t) => {
        if (!gruposMap.has(t.loteria)) {
          gruposMap.set(t.loteria, {
            nombre: t.loteria_nombre,
            foto: loteriasMap.get(t.loteria) || '',
            tiradas: [],
          });
        }
        gruposMap.get(t.loteria)!.tiradas.push(t);
      });

      gruposMap.forEach((grupo) => {
        grupo.tiradas.sort((a, b) => a.hora.localeCompare(b.hora));
      });

      setGrupos(Array.from(gruposMap.values()));
    } catch (err) {
      console.error('Error loading resultados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resultados de Hoy</h1>
          <p className="text-sm text-gray-500 capitalize">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <Dices className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Sin resultados aún</p>
          <p className="text-gray-400 text-sm mt-1">Los resultados aparecerán aquí cuando estén disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {grupos.map((grupo) => {
            const resultadosCount = grupo.tiradas.filter((t) => t.resultado_hoy !== null).length;
            return (
              <div key={grupo.nombre} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  {grupo.foto ? (
                    <img
                      src={grupo.foto}
                      alt={grupo.nombre}
                      className="w-12 h-12 rounded-xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {grupo.nombre.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{grupo.nombre}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      resultadosCount === grupo.tiradas.length
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {resultadosCount}/{grupo.tiradas.length} resultados
                    </span>
                  </div>
                </div>

                {/* Tiradas */}
                <div className="divide-y divide-gray-100">
                  {grupo.tiradas.map((tirada) => {
                    const tieneResultado = tirada.resultado_hoy !== null;
                    const pick3 = tirada.resultado_hoy?.pick_3;
                    const pick4 = tirada.resultado_hoy?.pick_4;

                    return (
                      <div
                        key={tirada.id}
                        className={`p-4 ${!tieneResultado ? 'bg-amber-50/50' : 'bg-white'}`}
                      >
                        {/* Hora y estado */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{formatHora(tirada.hora)}</span>
                          </div>
                          {!tieneResultado ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                              <Timer className="w-3 h-3" />
                              Pendiente
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                              Completo
                            </span>
                          )}
                        </div>

                        {/* Resultados */}
                        {tieneResultado ? (
                          <div className="space-y-3">
                            {pick3 && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pick 3</span>
                                <div className="flex gap-2 mt-1">
                                  {pick3.split('').map((d, i) => (
                                    <div
                                      key={i}
                                      className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md"
                                    >
                                      {d}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {pick4 && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pick 4</span>
                                <div className="flex gap-2 mt-1">
                                  {pick4.split('').map((d, i) => (
                                    <div
                                      key={i}
                                      className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md"
                                    >
                                      {d}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-amber-600">
                            <Timer className="w-4 h-4" />
                            Esperando resultados...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Resultados;
