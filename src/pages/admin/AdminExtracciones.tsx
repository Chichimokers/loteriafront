import React, { useState, useEffect } from 'react';
import { extraccionService } from '../../services/api';
import './AdminExtracciones.css';

interface Extraccion {
  id: number;
  usuario_email: string;
  monto: number | string;
  estado: string;
  fecha: string;
}

const AdminExtracciones: React.FC = () => {
  const [extracciones, setExtracciones] = useState<Extraccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pendiente' | 'aprobada' | 'rechazada'>('pendiente');

  useEffect(() => {
    loadExtracciones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadExtracciones = async () => {
    try {
      const data = await extraccionService.getExtracciones(filter);
      const arr = Array.isArray(data) ? data : (data as { results?: Extraccion[] }).results || [];
      setExtracciones(arr);
    } catch (err) {
      console.error('Error loading extracciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await extraccionService.approveExtraccion(id);
      await loadExtracciones();
    } catch (err) {
      console.error('Error approving extraccion:', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await extraccionService.rejectExtraccion(id);
      await loadExtracciones();
    } catch (err) {
      console.error('Error rejecting extraccion:', err);
    }
  };

  if (loading) {
    return <div className="admin-extracciones">Cargando...</div>;
  }

  return (
    <div className="admin-extracciones">
      <h2>Extracciones</h2>
      
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
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha</th>
            {filter === 'pendiente' && <th>Acciones</th>}
          </tr>
        </thead>
          <tbody>
            {extracciones.map((extraccion) => {
              const montoNum = typeof extraccion.monto === 'string' ? parseFloat(extraccion.monto) : extraccion.monto;
              return (
                <tr key={extraccion.id}>
                  <td>{extraccion.id}</td>
                  <td>{extraccion.usuario_email}</td>
                  <td>{montoNum.toFixed(2)} CUP</td>
                  <td>{extraccion.estado}</td>
                  <td>{new Date(extraccion.fecha).toLocaleString()}</td>
                  {filter === 'pendiente' && (
                    <td>
                      <button onClick={() => handleApprove(extraccion.id)} className="btn-approve">
                        Aprobar
                      </button>
                      <button onClick={() => handleReject(extraccion.id)} className="btn-reject">
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

export default AdminExtracciones;
