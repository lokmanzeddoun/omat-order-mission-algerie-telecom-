import axios from 'axios';
import http from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { IDecompte } from './decompte.reducer';
import { IMission } from './orderReducer';
import { fetchDecompteFailure, fetchDecompteSuccess, fetchDecompteStart } from './decompte.reducer';
export const addDecompte =
  (decompte: IDecompte, order: IMission | null, token: string | null) =>
    async (dispatch: AppDispatch) => {
      console.log(decompte, order);
      try {
        const missionId = order?.n_mission;
        if (missionId == null) throw new Error('Mission ID is required');
        const res = await http.post(`/decompte/${missionId}`, decompte, {
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

export const fetchAllDecompte = (token: string | null, status?: string) => async (dispatch: AppDispatch, getState: any) => {
  try {
    dispatch(fetchDecompteStart()); // Start loading

    const selectedYear: number | null = getState()?.exercice?.selectedYear ?? null;
    const res = await http.get(`/decompte`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      params: {
        exercice: selectedYear ?? undefined,
        status: status ?? 'pending',
      },
    });

    if (res && res.data) {
      dispatch(fetchDecompteSuccess(res.data)); // Dispatch success and pass the data
      return;
    }

    dispatch(fetchDecompteFailure('Problem in getting decomptes'));
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

export const acceptDecompte =
  (id: number, token: string | null, message?: string) =>
    async (dispatch: AppDispatch) => {
      try {
        const res = await http.patch(
          `/decompte/${id}/accept`,
          { message },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res && res.data) {
          dispatch(setAlert({ msg: 'Décompte accepté avec succès', type: AlertTypes.SUCCESS }));
          return dispatch(fetchAllDecompte(token, 'pending'));
        } else {
          dispatch(setAlert({ msg: 'Unexpected error occurred', type: AlertTypes.ERROR }));
        }
      } catch (error) {
        let errorMessage = 'An error occurred';

        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
        console.error('Error:', errorMessage);
      }
    };

export const rejectDecompte =
  (id: number, token: string | null, message: string) =>
    async (dispatch: AppDispatch) => {
      try {
        const res = await http.patch(
          `/decompte/${id}/reject`,
          { message },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res && res.data) {
          dispatch(setAlert({ msg: 'Décompte rejeté avec succès', type: AlertTypes.SUCCESS }));
          return dispatch(fetchAllDecompte(token, 'pending'));
        } else {
          dispatch(setAlert({ msg: 'Unexpected error occurred', type: AlertTypes.ERROR }));
        }
      } catch (error) {
        let errorMessage = 'An error occurred';

        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
        console.error('Error:', errorMessage);
      }
    };
