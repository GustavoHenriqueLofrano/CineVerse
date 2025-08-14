import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  params: {
    api_key: API_CONFIG.key,
    language: API_CONFIG.language
  }
});

api.interceptors.request.use((config) => {
  if (config.params) {
    config.params.api_key = API_CONFIG.key;
    config.params.language = API_CONFIG.language;
  }
  return config;
});

export default api;