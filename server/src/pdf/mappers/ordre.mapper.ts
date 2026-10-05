import { structureLabel } from 'src/structures/structure-tree';
import {
  GradeAssignmentKind,
  Mission,
  Structure,
  TransportType,
  User,
} from '@prisma/client';
import { fmtDate, fmtHour, fmtMinute, text } from '../format';
import { scanUrl } from '../qr';

export interface Moment {
  date: string;
  hour: string;
  minute: string;
}

export interface OrdrePdfData {
  numero: string;
  date: string;
  matricule: string;
  fullname: string;
  grade: string;
  service: string;
  destination: string;
  motif: string;
  depart: Moment;
  retour: Moment;
  transport: TransportType | null;
  /** Link encoded in the QR code; null when APP_PUBLIC_URL is not set. */
  qrUrl: string | null;
}

export type MissionWithOwner = Mission & {
  user: (User & { structure?: Structure | null }) | null;
  /** The Interim/Remplaçant period the ordre was priced under, if any. */
  gradeAssignment?: { kind: GradeAssignmentKind } | null;
};

const KIND_LABEL: Record<GradeAssignmentKind, string> = {
  INTERIM: 'Intérim',
  REMPLACANT: 'Remplaçant',
};

/** The grade as printed: tagged "(Intérim)" / "(Remplaçant)" when raised by a period. */
export function gradeLabel(mission: MissionWithOwner): string {
  const grade = text(mission.user?.grade);
  const kind = mission.gradeAssignment?.kind;
  return kind ? `${grade} (${KIND_LABEL[kind]})` : grade;
}

export function momentOf(val: Date | string | null | undefined): Moment {
  return { date: fmtDate(val), hour: fmtHour(val), minute: fmtMinute(val) };
}

/**
 * Always prints the mission owner (never the user downloading the PDF),
 * dated on the mission's creation so re-downloads are identical.
 */
export function toOrdrePdfData(mission: MissionWithOwner): OrdrePdfData {
  const owner = mission.user;
  return {
    numero: text(mission.n_mission),
    date: fmtDate(mission.createdAt ?? new Date()),
    matricule: text(owner?.matricule),
    fullname: text(`${text(owner?.nom)} ${text(owner?.prenom)}`),
    grade: gradeLabel(mission),
    service: text(owner?.structure ? structureLabel(owner.structure) : ''),
    destination: text(mission.destination),
    motif: text(mission.motif),
    depart: momentOf(mission.date_sortie),
    retour: momentOf(mission.date_retour),
    transport: mission.transport ?? null,
    qrUrl: scanUrl('ordre', mission.n_mission),
  };
}
