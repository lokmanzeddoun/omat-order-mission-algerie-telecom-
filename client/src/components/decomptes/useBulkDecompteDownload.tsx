import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
import { toast } from 'components/ui/toaster';
import type { MenuAction } from 'components/ui';
import { idsOf } from 'components/common/bulk';
import type { DecompteRow } from './useDecompteActions';

/** The server renders every page in one request; it refuses more than this. */
export const BULK_DOWNLOAD_MAX = 100;

/**
 * "Télécharger (n)" for the selected décomptes: one PDF, one page each, in the
 * table's order — ready to print in one go. Any status can be downloaded.
 */
export function useBulkDecompteDownload() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const run = async (rows: DecompteRow[]) => {
    const ids = idsOf(rows, (d) => d.n_decompte);
    if (ids.length === 0) return;
    if (ids.length > BULK_DOWNLOAD_MAX) {
      toast.error(t('decomptes:bulkDownloadTooMany', { count: BULK_DOWNLOAD_MAX }));
      return;
    }
    setBusy(true);
    try {
      const res = await http.post<Blob>('/decompte/bulk/download', { ids }, { responseType: 'blob' });
      const raw = String(res.headers['content-disposition'] ?? '').split('filename=')[1] ?? '';
      saveAs(res.data, raw.replace(/['"]/g, '').trim() || `decomptes-${ids.length}.pdf`);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (selected: DecompteRow[]): MenuAction[] => [
    {
      label: `${t('actions.download')} (${selected.length})`,
      icon: <Download />,
      disabled: busy,
      onSelect: () => void run(selected),
    },
  ];
}
