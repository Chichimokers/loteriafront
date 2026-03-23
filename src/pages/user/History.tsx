import React, { useState, useEffect } from 'react';
import { apuestaService } from '../../services/api';
import ResultadosHoy from './ResultadosHoy';

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

  const getResultadoStyles = (resultado?: string) => {
    if (resultado === 'ganador') return 'bg-success/10 text-success border-success/20';
    if (resultado === 'perdedor') return 'bg-red-50 text-red-600 border-red-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };

  const getResultadoIcon = (resultado?: string) => {
    if (resultado === 'ganador') return '🎉';
    if (resultado === 'perdedor') return '😔';
    return '⏳';
  };

  const getNum = (val: number | string | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return val;
  };

  const formatMonto = (val: number | string | undefined | null) => {
    return getNum(val).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Resultados de Hoy */}
      <ResultadosHoy />

      {/* Lista de Apuestas */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Mis Apuestas</h2>
        
        {apuestas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎰</span>
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
                      {new Date(apuesta.fecha).toLocaleString()}
                    </p>
                  </div>
                  <span className={`badge border ${getResultadoStyles(apuesta.resultado)}`}>
                    {getResultadoIcon(apuesta.resultado)} {apuesta.resultado === 'ganador' ? 'Ganador' : apuesta.resultado === 'perdedor' ? 'Perdedor' : 'Pendiente'}
                  </span>
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
                    <p className="font-semibold text-gray-900">{formatMonto(apuesta.monto)} CUP</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Premio</p>
                    <p className={`font-bold ${apuesta.premio > 0 ? 'text-success' : 'text-gray-900'}`}>
                      {formatMonto(apuesta.premio)} CUP
                    </p>
                  </div>
                </div>

                {/* Números */}
                <div>
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
