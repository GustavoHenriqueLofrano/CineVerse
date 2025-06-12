import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Configuração completa da API
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  params: {
    api_key: API_CONFIG.key,
    language: API_CONFIG.language
  }
});

// Interceptador para adicionar parâmetros adicionais
api.interceptors.request.use((config) => {
  // Se já tem parâmetros, adiciona os da API_CONFIG
  if (config.params) {
    config.params.api_key = API_CONFIG.key;
    config.params.language = API_CONFIG.language;
  }
  return config;
});

export default api;