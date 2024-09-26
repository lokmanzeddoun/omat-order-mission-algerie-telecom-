import axios from 'axios';
import {
  fetchUsersStart,
  fetchUsersSuccess,
  createUser,
  removeUser,
  editUser,
} from './users.reducers';
const API_URL = 'http://localhost:8000';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { IUser } from './users.reducers';

export const getAllUsers = () => async (dispatch: AppDispatch) => {
  // loading the users fetched
  dispatch(fetchUsersStart());
  try {
    const res = await axios.get(`${API_URL}/users`);
    if (res.data) {
      return dispatch(fetchUsersSuccess(res.data));
    }
    dispatch(setAlert({ msg: 'Problem In Getting Users', type: AlertTypes.ERROR }));
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

export const addUser = (user: IUser) => async (dispatch: AppDispatch) => {
  user.matricule = +user.matricule;
  console.log(user);
  try {
    const res = await axios.post<IUser>(`${API_URL}/users`, user, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.data) {
      dispatch(setAlert({ msg: 'User Created Successfully', type: AlertTypes.SUCCESS }));
      return dispatch(createUser(res.data));
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

export const uploadUsers = (file: File) => async (dispatch: AppDispatch) => {
  const formData = new FormData();
  formData.append('file', file); // Attach the file to the request

  try {
    const res = await axios.post(`${API_URL}/users/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Ensure the correct content type for file upload
      },
    });
    console.log(res);
    if (res) {
      await dispatch(setAlert({ msg: 'File uploaded successfully', type: AlertTypes.SUCCESS }));
      await dispatch(getAllUsers()); // Assuming 'res.data' contains the newly created users
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

export const deleteUser = (user: IUser) => async (dispatch: AppDispatch) => {
  //
  try {
    const res = await axios.delete(`${API_URL}/users/${user.matricule}`);
    if (res) {
      await dispatch(setAlert({ msg: 'User Deleted Successfully', type: AlertTypes.SUCCESS }));
      await dispatch(removeUser(res.data));
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

export const updateUser = (user: IUser) => async (dispatch: AppDispatch) => {
  //
  try {
    const res = await axios.patch(`${API_URL}/users/${user.matricule}`, user);
    if (res) {
      await dispatch(setAlert({ msg: 'User Updated Successfully', type: AlertTypes.SUCCESS }));
      dispatch(editUser(res.data));
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
