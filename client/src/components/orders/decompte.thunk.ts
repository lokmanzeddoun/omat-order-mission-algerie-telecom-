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

        // Transform distance_km to parcours for backend
        // Ensure parcours is always a valid number (default to 0 if undefined/null)
        const parcours = typeof decompte.distance_km === 'number'
          ? decompte.distance_km
          : (decompte.distance_km ? Number(decompte.distance_km) : 0);

        // Transform transport_cost to fees_transport for backend
        const fees_transport = typeof decompte.transport_cost === 'number'
          ? decompte.transport_cost
          : (decompte.transport_cost ? Number(decompte.transport_cost) : 0);

        const payload = {
          ...decompte,
          parcours,
          fees_transport,
        };
        // Remove distance_km and transport_cost as backend expects parcours and fees_transport
        delete (payload as any).distance_km;
        delete (payload as any).transport_cost;
        delete (payload as any).missionId;

        const res = await http.post(`/decompte/${missionId}`, payload, {
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

// Responses can arrive out of order when the exercice changes quickly;
// only the latest request may update the list.
let decomptesRequestId = 0;

export const fetchAllDecompte = (token: string | null, status?: string) => async (dispatch: AppDispatch, getState: any) => {
  const requestId = ++decomptesRequestId;
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
        archive: 'false',
        // Don't pass status to get all decomptes with any status (only filter by soft_delete = false)
        ...(status ? { status } : {}),
      },
    });
    if (requestId !== decomptesRequestId) return;

    if (res && res.data) {
      dispatch(fetchDecompteSuccess(res.data)); // Dispatch success and pass the data
      return;
    }

    dispatch(fetchDecompteFailure('Problem in getting decomptes'));
  } catch (error) {
    if (requestId !== decomptesRequestId) return;
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

export const fetchUserDecompte = (token: string | null, status?: string) => async (dispatch: AppDispatch, getState: any) => {
  const requestId = ++decomptesRequestId;
  try {
    dispatch(fetchDecompteStart()); // Start loading

    const selectedYear: number | null = getState()?.exercice?.selectedYear ?? null;
    const res = await http.get(`/decompte/user`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      params: {
        exercice: selectedYear ?? undefined,
        // Don't pass status to get all user decomptes with any status
        ...(status ? { status } : {}),
      },
    });
    if (requestId !== decomptesRequestId) return;

    if (res && res.data) {
      dispatch(fetchDecompteSuccess(res.data)); // Dispatch success and pass the data
      return;
    }

    dispatch(fetchDecompteFailure('Problem in getting decomptes'));
  } catch (error) {
    if (requestId !== decomptesRequestId) return;
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
  (id: number, token: string | null, message?: string, isAdmin?: boolean) =>
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
          // Refresh based on user role without status filter
          if (isAdmin) {
            return dispatch(fetchAllDecompte(token));
          } else {
            return dispatch(fetchUserDecompte(token));
          }
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
  (id: number, token: string | null, message: string, isAdmin?: boolean) =>
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
          // Refresh based on user role without status filter
          if (isAdmin) {
            return dispatch(fetchAllDecompte(token));
          } else {
            return dispatch(fetchUserDecompte(token));
          }
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

export const archiveDecompte =
  (id: number, token: string | null, isAdmin?: boolean) =>
    async (dispatch: AppDispatch) => {
      try {
        const res = await http.delete(`/decompte/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res && res.data) {
          dispatch(setAlert({ msg: 'Décompte archivé avec succès', type: AlertTypes.SUCCESS }));
          // Refresh based on user role without status filter
          if (isAdmin) {
            return dispatch(fetchAllDecompte(token));
          } else {
            return dispatch(fetchUserDecompte(token));
          }
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

export const addCommentToDecompte =
  (comment: { title: string; type: string; decompteId?: number }, token: string | null) =>
    async (dispatch: AppDispatch) => {
      try {
        const res = await http.post(
          `/comments`,
          comment,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res && res.data) {
          dispatch(setAlert({ msg: 'Commentaire ajouté avec succès', type: AlertTypes.SUCCESS }));
          // Refresh decomptes if it's a decompte comment, otherwise just return
          if (comment.decompteId) {
            return dispatch(fetchUserDecompte(token));
          }
          return res.data;
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

