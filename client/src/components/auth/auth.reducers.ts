import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Role } from 'constants/role';
import { Category } from 'constants/category';
const userType: IUser = {
  matricule: 0,
  nom: '',
  prenom: '',
  grade: '',
  email: '',
  password: '',
  role: Role.guest,
  category: Category.other,
};
export interface AuthState {
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null; // token can be string or null
  user: IUser;
}
const initialState: AuthState = {
  loading: true,
  isAuthenticated: false,
  token: null,
  user: userType,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    userLoaded: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<ResLoginApi>) => {
      // Persisting user is optional; avoid persisting tokens in localStorage for security
      try {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      } catch {
        /* ignore storage errors */
      }
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token; // keep in-memory
    },
    authFailed: (state) => {
      try {
        localStorage.removeItem('user');
      } catch {
        /* ignore */
      }
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    logoutSuccess: (state) => {
      try {
        localStorage.removeItem('user');
      } catch {
        /* ignore */
      }
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
});

export const { userLoaded, loginSuccess, authFailed, logoutSuccess } = authSlice.actions;

export default authSlice.reducer;
