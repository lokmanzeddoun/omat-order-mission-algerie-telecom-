import { endSession } from 'components/auth/auth.thunk';
import http from 'helpers/http';
import i18n from 'i18n';
import { extractErrorMessage } from 'helpers/errorHandler';
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
import { uploadSpreadsheet } from 'components/common/importFile';
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
    dispatch(setAlert({ msg: i18n.t('toasts:usersLoadFailed'), type: AlertTypes.ERROR }));
    return;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};

export const addUser = (user: IUser) => async (dispatch: AppDispatch) => {
  user.matricule = +user.matricule;

  // Sanitize empty strings to null for optional fields
  const sanitizedUser = {
    ...user,
    serviceId: (user as any).serviceId && (user as any).serviceId.trim() !== '' ? (user as any).serviceId : null,
  };

  try {
    const res = await http.post<IUser>(`/users`, sanitizedUser, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.data) {
      dispatch(setAlert({ msg: i18n.t('toasts:userCreated'), type: AlertTypes.SUCCESS }));
      return dispatch(createUser(res.data));
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};

/** Imports a spreadsheet; returns the per-row problems when the server rejects the file. */
export const uploadUsers = (file: File) => async (dispatch: AppDispatch) => {
  const result = await uploadSpreadsheet('/users/upload', file, dispatch);
  if (result?.ok) await dispatch(getAllUsers());
  return result;
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

      dispatch(setAlert({ msg: i18n.t('toasts:usersExported'), type: AlertTypes.SUCCESS }));
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};

export const archiveUser = (user: IUser) => async (dispatch: AppDispatch) => {
  try {
    const res = await http.patch(`/users/${user.matricule}/archive`);
    if (res) {
      await dispatch(setAlert({ msg: i18n.t('toasts:userArchived'), type: AlertTypes.SUCCESS }));
      dispatch(removeUser(user.matricule));
      return dispatch(getAllUsers());
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};

export const updateUser =
  (matricule: number | null, user: IUser) => async (dispatch: AppDispatch) => {
    // Sanitize empty strings to null for optional fields
    const sanitizedUser = {
      ...user,
      serviceId: (user as any).serviceId && (user as any).serviceId.trim() !== '' ? (user as any).serviceId : null,
    };

    try {
      const res = await http.patch(`/users/${matricule}`, sanitizedUser);
      if (res) {
        await dispatch(setAlert({ msg: i18n.t('toasts:userUpdated'), type: AlertTypes.SUCCESS }));
        dispatch(editUser(res.data));
        return dispatch(getAllUsers());
      } else {
        dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);

      dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
      console.error('Error:', errorMessage);
    }
  };

export const changePassword =
  (token: string | null, body: ChangePasswordDto) => async (dispatch: AppDispatch): Promise<boolean> => {
    try {
      const res = await http.post(`/users/changePassword`, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data) {
        // The server ends every session on a password change: sign in again.
        dispatch(endSession());
        await dispatch(setAlert({ msg: i18n.t('toasts:passwordChanged'), type: AlertTypes.SUCCESS }));
        return true;
      }
      dispatch(setAlert({ msg: i18n.t('toasts:passwordChangeFailed'), type: AlertTypes.ERROR }));
      return false;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);

      dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
      return false;
    }
  };

export const resetUserPassword =
  (matricule: number, newPassword: string) => async (dispatch: AppDispatch) => {
    try {
      const res = await http.post(`/users/${matricule}/reset-password`, {
        newPassword,
      });
      if (res.data) {
        dispatch(setAlert({ msg: i18n.t('toasts:passwordReset'), type: AlertTypes.SUCCESS }));
        return res.data;
      } else {
        dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);

      dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
      console.error('Error:', errorMessage);
      throw error;
    }
  };
