import { useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
import { ConfirmDialog, Field, Textarea, type MenuAction } from 'components/ui';
import { toast } from 'components/ui/toaster';
import { countOf, idsOf, reportBulkResult, type BulkNoun, type BulkResult, type Id } from './bulk';
import { BulkPreview } from './BulkPreview';

type Decision = 'accept' | 'reject';

const noun: BulkNoun = 'decompte';
const skipReasons = ['not_found', 'not_pending', 'archived'];

interface Options<Row> {
  idOf: (row: Row) => Id | null | undefined;
  labelOf: (row: Row) => string;
  /** Only pending décomptes can be accepted or rejected. */
  isPending: (row: Row) => boolean;
  onDone: () => unknown;
}

/**
 * Bulk Accepter / Rejeter for pending décomptes, with one message for the
 * whole batch (optional to accept, required to reject). Selected rows that
 * aren't pending are left out of the request and of the counts.
 */
export function useBulkDecompteStatus<Row>({ idOf, labelOf, isPending, onDone }: Options<Row>) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<{ decision: Decision; rows: Row[] } | null>(null);
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setPending(null);
    setMessage('');
    setTouched(false);
  };

  const run = async (decision: Decision, rows: Row[]) => {
    const ids = idsOf(rows, idOf);
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const text = message.trim();
      const { data } = await http.patch<BulkResult>(`/decompte/bulk/${decision}`, {
        ids,
        ...(text ? { message: text } : {}),
      });
      reportBulkResult({
        result: data,
        noun,
        outcome: decision === 'accept' ? 'accepted' : 'rejected',
        skipReasons,
      });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setBusy(false);
      close();
      await onDone();
    }
  };

  const actions = (selected: Row[]): MenuAction[] => {
    const rows = selected.filter(isPending);
    if (rows.length === 0) return [];
    return [
      {
        label: `${t('decomptes:accept')} (${rows.length})`,
        icon: <CheckCircle2 />,
        disabled: busy,
        onSelect: () => setPending({ decision: 'accept', rows }),
      },
      {
        label: `${t('decomptes:reject')} (${rows.length})`,
        icon: <XCircle />,
        tone: 'danger',
        disabled: busy,
        onSelect: () => setPending({ decision: 'reject', rows }),
      },
    ];
  };

  const rows = pending?.rows ?? [];
  const reject = pending?.decision === 'reject';
  const reasonMissing = reject && message.trim() === '';
  const dialog: ReactNode = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(o) => !o && !busy && close()}
      title={t('bulk:confirmTitle', { verb: reject ? t('decomptes:reject') : t('decomptes:accept'), what: countOf(rows.length, noun) })}
      description={
        reject ? t('bulk:rejectHint') : t('bulk:acceptHint')
      }
      tone={reject ? 'danger' : 'primary'}
      confirmLabel={reject ? t('decomptes:reject') : t('decomptes:accept')}
      confirmDisabled={busy || reasonMissing}
      onConfirm={() => pending && void run(pending.decision, rows)}
    >
      <div className="flex flex-col gap-3">
        <BulkPreview names={rows.map(labelOf)} total={rows.length} />
        {reject ? (
          <Field
            label={t('decomptes:rejectReason')}
            required
            error={touched && reasonMissing ? t('decomptes:rejectReasonRequired') : undefined}
          >
            <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} onBlur={() => setTouched(true)} />
          </Field>
        ) : (
          <Field label={t('bulk:messageToAgents')}>
            <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
        )}
      </div>
    </ConfirmDialog>
  );

  return { actions, dialog };
}
