import http from 'helpers/http';
import i18n from 'i18n';
import { extractErrorMessage } from 'helpers/errorHandler';
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
import { uploadSpreadsheet } from 'components/common/importFile';
import { IStructure } from './structure.reducer';

export const getAllStructures = () => async (dispatch: AppDispatch) => {
  // loading the users fetched
  dispatch(fetchStructuresStart());
  try {
    const res = await http.get<IStructure[]>(`/structures`);
    if (res.data) {
      return dispatch(fetchStructuresSuccess(res.data));
    }
    dispatch(setAlert({ msg: i18n.t('toasts:structuresLoadFailed'), type: AlertTypes.ERROR }));
    return;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};

export const addStructure = (structure: IStructure) => async (dispatch: AppDispatch) => {
  // Sanitize empty strings - trim whitespace
  const sanitizedStructure = {
    code: structure.code?.trim() || '',
    name: structure.name?.trim() || '',
  };

  // Validate required fields
  if (!sanitizedStructure.code || !sanitizedStructure.name) {
    dispatch(setAlert({ msg: i18n.t('toasts:structureCodeNameRequired'), type: AlertTypes.ERROR }));
    return;
  }

  try {
    const res = await http.post<IStructure>(`/structures`, sanitizedStructure, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res) {
      dispatch(setAlert({ msg: i18n.t('toasts:structureCreated'), type: AlertTypes.SUCCESS }));
      return dispatch(createStructure(res.data));
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
export const uploadStructure = (file: File) => async (dispatch: AppDispatch) => {
  const result = await uploadSpreadsheet('/structures/upload', file, dispatch);
  if (result?.ok) await dispatch(getAllStructures());
  return result;
};

export const exportStructures = () => async (dispatch: AppDispatch) => {
  try {
    const res = await http.get(`/structures/export`, {
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
      const filename = `structures_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      dispatch(setAlert({ msg: i18n.t('toasts:structuresExported'), type: AlertTypes.SUCCESS }));
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};

export const archiveStructure = (structure: IStructure) => async (dispatch: AppDispatch) => {
  try {
    const res = await http.patch(`/structures/${structure.code}/archive`);
    if (res) {
      await dispatch(setAlert({ msg: i18n.t('toasts:structureArchived'), type: AlertTypes.SUCCESS }));
      await dispatch(removeStructure(structure.code));
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};

export const updateStructure = (structure: IStructure) => async (dispatch: AppDispatch) => {
  // Sanitize empty strings - trim whitespace
  const sanitizedStructure = {
    code: structure.code?.trim() || '',
    name: structure.name?.trim() || '',
  };

  // Validate required fields
  if (!sanitizedStructure.name) {
    dispatch(setAlert({ msg: i18n.t('toasts:structureNameRequired'), type: AlertTypes.ERROR }));
    return;
  }

  try {
    const res = await http.patch(`/structures/${sanitizedStructure.code}`, sanitizedStructure);
    if (res) {
      await dispatch(setAlert({ msg: i18n.t('toasts:structureUpdated'), type: AlertTypes.SUCCESS }));
      dispatch(editStructure(res.data));
    } else {
      dispatch(setAlert({ msg: i18n.t('toasts:noData'), type: AlertTypes.ERROR }));
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    dispatch(setAlert({ msg: errorMessage, type: AlertTypes.ERROR }));
    console.error('Error:', errorMessage);
  }
};
