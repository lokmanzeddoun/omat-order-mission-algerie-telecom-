import axios from 'axios';
import { loginSuccess, userLoaded, authFailed, logoutSuccess } from './auth.reducers';
const API_URL = 'http://localhost:8000';
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
    const res = await axios.get(`${API_URL}/users/${matricule}`);
    if (res) {
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

export const login = (payload: ReqLogin) => async (dispatch: any) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, payload);
    const data = res.data;
    if (res.status === 200 && data) {
      dispatch(loginSuccess(data.user));
      dispatch(
        setAlert({
          msg: 'You are logged in!',
          type: AlertTypes.SUCCESS,
        }),
      );
      dispatch(loadUser());
      return;
    }
    dispatch();
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
  dispatch(logoutSuccess());
  dispatch(
    setAlert({
      msg: 'You are logged out!',
      type: AlertTypes.WARNING,
    }),
  );
};
