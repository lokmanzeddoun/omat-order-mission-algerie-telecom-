import axios from 'axios';
import { extractErrorMessage } from './errorHandler';

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

if (import.meta.env.DEV && typeof window !== 'undefined') {
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
    return config;
});

/**
 * The store registers these (see main.tsx) so this module does not import it.
 * `refreshed` receives the new session; `ended` runs when it cannot be renewed.
 */
const sessionHooks: {
    refreshed: (data: ResLoginApi) => void;
    ended: () => void;
} = { refreshed: () => undefined, ended: () => undefined };

export function onSession(hooks: Partial<typeof sessionHooks>) {
    Object.assign(sessionHooks, hooks);
}

export function setAccessToken(token: string | null) {
    if (token) http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete http.defaults.headers.common['Authorization'];
}

// One refresh at a time: parallel 401s wait for the same rotation instead of
// replaying the refresh cookie (which the server would treat as a theft).
let refreshing: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
    refreshing ??= http
        .post<ResLoginApi>('/auth/refresh')
        .then((res) => {
            const token = res.data?.token;
            if (!token) throw new Error('No token');
            setAccessToken(token);
            sessionHooks.refreshed(res.data);
            return token;
        })
        .finally(() => {
            refreshing = null;
        });
    return refreshing;
}

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

        // Credential routes answer 401 for a bad password or code: never retry them.
        const requestUrl = String(cfg.url || '').toLowerCase();
        const isAuthRoute = /\/auth\/(login|refresh|logout|mfa\/)/.test(requestUrl);

        // Access tokens live 15 minutes: on 401, refresh once and replay the request.
        if (status === 401 && !isAuthRoute && !cfg.__isRetryRequest) {
            cfg.__isRetryRequest = true;
            try {
                const newToken = await refreshAccessToken();
                cfg.headers = cfg.headers || {};
                cfg.headers['Authorization'] = `Bearer ${newToken}`;
                return await http(cfg);
            } catch {
                sessionHooks.ended();
                // Sign-in lives at the app root ('/' under the '/omat' basename)
                const signInPath = import.meta.env.BASE_URL;
                if (typeof window !== 'undefined' && window.location.pathname !== signInPath) {
                    window.location.href = signInPath;
                }
                return Promise.reject(error);
            }
        }

        // Use the error handler to extract and normalize the error message
        const normalizedMessage = extractErrorMessage(error);

        // Attach normalized message to the error object for easy access in catch blocks
        error.message = normalizedMessage;
        if (error.response) {
            error.response.data = {
                ...(typeof error.response.data === 'object' ? error.response.data : {}),
                normalizedMessage,
                message: normalizedMessage,
            };
        }

        return Promise.reject(error);
    },
);

export default http;
