import axios from 'axios';

// Use the Vite proxy in dev (/api -> backend) to avoid CORS. In prod, prefer VITE_API_URL or fallback to '/api'.
const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? '/api');

const http = axios.create({
    baseURL,
    withCredentials: true,
});

if (typeof window !== 'undefined') {
    // Lightweight runtime hint to verify which baseURL is used
    console.info('[http] baseURL =', baseURL);
}

// Debug logs for requests/responses (dev only)
http.interceptors.request.use((config) => {
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
                // fall through to normalize and reject original error
            }
        }

        // Normalize error message across the app (handles Blob JSON too)
        try {
            const resp = error?.response;
            let data = resp?.data;
            const headers = resp?.headers || {};
            const contentType: string = headers['content-type'] || headers['Content-Type'] || '';

            // If data is a Blob (e.g., because responseType was 'blob'), try to decode JSON
            if (typeof Blob !== 'undefined' && data instanceof Blob) {
                const isJson = contentType.includes('application/json') || contentType === '';
                const text = await data.text();
                try {
                    data = isJson ? JSON.parse(text) : text;
                } catch {
                    data = text;
                }
                // replace the blob with parsed data for downstream catch blocks
                if (resp) resp.data = data;
            }

            // Compute a normalized message
            let normalizedMessage = '';
            if (data) {
                const msg = (data as any).message;
                if (Array.isArray(msg)) normalizedMessage = msg.join(' | ');
                else if (typeof msg === 'string') normalizedMessage = msg;
                else if (typeof data === 'string') normalizedMessage = data as string;
                else if (typeof (data as any).error === 'string') normalizedMessage = (data as any).error;
            }
            if (!normalizedMessage) normalizedMessage = error.message || 'Request failed';

            // Attach normalized message for consumers
            if (resp) {
                (resp as any).data = { ...(resp.data || {}), normalizedMessage, message: normalizedMessage };
            }
            error.message = normalizedMessage;
        } catch {
            // ignore normalization errors
        }

        return Promise.reject(error);
    },
);

export default http;
