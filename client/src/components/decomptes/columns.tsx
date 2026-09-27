import type { TFunction } from 'i18next';
import { StatusBadge, type DataColumn } from 'components/ui';
import { decompteStatus } from 'constants/statusLabels';
import { transportLabels } from 'constants/labels';
import { agentName, formatDate, formatDateTime } from 'components/orders/format';
import { formatDA } from 'lib/format';
import type { DecompteRow } from './useDecompteActions';

export const da = (v?: number | null) => formatDA(v);

/** Whole days between departure and return, rounded up (as before). */
export const missionDays = (d: DecompteRow) => {
  const s = d.mission?.date_sortie;
  const e = d.mission?.date_retour;
  if (!s || !e) return 0;
  const days = Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000);
  return days > 0 ? days : 0;
};

// 8 key columns by default; the other figures stay available from "Colonnes".
// Built with `t` so headers follow the UI language (memoize on `t` in the page).
export const decompteColumns = (t: TFunction): DataColumn<DecompteRow>[] => [
  { id: 'n_decompte', header: t('field.number'), width: 64, align: 'end', alwaysVisible: true },
  { id: 'agent', header: t('field.agent'), accessor: (d) => agentName(d.mission?.user) },
  {
    id: 'ordre',
    header: t('field.missionOrder'),
    accessor: (d) => d.mission?.n_mission,
    filterText: (d) => `${d.mission?.n_mission ?? ''} ${d.mission?.destination ?? ''}`,
    cell: (d) => (d.mission?.n_mission ? `${t('numbered', { n: d.mission.n_mission })} — ${d.mission.destination ?? ''}` : '—'),
    exportValue: (d) => `${d.mission?.n_mission ?? ''} ${d.mission?.destination ?? ''}`.trim(),
  },
  { id: 'createdAt', header: t('field.date'), filter: 'date', cell: (d) => formatDate(d.createdAt), exportValue: (d) => formatDate(d.createdAt) },
  { id: 'jours', header: t('field.days'), width: 70, align: 'end', filter: false, accessor: missionDays },
  { id: 'montant', header: t('field.amount'), align: 'end', filter: false, cell: (d) => <span className="tabular-nums">{da(d.montant)}</span>, exportValue: (d) => String(d.montant ?? 0) },
  {
    id: 'status',
    header: t('field.status'),
    filter: {
      type: 'select',
      options: ['PENDING', 'ACCEPTED', 'REGECTED'].map((value) => ({ value, label: decompteStatus[value].label })),
    },
    cell: (d) => <StatusBadge map={decompteStatus} code={d.status} />,
    exportValue: (d) => decompteStatus[d.status ?? '']?.label ?? '',
  },
  // Optional columns
  { id: 'matricule', header: t('field.matricule'), defaultHidden: true, accessor: (d) => d.mission?.user?.matricule },
  { id: 'depart', header: t('field.departure'), filter: 'date', defaultHidden: true, accessor: (d) => d.mission?.date_sortie, cell: (d) => formatDateTime(d.mission?.date_sortie), exportValue: (d) => formatDateTime(d.mission?.date_sortie) },
  { id: 'retour', header: t('field.return'), filter: 'date', defaultHidden: true, accessor: (d) => d.mission?.date_retour, cell: (d) => formatDateTime(d.mission?.date_retour), exportValue: (d) => formatDateTime(d.mission?.date_retour) },
  { id: 'motif', header: t('field.motif'), defaultHidden: true, accessor: (d) => d.mission?.motif },
  { id: 'transport', header: t('field.transport'), defaultHidden: true, accessor: (d) => transportLabels[d.mission?.transport ?? ''] ?? d.mission?.transport },
  { id: 'parcours', header: t('field.distanceKm'), align: 'end', filter: false, defaultHidden: true },
  { id: 'repas_pec', header: t('field.mealsPecShort'), align: 'end', filter: false, defaultHidden: true },
  { id: 'repas_sans_pec', header: t('field.mealsNoPecShort'), align: 'end', filter: false, defaultHidden: true },
  { id: 'hebergement_pec', header: t('field.nightsPecShort'), align: 'end', filter: false, defaultHidden: true },
  { id: 'hebergement_sans_pec', header: t('field.nightsNoPecShort'), align: 'end', filter: false, defaultHidden: true },
  { id: 'fees_transport', header: t('field.transportFees'), align: 'end', filter: false, defaultHidden: true, cell: (d) => da(d.fees_transport) },
];
