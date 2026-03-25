import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession } from './utils/store.js';

const API_URL = process.env.API_URL || 'https://inventory.cloudns.be/api/v1';

const api = axios.create({ baseURL: API_URL });

// Normalize paginated or array responses to always return an array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export function createAuthedApi(chatId: number) {
  const session = getSession(chatId);
  const instance = axios.create({ baseURL: API_URL });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (session.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          if (session.refreshToken) {
            const resp = await axios.post(`${API_URL}/usuarios/token/refresh/`, {
              refresh: session.refreshToken,
            });
            const { access } = resp.data as { access: string };
            session.accessToken = access;
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access}`;
            }
            return instance(originalRequest);
          }
        } catch {
          session.accessToken = null;
          session.refreshToken = null;
          session.user = null;
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// Auth endpoints (no token needed)
export const authService = {
  register: async (data: { email: string; password: string; movil: string; tarjeta_bancaria: string; banco: string }) => {
    const response = await api.post('/usuarios/', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/usuarios/token/', data);
    return response.data as { access: string; refresh: string; user_id: number; email: string };
  },

  getCurrentUser: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/usuarios/me/');
    return response.data;
  },

  updateProfile: async (chatId: number, data: Partial<{ movil: string; tarjeta_bancaria: string; banco: string }>) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch('/usuarios/me/', data);
    return response.data;
  },
};

// Lottery endpoints
export const lotteryService = {
  getLoterias: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/loterias/loterias/');
    return toArray(response.data);
  },

  getTiradasActivas: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/loterias/tiradas/activas/');
    return toArray(response.data);
  },

  getTiradas: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/loterias/tiradas/');
    return toArray(response.data);
  },

  getResultadosHoy: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/loterias/tiradas/resultados_hoy/');
    return toArray(response.data);
  },

  getModalidades: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/loterias/modalidades/');
    return toArray(response.data);
  },
};

// Betting endpoints
export const apuestaService = {
  createApuesta: async (chatId: number, data: { tirada_id: number; modalidad_id: number; numeros: string[]; monto_por_numero: number }) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.post('/apuestas/', data);
    return response.data;
  },

  getMisApuestas: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/apuestas/mis_apuestas/');
    return toArray(response.data);
  },

  getAllApuestas: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/apuestas/');
    return toArray(response.data);
  },
};

// Acreditacion endpoints
export const acreditacionService = {
  create: async (chatId: number, data: { tarjeta: number; monto: number; sms_confirmacion: string; id_transferencia: string }) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.post('/usuarios/acreditaciones/', data);
    return response.data;
  },

  get: async (chatId: number, estado?: string) => {
    const authed = createAuthedApi(chatId);
    const params = estado ? { estado } : {};
    const response = await authed.get('/usuarios/acreditaciones/', { params });
    return toArray(response.data);
  },

  approve: async (chatId: number, id: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch(`/usuarios/acreditaciones/${id}/aprobar/`);
    return response.data;
  },

  reject: async (chatId: number, id: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch(`/usuarios/acreditaciones/${id}/rechazar/`);
    return response.data;
  },
};

// Extraccion endpoints
export const extraccionService = {
  create: async (chatId: number, data: { monto: number }) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.post('/usuarios/extracciones/', data);
    return response.data;
  },

  get: async (chatId: number, estado?: string) => {
    const authed = createAuthedApi(chatId);
    const params = estado ? { estado } : {};
    const response = await authed.get('/usuarios/extracciones/', { params });
    return toArray(response.data);
  },

  approve: async (chatId: number, id: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch(`/usuarios/extracciones/${id}/aprobar/`);
    return response.data;
  },

  reject: async (chatId: number, id: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch(`/usuarios/extracciones/${id}/rechazar/`);
    return response.data;
  },
};

// User management (admin)
export const usuarioService = {
  getAll: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/usuarios/');
    return toArray(response.data);
  },

  update: async (chatId: number, id: number, data: Record<string, any>) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch(`/usuarios/${id}/`, data);
    return response.data;
  },
};

// Tarjetas (payment cards)
export const tarjetaService = {
  getAll: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/usuarios/tarjetas/');
    return toArray(response.data);
  },
};

// Resultados
export const resultadoService = {
  create: async (chatId: number, data: { tirada_id: number; pick_3: string; pick_4: string }) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.post('/loterias/tiradas/ingresar_resultado/', data);
    return response.data;
  },

  getAll: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/loterias/resultados/');
    return toArray(response.data);
  },
};

// Modalidades
export const modalidadService = {
  update: async (chatId: number, id: number, data: { premio_por_peso: number }) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch(`/loterias/modalidades/${id}/`, data);
    return response.data;
  },
};

// Admin endpoints
export const adminService = {
  getMetricas: async (chatId: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.get('/admin/metricas/');
    return response.data;
  },

  createLoteria: async (chatId: number, formData: FormData) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.post('/loterias/loterias/', formData);
    return response.data;
  },

  deleteLoteria: async (chatId: number, id: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.delete(`/loterias/loterias/${id}/`);
    return response.data;
  },

  updateLoteria: async (chatId: number, id: number, data: Record<string, any>) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch(`/loterias/loterias/${id}/`, data);
    return response.data;
  },

  createTirada: async (chatId: number, data: Record<string, any>) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.post('/loterias/tiradas/', data);
    return response.data;
  },

  deleteTirada: async (chatId: number, id: number) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.delete(`/loterias/tiradas/${id}/`);
    return response.data;
  },

  updateTirada: async (chatId: number, id: number, data: Record<string, any>) => {
    const authed = createAuthedApi(chatId);
    const response = await authed.patch(`/loterias/tiradas/${id}/`, data);
    return response.data;
  },
};

export default api;
