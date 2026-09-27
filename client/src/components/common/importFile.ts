import axios from 'axios';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';

/** One problem the server found in an imported spreadsheet (`row` = Excel line, header = 1). */
export interface ImportRowError {
  row: number;
  field: string;
  value?: unknown;
  message: string;
}

export type ImportResult =
  | { ok: true; created: number; updated: number }
  | { ok: false; errors: ImportRowError[] };

/** Per-row problems carried by a rejected import, if any. */
export const importErrorsOf = (error: unknown): ImportRowError[] | null => {
  if (!axios.isAxiosError(error)) return null;
  const errors = (error.response?.data as { errors?: unknown } | undefined)?.errors;
  return Array.isArray(errors) ? (errors as ImportRowError[]) : null;
};

/**
 * Uploads a spreadsheet to `url`. Success → toast with the counts. A file rejected with per-row
 * problems → `{ ok: false, errors }` for the page to list. Anything else → error toast.
 */
export const uploadSpreadsheet = async (
  url: string,
  file: File,
  dispatch: AppDispatch,
): Promise<ImportResult | null> => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const { data } = await http.post<{ created: number; updated: number }>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const created = data?.created ?? 0;
    const updated = data?.updated ?? 0;
    dispatch(
      setAlert({
        msg: `Import terminé : ${created} créé(s), ${updated} mis à jour`,
        type: AlertTypes.SUCCESS,
      }),
    );
    return { ok: true, created, updated };
  } catch (error) {
    const errors = importErrorsOf(error);
    if (errors) return { ok: false, errors };
    dispatch(setAlert({ msg: extractErrorMessage(error), type: AlertTypes.ERROR }));
    return null;
  }
};
