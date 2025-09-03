import axios from 'axios';

// Use the Vite proxy in dev (/api -> backend) to avoid CORS. In prod, prefer VITE_API_URL or fallback to '/api'.
const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? '/api');

const http = axios.create({
    baseURL,
});

if (typeof window !== 'undefined') {
    // Lightweight runtime hint to verify which baseURL is used
    console.info('[http] baseURL =', baseURL);
}

// Debug logs for requests/responses (dev only)
if (import.meta.env.DEV) {
    http.interceptors.request.use((config) => {
        const method = (config.method || 'get').toUpperCase();
        const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
        console.info(`[http] → ${method} ${fullUrl}`);
        return config;
    });
    http.interceptors.response.use(
        (response) => {
            const method = (response.config.method || 'get').toUpperCase();
            const fullUrl = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
            console.info(`[http] ← ${method} ${fullUrl} ${response.status}`);
            return response;
        },
        (error) => {
            const cfg = error?.config || {};
            const method = (cfg.method || 'get').toUpperCase();
            const fullUrl = `${cfg.baseURL ?? ''}${cfg.url ?? ''}`;
            const status = error?.response?.status;
            console.warn(`[http] × ${method} ${fullUrl} ${status ?? ''}`, error?.message);
            return Promise.reject(error);
        },
    );
}

export default http;
