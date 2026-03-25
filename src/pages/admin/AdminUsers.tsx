import React, { useState, useEffect } from 'react';
import { usuarioService } from '../../services/api';
import { RefreshCw, Users, Smartphone, DollarSign, X } from 'lucide-react';
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

  // Modal ajustar saldo
  const [ajustarUsuario, setAjustarUsuario] = useState<Usuario | null>(null);
  const [ajustarMonto, setAjustarMonto] = useState<number>(100);
  const [ajustarTipo, setAjustarTipo] = useState<'principal' | 'extraccion'>('principal');
  const [ajustarOperacion, setAjustarOperacion] = useState<'sumar' | 'restar'>('sumar');
  const [ajustarLoading, setAjustarLoading] = useState(false);
  const [ajustarMsg, setAjustarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleToggleActive = async (usuario: Usuario) => {
    try {
      await usuarioService.updateUsuario(usuario.id, { is_active: !usuario.is_active });
      await loadUsuarios();
    } catch (err) {
      console.error('Error toggling usuario:', err);
    }
  };

  const openAjustarModal = (usuario: Usuario) => {
    setAjustarUsuario(usuario);
    setAjustarMonto(100);
    setAjustarTipo('principal');
    setAjustarOperacion('sumar');
    setAjustarMsg(null);
  };

  const handleAjustarSaldo = async () => {
    if (!ajustarUsuario || ajustarMonto <= 0) return;
    setAjustarLoading(true);
    setAjustarMsg(null);
    try {
      const res = await usuarioService.ajustarSaldo(ajustarUsuario.id, {
        monto: ajustarMonto,
        tipo: ajustarTipo,
        operacion: ajustarOperacion,
      });
      setAjustarMsg({ type: 'success', text: res.message });
      await loadUsuarios();
      setAjustarUsuario(null);
    } catch (err: unknown) {
      let msg = 'Error al ajustar saldo';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; detail?: string } } };
        const data = axiosErr.response?.data;
        if (data?.error) msg = data.error;
        else if (data?.detail) msg = data.detail;
      }
      setAjustarMsg({ type: 'error', text: msg });
    } finally {
      setAjustarLoading(false);
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
                  <button onClick={() => openAjustarModal(usuario)} className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4" /> Ajustar Saldo
                  </button>
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
                      <td className="p-4 text-sm font-bold text-gray-900">{getSaldo(usuario.saldo_principal)} CUP</td>
                      <td className="p-4 text-sm font-bold text-gray-900">{getSaldo(usuario.saldo_extraccion)} CUP</td>
                      <td className="p-4 text-sm text-gray-600">{formatFecha(usuario.fecha_registro)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${usuario.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {usuario.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => openAjustarModal(usuario)} className="text-amber-500 font-medium text-sm flex items-center gap-1">
                            <DollarSign className="w-4 h-4" /> Ajustar
                          </button>
                          <button onClick={() => handleToggleActive(usuario)} className="text-gray-500 hover:text-gray-700 text-sm">
                            {usuario.is_active ? 'Bloquear' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Ajustar Saldo */}
      {ajustarUsuario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Ajustar Saldo</h2>
              <button onClick={() => setAjustarUsuario(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-500">Usuario</p>
              <p className="font-semibold text-gray-900">{ajustarUsuario.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Principal: {getSaldo(ajustarUsuario.saldo_principal)} CUP | Extracción: {getSaldo(ajustarUsuario.saldo_extraccion)} CUP
              </p>
            </div>

            {ajustarMsg && (
              <div className={`p-3 rounded-xl text-sm ${ajustarMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {ajustarMsg.text}
              </div>
            )}

            {/* Operación */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Operación</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAjustarOperacion('sumar')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm ${ajustarOperacion === 'sumar' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Sumar
                </button>
                <button
                  onClick={() => setAjustarOperacion('restar')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm ${ajustarOperacion === 'restar' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Restar
                </button>
              </div>
            </div>

            {/* Tipo */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Tipo de saldo</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAjustarTipo('principal')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm ${ajustarTipo === 'principal' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Principal
                </button>
                <button
                  onClick={() => setAjustarTipo('extraccion')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm ${ajustarTipo === 'extraccion' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Extracción
                </button>
              </div>
            </div>

            {/* Monto */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Monto (CUP)</p>
              <input
                type="number"
                min="1"
                value={ajustarMonto}
                onChange={(e) => setAjustarMonto(Number(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2 mt-2">
                {[50, 100, 200, 500, 1000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAjustarMonto(v)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium ${ajustarMonto === v ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-center">
              {ajustarOperacion === 'sumar' ? 'Sumar' : 'Restar'} <span className="font-bold">{ajustarMonto} CUP</span> al saldo de <span className="font-bold">{ajustarTipo === 'principal' ? 'principal' : 'extracción'}</span>
            </div>

            <button
              onClick={handleAjustarSaldo}
              disabled={ajustarLoading || ajustarMonto <= 0}
              className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {ajustarLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Confirmar Ajuste
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
