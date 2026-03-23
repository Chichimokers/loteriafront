import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    movil: '',
    tarjeta_bancaria: '',
    banco: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'tarjeta_bancaria') {
      const value = e.target.value.replace(/\D/g, '').slice(0, 14);
      const match = value.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (match) {
        const parts = [match[1], match[2], match[3], match[4]].filter(p => p);
        setFormData({ ...formData, [e.target.name]: parts.join('-') });
        return;
      }
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        movil: formData.movil,
        tarjeta_bancaria: formData.tarjeta_bancaria,
        banco: formData.banco,
      });
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Registrarse</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
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
              placeholder="xxx-xxx-xxx-xxxx"
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
            {loading ? 'Cargando...' : 'Registrarse'}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
