import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export interface IStructureResponsible {
  matricule: number;
  nom: string;
  prenom: string;
}
export interface IStructure {
  code: string;
  name: string;
  /** Code of the parent; absent or null for a root (ADR 0004). */
  parentCode?: string | null;
  /** A root's full name, a child's path. */
  displayName?: string;
  responsibleUserId?: number | null;
  responsible?: IStructureResponsible | null;
}
export interface UserState {
  loading: boolean;
  structures: IStructure[];
  error: string | null; // Error message if an action fails
}
const initialState: UserState = {
  loading: true,
  structures: [],
  error: null,
};

const userSlice = createSlice({
  name: 'structures',
  initialState,
  reducers: {
    fetchStructuresStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchStructuresSuccess(state, action: PayloadAction<IStructure[]>) {
      state.structures = action.payload;
      state.loading = false;
    },
    fetchStructureError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createStructure(state, action: PayloadAction<IStructure>) {
      state.structures = [action.payload, ...state.structures];
    },
    editStructure(state, action: PayloadAction<IStructure>) {
      const index = state.structures.findIndex((user) => user.code === action.payload.code);
      if (index !== -1) {
        state.structures[index] = action.payload;
      }
    },
    removeStructure(state, action: PayloadAction<string>) {
      state.structures = state.structures.filter((user) => user.code !== action.payload);
    },
  },
});

export const {
  fetchStructureError,
  fetchStructuresStart,
  fetchStructuresSuccess,
  createStructure,
  editStructure,
  removeStructure,
} = userSlice.actions;

export default userSlice.reducer;
