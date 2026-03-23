import React, { useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { AuthContext } from './auth-context';

interface Usuario {
  id: number;
  email: string;
  movil: string;
  tarjeta_bancaria: string;
  banco: string;
  saldo_principal: number;
  saldo_extraccion: number;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  fecha_registro?: string;
}

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      const data = userData as Record<string, unknown>;
      setUser({
        id: data.id as number,
        email: data.email as string,
        movil: (data.movil as string) || '',
        tarjeta_bancaria: (data.tarjeta_bancaria as string) || '',
        banco: (data.banco as string) || '',
        saldo_principal: typeof data.saldo_principal === 'string' ? parseFloat(data.saldo_principal) : (data.saldo_principal as number) || 0,
        saldo_extraccion: typeof data.saldo_extraccion === 'string' ? parseFloat(data.saldo_extraccion) : (data.saldo_extraccion as number) || 0,
        is_active: data.is_active as boolean ?? true,
        is_staff: data.is_staff as boolean ?? false,
        date_joined: (data.date_joined as string) || (data.fecha_registro as string) || new Date().toISOString(),
      });
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login({ email, password });
    await refreshUser();
  };

  const register = async (data: { email: string; password: string; movil: string; tarjeta_bancaria: string; banco: string }) => {
    await authService.register(data);
    await login(data.email, data.password);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
