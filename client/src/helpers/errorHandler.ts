import { AxiosError } from 'axios';

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

/**
 * Extract a user-friendly error message from an axios error
 * This handles all the different error formats that might come from the backend
 */
export const extractErrorMessage = (error: unknown): string => {
  // Default error message
  const defaultMessage = 'Une erreur est survenue';

  // Not an error object
  if (!error) {
    return defaultMessage;
  }

  // If it's an axios error
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Network error (no response from server)
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') {
        return 'La requête a expiré. Veuillez réessayer.';
      }
      if (axiosError.code === 'ERR_NETWORK') {
        return 'Erreur de connexion. Vérifiez votre connexion internet.';
      }
      return 'Impossible de contacter le serveur';
    }

    // Server responded with an error
    const responseData = axiosError.response.data;

    // Check if response has the standard format
    if (responseData && typeof responseData === 'object') {
      const apiError = responseData as ApiErrorResponse;

      // Extract message from the standard error format
      if (apiError.message) {
        // If message is an array (validation errors), join them
        if (Array.isArray(apiError.message)) {
          return apiError.message.join(', ');
        }
        // If message is a string, return it
        if (typeof apiError.message === 'string') {
          return apiError.message;
        }
      }

      // Fallback to error field
      if (apiError.error && typeof apiError.error === 'string') {
        return apiError.error;
      }
    }

    // If response data is a string
    if (typeof responseData === 'string') {
      return responseData;
    }

    // Use status code to provide a generic message
    const status = axiosError.response.status;
    return getMessageForStatusCode(status);
  }

  // If it's a regular Error object
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  // If it's a string
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error type
  return defaultMessage;
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
 * Get a user-friendly message based on HTTP status code
 */
function getMessageForStatusCode(status: number): string {
  switch (status) {
    case 400:
      return 'Requête invalide';
    case 401:
      return 'Vous devez vous connecter pour continuer';
    case 403:
      return "Vous n'avez pas les permissions nécessaires";
    case 404:
      return 'Ressource introuvable';
    case 409:
      return 'Cette ressource existe déjà';
    case 422:
      return 'Données invalides';
    case 429:
      return 'Trop de requêtes. Veuillez réessayer plus tard.';
    case 500:
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    case 502:
      return 'Service temporairement indisponible';
    case 503:
      return 'Service en maintenance';
    default:
      return 'Une erreur est survenue';
  }
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
