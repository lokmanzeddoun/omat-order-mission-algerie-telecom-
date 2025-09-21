import { loginSuccess, userLoaded, authFailed, logoutSuccess } from './auth.reducers';
import http from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
export const loadUser = () => async (dispatch: AppDispatch) => {
  const userJson = localStorage.getItem('user') || '{}';
  const user = JSON.parse(userJson) as IUser;
  const matricule = user.matricule;
  if (!matricule) {
    dispatch(authFailed());
    dispatch(setAlert({ msg: 'Cant not load user!', type: AlertTypes.ERROR }));

    return;
  }
  try {
    const res = await http.get(`/users/${matricule}`);
    if (res.data) {
      return dispatch(userLoaded(res.data));
    }
    dispatch(authFailed());
    dispatch(setAlert({ msg: 'Get user error!', type: AlertTypes.ERROR }));
    return;
  } catch (error) {
    dispatch(authFailed());
    let errorMessage = 'Failed Loading User';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
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

export const login = (payload: ReqLogin) => async (dispatch: any) => {
  try {
    console.info('[auth.thunk] login called', payload);
    const res = await http.post(`/auth/login`, payload);
    const data = res.data;
    if (res.status === 200 && data) {
      // server sets refresh cookie; client receives access token in body
      http.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch(loginSuccess(data));
      dispatch(
        setAlert({
          msg: 'You are logged in!',
          type: AlertTypes.SUCCESS,
        }),
      );
      return;
    }
    setAlert({
      msg: 'Authentication Error',
      type: AlertTypes.ERROR,
      desc: 'Please check you email or password',
    });
    return dispatch(authFailed());
  } catch (error) {
    console.error(error);
    dispatch(
      setAlert({
        msg: 'Authentication Error',
        type: AlertTypes.ERROR,
        desc: 'Please check you email or password',
      }),
    );
    return dispatch(authFailed());
  }
};

export const logout = () => async (dispatch: any) => {
  // clear client-side auth header
  try {
    delete http.defaults.headers.common['Authorization'];
  } catch {
    /* ignore */
  }
  dispatch(logoutSuccess());
  dispatch(
    setAlert({
      msg: 'You are logged out!',
      type: AlertTypes.WARNING,
    }),
  );
};
