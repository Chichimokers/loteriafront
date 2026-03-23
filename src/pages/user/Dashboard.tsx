import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tarjetaService, acreditacionService, extraccionService } from '../../services/api';

interface Tarjeta {
  id: number;
  numero: string;
  movil: string;
  banco: string;
  activa: boolean;
}

const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [showAcreditarModal, setShowAcreditarModal] = useState(false);
  const [showExtraerModal, setShowExtraerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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

  const handleAcreditar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await acreditacionService.createAcreditacion(acreditacionData);
      setMessage('Solicitud enviada. Pendiente de aprobación.');
      setShowAcreditarModal(false);
      setAcreditacionData({ tarjeta: 0, monto: 0, sms_confirmacion: '', id_transferencia: '' });
      setSelectedCardId(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar solicitud';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExtraer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const montoRaw = extraccionData.monto;
    if (!montoRaw || montoRaw.trim() === '') {
      setError('Ingrese un monto válido');
      setLoading(false);
      return;
    }

    const montoNum = parseFloat(montoRaw);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('Ingrese un monto válido mayor a 0');
      setLoading(false);
      return;
    }

    if (montoNum > (user?.saldo_principal || 0)) {
      setError('Saldo insuficiente');
      setLoading(false);
      return;
    }

    try {
      await extraccionService.createExtraccion({ monto: montoNum });
      setMessage('Solicitud enviada. Pendiente de aprobación.');
      await refreshUser();
      setShowExtraerModal(false);
      setExtraccionData({ monto: '' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar solicitud';
      setError(errorMessage);
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
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return String(numero);
    const parts = [match[1], match[2], match[3], match[4]].filter(p => p);
    return parts.join('-');
  };

  if (!user || typeof user.saldo_principal !== 'number') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {message && (
        <div className="bg-success/10 text-success p-3 rounded-lg text-sm font-medium">
          {message}
        </div>
      )}

      {/* Saldo Principal */}
      <div className="bg-gradient-to-br from-primary to-primary-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">💰</span>
          <span className="text-white/80 text-sm font-medium">Saldo Principal</span>
        </div>
        <div className="text-4xl font-bold mb-4">{user.saldo_principal.toFixed(2)} CUP</div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAcreditarModal(true)}
            className="flex-1 bg-white text-primary font-semibold py-3 px-4 rounded-xl"
          >
            + Acreditar
          </button>
     
        </div>
      </div>

      {/* Saldo Extracción */}
      <div className="bg-gradient-to-br from-success to-success-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🏦</span>
          <span className="text-white/80 text-sm font-medium">Disponible para extraer</span>
        </div>
        <div className="text-3xl font-bold mb-4">{user.saldo_extraccion.toFixed(2)} CUP</div>
        <button
          onClick={() => setShowExtraerModal(true)}
          className="w-full bg-white text-success font-semibold py-3 px-4 rounded-xl"
        >
          Extraer a mi cuenta
        </button>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-4 gap-3">
        <a href="/apuestas" className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm">
          <span className="text-2xl">🎯</span>
          <span className="text-xs font-medium text-gray-700">Apostar</span>
        </a>
        <a href="/historial" className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm">
          <span className="text-2xl">📊</span>
          <span className="text-xs font-medium text-gray-700">Historial</span>
        </a>
        <a href="/resultados" className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm">
          <span className="text-2xl">🎰</span>
          <span className="text-xs font-medium text-gray-700">Resultados</span>
        </a>
        <a href="/perfil" className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm">
          <span className="text-2xl">👤</span>
          <span className="text-xs font-medium text-gray-700">Perfil</span>
        </a>
      </div>

      {/* Modal Acreditar */}
      {showAcreditarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAcreditarModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Acreditar Saldo</h3>
              <button onClick={() => setShowAcreditarModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
              
              <p className="text-sm text-gray-500 mb-3">Selecciona una tarjeta</p>
              
              <div className="space-y-2 mb-4">
                {tarjetas.map((tarjeta) => (
                  <div
                    key={tarjeta.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedCardId === tarjeta.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => handleCardClick(tarjeta.id)}
                  >
                    <p className="font-semibold text-gray-900">{getBancoLabel(tarjeta.banco)}</p>
                    {selectedCardId === tarjeta.id && (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>📱 {formatTarjeta(tarjeta.numero)}</p>
                        <p>📞 {tarjeta.movil}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAcreditar} className="space-y-3">
                <input
                  type="number"
                  placeholder="Monto (CUP)"
                  value={acreditacionData.monto}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, monto: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  required
                />
                <textarea
                  placeholder="SMS de confirmación"
                  value={acreditacionData.sms_confirmacion}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, sms_confirmacion: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  rows={2}
                  required
                />
                <input
                  type="text"
                  placeholder="ID de transferencia"
                  value={acreditacionData.id_transferencia}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, id_transferencia: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  required
                />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAcreditarModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading || !selectedCardId} className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-50">
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
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Extraer Saldo</h3>
              <button onClick={() => setShowExtraerModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-4">
              <div className="bg-primary/10 p-4 rounded-xl flex justify-between items-center mb-4">
                <span className="text-gray-600">Saldo disponible:</span>
                <span className="text-xl font-bold text-primary">{user.saldo_principal.toFixed(2)} CUP</span>
              </div>
              
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
              
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
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  required
                />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowExtraerModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-success text-white font-semibold rounded-xl disabled:opacity-50">
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
