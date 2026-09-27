import {
  editMission,
  fetchOrdersStart,
  fetchUserOrderFailure,
  fetchUserOrderSuccess,
  IMission,
  removeOrder,
} from './orderReducer';
import http from 'helpers/http';
import i18n from 'i18n';
import { extractErrorMessage } from 'helpers/errorHandler';

// Use shared http client
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { saveAs } from 'file-saver';

export const addOrder =
  (order: IMission, token: string | null) => async (dispatch: AppDispatch) => {
    try {
      // Build payload: combine date + time into ISO datetimes; remove UI-only heure_* fields
      const payload: any = { ...order };
      if (order.date_sortie) {
        const time = order.heure_sortie || '00:00';
        payload.date_sortie = new Date(`${order.date_sortie}T${time}:00`).toISOString();
      }
      if (order.date_retour) {
        const time = order.heure_retour || '00:00';
        payload.date_retour = new Date(`${order.date_retour}T${time}:00`).toISOString();
      }
      delete payload.heure_sortie;
      delete payload.heure_retour;

      // Set responseType to blob to handle file downloads
      const res = await http.post<Blob>(`/missions`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // Ensure Axios treats the response as a Blob (file)
      });

      if (res && res.data && res.data.size === 0) {
        // Saved, but the server could not render the PDF: don't invite a retry
        // that would create a duplicate.
        dispatch(setAlert({
          msg: i18n.t('toasts:missionCreatedNoPdf'),
          type: AlertTypes.WARNING,
        }));
        await dispatch(fetchUserOrders(token));
        return true;
      }

      if (res && res.data) {
        const contentDisposition = res.headers['content-disposition'];
        const fileName = contentDisposition
          ? contentDisposition.split('filename=')[1]
          : 'downloaded_file'; // Extract the filename if provided in headers

        // Option 1: Use file-saver library to save the file
        saveAs(res.data, fileName);

        // Option 2: Manually handle download if not using file-saver
        // Create a URL for the blob
        // const url = window.URL.createObjectURL(new Blob([res.data]));
        // const link = document.createElement('a');
        // link.href = url;
        // link.setAttribute('download', fileName); // Set the downloaded file's name
        // document.body.appendChild(link);
        // link.click(); // Trigger download
        // document.body.removeChild(link); // Clean up the link

        dispatch(setAlert({ msg: i18n.t('toasts:missionCreated'), type: AlertTypes.SUCCESS }));
        await dispatch(fetchUserOrders(token)); // Refresh the orders list
        return true; // Return true on success
      } else {
        dispatch(setAlert({ msg: i18n.t('toasts:noFile'), type: AlertTypes.ERROR }));
        return false;
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);

      dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
      console.error('Error creating order:', errorMessage);
      return false; // Return false on error
    }
  };

// Responses can arrive out of order when the exercice changes quickly;
// only the latest request may update the list.
let ordersRequestId = 0;

export const fetchUserOrders = (token: string | null) => async (dispatch: AppDispatch, getState: any) => {
  const requestId = ++ordersRequestId;
  try {
    dispatch(fetchOrdersStart()); // Start loading
    const selectedYear: number | null = getState()?.exercice?.selectedYear ?? null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await http.get(`/missions/user`, {
      headers,
      params: {
        exercice: selectedYear ?? undefined,
        archive: 'false',
        // Don't pass status to get all user missions with any status (only filter by soft_delete = false)
      },
    });
    if (requestId !== ordersRequestId) return;

    if (res && res.data) {
      dispatch(fetchUserOrderSuccess(res.data)); // Dispatch success and pass the data
      return;
    }

    dispatch(fetchUserOrderFailure(i18n.t('toasts:missionsLoadFailed')));
  } catch (error) {
    if (requestId !== ordersRequestId) return;
    const errorMessage = extractErrorMessage(error);

    dispatch(fetchUserOrderFailure(errorMessage)); // Dispatch failure and pass the error message
    console.error('Error:', errorMessage);
  }
};

