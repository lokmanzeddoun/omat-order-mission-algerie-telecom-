import { combineReducers } from '@reduxjs/toolkit';
import authReducer from 'components/auth/auth.reducers';
import alertReducer from 'components/alert/alert.reducer';
import usersReducer from 'components/users/users.reducers';
import structureReducer from 'components/structures/structure.reducer';
import orderReducer from 'components/orders/orderReducer';
const rootReducer = combineReducers({
  auth: authReducer,
  alerts: alertReducer,
  users: usersReducer,
  structures: structureReducer,
  orders: orderReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
