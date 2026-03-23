import React, { useState, useEffect } from 'react';
import { acreditacionService } from '../../services/api';
import './AdminAcreditaciones.css';

interface Acreditacion {
  id: number;
  usuario_email: string;
  tarjeta: string;
  monto: number | string;
  sms_confirmacion: string;
  id_transferencia: string;
  estado: string;
  fecha: string;
}

const AdminAcreditaciones: React.FC = () => {
  const [acreditaciones, setAcreditaciones] = useState<Acreditacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pendiente' | 'aprobada' | 'rechazada'>('pendiente');

  useEffect(() => {
    loadAcreditaciones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadAcreditaciones = async () => {
    setLoading(true);
    try {
      const data = await acreditacionService.getAcreditaciones(filter);
      const arr = Array.isArray(data) ? data : (data as { results?: Acreditacion[] }).results || [];
      setAcreditaciones(arr);
    } catch (err) {
      console.error('Error loading acreditaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await acreditacionService.approveAcreditacion(id);
      await loadAcreditaciones();
    } catch (err) {
      console.error('Error approving acreditacion:', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await acreditacionService.rejectAcreditacion(id);
      await loadAcreditaciones();
    } catch (err) {
      console.error('Error rejecting acreditacion:', err);
    }
  };

  const formatTarjeta = (numero: string | undefined | null) => {
    if (!numero) return '-';
    const cleaned = String(numero).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return String(numero);
    const parts = [match[1], match[2], match[3], match[4]].filter(p => p);
    return parts.join('-');
  };

  if (loading) {
    return <div className="admin-acreditaciones">Cargando...</div>;
  }

  return (
    <div className="admin-acreditaciones">
      <h2>Acreditaciones</h2>
      
      <div className="filter-buttons">
        <button onClick={() => setFilter('pendiente')} className={filter === 'pendiente' ? 'active' : ''}>
          Pendientes
        </button>
        <button onClick={() => setFilter('aprobada')} className={filter === 'aprobada' ? 'active' : ''}>
          Aprobadas
        </button>
        <button onClick={() => setFilter('rechazada')} className={filter === 'rechazada' ? 'active' : ''}>
          Rechazadas
        </button>
      </div>
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Tarjeta</th>
            <th>Monto</th>
            <th>SMS</th>
            <th>ID Transferencia</th>
            <th>Fecha</th>
            {filter === 'pendiente' && <th>Acciones</th>}
          </tr>
        </thead>
          <tbody>
            {acreditaciones.map((acreditacion) => {
              const montoNum = typeof acreditacion.monto === 'string' ? parseFloat(acreditacion.monto) : acreditacion.monto;
              return (
                <tr key={acreditacion.id}>
                  <td>{acreditacion.id}</td>
                  <td>{acreditacion.usuario_email}</td>
                  <td>{formatTarjeta(acreditacion.tarjeta)}</td>
                  <td>{montoNum.toFixed(2)} CUP</td>
                  <td>{acreditacion.sms_confirmacion}</td>
                  <td>{acreditacion.id_transferencia}</td>
                  <td>{new Date(acreditacion.fecha).toLocaleString()}</td>
                  {filter === 'pendiente' && (
                    <td>
                      <button onClick={() => handleApprove(acreditacion.id)} className="btn-approve">
                        Aprobar
                      </button>
                      <button onClick={() => handleReject(acreditacion.id)} className="btn-reject">
                        Rechazar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
      </table>
    </div>
  );
};

export default AdminAcreditaciones;
