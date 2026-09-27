import { loginSuccess, userLoaded, authFailed, logoutSuccess } from './auth.reducers';
import http from 'helpers/http';
import i18n from 'i18n';
import { extractErrorMessage } from 'helpers/errorHandler';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
export const loadUser = () => async (dispatch: AppDispatch) => {
  const userJson = localStorage.getItem('user') || '{}';
  const user = JSON.parse(userJson) as IUser;
  const matricule = user.matricule;
  if (!matricule) {
    dispatch(authFailed());
    dispatch(setAlert({ msg: i18n.t('toasts:userLoadFailed'), type: AlertTypes.ERROR }));

    return;
  }
  try {
    const res = await http.get(`/users/${matricule}`);
    if (res.data) {
      return dispatch(userLoaded(res.data));
    }
    dispatch(authFailed());
    dispatch(setAlert({ msg: i18n.t('toasts:userLoadFailed'), type: AlertTypes.ERROR }));
    return;
  } catch (error) {
    dispatch(authFailed());
    const errorMessage = extractErrorMessage(error);
    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    return;
  }
};

// Restore session using httpOnly refresh cookie. Call on app startup.
export const restoreSession = () => async (dispatch: AppDispatch) => {
  try {
    const res = await http.post('/auth/refresh');
    const data = res.data as ResLoginApi;
    if (res.status === 200 && data) {
      // set Authorization header for subsequent requests
      http.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch(loginSuccess(data));
      return;
    }
    dispatch(authFailed());
  } catch {
    dispatch(authFailed());
  }
};

export type LoginResult = { ok: true } | { ok: false; reason: 'invalid' | 'error' };

export const login =
  (payload: ReqLogin) =>
  async (dispatch: any): Promise<LoginResult> => {
    try {
      const res = await http.post(`/auth/login`, payload);
      const data = res.data;
      if (res.status === 200 && data) {
        // server sets refresh cookie; client receives access token in body
        http.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        dispatch(loginSuccess(data));
        dispatch(setAlert({ msg: i18n.t('toasts:signedIn'), type: AlertTypes.SUCCESS }));
        return { ok: true };
      }
      dispatch(authFailed());
      return { ok: false, reason: 'invalid' };
    } catch (error) {
      dispatch(authFailed());
      const status = (error as { response?: { status?: number } })?.response?.status;
      // 400/401/403/404: wrong credentials; anything else is a technical failure
      return { ok: false, reason: status && status >= 400 && status < 500 ? 'invalid' : 'error' };
    }
  };

export const logout = () => async (dispatch: any) => {
  try {
    // Inform server to clear refresh cookie
    await http.post('/auth/logout');
  } catch {
    // ignore server logout errors
  }

  // clear client-side auth header
  try {
    delete http.defaults.headers.common['Authorization'];
  } catch {
    /* ignore */
  }

  dispatch(logoutSuccess());
  dispatch(
    setAlert({
      msg: i18n.t('toasts:signedOut'),
      type: AlertTypes.WARNING,
    }),
  );
};
