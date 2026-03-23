import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    movil: user?.movil || '',
    tarjeta_bancaria: user?.tarjeta_bancaria || '',
    banco: user?.banco || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.getCurrentUser();
      setMessage('Perfil actualizado correctamente');
      await refreshUser();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar perfil';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || typeof user.saldo_principal !== 'number') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="profile-page">
      <h2>Mi Perfil</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={user.email} disabled />
        </div>
        
        <div className="form-group">
          <label htmlFor="movil">Móvil</label>
          <input
            type="text"
            id="movil"
            name="movil"
            value={formData.movil}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tarjeta_bancaria">Tarjeta Bancaria</label>
          <input
            type="text"
            id="tarjeta_bancaria"
            name="tarjeta_bancaria"
            value={formData.tarjeta_bancaria}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="banco">Banco</label>
          <select
            id="banco"
            name="banco"
            value={formData.banco}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar banco</option>
            <option value="metropolitano">Metropolitano</option>
            <option value="bandec">Bandec</option>
            <option value="bpa">BPA</option>
            <option value="cuba">Banco de Cuba</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
