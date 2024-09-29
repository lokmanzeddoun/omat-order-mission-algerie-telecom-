import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export interface IMission {
  n_mission: number; // The unique identifier for the mission
  date_sortie: Date; // The departure date
  heure_sortie: Date; // The departure time (could use string if storing time separately)
  date_retour: Date; // The return date
  heure_retour: Date; // The return time (could use string if storing time separately)
  motif: string; // The reason or purpose of the mission
  transport: string; // Mode of transport (e.g., 'Car', 'Plane', etc.)
  destination: string; // The destination of the mission
  montant: number; // The cost associated with the mission
  userId: number; // The ID of the user associated with the mission (foreign
}

export interface MissionState {
  loading: boolean;
  orders: IMission[];
  error: string | null; // Error message if an action fails
}
const initialState: MissionState = {
  loading: true,
  orders: [],
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    createOrder(state, action: PayloadAction<IMission>) {
      state.orders = [action.payload, ...state.orders];
    },
  },
});

export const { createOrder } = orderSlice.actions;

export default orderSlice.reducer;
