import React, { useState, useEffect } from 'react';
import { lotteryService } from '../../services/api';
import './ResultadosHoy.css';

interface ResultadoItem {
  id: number;
  loteria: string;
  hora: string;
  resultado: {
    pick_3: string | null;
    pick_4: string | null;
  } | null;
}

interface TiradaActiva {
  id: number;
  loteria: number;
  loteria_nombre: string;
  hora: string;
  activa: boolean;
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
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
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
      loteriasArr.forEach((l: LoteriaInfo) => {
        loteriasMap.set(l.nombre, l.foto || '');
      });

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

      tiradasActivasPorLoteria.forEach((horas, loteria) => {
        horas.sort((a, b) => a.localeCompare(b));
      });

      const gruposMap = new Map<string, GrupoLoteria>();
      
      resultadosArr.forEach((r: ResultadoItem) => {
        const foto = loteriasMap.get(r.loteria) || '';
        const tiradasActivasHoras = tiradasActivasPorLoteria.get(r.loteria) || [];
        if (!gruposMap.has(r.loteria)) {
          gruposMap.set(r.loteria, {
            nombre: r.loteria,
            foto: foto,
            tiradas: [],
            tiradasActivas: tiradasActivasHoras,
          });
        }
        gruposMap.get(r.loteria)!.tiradas.push(r);
      });

      loteriasArr.forEach((l: LoteriaInfo) => {
        if (!gruposMap.has(l.nombre) && l.activa) {
          const tiradasActivasHoras = tiradasActivasPorLoteria.get(l.nombre) || [];
          if (tiradasActivasHoras.length > 0) {
            gruposMap.set(l.nombre, {
              nombre: l.nombre,
              foto: l.foto || '',
              tiradas: [],
              tiradasActivas: tiradasActivasHoras,
            });
          }
        }
      });

      gruposMap.forEach((grupo) => {
        grupo.tiradas.sort((a, b) => a.hora.localeCompare(b.hora));
      });

      setGrupos(Array.from(gruposMap.values()));
    } catch (err) {
      console.error('Error loading resultados:', err);
      setError('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  };

  const splitDigits = (value: string | null | undefined): string[] => {
    if (!value) return [];
    return value.split('');
  };

  const renderBolas = (value: string | null | undefined, count: number, isPrimary: boolean = false, isPending: boolean = false) => {
    if (isPending) {
      const balls = [];
      for (let i = 0; i < count; i++) {
        balls.push(
          <div key={i} className="bola bola-pending">
            <span className="bola-pending-text">?</span>
          </div>
        );
      }
      return balls;
    }
    
    const digits = splitDigits(value ?? null);
    const balls = [];
    for (let i = 0; i < count; i++) {
      const hasValue = digits[i] && digits[i] !== '?' && digits[i] !== undefined;
      balls.push(
        <div 
          key={i} 
          className={`bola ${hasValue ? (isPrimary ? 'bola-primary' : 'bola-secondary') : 'bola-waiting'}`}
        >
          {hasValue ? digits[i] : '?'}
        </div>
      );
    }
    return balls;
  };

  const getProximaTirada = (horaActual: string, tiradasActivas: string[]): string | null => {
    const ahora = new Date();
    const horaParts = horaActual.split(':');
    const horaActualMin = parseInt(horaParts[0]) * 60 + parseInt(horaParts[1]);
    
    for (const hora of tiradasActivas) {
      const parts = hora.split(':');
      const horaMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      if (horaMin > horaActualMin) {
        return hora;
      }
    }
    return tiradasActivas[0] || null;
  };

  if (loading) {
    return (
      <div className="resultados-hoy">
        <div className="resultados-header">
          <h2>Resultados de Hoy</h2>
        </div>
        <div className="loading-state">Cargando resultados...</div>
      </div>
    );
  }

  return (
    <div className="resultados-hoy">
      <div className="resultados-header">
        <h2>Resultados de Hoy</h2>
        <button onClick={loadData} className="btn-refresh">
          Actualizar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {grupos.length === 0 ? (
        <div className="no-resultados">
          <div className="no-resultados-icon">📋</div>
          <p>No hay resultados para hoy</p>
        </div>
      ) : (
        <div className="loterias-grid">
          {grupos.map((grupo) => (
            <div key={grupo.nombre} className="loteria-resultado-card">
              <div className="loteria-header">
                {grupo.foto ? (
                  <img src={grupo.foto} alt={grupo.nombre} className="loteria-foto" />
                ) : (
                  <div className="loteria-foto-placeholder">
                    {grupo.nombre.charAt(0)}
                  </div>
                )}
                <h3>{grupo.nombre}</h3>
              </div>

              <div className="tiradas-list">
                {grupo.tiradasActivas.map((hora) => {
                  const tiradaConResultado = grupo.tiradas.find(t => t.hora === hora);
                  const tieneResultado = tiradaConResultado?.resultado !== null && tiradaConResultado?.resultado !== undefined;
                  
                  return (
                    <div key={hora} className={`tirada-resultado ${!tieneResultado ? 'tirada-pendiente' : ''}`}>
                      <div className="tirada-hora">
                        {hora}
                        {!tieneResultado && (
                          <span className="badge-pendiente">Pendiente</span>
                        )}
                      </div>
                      
                      <div className="picks-container">
                        <div className="pick-group">
                          <span className="pick-label">Pick 3</span>
                          <div className="bolas-row">
                            {renderBolas(
                              tieneResultado ? tiradaConResultado?.resultado?.pick_3 ?? null : null,
                              3,
                              true,
                              !tieneResultado
                            )}
                          </div>
                        </div>
                        
                        <div className="pick-group">
                          <span className="pick-label">Pick 4</span>
                          <div className="bolas-row">
                            {renderBolas(
                              tieneResultado ? tiradaConResultado?.resultado?.pick_4 ?? null : null,
                              4,
                              false,
                              !tieneResultado
                            )}
                          </div>
                        </div>
                      </div>

                      {!tieneResultado && (
                        <div className="proxima-tirada">
                          <span className="proxima-icon">⏰</span>
                          Próxima tirada: {getProximaTirada(hora, grupo.tiradasActivas) || 'Verifique'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultadosHoy;
