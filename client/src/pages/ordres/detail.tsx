import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Download, Pencil } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import http from 'helpers/http';
import { fetchAllOrders, fetchUserOrders } from 'components/orders/orderthunk';
import { fetchAllDecompte, fetchUserDecompte } from 'components/orders/decompte.thunk';
import type { IMission } from 'components/orders/orderReducer';
import type { IDecompte } from 'components/orders/decompte.reducer';
import { countItems } from 'components/decomptes/zones';
import { isValidated, useMissionActions } from 'components/orders/useMissionActions';
import { agentName, formatDate, formatDateTime, missionDuration } from 'components/orders/format';
import {
  Button,
  DescriptionList,
  DropdownMenu,
  EmptyState,
  Loader,
  PageHeader,
  Panel,
  StatusBadge,
  StatusTimeline,
  type TimelineStep,
} from 'components/ui';
import { decompteStatus, getStatusDisplay, missionStatus } from 'constants/statusLabels';
import { directionLabels, transportLabels } from 'constants/labels';
import { homeFor } from 'routes/navigation';
import paths from 'routes/paths';

type MissionRow = IMission & { user?: { matricule: number; nom?: string; prenom?: string }; createdAt?: string };

const amount = new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 });

function timeline(m: MissionRow, d: IDecompte | undefined): TimelineStep[] {
  const validated = isValidated(m);
  const steps: TimelineStep[] = [
    { label: 'Ordre de mission créé', date: formatDateTime(m.createdAt), state: 'done' },
    { label: 'Validation', date: validated ? undefined : null, state: validated ? 'done' : 'current' },
  ];
  if (!validated) {
    steps.push({ label: 'Décompte', state: 'upcoming' });
    return steps;
  }
  if (!d) {
    steps.push({ label: 'Décompte', state: 'current', note: 'Décompte non trouvé pour l’exercice sélectionné.' });
    return steps;
  }
  steps.push({ label: `Décompte N° ${d.n_decompte} créé`, date: formatDateTime(d.createdAt), state: 'done' });
  const status = getStatusDisplay(decompteStatus, d.status);
  steps.push({
    label: d.status === 'PENDING' ? 'Décision sur le décompte' : `Décompte ${status.label.toLowerCase()}`,
    date: d.status === 'PENDING' ? undefined : formatDateTime(d.updatedAt),
    state: d.status === 'ACCEPTED' ? 'done' : d.status === 'PENDING' ? 'current' : 'failed',
  });
  return steps;
}

/** Full, printable view of one ordre de mission with its lifecycle and actions. */
export default function OrdreDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((s: RootState) => s.auth) as { token: string | null; user: IUser };
  const orders = useSelector((s: RootState) => s.orders.orders) as MissionRow[];
  const decomptes = useSelector((s: RootState) => s.decompte.decomptes);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const n = Number(id);
  const fromStore = orders.find((o) => o.n_mission === n);
  const [fetched, setFetched] = useState<MissionRow | null>(null);
  const [missing, setMissing] = useState(false);
  const mission = fromStore ?? fetched;
  const decompte = decomptes.find((d) => (d.mission as { n_mission?: number } | undefined)?.n_mission === n);
  const listPath = isAdmin ? paths.admins : paths.users;

  const reload = useCallback(async () => {
    if (!token) return;
    await dispatch(isAdmin ? fetchAllOrders(token) : fetchUserOrders(token));
    await dispatch(isAdmin ? fetchAllDecompte(token) : fetchUserDecompte(token));
  }, [dispatch, token, isAdmin]);

  useEffect(() => {
    if (!orders.length || !decomptes.length) void reload();
    // load once on entry; later refreshes go through onChanged
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link to an ordre outside the current exercice: fetch it directly.
  useEffect(() => {
    if (fromStore || fetched || !token || Number.isNaN(n)) return;
    http
      .get<MissionRow>(`/missions/${n}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.data ? setFetched(r.data) : setMissing(true)))
      .catch(() => setMissing(true));
  }, [fromStore, fetched, token, n]);

  const { actionsFor, dialogs, download } = useMissionActions({
    admin: isAdmin,
    onChanged: async () => {
      await reload();
      setFetched(null);
    },
  });

  const breadcrumbs = [
    { label: t('nav.home'), to: homeFor(user?.role) },
    { label: isAdmin ? t('nav.ordres') : t('nav.myOrdres'), to: listPath },
    { label: `N° ${id}` },
  ];

  if (!mission) {
    return (
      <>
        <PageHeader title={`Ordre de mission N° ${id}`} breadcrumbs={breadcrumbs} />
        {missing ? (
          <Panel>
            <EmptyState
              title="Ordre de mission introuvable"
              hint="Il a peut-être été annulé ou archivé."
              action={<Button onClick={() => navigate(listPath)}>Retour à la liste</Button>}
            />
          </Panel>
        ) : (
          <Loader />
        )}
      </>
    );
  }

  const { menu = [] } = actionsFor(mission);
  const validated = isValidated(mission);
  const open = (label: string) => menu.find((a) => a.label === label && !a.hidden);
  const validate = open('Valider');
  const edit = open('Modifier');
  const others = menu.filter((a) => a.label !== 'Valider' && a.label !== 'Modifier');

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Ordre de mission N° {mission.n_mission}
            <StatusBadge map={missionStatus} code={mission.status} />
          </span>
        }
        description={mission.motif}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button onClick={() => download(mission)}>
              <Download />
              Télécharger
            </Button>
            {edit && (
              <Button onClick={edit.onSelect}>
                <Pencil />
                Modifier
              </Button>
            )}
            {validate && (
              <Button variant="primary" onClick={validate.onSelect}>
                <CheckCircle2 />
                Valider
              </Button>
            )}
            {others.some((a) => !a.hidden) && (
              <DropdownMenu actions={others} trigger={<Button>{t('actions.more')}</Button>} />
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Mission">
            <DescriptionList
              items={[
                { label: 'Motif', value: mission.motif },
                { label: 'Destination', value: mission.destination },
                { label: 'Départ', value: formatDateTime(mission.date_sortie) },
                { label: 'Retour', value: formatDateTime(mission.date_retour) },
                { label: 'Durée', value: missionDuration(mission.date_sortie, mission.date_retour) },
                { label: 'Direction', value: directionLabels[mission.direction] ?? mission.direction },
                { label: 'Moyen de transport', value: transportLabels[mission.transport] ?? mission.transport },
              ]}
            />
          </Panel>
          <Panel title="Agent">
            <DescriptionList
              items={[
                { label: 'Nom et prénom', value: agentName(mission.user) },
                { label: 'Matricule', value: mission.user?.matricule ?? mission.userId },
              ]}
            />
          </Panel>
          {validated && decompte && (
            <Panel title={`Décompte N° ${decompte.n_decompte}`} actions={<StatusBadge map={decompteStatus} code={decompte.status} />}>
              <DescriptionList
                columns={3}
                items={[
                  ...countItems(decompte, mission.direction),
                  { label: 'Distance parcourue', value: `${decompte.parcours ?? 0} km` },
                  { label: 'Frais de transport', value: `${amount.format(decompte.fees_transport ?? 0)} DA` },
                  { label: 'Montant', value: <strong>{amount.format(decompte.montant ?? 0)} DA</strong> },
                  { label: 'Créé le', value: formatDate(decompte.createdAt) },
                ]}
              />
            </Panel>
          )}
        </div>
        <Panel title="Suivi" className="self-start">
          <StatusTimeline steps={timeline(mission, decompte)} />
        </Panel>
      </div>
      {dialogs}
    </>
  );
}
