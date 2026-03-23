import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/ToastContext';
import { tarjetaService, acreditacionService, extraccionService } from '../../services/api';
import { Wallet, CreditCard, Target, BarChart3, Dices, User, Smartphone, X, Phone } from 'lucide-react';

interface Tarjeta {
  id: number;
  numero: string;
  movil: string;
  banco: string;
  activa: boolean;
}

const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [showAcreditarModal, setShowAcreditarModal] = useState(false);
  const [showExtraerModal, setShowExtraerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const [acreditacionData, setAcreditacionData] = useState({
    tarjeta: 0,
    monto: 0,
    sms_confirmacion: '',
    id_transferencia: '',
  });

  const [extraccionData, setExtraccionData] = useState({
    monto: '',
  });

  useEffect(() => {
    loadTarjetas();
    refreshUser();
  }, []);

  const loadTarjetas = async () => {
    try {
      const data = await tarjetaService.getTarjetas();
      const cards = Array.isArray(data) ? data : (data as { results?: Tarjeta[] }).results || [];
      const activas = cards.filter((t: Tarjeta) => t.activa);
      setTarjetas(activas);
    } catch (err) {
      console.error('Error loading tarjetas:', err);
    }
  };

  const handleCardClick = (cardId: number) => {
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
    setAcreditacionData({ ...acreditacionData, tarjeta: cardId });
  };

  const openAcreditar = async () => {
    await refreshUser();
    setShowAcreditarModal(true);
  };

  const openExtraer = async () => {
    await refreshUser();
    setShowExtraerModal(true);
  };

  const handleAcreditar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await acreditacionService.createAcreditacion(acreditacionData);
      toast.showToast('Solicitud enviada. Pendiente de aprobación.', 'success');
      setShowAcreditarModal(false);
      setAcreditacionData({ tarjeta: 0, monto: 0, sms_confirmacion: '', id_transferencia: '' });
      setSelectedCardId(null);
      await refreshUser();
    } catch (err: unknown) {
      toast.showToast(err instanceof Error ? err.message : 'Error al enviar solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const montoRaw = extraccionData.monto;
    if (!montoRaw || montoRaw.trim() === '') {
      toast.showToast('Ingrese un monto válido', 'warning');
      setLoading(false);
      return;
    }

    const montoNum = parseFloat(montoRaw);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.showToast('Ingrese un monto válido mayor a 0', 'warning');
      setLoading(false);
      return;
    }

    if (montoNum > (user?.saldo_principal || 0)) {
      toast.showToast('Saldo insuficiente', 'error');
      setLoading(false);
      return;
    }

    try {
      await extraccionService.createExtraccion({ monto: montoNum });
      toast.showToast('Solicitud enviada. Pendiente de aprobación.', 'success');
      await refreshUser();
      setShowExtraerModal(false);
      setExtraccionData({ monto: '' });
    } catch (err: unknown) {
      toast.showToast(err instanceof Error ? err.message : 'Error al enviar solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getBancoLabel = (banco: string) => {
    const bancos: Record<string, string> = {
      'metropolitano': 'Metropolitano',
      'bandec': 'Bandec',
      'bpa': 'BPA',
      'cuba': 'Banco de Cuba',
    };
    return bancos[banco] || banco;
  };

  const formatTarjeta = (numero: string | undefined | null) => {
    if (!numero) return '-';
    const cleaned = String(numero).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (!match) return String(numero);
    const parts = [match[1], match[2], match[3], match[4]].filter(p => p);
    return parts.join('-');
  };

  if (!user || typeof user.saldo_principal !== 'number') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Saldo Principal */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5" />
          <span className="text-white/80 text-sm font-medium">Saldo Principal</span>
        </div>
        <div className="text-4xl font-bold mb-4">{user.saldo_principal.toFixed(2)} CUP</div>
        <div className="flex gap-3">
          <button
            onClick={openAcreditar}
            className="flex-1 bg-white text-indigo-600 font-semibold py-3 px-4 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            + Acreditar
          </button>
        </div>
      </div>

      {/* Saldo Extracción */}
      <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5" />
          <span className="text-white/80 text-sm font-medium">Disponible para extraer</span>
        </div>
        <div className="text-3xl font-bold mb-4">{user.saldo_extraccion.toFixed(2)} CUP</div>
        <button
          onClick={openExtraer}
          className="w-full bg-white text-green-600 font-semibold py-3 px-4 rounded-xl hover:bg-green-50 transition-colors"
        >
          Extraer a mi cuenta
        </button>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-4 gap-3">
        <a href="/apuestas" className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <Target className="w-6 h-6 text-blue-500" />
          <span className="text-xs font-medium text-gray-700">Apostar</span>
        </a>
        <a href="/historial" className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          <span className="text-xs font-medium text-gray-700">Historial</span>
        </a>
        <a href="/resultados" className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <Dices className="w-6 h-6 text-orange-500" />
          <span className="text-xs font-medium text-gray-700">Resultados</span>
        </a>
        <a href="/perfil" className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <User className="w-6 h-6 text-green-500" />
          <span className="text-xs font-medium text-gray-700">Perfil</span>
        </a>
      </div>

      {/* Modal Acreditar */}
      {showAcreditarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAcreditarModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Acreditar Saldo</h3>
              <button onClick={() => setShowAcreditarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Selecciona una tarjeta</p>

              <div className="space-y-2 mb-4">
                {tarjetas.map((tarjeta) => (
                  <div
                    key={tarjeta.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedCardId === tarjeta.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCardClick(tarjeta.id)}
                  >
                    <p className="font-semibold text-gray-900">{getBancoLabel(tarjeta.banco)}</p>
                    {selectedCardId === tarjeta.id && (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          <span>{formatTarjeta(tarjeta.numero)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{tarjeta.movil}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAcreditar} className="space-y-3">
                <input
                  type="number"
                  placeholder="Monto (CUP)"
                  value={acreditacionData.monto || ''}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, monto: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                />
                <textarea
                  placeholder="SMS de confirmación"
                  value={acreditacionData.sms_confirmacion}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, sms_confirmacion: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  rows={2}
                  required
                />
                <input
                  type="text"
                  placeholder="ID de transferencia"
                  value={acreditacionData.id_transferencia}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, id_transferencia: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAcreditarModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading || !selectedCardId} className="flex-1 py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50">
                    {loading ? 'Enviando...' : 'Acreditar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Extraer */}
      {showExtraerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowExtraerModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Extraer Saldo</h3>
              <button onClick={() => setShowExtraerModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-indigo-50 p-4 rounded-xl flex justify-between items-center mb-4">
                <span className="text-gray-600">Saldo disponible:</span>
                <span className="text-xl font-bold text-indigo-600">{user.saldo_principal.toFixed(2)} CUP</span>
              </div>

              <form onSubmit={handleExtraer} className="space-y-3">
                <input
                  type="number"
                  placeholder="Monto a extraer"
                  value={extraccionData.monto}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
                      setExtraccionData({ monto: raw });
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowExtraerModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50">
                    {loading ? 'Procesando...' : 'Extraer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
