import { useTranslation } from 'react-i18next';
import { SidePanel, StatusBadge } from 'components/ui';
import { decompteStatus } from 'constants/statusLabels';
import { roleLabels } from 'constants/labels';
import dayjs from 'helpers/date';

export interface CommentMessage {
  id?: number;
  title: string;
  status?: string;
  createdAt?: string;
  user?: { nom?: string; prenom?: string; role?: string } | null;
}

interface Props {
  open: boolean;
  title: string;
  messages: CommentMessage[];
  onClose: () => void;
}

/** Chronological list of the messages attached to a décompte. */
export default function CommentsPanel({ open, title, messages, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <SidePanel open={open} onOpenChange={(o) => !o && onClose()} title={title}>
      {messages.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('comments:noneForDecompte')}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <li key={msg.id ?? i} className="rounded-sm border border-border bg-surface-muted p-3">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
                <span>
                  {msg.user ? `${msg.user.prenom ?? ''} ${msg.user.nom ?? ''}`.trim() : t('comments:administration')}
                  {msg.user?.role ? ` · ${roleLabels[msg.user.role] ?? msg.user.role}` : ''}
                </span>
                <span className="tabular-nums">{msg.createdAt ? dayjs(msg.createdAt).format('DD/MM/YYYY HH:mm') : ''}</span>
              </div>
              <p className="text-sm whitespace-pre-line text-fg">{msg.title}</p>
              {msg.status && (
                <div className="mt-2">
                  <StatusBadge map={decompteStatus} code={msg.status} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </SidePanel>
  );
}
