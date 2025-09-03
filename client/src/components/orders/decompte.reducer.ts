import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the Decompte interface for decompte data
export interface IDecompte {
  heure_sortie: string;
  date_retour: string;
  heure_retour: string;
  hebergement_sans_pec?: number;
  repas_sans_pec?: number;
  repas_pec?: number;
  hebergement_pec?: number;
  distance_km?: number; // Distance parcourue pour indemnité kilométrique
  transport_cost?: number; // Frais de transport engagés (DA)
  missionId: number; // Relation to the mission
}

export interface DecompteState {
  loading: boolean;
  decomptes: IDecompte[];
  error: string | null; // Error message if an action fails
}

// Initial state for decompte slice
const initialState: DecompteState = {
  loading: false,
  decomptes: [],
  error: null,
};

// Create the decompte slice using createSlice
const decompteSlice = createSlice({
  name: 'decompte',
  initialState,
  reducers: {
    // Action to handle when decompte creation happens
    createDecompte(state, action: PayloadAction<IDecompte>) {
      state.decomptes = [action.payload, ...state.decomptes]; // Add new decompte to the top
    },

    // Action to indicate the fetch process started
    fetchDecompteStart(state) {
      state.loading = true;
      state.error = null; // Clear any previous errors
    },

    // Action to set fetched decomptes
    fetchDecompteSuccess(state, action: PayloadAction<IDecompte[]>) {
      state.decomptes = action.payload; // Update the state with the fetched decomptes
      state.loading = false; // Set loading to false since the decomptes are loaded
    },

    // Action to handle when fetch fails
    fetchDecompteFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload; // Set error message in case of failure
    },

    // Action to edit an existing decompte
    editDecompte(state, action: PayloadAction<IDecompte>) {
      const index = state.decomptes.findIndex(
        (decompte) => decompte.missionId === action.payload.missionId,
      );
      if (index !== -1) {
        state.decomptes[index] = action.payload;
      }
    },

    // Action to remove a decompte
    removeDecompte(state, action: PayloadAction<number>) {
      state.decomptes = state.decomptes.filter((decompte) => decompte.missionId !== action.payload);
    },
  },
});

// Export the actions to use them in your components or thunks
export const {
  createDecompte,
  fetchDecompteStart,
  fetchDecompteSuccess,
  fetchDecompteFailure,
  editDecompte,
  removeDecompte,
} = decompteSlice.actions;

// Export the reducer to combine with your root reducer
export default decompteSlice.reducer;
