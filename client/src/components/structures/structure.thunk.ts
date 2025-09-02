import axios from 'axios';
import http from 'helpers/http';
import {
  fetchStructuresSuccess,
  fetchStructuresStart,
  editStructure,
  removeStructure,
  createStructure,
} from './structure.reducer';
// use shared http client
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { IStructure } from './structure.reducer';

export const getAllStructures = () => async (dispatch: AppDispatch) => {
  // loading the users fetched
  dispatch(fetchStructuresStart());
  try {
    const res = await http.get<IStructure[]>(`/structures`);
    if (res.data) {
      return dispatch(fetchStructuresSuccess(res.data));
    }
    dispatch(setAlert({ msg: 'Problem In Getting Structures', type: AlertTypes.ERROR }));
    return;
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

export const addStructure = (structure: IStructure) => async (dispatch: AppDispatch) => {
  try {
    const res = await http.post<IStructure>(`/structures`, structure, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res) {
      dispatch(setAlert({ msg: 'Structure Created Successfully', type: AlertTypes.SUCCESS }));
      return dispatch(createStructure(res.data));
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

export const uploadStructure = (file: File) => async (dispatch: AppDispatch) => {
  const formData = new FormData();
  formData.append('file', file); // Attach the file to the request

  try {
    const res = await http.post(`/structures/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Ensure the correct content type for file upload
      },
    });
    console.log(res);
    if (res) {
      await dispatch(setAlert({ msg: 'File uploaded successfully', type: AlertTypes.SUCCESS }));
      await dispatch(getAllStructures()); // Assuming 'res.data' contains the newly created users
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

export const deleteStructure = (structure: IStructure) => async (dispatch: AppDispatch) => {
  //
  try {
    const res = await http.delete(`/structures/${structure.code}`);
    if (res) {
      await dispatch(setAlert({ msg: 'Structure Deleted Successfully', type: AlertTypes.SUCCESS }));
      await dispatch(removeStructure(res.data));
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

export const updateStructure = (structure: IStructure) => async (dispatch: AppDispatch) => {
  //
  try {
    const res = await http.patch(`/structures/${structure.code}`, structure);
    if (res) {
      await dispatch(setAlert({ msg: 'Structure Updated Successfully', type: AlertTypes.SUCCESS }));
      dispatch(editStructure(res.data));
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
