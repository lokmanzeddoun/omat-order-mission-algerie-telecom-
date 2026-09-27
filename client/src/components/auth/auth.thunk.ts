import { loginSuccess, userLoaded, authFailed, logoutSuccess } from './auth.reducers';
import http, { refreshAccessToken, setAccessToken } from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';

export const loadUser = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  const matricule = getState().auth.user?.matricule;
  if (!matricule) {
    dispatch(authFailed());
    return;
  }
  try {
    const res = await http.get(`/users/${matricule}`);
    if (res.data) {
      return dispatch(userLoaded(res.data));
    }
    dispatch(setAlert({ msg: 'Get user error!', type: AlertTypes.ERROR }));
  } catch (error) {
    let errorMessage = 'Failed Loading User';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
  }
};

// Restore the session from the httpOnly refresh cookie. Called on app startup:
// nothing about the session is kept in browser storage (ADR 0002).
export const restoreSession = () => async (dispatch: AppDispatch) => {
  try {
    await refreshAccessToken(); // the session hook dispatches loginSuccess
  } catch {
    dispatch(authFailed());
  }
};

/** The second step an ADMIN / SUPER_ADMIN must pass after the password. */
export type MfaChallenge = { stage: 'verify' | 'enroll'; mfaToken: string };

export type LoginResult =
  | { ok: true; recoveryCodes?: string[]; session?: ResLoginApi }
  | { ok: false; reason: 'invalid' | 'error' | 'throttled' }
  | { ok: false; reason: 'mfa'; mfa: MfaChallenge };

function failure(error: unknown): LoginResult {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 429) return { ok: false, reason: 'throttled' };
  // 400/401/403: wrong credentials or code; anything else is a technical failure
  return { ok: false, reason: status && status >= 400 && status < 500 ? 'invalid' : 'error' };
}

function startSession(dispatch: AppDispatch, data: ResLoginApi) {
  setAccessToken(data.token);
  dispatch(loginSuccess(data));
  dispatch(setAlert({ msg: 'Connexion réussie', type: AlertTypes.SUCCESS }));
}

export const login =
  (payload: ReqLogin) =>
  async (dispatch: AppDispatch): Promise<LoginResult> => {
    try {
      const res = await http.post(`/auth/login`, payload);
      const data = res.data;
      if (data?.mfa) {
        return { ok: false, reason: 'mfa', mfa: { stage: data.mfa, mfaToken: data.mfaToken } };
      }
      if (data?.token) {
        startSession(dispatch, data);
        return { ok: true };
      }
      dispatch(authFailed());
      return { ok: false, reason: 'invalid' };
    } catch (error) {
      dispatch(authFailed());
      return failure(error);
    }
  };

export type MfaEnrollment = { otpauthUrl: string; qrDataUrl: string; secret: string };

/** Enrollment: a new TOTP secret to scan with an authenticator app. */
export const startMfaEnrollment = async (mfaToken: string): Promise<MfaEnrollment | null> => {
  try {
    const res = await http.post<MfaEnrollment>('/auth/mfa/setup', { mfaToken });
    return res.data;
  } catch {
    return null;
  }
};

/** Second factor: a TOTP code or a recovery code. */
export const verifyMfa =
  (mfaToken: string, code: string) =>
  async (dispatch: AppDispatch): Promise<LoginResult> => {
    try {
      const res = await http.post('/auth/mfa/verify', { mfaToken, code });
      const { recoveryCodes, ...data } = res.data;
      // After enrollment the codes are shown before entering the app.
      if (recoveryCodes) {
        setAccessToken(data.token);
        return { ok: true, recoveryCodes: recoveryCodes as string[], session: data as ResLoginApi };
      }
      startSession(dispatch, data);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  };

/** Enter the app once the recovery codes have been saved. */
export const finishMfaEnrollment = (data: ResLoginApi) => (dispatch: AppDispatch) =>
  startSession(dispatch, data);

/** Local sign-out when the server already ended the session (e.g. password change). */
export const endSession = () => (dispatch: AppDispatch) => {
  setAccessToken(null);
  dispatch(logoutSuccess());
};

export const logout = () => async (dispatch: AppDispatch) => {
  try {
    // Revoke the session server-side and clear the refresh cookie
    await http.post('/auth/logout');
  } catch {
    // ignore server logout errors
  }
  dispatch(endSession());
  dispatch(
    setAlert({
      msg: 'Vous êtes déconnecté',
      type: AlertTypes.WARNING,
    }),
  );
};
