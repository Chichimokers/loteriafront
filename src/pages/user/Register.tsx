import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/ToastContext';
import { Sparkles, UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    movil: '',
    tarjeta_bancaria: '',
    banco: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'tarjeta_bancaria') {
      const value = e.target.value.replace(/\D/g, '').slice(0, 16);
      const match = value.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
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

    if (formData.password !== formData.confirmPassword) {
      toast.showToast('Las contraseñas no coinciden', 'warning');
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
      toast.showToast(err instanceof Error ? err.message : 'Error al registrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-500 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <Sparkles className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Lotería</h1>
          <p className="text-white/80">Únete y empieza a ganar</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Crear Cuenta</h2>

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
                placeholder="xxxx-xxxx-xxxx-xxxx"
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
                  <UserPlus className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-500 font-semibold hover:underline">
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
