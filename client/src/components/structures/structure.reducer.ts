import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export interface IStructure {
  code: string;
  name: string;
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
