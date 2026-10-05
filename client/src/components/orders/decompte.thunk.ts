import http from 'helpers/http';
import i18n from 'i18n';
import { extractErrorMessage } from 'helpers/errorHandler';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { IDecompte } from './decompte.reducer';
import { IMission } from './orderReducer';
import { fetchDecompteFailure, fetchDecompteSuccess, fetchDecompteStart } from './decompte.reducer';
/** The form's figures as the API expects them (distance_km → parcours, transport_cost → fees_transport). */
const toDecomptePayload = (decompte: IDecompte) => {
  const parcours = typeof decompte.distance_km === 'number'
    ? decompte.distance_km
    : (decompte.distance_km ? Number(decompte.distance_km) : 0);
  const fees_transport = typeof decompte.transport_cost === 'number'
    ? decompte.transport_cost
    : (decompte.transport_cost ? Number(decompte.transport_cost) : 0);
  const payload = { ...decompte, parcours, fees_transport };
  delete (payload as any).distance_km;
  delete (payload as any).transport_cost;
  delete (payload as any).missionId;
  return payload;
};

/**
 * Validates several ordres with the same figures. All or nothing: on refusal
 * nothing is validated and the error names each ordre at fault. Resolves true
 * on success so the form can stay open otherwise.
 */
export const addDecomptes =
  (decompte: IDecompte, orders: IMission[]) =>
    async (dispatch: AppDispatch): Promise<boolean> => {
      const ids = orders.map((o) => o.n_mission).filter((n): n is number => n != null);
      try {
        await http.post('/decompte/bulk', { ids, figures: toDecomptePayload(decompte) });
        dispatch(setAlert({ msg: i18n.t('ordres:validate.bulkDone', { count: ids.length }), type: AlertTypes.SUCCESS }));
        return true;
      } catch (error) {
        dispatch(setAlert({ msg: extractErrorMessage(error), type: AlertTypes.ERROR }));
        return false;
      }
    };

export const addDecompte =
  (decompte: IDecompte, order: IMission | null, token: string | null) =>
    async (dispatch: AppDispatch) => {
      console.log(decompte, order);
      try {
        const missionId = order?.n_mission;
        if (missionId == null) throw new Error('Mission ID is required');

        const payload = toDecomptePayload(decompte);

        const res = await http.post(`/decompte/${missionId}`, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res && res.data) {
          dispatch(setAlert({ msg: i18n.t('toasts:decompteSubmitted'), type: AlertTypes.SUCCESS }));
          return dispatch(fetchAllDecompte(token)); // Dispatch createOrder if necessary
        } else {
          dispatch(setAlert({ msg: i18n.t('toasts:noFile'), type: AlertTypes.ERROR }));
        }
      } catch (error) {
        const errorMessage = extractErrorMessage(error);

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

    dispatch(fetchDecompteFailure(i18n.t('toasts:decomptesLoadFailed')));
  } catch (error) {
    if (requestId !== decomptesRequestId) return;
    const errorMessage = extractErrorMessage(error);

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

    dispatch(fetchDecompteFailure(i18n.t('toasts:decomptesLoadFailed')));
  } catch (error) {
    if (requestId !== decomptesRequestId) return;
    const errorMessage = extractErrorMessage(error);

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
          dispatch(setAlert({ msg: i18n.t('toasts:decompteAccepted'), type: AlertTypes.SUCCESS }));
          // Refresh based on user role without status filter
          if (isAdmin) {
            return dispatch(fetchAllDecompte(token));
          } else {
            return dispatch(fetchUserDecompte(token));
          }
        } else {
          dispatch(setAlert({ msg: i18n.t('toasts:unexpected'), type: AlertTypes.ERROR }));
        }
      } catch (error) {
        const errorMessage = extractErrorMessage(error);

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
          dispatch(setAlert({ msg: i18n.t('toasts:decompteRejected'), type: AlertTypes.SUCCESS }));
          // Refresh based on user role without status filter
          if (isAdmin) {
            return dispatch(fetchAllDecompte(token));
          } else {
            return dispatch(fetchUserDecompte(token));
          }
        } else {
          dispatch(setAlert({ msg: i18n.t('toasts:unexpected'), type: AlertTypes.ERROR }));
        }
      } catch (error) {
        const errorMessage = extractErrorMessage(error);

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
          dispatch(setAlert({ msg: i18n.t('toasts:decompteArchived'), type: AlertTypes.SUCCESS }));
          // Refresh based on user role without status filter
          if (isAdmin) {
            return dispatch(fetchAllDecompte(token));
          } else {
            return dispatch(fetchUserDecompte(token));
          }
        } else {
          dispatch(setAlert({ msg: i18n.t('toasts:unexpected'), type: AlertTypes.ERROR }));
        }
      } catch (error) {
        const errorMessage = extractErrorMessage(error);

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
          dispatch(setAlert({ msg: i18n.t('toasts:commentAdded'), type: AlertTypes.SUCCESS }));
          // Refresh decomptes if it's a decompte comment, otherwise just return
          if (comment.decompteId) {
            return dispatch(fetchUserDecompte(token));
          }
          return res.data;
        } else {
          dispatch(setAlert({ msg: i18n.t('toasts:unexpected'), type: AlertTypes.ERROR }));
        }
      } catch (error) {
        const errorMessage = extractErrorMessage(error);

        dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
        console.error('Error:', errorMessage);
      }
    };

