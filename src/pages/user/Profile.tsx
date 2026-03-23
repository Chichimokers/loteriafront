import React, { useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/api';
import { Check } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    movil: user?.movil || '',
    tarjeta_bancaria: user?.tarjeta_bancaria || '',
    banco: user?.banco || '',
  });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await authService.updateProfile(formData);
      toast.showToast('Perfil actualizado correctamente', 'success');
      await refreshUser();
    } catch (err: unknown) {
      toast.showToast(err instanceof Error ? err.message : 'Error al actualizar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user || typeof user.saldo_principal !== 'number') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.email}</h2>
            <p className="text-gray-500 text-sm">Usuario desde 2026</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="label">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="input bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">El correo electrónico no puede ser modificado</p>
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
            >
              <option value="">Seleccionar banco</option>
              <option value="metropolitano">Metropolitano</option>
              <option value="bandec">Bandec</option>
              <option value="bpa">BPA</option>
              <option value="cuba">Banco de Cuba</option>
            </select>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-4">
              {loading ? (
                <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
