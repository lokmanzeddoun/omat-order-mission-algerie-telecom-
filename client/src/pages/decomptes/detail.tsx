import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Download, XCircle } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { fetchAllDecompte } from 'components/orders/decompte.thunk';
import { useDecompteActions, type DecompteRow } from 'components/decomptes/useDecompteActions';
import { da, missionDays } from 'components/decomptes/columns';
import { countItems } from 'components/decomptes/zones';
import { agentName, formatDate, formatDateTime } from 'components/orders/format';
import type { CommentMessage } from 'components/comments/CommentsPanel';
import { Button, DescriptionList, DropdownMenu, EmptyState, Loader, PageHeader, Panel, StatusBadge } from 'components/ui';
import { decompteStatus } from 'constants/statusLabels';
import { roleLabels, transportLabels } from 'constants/labels';
import paths from 'routes/paths';
import dayjs from 'helpers/date';

/** One décompte: figures, related ordre, agent, comment thread and decision actions. */
export default function DecompteDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((s: RootState) => s.auth) as { token: string | null; user: IUser };
  const { decomptes, loading } = useSelector((s: RootState) => s.decompte) as { decomptes: DecompteRow[]; loading: boolean };
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const decompte = decomptes.find((d) => d.n_decompte === Number(id));

  const reload = useCallback(async () => {
    if (token) await dispatch(fetchAllDecompte(token));
  }, [dispatch, token]);

  useEffect(() => {
    if (!decomptes.length) void reload();
  }, [decomptes.length, reload]);

  const { actionsFor, dialogs, download } = useDecompteActions({ admin: isAdmin, onChanged: reload });

  const breadcrumbs = [
    { label: t('nav.home'), to: paths.admins },
    { label: t('nav.decomptes'), to: `${paths.admins}/decomptes` },
    { label: t('numbered', { n: id }) },
  ];

  if (!decompte) {
    return (
      <>
        <PageHeader title={t('decomptes:title', { n: id })} breadcrumbs={breadcrumbs} />
        {loading ? (
          <Loader />
        ) : (
          <Panel>
            <EmptyState
              title={t('decomptes:notFound')}
              hint={t('decomptes:notFoundHint')}
              action={
                <Button asChild>
                  <Link to={`${paths.admins}/decomptes`}>{t('actions.backToList')}</Link>
                </Button>
              }
            />
          </Panel>
        )}
      </>
    );
  }

  const { menu = [] } = actionsFor(decompte);
  const find = (id: string) => menu.find((a) => a.id === id && !a.hidden);
  const accept = find('accept');
  const reject = find('reject');
  const others = menu.filter((a) => a.id !== 'accept' && a.id !== 'reject' && a.id !== 'comments');
  const m = decompte.mission;
  const messages = (decompte.messages ?? []) as CommentMessage[];

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t('decomptes:title', { n: decompte.n_decompte })}
            <StatusBadge map={decompteStatus} code={decompte.status} />
          </span>
        }
        description={m ? `${agentName(m.user)} — ${m.destination ?? ''}` : undefined}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button onClick={() => download(decompte)}>
              <Download />
              {t('actions.download')}
            </Button>
            {reject && (
              <Button variant="danger" onClick={reject.onSelect}>
                <XCircle />
                {t('decomptes:reject')}
              </Button>
            )}
            {accept && (
              <Button variant="primary" onClick={accept.onSelect}>
                <CheckCircle2 />
                {t('decomptes:accept')}
              </Button>
            )}
            {others.some((a) => !a.hidden) && <DropdownMenu actions={others} trigger={<Button>{t('actions.more')}</Button>} />}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title={t('decomptes:amounts')}>
            <DescriptionList
              columns={3}
              items={[
                ...countItems(decompte, decompte.mission?.direction, t),
                { label: t('field.distance'), value: t('units.km', { value: decompte.parcours ?? 0 }) },
                { label: t('field.transportFees'), value: da(decompte.fees_transport) },
                { label: t('field.totalAmount'), value: <strong className="text-base">{da(decompte.montant)}</strong> },
                { label: t('field.createdOn'), value: formatDate(decompte.createdAt) },
              ]}
            />
          </Panel>
          <Panel
            title={t('field.missionOrder')}
            actions={
              m?.n_mission ? (
                <Link to={`${paths.admins}/ordres/${m.n_mission}`} className="text-sm text-primary underline underline-offset-2">
                  {t('decomptes:openMission', { n: m.n_mission })}
                </Link>
              ) : undefined
            }
          >
            <DescriptionList
              items={[
                { label: t('field.agent'), value: agentName(m?.user) },
                { label: t('field.matricule'), value: m?.user?.matricule },
                { label: t('field.destination'), value: m?.destination },
                { label: t('field.motif'), value: m?.motif },
                { label: t('field.departure'), value: formatDateTime(m?.date_sortie) },
                { label: t('field.return'), value: formatDateTime(m?.date_retour) },
                { label: t('field.daysCount'), value: missionDays(decompte) },
                { label: t('field.transport'), value: transportLabels[m?.transport ?? ''] ?? m?.transport },
              ]}
            />
          </Panel>
        </div>

        <Panel title={t('decomptes:commentsCount', { count: messages.length })} className="self-start">
          {messages.length === 0 ? (
            <p className="text-sm text-fg-muted">{t('comments:none')}</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <li key={msg.id ?? i} className="border-s-4 border-border-strong ps-3">
                  <p className="text-xs text-fg-muted">
                    {msg.user ? `${agentName(msg.user)} · ${roleLabels[msg.user.role ?? ''] ?? ''}` : t('comments:administration')}
                    {msg.createdAt ? ` — ${dayjs(msg.createdAt).format('DD/MM/YYYY HH:mm')}` : ''}
                  </p>
                  <p className="text-sm whitespace-pre-line">{msg.title}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
      {dialogs}
    </>
  );
}
