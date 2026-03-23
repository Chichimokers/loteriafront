import React, { useState, useEffect } from 'react';
import { usuarioService } from '../../services/api';
import { RefreshCw, Users, Smartphone } from 'lucide-react';
import { formatMonto } from '../../utils/format';

interface Usuario {
  id: number;
  email: string;
  movil: string;
  saldo_principal: number | string;
  saldo_extraccion: number | string;
  banco: string;
  tarjeta_bancaria: string;
  fecha_registro: string;
  is_active: boolean;
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
      const usuariosArr = Array.isArray(data) ? data : (data as { results?: Usuario[] }).results || [];
      setUsuarios(usuariosArr);
    } catch (err) {
      console.error('Error loading usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSaldo = (saldo: number | string) => {
    const num = typeof saldo === 'string' ? parseFloat(saldo) : saldo;
    return formatMonto(num);
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTarjeta = (tarjeta: string) => {
    if (!tarjeta) return '-';
    const cleaned = String(tarjeta).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (!match) return String(tarjeta);
    const parts = [match[1], match[2], match[3], match[4]].filter(p => p);
    return parts.join('-');
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingId(usuario.id);
    setEditData({
      saldo_principal: typeof usuario.saldo_principal === 'string' ? parseFloat(usuario.saldo_principal) : usuario.saldo_principal,
      saldo_extraccion: typeof usuario.saldo_extraccion === 'string' ? parseFloat(usuario.saldo_extraccion) : usuario.saldo_extraccion,
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={loadUsuarios} className="btn btn-ghost">
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-2xl font-bold text-green-600">{usuarios.filter(u => u.is_active).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Inactivos</p>
          <p className="text-2xl font-bold text-red-600">{usuarios.filter(u => !u.is_active).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Saldo Total</p>
          <p className="text-2xl font-bold text-indigo-500">
            {formatMonto(usuarios.reduce((acc, u) => acc + (typeof u.saldo_principal === 'number' ? u.saldo_principal : parseFloat(u.saldo_principal) || 0), 0))} CUP
          </p>
        </div>
      </div>

      {usuarios.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">No hay usuarios registrados</p>
        </div>
      ) : (
        <>
          {/* Cards para móvil */}
          <div className="lg:hidden space-y-3">
            {usuarios.map((usuario) => (
              <div key={usuario.id} className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{usuario.email}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Smartphone className="w-4 h-4" />
                      <span>{usuario.movil}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${usuario.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {usuario.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Banco</p>
                    <p className="font-medium">{usuario.banco || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tarjeta</p>
                    <p className="font-medium">{formatTarjeta(usuario.tarjeta_bancaria)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Saldo Principal</p>
                    <p className="font-bold text-gray-900">{getSaldo(usuario.saldo_principal)} CUP</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Saldo Extracción</p>
                    <p className="font-bold text-gray-900">{getSaldo(usuario.saldo_extraccion)} CUP</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Registrado</p>
                    <p className="font-medium">{formatFecha(usuario.fecha_registro)}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  {editingId === usuario.id ? (
                    <button onClick={() => handleSave(usuario.id)} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">
                      Guardar
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(usuario)} className="flex-1 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium">
                        Editar
                      </button>
                      <button onClick={() => handleToggleActive(usuario)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${usuario.is_active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {usuario.is_active ? 'Bloquear' : 'Activar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tabla para PC */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Móvil</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Banco</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Tarjeta</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Saldo Principal</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Saldo Extracción</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Registrado</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Estado</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-900 font-medium">{usuario.email}</td>
                      <td className="p-4 text-sm text-gray-600">{usuario.movil}</td>
                      <td className="p-4 text-sm text-gray-600">{usuario.banco || '-'}</td>
                      <td className="p-4 text-sm text-gray-600">{formatTarjeta(usuario.tarjeta_bancaria)}</td>
                      <td className="p-4 text-sm font-bold text-gray-900">
                        {editingId === usuario.id ? (
                          <input
                            type="number"
                            value={editData.saldo_principal}
                            onChange={(e) => setEditData({ ...editData, saldo_principal: Number(e.target.value) })}
                            className="w-24 p-1 border rounded"
                          />
                        ) : (
                          `${getSaldo(usuario.saldo_principal)} CUP`
                        )}
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900">
                        {editingId === usuario.id ? (
                          <input
                            type="number"
                            value={editData.saldo_extraccion}
                            onChange={(e) => setEditData({ ...editData, saldo_extraccion: Number(e.target.value) })}
                            className="w-24 p-1 border rounded"
                          />
                        ) : (
                          `${getSaldo(usuario.saldo_extraccion)} CUP`
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{formatFecha(usuario.fecha_registro)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${usuario.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {usuario.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4">
                        {editingId === usuario.id ? (
                          <button onClick={() => handleSave(usuario.id)} className="text-green-500 font-medium text-sm">
                            Guardar
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(usuario)} className="text-indigo-500 font-medium text-sm">
                              Editar
                            </button>
                            <button onClick={() => handleToggleActive(usuario)} className="text-gray-500 hover:text-gray-700 text-sm">
                              {usuario.is_active ? 'Bloquear' : 'Activar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsers;
