import { IMission } from './orderReducer';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { createOrder } from './orderReducer.ts';
import { saveAs } from 'file-saver';

export const addOrder =
  (order: IMission, token: string | null) => async (dispatch: AppDispatch) => {
    try {
      // Set responseType to blob to handle file downloads
      const res = await axios.post<Blob>(`${API_URL}/missions`, order, {
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
        return dispatch(createOrder(order)); // Dispatch createOrder if necessary
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
