import React, { useState, useEffect } from 'react';
import { usuarioService } from '../../services/api';
import './AdminUsers.css';

interface Usuario {
  id: number;
  email: string;
  movil: string;
  saldo_principal: number;
  saldo_extraccion: number;
  banco: string;
  is_active: boolean;
  date_joined: string;
}

const AdminUsers: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ saldo_principal: 0, saldo_extraccion: 0 });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await usuarioService.getUsuarios();
      setUsuarios(data as Usuario[]);
    } catch (err) {
      console.error('Error loading usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingId(usuario.id);
    setEditData({
      saldo_principal: usuario.saldo_principal,
      saldo_extraccion: usuario.saldo_extraccion,
    });
  };

  const handleSave = async (id: number) => {
    try {
      await usuarioService.updateUsuario(id, editData);
      await loadUsuarios();
      setEditingId(null);
    } catch (err) {
      console.error('Error updating usuario:', err);
    }
  };

  const handleToggleActive = async (usuario: Usuario) => {
    try {
      await usuarioService.updateUsuario(usuario.id, { is_active: !usuario.is_active });
      await loadUsuarios();
    } catch (err) {
      console.error('Error toggling usuario:', err);
    }
  };

  if (loading) {
    return <div className="admin-users">Cargando...</div>;
  }

  return (
    <div className="admin-users">
      <h2>Gestión de Usuarios</h2>
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Móvil</th>
            <th>Saldo Principal</th>
            <th>Saldo Extracción</th>
            <th>Banco</th>
            <th>Registrado</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td>{usuario.email}</td>
              <td>{usuario.movil}</td>
              <td>
                {editingId === usuario.id ? (
                  <input
                    type="number"
                    value={editData.saldo_principal}
                    onChange={(e) => setEditData({ ...editData, saldo_principal: Number(e.target.value) })}
                  />
                ) : (
                  usuario.saldo_principal.toFixed(2)
                )}
              </td>
              <td>
                {editingId === usuario.id ? (
                  <input
                    type="number"
                    value={editData.saldo_extraccion}
                    onChange={(e) => setEditData({ ...editData, saldo_extraccion: Number(e.target.value) })}
                  />
                ) : (
                  usuario.saldo_extraccion.toFixed(2)
                )}
              </td>
              <td>{usuario.banco}</td>
              <td>{new Date(usuario.date_joined).toLocaleDateString()}</td>
              <td>{usuario.is_active ? 'Activo' : 'Inactivo'}</td>
              <td>
                {editingId === usuario.id ? (
                  <button onClick={() => handleSave(usuario.id)}>Guardar</button>
                ) : (
                  <>
                    <button onClick={() => handleEdit(usuario)}>Editar</button>
                    <button onClick={() => handleToggleActive(usuario)}>
                      {usuario.is_active ? 'Bloquear' : 'Activar'}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
