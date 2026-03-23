import React, { useState, useEffect } from 'react';
import { lotteryService } from '../../services/api';

interface ResultadoItem {
  id: number;
  loteria: string;
  hora: string;
  resultado: { pick_3: string | null; pick_4: string | null } | null;
}

interface TiradaActiva {
  id: number;
  loteria_nombre: string;
  hora: string;
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
  tiradas: ResultadoItem[];
  tiradasActivas: string[];
}

const ResultadosHoy: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoLoteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [loteriasData, resultadosData, tiradasActivasData] = await Promise.all([
        lotteryService.getLoterias(),
        lotteryService.getResultadosHoy(),
        lotteryService.getTiradasActivas(),
      ]);

      const loteriasArr = Array.isArray(loteriasData)
        ? loteriasData
        : (loteriasData as { results?: LoteriaInfo[] }).results || [];

      const loteriasMap = new Map<string, string>();
      loteriasArr.forEach((l: LoteriaInfo) => loteriasMap.set(l.nombre, l.foto || ''));

      const resultadosArr = Array.isArray(resultadosData)
        ? resultadosData
        : (resultadosData as { results?: ResultadoItem[] }).results || [];

      const tiradasActivasArr = Array.isArray(tiradasActivasData)
        ? tiradasActivasData
        : (tiradasActivasData as { results?: TiradaActiva[] }).results || [];

      const tiradasActivasPorLoteria = new Map<string, string[]>();
      tiradasActivasArr.forEach((t: TiradaActiva) => {
        if (!tiradasActivasPorLoteria.has(t.loteria_nombre)) {
          tiradasActivasPorLoteria.set(t.loteria_nombre, []);
        }
        tiradasActivasPorLoteria.get(t.loteria_nombre)!.push(t.hora);
      });

      const gruposMap = new Map<string, GrupoLoteria>();

      resultadosArr.forEach((r: ResultadoItem) => {
        const foto = loteriasMap.get(r.loteria) || '';
        const tiradasActivasHoras = tiradasActivasPorLoteria.get(r.loteria) || [];
        if (!gruposMap.has(r.loteria)) {
          gruposMap.set(r.loteria, { nombre: r.loteria, foto, tiradas: [], tiradasActivas: tiradasActivasHoras });
        }
        gruposMap.get(r.loteria)!.tiradas.push(r);
      });

      loteriasArr.forEach((l: LoteriaInfo) => {
        if (!gruposMap.has(l.nombre) && l.activa) {
          const tiradasActivasHoras = tiradasActivasPorLoteria.get(l.nombre) || [];
          if (tiradasActivasHoras.length > 0) {
            gruposMap.set(l.nombre, { nombre: l.nombre, foto: l.foto || '', tiradas: [], tiradasActivas: tiradasActivasHoras });
          }
        }
      });

      gruposMap.forEach((grupo) => {
        grupo.tiradas.sort((a, b) => a.hora.localeCompare(b.hora));
        grupo.tiradasActivas.sort((a, b) => a.localeCompare(b));
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
      <div className="resultados-hoy">
        <div className="rh-header">
          <h2>Resultados de Hoy</h2>
          <p>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="rh-loading">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resultados-hoy">
      <div className="rh-header">
        <div>
          <h2>Resultados de Hoy</h2>
          <p>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => loadData(true)} disabled={refreshing} className="rh-refresh">
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="rh-empty">
          <span>🎰</span>
          <p>Sin resultados aún</p>
        </div>
      ) : (
        <div className="rh-grid">
          {grupos.map((grupo) => {
            const resultadosCount = grupo.tiradas.filter((t) => t.resultado).length;
            return (
              <div key={grupo.nombre} className="rh-card">
                <div className="rh-card-header">
                  {grupo.foto ? (
                    <img src={grupo.foto} alt={grupo.nombre} className="rh-card-img" />
                  ) : (
                    <div className="rh-card-img-placeholder">{grupo.nombre.charAt(0)}</div>
                  )}
                  <div className="rh-card-info">
                    <h3>{grupo.nombre}</h3>
                    <span>{resultadosCount}/{grupo.tiradasActivas.length} resultados</span>
                  </div>
                </div>

                <div className="rh-tiradas">
                  {grupo.tiradasActivas.map((hora) => {
                    const tirada = grupo.tiradas.find((t) => t.hora === hora);
                    const tieneResultado = tirada?.resultado !== null && tirada?.resultado !== undefined;
                    const pick3 = tirada?.resultado?.pick_3;
                    const pick4 = tirada?.resultado?.pick_4;

                    return (
                      <div key={hora} className={`rh-tirada ${!tieneResultado ? 'rh-tirada-pending' : ''}`}>
                        <div className="rh-tirada-hora">
                          <span>🕐</span>
                          {hora}
                          {!tieneResultado && <span className="rh-pending-badge">Pendiente</span>}
                        </div>

                        {tieneResultado ? (
                          <div className="rh-picks">
                            {pick3 && (
                              <div className="rh-pick">
                                <span className="rh-pick-label">Pick 3</span>
                                <div className="rh-bolas">
                                  {pick3.split('').map((d, i) => (
                                    <span key={i} className="bola bola-3">{d}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {pick4 && (
                              <div className="rh-pick">
                                <span className="rh-pick-label">Pick 4</span>
                                <div className="rh-bolas">
                                  {pick4.split('').map((d, i) => (
                                    <span key={i} className="bola bola-4">{d}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rh-pending-info">
                            <span>⏰ Esperando resultados...</span>
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

export default ResultadosHoy;
