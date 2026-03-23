import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-primary-700 to-primary p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <span className="text-5xl">🎰</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Lotería</h1>
          <p className="text-white/80">Únete y empieza a ganar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-modal p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Crear Cuenta</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="label">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="••••"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">Confirmar</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input"
                  placeholder="••••"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="movil" className="label">Teléfono Móvil</label>
              <input
                type="tel"
                id="movil"
                name="movil"
                value={formData.movil}
                onChange={handleChange}
                className="input"
                placeholder="+53 5XX XXX XXXX"
                required
              />
            </div>

            <div>
              <label htmlFor="tarjeta_bancaria" className="label">Tarjeta Bancaria</label>
              <input
                type="text"
                id="tarjeta_bancaria"
                name="tarjeta_bancaria"
                value={formData.tarjeta_bancaria}
                onChange={handleChange}
                className="input"
                placeholder="xxx-xxx-xxx-xxxx"
                required
              />
            </div>

            <div>
              <label htmlFor="banco" className="label">Banco</label>
              <select
                id="banco"
                name="banco"
                value={formData.banco}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">Seleccionar banco</option>
                <option value="metropolitano">Metropolitano</option>
                <option value="bandec">Bandec</option>
                <option value="bpa">BPA</option>
                <option value="cuba">Banco de Cuba</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-secondary w-full py-4 text-lg mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Crear Cuenta
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Inicia Sesión
            </Link>
          </p>
        </div>

        <p className="text-center text-white/60 mt-6 text-sm">
          © 2026 Lotería. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Register;
