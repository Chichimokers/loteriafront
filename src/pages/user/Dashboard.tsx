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
      setMessage('Solicitud de acreditación enviada. Pendiente de aprobación.');
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
      setMessage('Solicitud de extracción enviada. Pendiente de aprobación.');
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

  const formatTarjeta = (numero: string) => {
    const cleaned = numero.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return numero;
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
        <button
          onClick={() => setShowAcreditarModal(true)}
          className="btn btn-primary"
        >
          + Nueva Acreditación
        </button>
      </div>

      {message && (
        <div className="success-message">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {message}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Principal Card */}
        <div className="card bg-gradient-to-br from-primary to-primary-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Saldo Principal</p>
                <p className="text-xs text-white/60">Disponible para apuestas</p>
              </div>
            </div>
            <p className="text-4xl font-bold mb-6">{user.saldo_principal.toFixed(2)} CUP</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAcreditarModal(true)}
                className="btn bg-white text-primary hover:bg-white/90 flex-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Acreditar
              </button>
              <button
                onClick={() => setShowExtraerModal(true)}
                className="btn bg-white/20 text-white hover:bg-white/30 flex-1 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Extraer
              </button>
            </div>
          </div>
        </div>

        {/* Extracción Card */}
        <div className="card bg-gradient-to-br from-secondary to-secondary-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">🏦</span>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Saldo de Extracción</p>
                <p className="text-xs text-white/60">Listo para retirar</p>
              </div>
            </div>
            <p className="text-4xl font-bold mb-6">{user.saldo_extraccion.toFixed(2)} CUP</p>
            <button
              onClick={() => setShowExtraerModal(true)}
              className="btn bg-white text-secondary hover:bg-white/90 w-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Solicitar Extracción
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/apuestas" className="flex flex-col items-center p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <span className="text-2xl">🎯</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Hacer Apuesta</span>
          </a>
          <a href="/historial" className="flex flex-col items-center p-4 rounded-xl bg-secondary/5 hover:bg-secondary/10 transition-colors group">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
              <span className="text-2xl">📊</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Mi Historial</span>
          </a>
          <a href="/perfil" className="flex flex-col items-center p-4 rounded-xl bg-success/5 hover:bg-success/10 transition-colors group">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-success/20 transition-colors">
              <span className="text-2xl">👤</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Mi Perfil</span>
          </a>
          <button className="flex flex-col items-center p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors group">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gray-300 transition-colors">
              <span className="text-2xl">❓</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Ayuda</span>
          </button>
        </div>
      </div>

      {/* Modal Acreditar */}
      {showAcreditarModal && (
        <div className="modal-backdrop" onClick={() => setShowAcreditarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-900">Acreditar Saldo</h3>
              <button 
                onClick={() => setShowAcreditarModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              
              <p className="text-sm text-gray-600 mb-4">Selecciona una tarjeta para ver los datos de envío</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {tarjetas.map((tarjeta) => (
                  <div
                    key={tarjeta.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedCardId === tarjeta.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCardClick(tarjeta.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">💳</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{getBancoLabel(tarjeta.banco)}</p>
                        {selectedCardId === tarjeta.id && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p>📱 {formatTarjeta(tarjeta.numero)}</p>
                            <p>📞 {tarjeta.movil}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAcreditar} className="space-y-4">
                <div>
                  <label className="label">Monto (CUP)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={acreditacionData.monto}
                    onChange={(e) => setAcreditacionData({ ...acreditacionData, monto: Number(e.target.value) })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">SMS de Confirmación</label>
                  <textarea
                    value={acreditacionData.sms_confirmacion}
                    onChange={(e) => setAcreditacionData({ ...acreditacionData, sms_confirmacion: e.target.value })}
                    className="input"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="label">ID de Transferencia</label>
                  <input
                    type="text"
                    value={acreditacionData.id_transferencia}
                    onChange={(e) => setAcreditacionData({ ...acreditacionData, id_transferencia: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="modal-footer !px-0 !border-0">
                  <button type="button" onClick={() => setShowAcreditarModal(false)} className="btn btn-ghost">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading || !selectedCardId} className="btn btn-primary">
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
        <div className="modal-backdrop" onClick={() => setShowExtraerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-900">Extraer Saldo</h3>
              <button 
                onClick={() => setShowExtraerModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="bg-primary/5 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-sm text-gray-600">Saldo disponible</p>
                    <p className="text-xl font-bold text-gray-900">{user.saldo_extraccion.toFixed(2)} CUP</p>
                  </div>
                </div>
              </div>
              
              {error && <div className="error-message mb-4">{error}</div>}
              
              <form onSubmit={handleExtraer} className="space-y-4">
                <div>
                  <label className="label">Monto a Extraer (CUP)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={extraccionData.monto}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
                        setExtraccionData({ monto: raw });
                      }
                    }}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div className="modal-footer !px-0 !border-0">
                  <button type="button" onClick={() => setShowExtraerModal(false)} className="btn btn-ghost">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-secondary">
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
