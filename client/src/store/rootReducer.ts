import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "components/auth/auth.reducers";
import alertReducer from "components/alert/alert.reducer";

const rootReducer = combineReducers({
	auth: authReducer,
	alerts: alertReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
