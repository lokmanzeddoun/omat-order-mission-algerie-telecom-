import React from 'react';
import { Document } from '@react-pdf/renderer';
import { IMission } from './orderReducer';
import { IDecompte } from './decompte.reducer';
import { DecompteDocument } from './pdf/DecomptePdf';

interface Props {
    mission: IMission;
    decompte: IDecompte;
    user?: { matricule?: number; nom?: string; prenom?: string; grade?: string; structure?: string };
}

export const DecomptePdf: React.FC<Props> = ({ mission, decompte, user }) => (
    <Document>
        <DecompteDocument
            data={{
                matricule: user?.matricule ? String(user.matricule) : undefined,
                nomPrenom: `${user?.nom ?? ''} ${user?.prenom ?? ''}`.trim() || undefined,
                structure: user?.structure,
                refMission: mission?.n_mission,
                destination: mission?.destination,
                motif: mission?.motif,
                dateDepart: mission?.date_sortie?.split('T')[0],
                heureArriveeH: decompte?.heure_retour?.split(':')[0],
                heureArriveeM: decompte?.heure_retour?.split(':')[1],
                dateRetour: decompte?.date_retour,
                heureDepartH: decompte?.heure_sortie?.split(':')[0],
                heureDepartM: decompte?.heure_sortie?.split(':')[1],
                nbJours: (() => {
                    try {
                        const start = mission?.date_sortie?.split('T')[0];
                        const end = decompte?.date_retour;
                        if (!start || !end) return undefined;
                        const sd = new Date(start);
                        const ed = new Date(end);
                        const diff = Math.round((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24));
                        return isNaN(diff) ? undefined : Math.max(diff, 0);
                    } catch {
                        return undefined;
                    }
                })(),
                moyenTransport:
                    mission?.transport === 'SERVICE_CAR'
                        ? 'vehicule_service'
                        : mission?.transport === 'PERSONAL_CAR'
                            ? 'vehicule_personnel'
                            : mission?.transport === 'TRANSPORT_ENTREPRISE' || mission?.transport === 'TRANSPORT_EMPLOYEE'
                                ? 'autres'
                                : undefined,
                distanceKm: decompte?.distance_km,
                indemniteKm: undefined,
                // Prise en charge section uses counts; mapping available fields
                repasNord: decompte?.repas_pec, // using available fields as approximation
                repasSud: decompte?.repas_sans_pec,
                nuitsNord: decompte?.hebergement_pec,
                nuitsSud: decompte?.hebergement_sans_pec,
                fraisTransport: decompte?.transport_cost,
                montantTotal: undefined,
            }}
            logoPath="/Logo.png"
        />
    </Document>
);

export default DecomptePdf;
