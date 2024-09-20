import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AlertTypes } from "constants/alert";
import { v4 as uuid } from "uuid";
import { AppDispatch } from "store";
const initialState = [] as IAlert[];
interface PayloadAlert {
	msg: string;
	type: AlertTypes;
	desc?: string;
}
const alertSlice = createSlice({
	name: "alerts",
	initialState,
	reducers: {
		showAlert(state, action: PayloadAction<IAlert>) {
			return [...state, action.payload];
		},
		clearAlert(state, action: PayloadAction<string>) {
			return state.filter((alert) => alert.id !== action.payload);
		},
	},
});

export const { showAlert, clearAlert } = alertSlice.actions;
export const setAlert = (payload: PayloadAlert) => {
	return async (dispatch: AppDispatch) => {
		const newAlert = { ...payload, id: uuid() };
		dispatch(showAlert(newAlert));
		setTimeout(() => dispatch(clearAlert(newAlert.id)), 4000);
	};
};
export const removeAlert = (alert: IAlert) => {
	return async (dispatch: AppDispatch) => {
		dispatch(clearAlert(alert.id));
	};
};

export default alertSlice.reducer;
