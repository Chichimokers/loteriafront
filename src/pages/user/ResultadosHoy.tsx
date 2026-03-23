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
  };
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
      const [loteriasData, resultadosData] = await Promise.all([
        lotteryService.getLoterias(),
        lotteryService.getResultadosHoy(),
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

      const gruposMap = new Map<string, GrupoLoteria>();
      
      resultadosArr.forEach((r: ResultadoItem) => {
        const foto = loteriasMap.get(r.loteria) || '';
        if (!gruposMap.has(r.loteria)) {
          gruposMap.set(r.loteria, {
            nombre: r.loteria,
            foto: foto,
            tiradas: [],
          });
        }
        gruposMap.get(r.loteria)!.tiradas.push(r);
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

  const splitDigits = (value: string | null): string[] => {
    if (!value) return [];
    return value.split('');
  };

  const renderBolas = (value: string | null, count: number) => {
    const digits = splitDigits(value);
    const balls = [];
    for (let i = 0; i < count; i++) {
      balls.push(
        <div key={i} className={`bola ${i === 0 ? 'bola-primary' : 'bola-secondary'}`}>
          {digits[i] || '?'}
        </div>
      );
    }
    return balls;
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
                {grupo.tiradas.map((tirada) => (
                  <div key={tirada.id} className="tirada-resultado">
                    <div className="tirada-hora">{tirada.hora}</div>
                    
                    <div className="picks-container">
                      <div className="pick-group">
                        <span className="pick-label">Pick 3</span>
                        <div className="bolas-row">
                          {renderBolas(tirada.resultado.pick_3, 3)}
                        </div>
                      </div>
                      
                      <div className="pick-group">
                        <span className="pick-label">Pick 4</span>
                        <div className="bolas-row">
                          {renderBolas(tirada.resultado.pick_4, 4)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultadosHoy;
