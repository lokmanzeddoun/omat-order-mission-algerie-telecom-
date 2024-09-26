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
  accessToken: '',
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
      state.isAuthenticated = true;
      state.loading = false;
      state.token = `${action.payload.matricule}`;
      state.user = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<IUser>) => {
      localStorage.setItem('user', JSON.stringify(action.payload));
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload;
    },
    authFailed: (state) => {
      localStorage.removeItem('user');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    logoutSuccess: (state) => {
      localStorage.removeItem('user');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
});

export const { userLoaded, loginSuccess, authFailed, logoutSuccess } = authSlice.actions;

export default authSlice.reducer;
