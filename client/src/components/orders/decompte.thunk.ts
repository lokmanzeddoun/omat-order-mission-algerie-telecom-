import axios from 'axios';

const API_URL = 'http://localhost:8000';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { IDecompte } from './decompte.reducer';
import { IMission } from './orderReducer';
import {
  fetchDecompteFailure,
  fetchDecompteSuccess,
  fetchDecompteStart,
  removeDecompte,
  createDecompte,
  editDecompte,
} from './decompte.reducer';
export const addDecompte =
  (decompte: IDecompte, order: IMission | null, token: string | null) =>
  async (dispatch: AppDispatch) => {
    console.log(decompte, order);
    try {
      const res = await axios.post(`${API_URL}/decompte/${order.n_mission}`, decompte, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res && res.data) {
        dispatch(setAlert({ msg: 'Order Submitted Successfully', type: AlertTypes.SUCCESS }));
        return dispatch(fetchAllDecompte(token)); // Dispatch createOrder if necessary
      } else {
        dispatch(setAlert({ msg: 'Unexpected error: no file returned', type: AlertTypes.ERROR }));
      }
    } catch (error) {
      let errorMessage = 'An error occurred';

      if (axios.isAxiosError(error)) {
        // For Axios errors, extract specific information
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        // Handle other errors
        errorMessage = error.message;
      }

      dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
      console.error('Error:', errorMessage);
    }
  };

export const fetchAllDecompte = (token: string | null) => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchDecompteStart()); // Start loading

    const res = await axios.get(`${API_URL}/decompte`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res && res.data) {
      dispatch(fetchDecompteSuccess(res.data)); // Dispatch success and pass the data
      return;
    }

    dispatch(fetchDecompteFailure('Problem in getting orders'));
  } catch (error) {
    let errorMessage = 'An error occurred';

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    dispatch(fetchDecompteFailure(errorMessage)); // Dispatch failure and pass the error message
    console.error('Error:', errorMessage);
  }
};
