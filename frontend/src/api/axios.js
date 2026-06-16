import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(
        `%c[API Request] %c${config.method?.toUpperCase()} %c${config.url}`,
        'color: #34d399; font-weight: bold',
        'color: #f59e0b',
        'color: #3b82f6',
        config.params || ''
      );
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API Request Error]', error.message);
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(
        `%c[API Response] %c${response.status} %c${response.config.url}`,
        'color: #34d399; font-weight: bold',
        'color: #84cc16',
        'color: #3b82f6',
        `(${response.data?.data ? 'OK' : 'no data'})`
      );
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const message =
      error.response?.data?.error?.message || error.message || 'Unknown error';

    if (import.meta.env.DEV) {
      console.error(
        `%c[API Error] %c${status || 'NETWORK'} %c${url}`,
        'color: #ef4444; font-weight: bold',
        'color: #f59e0b',
        'color: #3b82f6',
        `\n→ ${message}`
      );
    }

    return Promise.reject(error);
  }
);

export default api;
