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
import { importErrorsOf, uploadSpreadsheet, type ImportRowError } from 'components/common/importFile';
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
  const parentCode = structure.parentCode?.trim() || undefined;
  const sanitizedStructure: { code?: string; parentCode?: string; name: string } = {
    // A child's code is derived from its parent's path by the server.
    ...(parentCode ? { parentCode } : { code: structure.code?.trim() || '' }),
    name: structure.name?.trim() || '',
  };

  // Validate required fields
  if ((!parentCode && !sanitizedStructure.code) || !sanitizedStructure.name) {
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
    const res = await http.patch(`/structures/${encodeURIComponent(structure.code)}/archive`);
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
    name: structure.name?.trim() || '',
    responsibleUserId: structure.responsibleUserId ?? null,
  };

  // Validate required fields
  if (!sanitizedStructure.name) {
    dispatch(setAlert({ msg: i18n.t('toasts:structureNameRequired'), type: AlertTypes.ERROR }));
    return;
  }

  try {
    const res = await http.patch(`/structures/${encodeURIComponent(structure.code)}`, sanitizedStructure);
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

/** Moves a structure (and its subtree) under `parentCode`, or to the root with `code` (super admin). */
export const moveStructure =
  (structure: IStructure, target: { parentCode: string | null; code?: string }) => async (dispatch: AppDispatch) => {
    try {
      await http.patch(`/structures/${encodeURIComponent(structure.code)}/move`, target);
      dispatch(setAlert({ msg: i18n.t('toasts:structureMoved'), type: AlertTypes.SUCCESS }));
      return true;
    } catch (error) {
      dispatch(setAlert({ msg: extractErrorMessage(error), type: AlertTypes.ERROR }));
      return false;
    }
  };

export interface StructureImportReport {
  dryRun: true;
  willCreate: number;
  willUpdate: number;
  errors: ImportRowError[];
  rows: { row: number; code: string; action: 'create' | 'update' }[];
}

/** Dry run of an import: nothing is written, the report says what would happen. */
export const previewStructureImport = (file: File) => async (dispatch: AppDispatch) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const { data } = await http.post<StructureImportReport>('/structures/upload?dryRun=true', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    // A file the server can't even read (bad format, missing columns) comes back as per-row errors too.
    const errors = importErrorsOf(error);
    if (errors) return { dryRun: true, willCreate: 0, willUpdate: 0, errors, rows: [] } as StructureImportReport;
    dispatch(setAlert({ msg: extractErrorMessage(error), type: AlertTypes.ERROR }));
    return null;
  }
};
