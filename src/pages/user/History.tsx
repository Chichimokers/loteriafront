import React, { useState, useEffect } from 'react';
import { apuestaService } from '../../services/api';
import ResultadosHoy from './ResultadosHoy';
import './History.css';

interface Apuesta {
  id: number;
  loteria_nombre: string;
  modalidad_nombre: string;
  numeros: string[];
  monto: number;
  premio: number;
  fecha: string;
  resultado?: string;
}

const History: React.FC = () => {
  const [apuestas, setApuestas] = useState<Apuesta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApuestas();
  }, []);

  const loadApuestas = async () => {
    try {
      const data = await apuestaService.getApuestas();
      const apuestasArr = Array.isArray(data) ? data : (data as { results?: Apuesta[] }).results || [];
      setApuestas(apuestasArr);
    } catch (err) {
      console.error('Error loading apuestas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getResultadoClass = (resultado?: string) => {
    if (resultado === 'ganador') return 'resultado-ganador';
    if (resultado === 'perdedor') return 'resultado-perdedor';
    return 'resultado-pendiente';
  };

  const getNum = (val: number | string | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return val;
  };

  const formatMonto = (val: number | string | undefined | null) => {
    return getNum(val).toFixed(2);
  };

  const getResultadoText = (resultado?: string) => {
    if (resultado === 'ganador') return '✓ Ganador';
    if (resultado === 'perdedor') return '✗ Perdedor';
    return 'Pendiente';
  };

  if (loading) {
    return <div className="history-page">Cargando...</div>;
  }

  return (
    <div className="history-page">
      <ResultadosHoy />
      
      <h2>Mis Apuestas</h2>
      
      {apuestas.length === 0 ? (
        <p className="no-apuestas">No tienes apuestas realizadas</p>
      ) : (
        <div className="apuestas-list">
          {apuestas.map((apuesta) => (
            <div key={apuesta.id} className="apuesta-card">
              <div className="apuesta-header">
                <span className="apuesta-id">Apuesta #{apuesta.id}</span>
                <span className={`apuesta-resultado ${getResultadoClass(apuesta.resultado)}`}>
                  {getResultadoText(apuesta.resultado)}
                </span>
              </div>
              <div className="apuesta-details">
                <p><strong>Lotería:</strong> {apuesta.loteria_nombre}</p>
                <p><strong>Modalidad:</strong> {apuesta.modalidad_nombre}</p>
                <p><strong>Números:</strong> {apuesta.numeros.join(', ')}</p>
                <p><strong>Monto:</strong> {formatMonto(apuesta.monto)} CUP</p>
                <p><strong>Premio:</strong> {formatMonto(apuesta.premio)} CUP</p>
                <p><strong>Fecha:</strong> {new Date(apuesta.fecha).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
