import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { RefreshCw, Trophy, Target, BarChart3 } from 'lucide-react';
import { formatMonto, formatHora } from '../../utils/format';

interface Metricas {
  total_apostado: string;
  total_premios_pagados: string;
  top_loteria: { id: number; nombre: string; cantidad_apuestas: number } | null;
  top_tirada: { id: number; loteria: string; hora: string; cantidad_apuestas: number } | null;
  acreditado_hoy: string;
  extraido_hoy: string;
}

const AdminDashboard: React.FC = () => {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetricas();
  }, []);

  const loadMetricas = async () => {
    try {
      const data = await adminService.getMetricas();
      setMetricas(data);
    } catch (err) {
      console.error('Error loading metricas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNum = (val: string | undefined | null) => {
    if (!val) return 0;
    return parseFloat(val) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button onClick={loadMetricas} className="btn btn-ghost">
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 rounded-xl text-white">
          <p className="text-white/80 text-sm font-medium">Total Apostado</p>
          <p className="text-2xl font-bold mt-1">{formatMonto(getNum(metricas?.total_apostado))}</p>
          <p className="text-xs text-white/60 mt-1">CUP</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 p-5 rounded-xl text-white">
          <p className="text-white/80 text-sm font-medium">Premios Pagados</p>
          <p className="text-2xl font-bold mt-1">{formatMonto(getNum(metricas?.total_premios_pagados))}</p>
          <p className="text-xs text-white/60 mt-1">CUP</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white">
          <p className="text-white/80 text-sm font-medium">Acreditado Hoy</p>
          <p className="text-2xl font-bold mt-1">{formatMonto(getNum(metricas?.acreditado_hoy))}</p>
          <p className="text-xs text-white/60 mt-1">CUP</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-xl text-white">
          <p className="text-white/80 text-sm font-medium">Extraído Hoy</p>
          <p className="text-2xl font-bold mt-1">{formatMonto(getNum(metricas?.extraido_hoy))}</p>
          <p className="text-xs text-white/60 mt-1">CUP</p>
        </div>
      </div>

      {/* Top lotería y tirada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metricas?.top_loteria && (
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Top Lotería</p>
                <p className="text-lg font-bold text-gray-900">{metricas.top_loteria.nombre}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Apuestas</span>
              <span className="text-xl font-bold text-indigo-500">{metricas.top_loteria.cantidad_apuestas}</span>
            </div>
          </div>
        )}

        {metricas?.top_tirada && (
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Top Tirada</p>
                <p className="text-lg font-bold text-gray-900">{metricas.top_tirada.loteria} - {formatHora(metricas.top_tirada.hora)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Apuestas</span>
              <span className="text-xl font-bold text-indigo-500">{metricas.top_tirada.cantidad_apuestas}</span>
            </div>
          </div>
        )}

        {!metricas?.top_loteria && !metricas?.top_tirada && (
          <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-xl text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">No hay datos suficientes para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