export const updateMission = (order: IMission) => async (dispatch: AppDispatch, getState: any) => {
  try {
    const token: string | null = getState()?.auth?.token ?? null;
    // Do not send primary key in the body; only send changed fields
    const { n_mission, ...rawBody } = (order as any) || {};

    // Map date/time into ISO datetimes; only include provided fields
    const body: any = { ...rawBody };
    if (rawBody.date_sortie) {
      const d = rawBody.date_sortie;
      // If provided value looks like YYYY-MM-DD, combine with heure_sortie (if any)
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const t = rawBody.heure_sortie || '00:00';
        body.date_sortie = new Date(`${d}T${t}:00`).toISOString();
      }
    }
    if (rawBody.date_retour) {
      const d = rawBody.date_retour;
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const t = rawBody.heure_retour || '00:00';
        body.date_retour = new Date(`${d}T${t}:00`).toISOString();
      }
    }
    delete body.heure_sortie;
    delete body.heure_retour;

    console.log('Updating mission:', { n_mission, body });

    const res = await http.patch(`/missions/${n_mission}`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });


    if (res && res.data) {
      await dispatch(setAlert({ msg: i18n.t('toasts:missionUpdated'), type: AlertTypes.SUCCESS }));
      dispatch(editMission(res.data));
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
  }
};
export const fetchAllOrders = (token: string | null) => async (dispatch: AppDispatch, getState: any) => {
  const requestId = ++ordersRequestId;
  try {
    dispatch(fetchOrdersStart()); // Start loading
    const selectedYear: number | null = getState()?.exercice?.selectedYear ?? null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await http.get(`/missions`, {
      headers,
      params: {
        exercice: selectedYear ?? undefined,
        archive: 'false',
        // Don't pass status to get all missions with any status (only filter by soft_delete = false)
      },
    });
    if (requestId !== ordersRequestId) return;

    if (res && res.data) {
      dispatch(fetchUserOrderSuccess(res.data)); // Dispatch success and pass the data
      return;
    }

    dispatch(fetchUserOrderFailure(i18n.t('toasts:missionsLoadFailed')));
  } catch (error) {
    if (requestId !== ordersRequestId) return;
    const errorMessage = extractErrorMessage(error);

    dispatch(fetchUserOrderFailure(errorMessage)); // Dispatch failure and pass the error message
    console.error('Error:', errorMessage);
  }
};

export const deleteOrder = (n_mission: number | null) => async (dispatch: AppDispatch, getState: any) => {
  if (typeof n_mission !== 'number') {
    dispatch(setAlert({ msg: i18n.t('toasts:missionInvalidCancel'), type: AlertTypes.ERROR }));
    return false;
  }

  try {
    const token: string | null = getState()?.auth?.token ?? null;

    if (!token) {
      dispatch(setAlert({ msg: i18n.t('toasts:sessionExpired'), type: AlertTypes.ERROR }));
      return false;
    }

    const res = await http.delete(`/missions/${n_mission}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res && res.data) {
      dispatch(setAlert({ msg: i18n.t('toasts:missionCancelled'), type: AlertTypes.SUCCESS }));
      dispatch(removeOrder(n_mission));
      return true;
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:missionCancelFailed'), type: AlertTypes.ERROR }));
      return false;
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error deleting order:', errorMessage);
    return false;
  }
};

export const archiveMission = (n_mission: number | null, isAdmin?: boolean) => async (dispatch: AppDispatch, getState: any) => {
  if (typeof n_mission !== 'number') {
    dispatch(setAlert({ msg: i18n.t('toasts:missionInvalidArchive'), type: AlertTypes.ERROR }));
    return;
  }

  try {
    const token: string | null = getState()?.auth?.token ?? null;
    if (!token) {
      dispatch(setAlert({ msg: i18n.t('toasts:sessionExpired'), type: AlertTypes.ERROR }));
      return;
    }

    const res = await http.patch(
      `/archive/missions/${n_mission}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res && res.data) {
      dispatch(setAlert({ msg: i18n.t('toasts:missionArchived'), type: AlertTypes.SUCCESS }));
      dispatch(removeOrder(n_mission));
      // Refresh based on user role
      if (isAdmin) {
        await dispatch(fetchAllOrders(token));
      } else {
        await dispatch(fetchUserOrders(token));
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

export const validateMission = (n_mission: number | null) => async (dispatch: AppDispatch, getState: any) => {
  if (typeof n_mission !== 'number') {
    dispatch(setAlert({ msg: i18n.t('toasts:missionInvalidValidate'), type: AlertTypes.ERROR }));
    return;
  }

  try {
    const token: string | null = getState()?.auth?.token ?? null;
    if (!token) {
      dispatch(setAlert({ msg: i18n.t('toasts:sessionExpired'), type: AlertTypes.ERROR }));
      return;
    }

    const res = await http.patch(
      `/missions/${n_mission}`,
      { status: 'COMPLETED' },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res && res.data) {
      dispatch(setAlert({ msg: i18n.t('toasts:missionValidated'), type: AlertTypes.SUCCESS }));
      dispatch(editMission(res.data));
      await dispatch(fetchUserOrders(token));
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:unexpected'), type: AlertTypes.ERROR }));
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};
