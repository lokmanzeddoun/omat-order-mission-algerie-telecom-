import axios from 'axios';
import http from 'helpers/http';
import {
  fetchUsersStart,
  fetchUsersSuccess,
  createUser,
  removeUser,
  editUser,
} from './users.reducers';
// Requests go through Vite proxy in dev
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { IUser } from './users.reducers';

interface ChangePasswordDto {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
}

export const getAllUsers = () => async (dispatch: AppDispatch) => {
  // loading the users fetched
  dispatch(fetchUsersStart());
  try {
    const res = await http.get(`/users`);
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
    const res = await http.post<IUser>(`/users`, user, {
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
    const res = await http.post(`/users/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Ensure the correct content type for file upload
      },
    });
    console.log(res);
    if (res) {
      await dispatch(setAlert({ msg: 'File uploaded successfully', type: AlertTypes.SUCCESS }));
      return dispatch(getAllUsers()); // Assuming 'res.data' contains the newly created users
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

export const exportUsers = () => async (dispatch: AppDispatch) => {
  try {
    const res = await http.get(`/users/export`, {
      responseType: 'blob', // Important for file downloads
    });

    if (res.data) {
      // Create a blob from the response data
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with current date
      const filename = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      dispatch(setAlert({ msg: 'Users exported successfully', type: AlertTypes.SUCCESS }));
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

export const deleteUser = (user: IUser) => async (dispatch: AppDispatch) => {
  //
  try {
    const res = await http.delete(`/users/${user.matricule}`);
    if (res) {
      await dispatch(setAlert({ msg: 'User Deleted Successfully', type: AlertTypes.SUCCESS }));
      dispatch(removeUser(res.data));
      return dispatch(getAllUsers()); // Assuming 'res.data' contains the newly created users
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

export const updateUser =
  (matricule: number | null, user: IUser) => async (dispatch: AppDispatch) => {
    //
    try {
      const res = await http.patch(`/users/${matricule}`, user);
      if (res) {
        await dispatch(setAlert({ msg: 'User Updated Successfully', type: AlertTypes.SUCCESS }));
        dispatch(editUser(res.data));
        return dispatch(getAllUsers());
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

export const changePassword =
  (token: string | null, body: ChangePasswordDto) => async (dispatch: AppDispatch) => {
    try {
      const res = await http.post(`/users/changePassword`, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data) {
        await dispatch(setAlert({ msg: 'Password Updated ', type: AlertTypes.SUCCESS }));
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
