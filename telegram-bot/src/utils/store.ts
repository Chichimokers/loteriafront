import 'dotenv/config';

export interface UserData {
  id: number;
  email: string;
  movil: string;
  tarjeta_bancaria: string;
  banco: string;
  saldo_principal: number;
  saldo_extraccion: number;
  is_active: boolean;
  is_staff: boolean;
}

export interface Session {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserData | null;
  wizardStep: string | null;
  wizardData: Record<string, any>;
}

const sessions = new Map<number, Session>();

export function getSession(chatId: number): Session {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      accessToken: null,
      refreshToken: null,
      user: null,
      wizardStep: null,
      wizardData: {},
    });
  }
  return sessions.get(chatId)!;
}

export function clearSession(chatId: number): void {
  sessions.delete(chatId);
}

export function isAuthenticated(chatId: number): boolean {
  const s = sessions.get(chatId);
  return !!(s?.accessToken && s?.user);
}

export function isAdmin(chatId: number): boolean {
  const s = sessions.get(chatId);
  return !!(s?.user?.is_staff);
}
