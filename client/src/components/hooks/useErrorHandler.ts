import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { extractErrorMessage, isAuthError, isNetworkError } from 'helpers/errorHandler';

/**
 * Custom hook for handling API errors consistently across the application
 *
 * Usage:
 * ```tsx
 * const handleError = useErrorHandler();
 *
 * try {
 *   await http.post('/api/endpoint', data);
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export const useErrorHandler = () => {
  const dispatch = useDispatch<AppDispatch>();

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      // Use custom message if provided, otherwise extract from error
      const message = customMessage || extractErrorMessage(error);

      // Show error alert
      dispatch(
        setAlert({
          msg: message,
          type: AlertTypes.ERROR,
        })
      );

      // Log error in development
      if (import.meta.env.DEV) {
        console.error('[Error Handler]', error);
      }

      // Handle specific error types
      if (isNetworkError(error)) {
        // Could show a special network error dialog or retry mechanism
        console.warn('Network error detected');
      }

      if (isAuthError(error)) {
        // Could trigger logout or redirect to login
        console.warn('Authentication error detected');
      }
    },
    [dispatch]
  );

  return handleError;
};

/**
 * Custom hook for handling API errors with success messages
 *
 * Usage:
 * ```tsx
 * const { handleError, handleSuccess } = useApiHandler();
 *
 * try {
 *   const response = await http.post('/api/endpoint', data);
 *   handleSuccess('Opération réussie');
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export const useApiHandler = () => {
  const dispatch = useDispatch<AppDispatch>();
  const handleError = useErrorHandler();

  const handleSuccess = useCallback(
    (message: string, description?: string) => {
      dispatch(
        setAlert({
          msg: message,
          type: AlertTypes.SUCCESS,
          desc: description,
        })
      );
    },
    [dispatch]
  );

  const handleWarning = useCallback(
    (message: string, description?: string) => {
      dispatch(
        setAlert({
          msg: message,
          type: AlertTypes.WARNING,
          desc: description,
        })
      );
    },
    [dispatch]
  );

  const handleInfo = useCallback(
    (message: string, description?: string) => {
      dispatch(
        setAlert({
          msg: message,
          type: AlertTypes.INFO,
          desc: description,
        })
      );
    },
    [dispatch]
  );

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
  };
};
