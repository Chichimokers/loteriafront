import React, { useState, useEffect } from 'react';
import { usuarioService, apuestaService } from '../../services/api';
import './AdminDashboard.css';

interface DashboardStats {
  totalUsuarios: number;
  apuestasHoy: number;
  volumenApuestas: number;
  premiosPagados: number;
  saldoTotal: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    apuestasHoy: 0,
    volumenApuestas: 0,
    premiosPagados: 0,
    saldoTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const usuarios = await usuarioService.getUsuarios();
      const apuestaData = await apuestaService.getApuestas();
      
      const usuariosArray = usuarios as Array<{id: number; saldo_principal: number; saldo_extraccion: number}>;
      const apuestasArray = apuestaData as Array<{monto: number; premio: number; fecha: string}>;
      
      const hoy = new Date().toISOString().split('T')[0];
      const apuestasDeHoy = apuestasArray.filter(a => a.fecha.startsWith(hoy));
      
      setStats({
        totalUsuarios: usuariosArray.length,
        apuestasHoy: apuestasDeHoy.length,
        volumenApuestas: apuestasDeHoy.reduce((sum, a) => sum + a.monto, 0),
        premiosPagados: apuestasDeHoy.reduce((sum, a) => sum + a.premio, 0),
        saldoTotal: usuariosArray.reduce((sum, u) => sum + u.saldo_principal + u.saldo_extraccion, 0),
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard">Cargando...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Dashboard</h2>
      
      <div className="kpi-cards">
        <div className="kpi-card">
          <h3>Total Usuarios</h3>
          <p className="kpi-value">{stats.totalUsuarios}</p>
        </div>
        <div className="kpi-card">
          <h3>Apuestas Hoy</h3>
          <p className="kpi-value">{stats.apuestasHoy}</p>
        </div>
        <div className="kpi-card">
          <h3>Volumen de Apuestas</h3>
          <p className="kpi-value">{stats.volumenApuestas.toFixed(2)} CUP</p>
        </div>
        <div className="kpi-card">
          <h3>Premios Pagados</h3>
          <p className="kpi-value">{stats.premiosPagados.toFixed(2)} CUP</p>
        </div>
        <div className="kpi-card">
          <h3>Saldo Total Sistema</h3>
          <p className="kpi-value">{stats.saldoTotal.toFixed(2)} CUP</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
