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
    { label: `N° ${id}` },
  ];

  if (!decompte) {
    return (
      <>
        <PageHeader title={`Décompte N° ${id}`} breadcrumbs={breadcrumbs} />
        {loading ? (
          <Loader />
        ) : (
          <Panel>
            <EmptyState
              title="Décompte introuvable"
              hint="Il n’appartient pas à l’exercice sélectionné, ou il a été archivé."
              action={
                <Button asChild>
                  <Link to={`${paths.admins}/decomptes`}>Retour à la liste</Link>
                </Button>
              }
            />
          </Panel>
        )}
      </>
    );
  }

  const { menu = [] } = actionsFor(decompte);
  const find = (label: string) => menu.find((a) => a.label === label && !a.hidden);
  const accept = find('Accepter');
  const reject = find('Rejeter');
  const others = menu.filter((a) => a.label !== 'Accepter' && a.label !== 'Rejeter' && a.label !== 'Voir les commentaires');
  const m = decompte.mission;
  const messages = (decompte.messages ?? []) as CommentMessage[];

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Décompte N° {decompte.n_decompte}
            <StatusBadge map={decompteStatus} code={decompte.status} />
          </span>
        }
        description={m ? `${agentName(m.user)} — ${m.destination ?? ''}` : undefined}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button onClick={() => download(decompte)}>
              <Download />
              Télécharger
            </Button>
            {reject && (
              <Button variant="danger" onClick={reject.onSelect}>
                <XCircle />
                Rejeter
              </Button>
            )}
            {accept && (
              <Button variant="primary" onClick={accept.onSelect}>
                <CheckCircle2 />
                Accepter
              </Button>
            )}
            {others.some((a) => !a.hidden) && <DropdownMenu actions={others} trigger={<Button>{t('actions.more')}</Button>} />}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Montants">
            <DescriptionList
              columns={3}
              items={[
                ...countItems(decompte, decompte.mission?.direction),
                { label: 'Distance parcourue', value: `${decompte.parcours ?? 0} km` },
                { label: 'Frais de transport', value: da(decompte.fees_transport) },
                { label: 'Montant total', value: <strong className="text-base">{da(decompte.montant)}</strong> },
                { label: 'Créé le', value: formatDate(decompte.createdAt) },
              ]}
            />
          </Panel>
          <Panel
            title="Ordre de mission"
            actions={
              m?.n_mission ? (
                <Link to={`${paths.admins}/ordres/${m.n_mission}`} className="text-sm text-primary underline underline-offset-2">
                  Ouvrir l’ordre N° {m.n_mission}
                </Link>
              ) : undefined
            }
          >
            <DescriptionList
              items={[
                { label: 'Agent', value: agentName(m?.user) },
                { label: 'Matricule', value: m?.user?.matricule },
                { label: 'Destination', value: m?.destination },
                { label: 'Motif', value: m?.motif },
                { label: 'Départ', value: formatDateTime(m?.date_sortie) },
                { label: 'Retour', value: formatDateTime(m?.date_retour) },
                { label: 'Nombre de jours', value: missionDays(decompte) },
                { label: 'Transport', value: transportLabels[m?.transport ?? ''] ?? m?.transport },
              ]}
            />
          </Panel>
        </div>

        <Panel title={`Commentaires (${messages.length})`} className="self-start">
          {messages.length === 0 ? (
            <p className="text-sm text-fg-muted">Aucun commentaire.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <li key={msg.id ?? i} className="border-s-4 border-border-strong ps-3">
                  <p className="text-xs text-fg-muted">
                    {msg.user ? `${agentName(msg.user)} · ${roleLabels[msg.user.role ?? ''] ?? ''}` : 'Administration'}
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
