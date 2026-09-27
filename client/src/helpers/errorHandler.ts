import { AxiosError } from 'axios';
import i18n from 'i18n';

/**
 * Standard error response from backend
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

// Known backend messages (English or French, not localized by the API) mapped to
// translated keys. Anything else falls back to a message chosen from the HTTP status.
const KNOWN_SERVER_MESSAGES: [RegExp, string][] = [
  [/pending password reset/i, 'errors:pendingReset'],
  [/wrong credentials|invalid password/i, 'errors:invalidCredentials'],
  [/already exists|existe déjà|cette email exist/i, 'errors:alreadyExists'],
  [/date_retour must be strictly after/i, 'errors:returnBeforeDeparture'],
  [/nombre de repas/i, 'errors:invalidMealsCount'],
  [/not in PENDING status/i, 'errors:decompteNotPending'],
  [/unsupported file type|correct file name/i, 'errors:unsupportedFile'],
  [/empty file|fichier.*vide/i, 'errors:emptyFile'],
  [/pdf/i, 'errors:pdfFailed'],
];

const STATUS_KEYS: Record<number, string> = {
  400: 'errors:badRequest',
  401: 'errors:unauthorized',
  403: 'errors:forbidden',
  404: 'errors:notFound',
  409: 'errors:conflict',
  413: 'errors:tooLarge',
  422: 'errors:invalidData',
  429: 'errors:tooManyRequests',
  500: 'errors:server',
  502: 'errors:unavailable',
  503: 'errors:maintenance',
};

/** Raw message sent by the backend, if any (kept for logic that must not depend on the UI language). */
export const serverMessage = (error: unknown): string => {
  if (!isAxiosError(error)) return '';
  const data = (error as AxiosError<ApiErrorResponse & { serverMessage?: string }>).response?.data;
  if (!data || typeof data !== 'object') return typeof data === 'string' ? data : '';
  if (data.serverMessage !== undefined) return data.serverMessage;
  const message = data.message as unknown;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return typeof data.error === 'string' ? data.error : '';
};

/**
 * Extract a user-friendly, translated error message from an axios error (or any thrown value).
 */
export const extractErrorMessage = (error: unknown): string => {
  const generic = i18n.t('errors:generic');
  if (!error) return generic;

  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse & { normalizedMessage?: string }>;

    // Network error (no response from server)
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') return i18n.t('errors:timeout');
      if (axiosError.code === 'ERR_NETWORK') return i18n.t('errors:network');
      return i18n.t('errors:unreachable');
    }

    // Already normalized by the http interceptor.
    const data = axiosError.response.data;
    if (data && typeof data === 'object' && typeof data.normalizedMessage === 'string') return data.normalizedMessage;

    const raw = serverMessage(error);
    const known = KNOWN_SERVER_MESSAGES.find(([pattern]) => pattern.test(raw));
    if (known) return i18n.t(known[1]);

    const status = axiosError.response.status;
    const statusKey = STATUS_KEYS[status] ?? (status >= 500 ? 'errors:server' : undefined);
    return statusKey ? i18n.t(statusKey) : generic;
  }

  if (error instanceof Error) return error.message || generic;
  if (typeof error === 'string') return error;
  return generic;
};

/**
 * Type guard to check if error is an AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as any).isAxiosError === true
  );
}

/**
 * Check if an error is a network error (no response from server)
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return false;
  }
  return !error.response;
};

/**
 * Check if error is due to authentication issues
 */
export const isAuthError = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status === 401 || status === 403;
};

/**
 * Get error details for debugging (development only)
 */
export const getErrorDetails = (error: unknown): string => {
  if (!isAxiosError(error)) {
    return String(error);
  }

  const axiosError = error as AxiosError<ApiErrorResponse>;
  const details = {
    message: extractErrorMessage(error),
    status: axiosError.response?.status,
    statusText: axiosError.response?.statusText,
    url: axiosError.config?.url,
    method: axiosError.config?.method?.toUpperCase(),
  };

  return JSON.stringify(details, null, 2);
};
