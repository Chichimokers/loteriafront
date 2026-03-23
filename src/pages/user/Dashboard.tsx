import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tarjetaService, acreditacionService, extraccionService } from '../../services/api';
import './Dashboard.css';

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
    monto: 0,
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

    if (extraccionData.monto > (user?.saldo_extraccion || 0)) {
      setError('Saldo insuficiente');
      setLoading(false);
      return;
    }

    try {
      await extraccionService.createExtraccion(extraccionData);
      setMessage('Solicitud de extracción enviada. Pendiente de aprobación.');
      await refreshUser();
      setShowExtraerModal(false);
      setExtraccionData({ monto: 0 });
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

  if (!user || typeof user.saldo_principal !== 'number') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="dashboard">
      <h2>Mi Dashboard</h2>
      
      {message && <div className="success-message">{message}</div>}
      
      <div className="saldo-cards">
        <div className="saldo-card principal">
          <h3>Saldo Principal</h3>
          <p className="saldo-amount">{user.saldo_principal.toFixed(2)} CUP</p>
          <div className="saldo-actions">
            <button onClick={() => setShowAcreditarModal(true)} className="btn-acreditar">
              Acreditar
            </button>
            <button onClick={() => setShowExtraerModal(true)} className="btn-extraer">
              Extraer
            </button>
          </div>
        </div>
        <div className="saldo-card extraccion">
          <h3>Saldo para Extracción</h3>
          <p className="saldo-amount">{user.saldo_extraccion.toFixed(2)} CUP</p>
        </div>
      </div>

      {showAcreditarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Acreditar Saldo</h3>
            <p className="modal-subtitle">Selecciona una tarjeta para ver los datos de envío</p>
            {error && <div className="error-message">{error}</div>}
            
            <div className="tarjetas-grid">
              {tarjetas.map((tarjeta) => (
                <div
                  key={tarjeta.id}
                  className={`tarjeta-card ${selectedCardId === tarjeta.id ? 'selected' : ''}`}
                  onClick={() => handleCardClick(tarjeta.id)}
                >
                  <div className="tarjeta-banco">{getBancoLabel(tarjeta.banco)}</div>
                  {selectedCardId === tarjeta.id ? (
                    <div className="tarjeta-detalles">
                      <div className="tarjeta-numero">📱 {tarjeta.numero}</div>
                      <div className="tarjeta-movil">📞 {tarjeta.movil}</div>
                    </div>
                  ) : (
                    <div className="tarjeta-tap">Toca para ver datos</div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAcreditar}>
              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  value={acreditacionData.monto}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, monto: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>SMS de Confirmación</label>
                <textarea
                  value={acreditacionData.sms_confirmacion}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, sms_confirmacion: e.target.value })}
                  required
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>ID de Transferencia</label>
                <input
                  type="text"
                  value={acreditacionData.id_transferencia}
                  onChange={(e) => setAcreditacionData({ ...acreditacionData, id_transferencia: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowAcreditarModal(false); setSelectedCardId(null); }} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" disabled={loading || !selectedCardId} className="btn-submit">
                  {loading ? 'Enviando...' : 'Acreditar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExtraerModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Extraer Saldo</h3>
            <p className="saldo-disponible">
              Saldo disponible: {user.saldo_extraccion.toFixed(2)} CUP
            </p>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleExtraer}>
              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  value={extraccionData.monto}
                  onChange={(e) => setExtraccionData({ monto: Number(e.target.value) })}
                  min="1"
                  max={user.saldo_extraccion}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowExtraerModal(false)} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn-submit">
                  {loading ? 'Enviando...' : 'Extraer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
