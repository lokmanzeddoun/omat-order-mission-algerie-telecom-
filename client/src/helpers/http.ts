import axios from 'axios';
import { extractErrorMessage, serverMessage } from './errorHandler';

// Use the Vite proxy in dev (/api -> backend) to avoid CORS. In prod, prefer VITE_API_URL or fallback to '/api'.
const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? '/api');

// Fail fast instead of spinning forever; file downloads (PDF/Excel exports) get more time.
const DEFAULT_TIMEOUT_MS = 15_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;

const http = axios.create({
    baseURL,
    withCredentials: true,
    timeout: DEFAULT_TIMEOUT_MS,
});

if (typeof window !== 'undefined') {
    // Lightweight runtime hint to verify which baseURL is used
    console.info('[http] baseURL =', baseURL);
}

// Debug logs for requests/responses (dev only)
http.interceptors.request.use((config) => {
    if (config.responseType === 'blob' && config.timeout === DEFAULT_TIMEOUT_MS) {
        config.timeout = DOWNLOAD_TIMEOUT_MS;
    }
    if (import.meta.env.DEV) {
        const method = (config.method || 'get').toUpperCase();
        const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
        console.info(`[http] → ${method} ${fullUrl}`);
    }
    // Ensure Authorization header is present if token exists in storage
    try {
        const hasAuth = config.headers && (
            (config.headers as any)['Authorization'] || (config.headers as any)['authorization']
        );
        if (!hasAuth && typeof window !== 'undefined') {
            const raw = window.localStorage.getItem('token');
            let token: string | null = null;
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    token = typeof parsed === 'string' ? parsed : parsed?.token || null;
                } catch {
                    token = raw; // use raw string as token
                }
            }
            if (token) {
                config.headers = config.headers || {};
                (config.headers as any)['Authorization'] = `Bearer ${token}`;
            }
        }
    } catch {
        // ignore storage issues
    }
    return config;
});

http.interceptors.response.use(
    (response) => {
        if (import.meta.env.DEV) {
            const method = (response.config.method || 'get').toUpperCase();
            const fullUrl = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
            console.info(`[http] ← ${method} ${fullUrl} ${response.status}`);
        }
        return response;
    },
    async (error) => {
        const cfg = error?.config || {};
        const method = (cfg.method || 'get').toUpperCase();
        const fullUrl = `${cfg.baseURL ?? ''}${cfg.url ?? ''}`;
        const status = error?.response?.status;

        if (import.meta.env.DEV) {
            console.warn(`[http] × ${method} ${fullUrl} ${status ?? ''}`, error?.message);
        }

        // If the failed request is the refresh endpoint itself, don't try to refresh again
        const requestUrl = String(cfg.url || '').toLowerCase();
        if (requestUrl.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        // If unauthorized, attempt one refresh and retry original request
        if (status === 401 && !cfg.__isRetryRequest) {
            try {
                cfg.__isRetryRequest = true;
                const r = await http.post('/auth/refresh');
                const newToken = r.data?.token;
                if (newToken) {
                    cfg.headers = cfg.headers || {};
                    cfg.headers['Authorization'] = `Bearer ${newToken}`;
                }
                return await http(cfg);
            } catch {
                // If refresh fails, logout user by clearing storage
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('token');
                    window.localStorage.removeItem('user');
                    window.localStorage.removeItem('persist:root');
                    // Optionally redirect to login
                    // Sign-in lives at the app root ('/' under the '/omat' basename)
                    const signInPath = import.meta.env.BASE_URL;
                    if (window.location.pathname !== signInPath) {
                        window.location.href = signInPath;
                    }
                }
                return Promise.reject(error);
            }
        }

        // Use the error handler to extract and normalize (translate) the error message;
        // the backend's own text is kept as `serverMessage`.
        const originalMessage = serverMessage(error);
        const normalizedMessage = extractErrorMessage(error);

        // Attach normalized message to the error object for easy access in catch blocks
        error.message = normalizedMessage;
        if (error.response) {
            error.response.data = {
                ...(typeof error.response.data === 'object' ? error.response.data : {}),
                serverMessage: originalMessage,
                normalizedMessage,
                message: normalizedMessage,
            };
        }

        return Promise.reject(error);
    },
);

export default http;
