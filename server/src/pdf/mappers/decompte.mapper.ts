import { Barem, Decompte, Direction, TransportType } from '@prisma/client';
import { fmtAmount, fmtCount, fmtDate, missionDays, text } from '../format';
import { MissionWithOwner, Moment, momentOf } from './ordre.mapper';
import { scanUrl } from '../qr';

export interface NordSud {
  nord: string;
  sud: string;
}

export interface PecColumn {
  repas: NordSud;
  nuitees: NordSud;
}

export interface DecomptePdfData {
  numero: string;
  date: string;
  matricule: string;
  fullname: string;
  grade: string;
  structure: string;
  reference: string;
  destination: string;
  motif: string;
  depart: Moment;
  retour: Moment;
  nbrJours: string;
  transport: {
    avion: boolean;
    service: boolean;
    personnel: boolean;
    autres: boolean;
  };
  distance: string;
  indemnite: string;
  /** "Oui" = pris en charge, "Non" = sans prise en charge. */
  pec: { oui: PecColumn; non: PecColumn };
  fraisTransport: string;
  montantTotal: string;
  /** Link encoded in the QR code; null when APP_PUBLIC_URL is not set. */
  qrUrl: string | null;
}

export type DecompteWithMission = Decompte & { mission: MissionWithOwner };

/** Only the mission's direction (Nord or Sud) is filled; the other side stays blank. */
function split(
  direction: Direction,
  count: number | null | undefined,
): NordSud {
  const v = fmtCount(count ?? 0);
  return direction === Direction.SUD
    ? { nord: '', sud: v }
    : { nord: v, sud: '' };
}

export function toDecomptePdfData(
  decompte: DecompteWithMission,
  barem?: Pick<Barem, 'montant_km'> | null,
): DecomptePdfData {
  const mission = decompte.mission;
  const user = mission?.user;
  const direction = mission?.direction ?? Direction.NORD;
  const transport = mission?.transport ?? null;

  const kmIndemnity =
    transport === TransportType.PERSONAL_CAR && barem
      ? (decompte.parcours ?? 0) * barem.montant_km
      : 0;

  return {
    numero: text(decompte.n_decompte),
    date: fmtDate(decompte.createdAt ?? new Date()),
    matricule: text(user?.matricule),
    fullname: text(`${text(user?.nom)} ${text(user?.prenom)}`),
    grade: text(user?.grade),
    structure: text(user?.structure?.name),
    reference: text(mission?.n_mission),
    destination: text(mission?.destination),
    motif: text(mission?.motif),
    depart: momentOf(mission?.date_sortie),
    retour: momentOf(mission?.date_retour),
    nbrJours: fmtCount(missionDays(mission?.date_sortie, mission?.date_retour)),
    transport: {
      // No plane value exists in TransportType yet.
      avion: false,
      service: transport === TransportType.SERVICE_CAR,
      personnel: transport === TransportType.PERSONAL_CAR,
      autres:
        transport === TransportType.TRANSPORT_ENTREPRISE ||
        transport === TransportType.TRANSPORT_EMPLOYEE,
    },
    distance: fmtCount(decompte.parcours ?? 0),
    indemnite: fmtAmount(kmIndemnity),
    pec: {
      oui: {
        repas: split(direction, decompte.repas_pec),
        nuitees: split(direction, decompte.hebergement_pec),
      },
      non: {
        repas: split(direction, decompte.repas_sans_pec),
        nuitees: split(direction, decompte.hebergement_sans_pec),
      },
    },
    fraisTransport: fmtAmount(decompte.fees_transport ?? 0),
    montantTotal: fmtAmount(decompte.montant ?? 0),
    qrUrl: scanUrl('decompte', decompte.n_decompte),
  };
}
