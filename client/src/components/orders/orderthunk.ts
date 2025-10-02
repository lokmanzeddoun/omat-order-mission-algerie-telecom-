import {
  editMission,
  fetchOrdersStart,
  fetchUserOrderFailure,
  fetchUserOrderSuccess,
  IMission,
  removeOrder,
} from './orderReducer';
import axios from 'axios';
import http from 'helpers/http';

// Use shared http client
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { saveAs } from 'file-saver';

export const addOrder =
  (order: IMission, token: string | null) => async (dispatch: AppDispatch) => {
    try {
      // Set responseType to blob to handle file downloads
      const res = await http.post<Blob>(`/missions`, order, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // Ensure Axios treats the response as a Blob (file)
      });

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

        dispatch(setAlert({ msg: 'Order Created Successfully', type: AlertTypes.SUCCESS }));
        return dispatch(fetchUserOrders(token)); // Dispatch createOrder if necessary
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

export const fetchUserOrders = (token: string | null) => async (dispatch: AppDispatch, getState: any) => {
  try {
    dispatch(fetchOrdersStart()); // Start loading
    const selectedYear: number | null = getState()?.exercice?.selectedYear ?? null;
    const res = await http.get(`/missions/user`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      params: {
        exercice: selectedYear ?? undefined,
      },
    });

    if (res && res.data) {
      dispatch(fetchUserOrderSuccess(res.data)); // Dispatch success and pass the data
      return;
    }

    dispatch(fetchUserOrderFailure('Problem in getting orders'));
  } catch (error) {
    let errorMessage = 'An error occurred';

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    dispatch(fetchUserOrderFailure(errorMessage)); // Dispatch failure and pass the error message
    console.error('Error:', errorMessage);
  }
};

export const updateMission = (order: IMission) => async (dispatch: AppDispatch, getState: any) => {
  try {
    const token: string | null = getState()?.auth?.token ?? null;
    // Do not send primary key in the body; only send changed fields
    const { n_mission, ...body } = (order as any) || {};
    const res = await http.patch(`/missions/${n_mission}`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res && res.data) {
      await dispatch(setAlert({ msg: 'Order Updated Successfully', type: AlertTypes.SUCCESS }));
      dispatch(editMission(res.data));
    } else {
      dispatch(setAlert({ msg: 'Unexpected error: no data returned', type: AlertTypes.ERROR }));
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
export const fetchAllOrders = (token: string | null) => async (dispatch: AppDispatch, getState: any) => {
  try {
    dispatch(fetchOrdersStart()); // Start loading
    const selectedYear: number | null = getState()?.exercice?.selectedYear ?? null;
    const res = await http.get(`/missions`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      params: {
        exercice: selectedYear ?? undefined,
      },
    });

    if (res && res.data) {
      dispatch(fetchUserOrderSuccess(res.data)); // Dispatch success and pass the data
      return;
    }

    dispatch(fetchUserOrderFailure('Problem in getting orders'));
  } catch (error) {
    let errorMessage = 'An error occurred';

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    dispatch(fetchUserOrderFailure(errorMessage)); // Dispatch failure and pass the error message
    console.error('Error:', errorMessage);
  }
};

export const deleteOrder = (n_mission: number | null) => async (dispatch: AppDispatch, getState: any) => {
  try {
    const token: string | null = getState()?.auth?.token ?? null;
    const res = await http.delete(`/missions/${n_mission}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res) {
      await dispatch(setAlert({ msg: 'Order Deleted Successfully', type: AlertTypes.SUCCESS }));
      dispatch(removeOrder(res.data));
    } else {
      dispatch(setAlert({ msg: 'Unexpected error: no data returned', type: AlertTypes.ERROR }));
    }
  } catch (error) {
    let errorMessage = 'An error occurred';

    if (axios.isAxiosError(error)) {
      // For Axios errors, you can extract more specific information
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      // Handle other errors
      errorMessage = error.message;
    }

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};
