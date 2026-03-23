import { createContext, useContext } from 'react';

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

export interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; movil: string; tarjeta_bancaria: string; banco: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
