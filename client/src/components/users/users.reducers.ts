import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Role } from 'constants/role';
import { Category } from 'constants/category';
export interface IUser {
  matricule: number;
  nom: string;
  prenom: string;
  grade: string;
  email: string;
  password: string;
  role: Role;
  category: Category;
  status: string;
  service: string;
}
export interface UserState {
  loading: boolean;
  users: IUser[];
  error: string | null; // Error message if an action fails
}
const initialState: UserState = {
  loading: true,
  users: [],
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    fetchUsersStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess(state, action: PayloadAction<IUser[]>) {
      state.users = action.payload;
      state.loading = false;
    },
    fetchUsersError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createUser(state, action: PayloadAction<IUser>) {
      state.users = [action.payload, ...state.users];
    },
    editUser(state, action: PayloadAction<IUser>) {
      const index = state.users.findIndex((user) => user.matricule === action.payload.matricule);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    removeUser(state, action: PayloadAction<number>) {
      state.users = state.users.filter((user) => user.matricule !== action.payload);
    },
  },
});

export const { fetchUsersStart, fetchUsersError, createUser, removeUser, editUser, fetchUsersSuccess } =
  userSlice.actions;

export default userSlice.reducer;
