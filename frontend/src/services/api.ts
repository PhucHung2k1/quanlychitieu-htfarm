import axios from 'axios';
import { Transaction, SummaryData, ProjectTag, Category, User, AiParsedData } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');

export const api = axios.create({
  baseURL: API_BASE,
});

export const getImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = API_BASE ? (API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE) : '';
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${base}${cleanPath}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  },
);

export const authService = {
  login: async (username: string, password: string): Promise<{ accessToken: string; user: User }> => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  getUsers: async (): Promise<User[]> => {
    const res = await api.get('/auth/users');
    return res.data;
  },
};

export const transactionService = {
  getAll: async (params?: { month?: string; year?: string; projectTagId?: string; search?: string; sortBy?: string }): Promise<Transaction[]> => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },
  getSummary: async (params?: { month?: string; year?: string; projectTagId?: string }): Promise<SummaryData> => {
    const res = await api.get('/transactions/summary', { params });
    return res.data;
  },
  create: async (data: Partial<Transaction>): Promise<Transaction> => {
    const res = await api.post('/transactions', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    const res = await api.put(`/transactions/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

export const metaService = {
  getTags: async (): Promise<ProjectTag[]> => {
    const res = await api.get('/meta/tags');
    return res.data;
  },
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/meta/categories');
    return res.data;
  },
  getSettings: async (): Promise<Record<string, string>> => {
    const res = await api.get('/meta/settings');
    return res.data;
  },
};

export const aiService = {
  parseReceipt: async (file: File): Promise<{ billImageUrl: string; parsedData: AiParsedData }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/ai/parse-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
