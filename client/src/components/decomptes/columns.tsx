import { StatusBadge, type DataColumn } from 'components/ui';
import { decompteStatus } from 'constants/statusLabels';
import { transportLabels } from 'constants/labels';
import { agentName, formatDate, formatDateTime } from 'components/orders/format';
import type { DecompteRow } from './useDecompteActions';

const money = new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 });
export const da = (v?: number | null) => `${money.format(v ?? 0)} DA`;

/** Whole days between departure and return, rounded up (as before). */
export const missionDays = (d: DecompteRow) => {
  const s = d.mission?.date_sortie;
  const e = d.mission?.date_retour;
  if (!s || !e) return 0;
  const days = Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000);
  return days > 0 ? days : 0;
};

const statusOptions = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACCEPTED', label: 'Accepté' },
  { value: 'REGECTED', label: 'Rejeté' },
];

// 8 key columns by default; the other figures stay available from "Colonnes".
export const decompteColumns: DataColumn<DecompteRow>[] = [
  { id: 'n_decompte', header: 'N°', width: 64, align: 'end', alwaysVisible: true },
  { id: 'agent', header: 'Agent', accessor: (d) => agentName(d.mission?.user) },
  {
    id: 'ordre',
    header: 'Ordre de mission',
    accessor: (d) => d.mission?.n_mission,
    filterText: (d) => `${d.mission?.n_mission ?? ''} ${d.mission?.destination ?? ''}`,
    cell: (d) => (d.mission?.n_mission ? `N° ${d.mission.n_mission} — ${d.mission.destination ?? ''}` : '—'),
    exportValue: (d) => `${d.mission?.n_mission ?? ''} ${d.mission?.destination ?? ''}`.trim(),
  },
  { id: 'createdAt', header: 'Date', filter: 'date', cell: (d) => formatDate(d.createdAt), exportValue: (d) => formatDate(d.createdAt) },
  { id: 'jours', header: 'Jours', width: 70, align: 'end', filter: false, accessor: missionDays },
  { id: 'montant', header: 'Montant', align: 'end', filter: false, cell: (d) => <span className="tabular-nums">{da(d.montant)}</span>, exportValue: (d) => String(d.montant ?? 0) },
  {
    id: 'status',
    header: 'Statut',
    filter: { type: 'select', options: statusOptions },
    cell: (d) => <StatusBadge map={decompteStatus} code={d.status} />,
    exportValue: (d) => decompteStatus[d.status ?? '']?.label ?? '',
  },
  // Optional columns
  { id: 'matricule', header: 'Matricule', defaultHidden: true, accessor: (d) => d.mission?.user?.matricule },
  { id: 'depart', header: 'Départ', filter: 'date', defaultHidden: true, accessor: (d) => d.mission?.date_sortie, cell: (d) => formatDateTime(d.mission?.date_sortie), exportValue: (d) => formatDateTime(d.mission?.date_sortie) },
  { id: 'retour', header: 'Retour', filter: 'date', defaultHidden: true, accessor: (d) => d.mission?.date_retour, cell: (d) => formatDateTime(d.mission?.date_retour), exportValue: (d) => formatDateTime(d.mission?.date_retour) },
  { id: 'motif', header: 'Motif', defaultHidden: true, accessor: (d) => d.mission?.motif },
  { id: 'transport', header: 'Transport', defaultHidden: true, accessor: (d) => transportLabels[d.mission?.transport ?? ''] ?? d.mission?.transport },
  { id: 'parcours', header: 'Distance (km)', align: 'end', filter: false, defaultHidden: true },
  { id: 'repas_pec', header: 'Repas PEC', align: 'end', filter: false, defaultHidden: true },
  { id: 'repas_sans_pec', header: 'Repas non PEC', align: 'end', filter: false, defaultHidden: true },
  { id: 'hebergement_pec', header: 'Nuitées PEC', align: 'end', filter: false, defaultHidden: true },
  { id: 'hebergement_sans_pec', header: 'Nuitées non PEC', align: 'end', filter: false, defaultHidden: true },
  { id: 'fees_transport', header: 'Frais de transport', align: 'end', filter: false, defaultHidden: true, cell: (d) => da(d.fees_transport) },
];
