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
      // The token stays in memory only (ADR 0002).
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token; // keep in-memory
    },
    tokenRefreshed: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    authFailed: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    logoutSuccess: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
});

export const { userLoaded, loginSuccess, tokenRefreshed, authFailed, logoutSuccess } = authSlice.actions;

export default authSlice.reducer;
