import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data as { access: string };
          localStorage.setItem('access_token', access);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (data: { email: string; password: string; movil: string; tarjeta_bancaria: string; banco: string }) => {
    const response = await api.post('/usuarios/', data);
    return response.data;
  },
  
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/token/', data);
    const { access, refresh } = response.data as { access: string; refresh: string };
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/usuarios/me/');
    return response.data;
  },
};

export const lotteryService = {
  getLoterias: async () => {
    const response = await api.get('/loterias/');
    return response.data;
  },
  
  getTiradasActivas: async () => {
    const response = await api.get('/tiradas/activas/');
    return response.data;
  },
  
  getTiradas: async () => {
    const response = await api.get('/tiradas/');
    return response.data;
  },
  
  getModalidades: async () => {
    const response = await api.get('/modalidades/');
    return response.data;
  },
};

export const apuestaService = {
  createApuesta: async (data: { loteria_id: number; modalidad_id: number; tirada_id: number; numeros: string[]; monto_por_numero: number }) => {
    const response = await api.post('/apuestas/', data);
    return response.data;
  },
  
  getApuestas: async () => {
    const response = await api.get('/apuestas/');
    return response.data;
  },
};

export const acreditacionService = {
  createAcreditacion: async (data: { tarjeta_id: number; monto: number; sms_confirmacion: string; id_transferencia: string }) => {
    const response = await api.post('/acreditaciones/', data);
    return response.data;
  },
  
  getAcreditaciones: async (estado?: string) => {
    const params = estado ? { estado } : {};
    const response = await api.get('/acreditaciones/', { params });
    return response.data;
  },
  
  approveAcreditacion: async (id: number) => {
    const response = await api.patch(`/acreditaciones/${id}/aprobar/`);
    return response.data;
  },
  
  rejectAcreditacion: async (id: number) => {
    const response = await api.patch(`/acreditaciones/${id}/rechazar/`);
    return response.data;
  },
};

export const extraccionService = {
  createExtraccion: async (data: { monto: number }) => {
    const response = await api.post('/extracciones/', data);
    return response.data;
  },
  
  getExtracciones: async (estado?: string) => {
    const params = estado ? { estado } : {};
    const response = await api.get('/extracciones/', { params });
    return response.data;
  },
  
  approveExtraccion: async (id: number) => {
    const response = await api.patch(`/extracciones/${id}/aprobar/`);
    return response.data;
  },
  
  rejectExtraccion: async (id: number) => {
    const response = await api.patch(`/extracciones/${id}/rechazar/`);
    return response.data;
  },
};

export const usuarioService = {
  getUsuarios: async () => {
    const response = await api.get('/usuarios/');
    return response.data;
  },
  
  updateUsuario: async (id: number, data: Partial<{ movil: string; tarjeta_bancaria: string; banco: string; saldo_principal: number; saldo_extraccion: number; is_active: boolean }>) => {
    const response = await api.patch(`/usuarios/${id}/`, data);
    return response.data;
  },
};

export const tarjetaService = {
  getTarjetas: async () => {
    const response = await api.get('/tarjetas/');
    return response.data;
  },
};

export const resultadoService = {
  createResultado: async (data: { tirada_id: number; pick_3: string; pick_4: string }) => {
    const response = await api.post('/tiradas/resultados/', data);
    return response.data;
  },
};

export const modalidadService = {
  updateModalidad: async (id: number, data: { premio_por_peso: number }) => {
    const response = await api.patch(`/modalidades/${id}/`, data);
    return response.data;
  },
};

export default api;
