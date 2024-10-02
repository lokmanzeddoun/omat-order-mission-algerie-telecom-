import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Direction } from 'constants/direction';

export interface IMission {
  n_mission?: number; // The unique identifier for the mission
  date_sortie: string; // The departure date
  heure_sortie: string; // The departure time
  date_retour: string; // The return date
  heure_retour: string; // The return time
  motif: string; // The reason or purpose of the mission
  transport: string; // Mode of transport (e.g., 'Car', 'Plane', etc.)
  destination: string; // The destination of the mission
  userId?: number; // The ID of the user associated with the mission
  direction: Direction;
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
    // Action to handle when order creation happens
    createOrder(state, action: PayloadAction<IMission>) {
      state.orders = [action.payload, ...state.orders]; // Add new order to the top
    },

    // Action to indicate the fetch process started
    fetchOrdersStart(state) {
      state.loading = true;
      state.error = null; // Clear any previous errors
    },

    // Action to set fetched user orders
    fetchUserOrderSuccess(state, action: PayloadAction<IMission[]>) {
      state.orders = action.payload; // Update the state with the fetched orders
      state.loading = false; // Set loading to false since the orders are loaded
    },

    // Action to handle when fetch fails
    fetchUserOrderFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload; // Set error message in case of failure
    },
    editMission(state, action: PayloadAction<IMission>) {
      const index = state.orders.findIndex((order) => order.n_mission === action.payload.n_mission);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    removeOrder(state, action: PayloadAction<number | null>) {
      state.orders = state.orders.filter((order) => order.n_mission !== action.payload);
    },
  },
});

// Export the actions to use in the fetchUserOrders thunk
export const {
  createOrder,
  fetchOrdersStart,
  fetchUserOrderSuccess,
  fetchUserOrderFailure,
  editMission,
  removeOrder,
} = orderSlice.actions;

// Export the reducer to combine with your root reducer
export default orderSlice.reducer;
