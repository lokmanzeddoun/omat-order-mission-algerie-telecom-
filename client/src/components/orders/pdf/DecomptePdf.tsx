import React from 'react';
import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';

// A4 page is 595x842pt approximately

export interface DecomptePdfProps {
    // Optional data fields to prefill the form; if omitted, boxes remain empty
    data?: {
        matricule?: string;
        nomPrenom?: string;
        poste?: string;
        structure?: string;
        refMission?: string | number;
        destination?: string;
        motif?: string;
        dateDepart?: string; // dd/mm/yyyy
        heureArriveeH?: string; // HH
        heureArriveeM?: string; // mm
        dateRetour?: string; // dd/mm/yyyy
        heureDepartH?: string; // HH
        heureDepartM?: string; // mm
        nbJours?: string | number;
        moyenTransport?: 'vehicule_service' | 'vehicule_personnel' | 'autres';
        distanceKm?: string | number;
        indemniteKm?: string | number;
        priseEnCharge?: 'oui' | 'non';
        repasNord?: string | number;
        repasSud?: string | number;
        nuitsNord?: string | number;
        nuitsSud?: string | number;
        fraisTransport?: string | number;
        montantTotal?: string | number;
    };
    // Public logo path served by Vite; default to '/Logo.png' (from public folder)
    logoPath?: string;
}

// Common styles for borders, cells, text, etc.
const styles = StyleSheet.create({
    page: {
        padding: 24,
        fontSize: 9,
        fontFamily: 'Helvetica',
        color: '#000',
    },
    borderBox: {
        border: 1,
        borderColor: '#777',
        borderRadius: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    headerLeft: {
        width: '22%',
        ...({} as any),
        border: 1,
        borderColor: '#777',
        borderRightWidth: 0,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        width: '41%',
        borderTop: 1,
        borderBottom: 1,
        borderColor: '#777',
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        width: '37%',
        border: 1,
        borderColor: '#777',
        borderLeftWidth: 0,
        padding: 6,
    },
    small: { fontSize: 8 },
    bold: { fontWeight: 700 },
    title: { fontSize: 11, textAlign: 'center', fontWeight: 700 },
    label: { fontSize: 9 },
    row: { flexDirection: 'row', alignItems: 'center' },
    spacer: { height: 6 },
    section: { marginTop: 8 },
    underlineArea: {
        borderBottom: 1,
        borderColor: '#777',
        minWidth: 120,
        height: 12,
    },
    box: {
        border: 1,
        borderColor: '#777',
        minHeight: 14,
        minWidth: 60,
        paddingHorizontal: 4,
        justifyContent: 'center',
    },
    boxSmall: { border: 1, borderColor: '#777', minWidth: 18, minHeight: 14, justifyContent: 'center', alignItems: 'center' },
    right: { textAlign: 'right' },
    metaTableRow: { flexDirection: 'row' },
    metaLabel: { width: '50%', borderRight: 1, borderColor: '#777', padding: 3 },
    metaValue: { width: '50%', padding: 3 },
    blueLine: { borderTop: 2, borderColor: '#7aa5cd', marginVertical: 6 },
    sectionTitle: { textAlign: 'center', fontSize: 12, fontWeight: 700, marginTop: 6, marginBottom: 6 },
    // Grid-like helpers
    col: { flexDirection: 'column' },
    flex1: { flex: 1 },
});

const TwoCol = ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
    <View style={{ ...styles.row, gap: 12 }}>
        <View style={{ ...styles.flex1 }}>{left}</View>
        <View style={{ ...styles.flex1 }}>{right}</View>
    </View>
);

export const DecompteDocument: React.FC<DecomptePdfProps> = ({ data, logoPath = '/Logo.png' }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <Image src={logoPath} style={{ width: 60, height: 60, marginBottom: 4 }} />
                    <Text style={styles.small}>Toujours plus proche</Text>
                </View>
                <View style={styles.headerCenter}>
                    <Text style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>PROCEDURE DE REMBOURSEMENT</Text>
                    <Text style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>DES FRAIS DE MISSION</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={{ ...styles.borderBox }}>
                        <View style={{ ...styles.metaTableRow }}>
                            <Text style={{ ...styles.metaLabel, fontSize: 8 }}>Réf :</Text>
                            <Text style={{ ...styles.metaValue, fontSize: 8 }}>AT-DG-DOP-DSPE- PR N°16-2023</Text>
                        </View>
                        <View style={{ ...styles.metaTableRow, borderTop: 1, borderColor: '#777' }}>
                            <Text style={{ ...styles.metaLabel, fontSize: 8 }}>Version :</Text>
                            <Text style={{ ...styles.metaValue, fontSize: 8 }}>3.0</Text>
                        </View>
                        <View style={{ ...styles.metaTableRow, borderTop: 1, borderColor: '#777' }}>
                            <Text style={{ ...styles.metaLabel, fontSize: 8 }}>Date :</Text>
                            <Text style={{ ...styles.metaValue, fontSize: 8 }}>03/08/2023</Text>
                        </View>
                        <View style={{ ...styles.metaTableRow, borderTop: 1, borderColor: '#777' }}>
                            <Text style={{ ...styles.metaLabel, fontSize: 8 }}>Page</Text>
                            <Text style={{ ...styles.metaValue, fontSize: 8 }}>15 sur 17</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.small}>Annexe n°5</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Décompte des frais de mission</Text>
            </View>

            {/* Identity lines */}
            <View style={styles.section}>
                <View style={styles.row}>
                    <Text style={{ ...styles.label, width: 70 }}>Matricule :</Text>
                    <View style={{ ...styles.underlineArea, flex: 1 }} />
                </View>
                <View style={{ height: 4 }} />
                <View style={styles.row}>
                    <Text style={{ ...styles.label, width: 90 }}>Nom et Prénom :</Text>
                    <View style={{ ...styles.underlineArea, flex: 1 }} />
                </View>
                <View style={{ height: 4 }} />
                <View style={styles.row}>
                    <Text style={{ ...styles.label, width: 80 }}>Poste occupé :</Text>
                    <View style={{ ...styles.underlineArea, flex: 1 }} />
                </View>
                <View style={{ height: 4 }} />
                <View style={styles.row}>
                    <Text style={{ ...styles.label, width: 95 }}>Structure d'attache :</Text>
                    <View style={{ ...styles.underlineArea, flex: 1 }} />
                </View>
            </View>

            <View style={styles.blueLine} />

            {/* Mission ref and details */}
            <View style={styles.section}>
                <View style={{ ...styles.row, marginBottom: 6 }}>
                    <Text style={{ ...styles.label, marginRight: 8 }}>Référence Ordre de mission</Text>
                    <View style={{ ...styles.box, width: 140 }}>
                        {data?.refMission && <Text>{String(data.refMission)}</Text>}
                    </View>
                </View>

                <View style={{ ...styles.row, marginBottom: 6 }}>
                    <Text style={{ ...styles.label, marginRight: 8 }}>Destination :</Text>
                    <View style={{ ...styles.box, flex: 1 }}>
                        {data?.destination && <Text>{String(data.destination)}</Text>}
                    </View>
                </View>

                <View style={{ ...styles.row, marginBottom: 6 }}>
                    <Text style={{ ...styles.label, marginRight: 8 }}>Motif :</Text>
                    <View style={{ ...styles.box, flex: 1, minHeight: 24 }}>
                        {data?.motif && <Text>{String(data.motif)}</Text>}
                    </View>
                </View>
            </View>

            {/* Dates and times */}
            <View style={{ ...styles.section, ...styles.borderBox, padding: 8 }}>
                <TwoCol
                    left={
                        <View>
                            <View style={{ ...styles.row, marginBottom: 6 }}>
                                <Text style={{ ...styles.label, marginRight: 8 }}>Date de départ</Text>
                                <View style={{ ...styles.box, width: 120 }}>{data?.dateDepart && <Text>{String(data.dateDepart)}</Text>}</View>
                            </View>
                            <View style={{ ...styles.row }}>
                                <Text style={{ ...styles.label, marginRight: 8 }}>Date de retour</Text>
                                <View style={{ ...styles.box, width: 120 }}>{data?.dateRetour && <Text>{String(data.dateRetour)}</Text>}</View>
                            </View>
                        </View>
                    }
                    right={
                        <View>
                            <View style={{ ...styles.row, marginBottom: 6 }}>
                                <Text style={{ ...styles.label, marginRight: 8 }}>Heure d'arrivée</Text>
                                <View style={styles.boxSmall}><Text>{data?.heureArriveeH ?? ''}</Text></View>
                                <Text style={{ marginHorizontal: 3 }}>H</Text>
                                <View style={styles.boxSmall}><Text>{data?.heureArriveeM ?? ''}</Text></View>
                                <Text style={{ marginLeft: 3 }}>min</Text>
                            </View>
                            <View style={{ ...styles.row }}>
                                <Text style={{ ...styles.label, marginRight: 8 }}>heure de départ</Text>
                                <View style={styles.boxSmall}><Text>{data?.heureDepartH ?? ''}</Text></View>
                                <Text style={{ marginHorizontal: 3 }}>H</Text>
                                <View style={styles.boxSmall}><Text>{data?.heureDepartM ?? ''}</Text></View>
                                <Text style={{ marginLeft: 3 }}>min</Text>
                            </View>
                        </View>
                    }
                />

                <View style={{ ...styles.row, marginTop: 8 }}>
                    <Text style={{ ...styles.label, marginRight: 8 }}>Nombre de jours de la mission</Text>
                    <View style={{ ...styles.box, width: 80 }}>{data?.nbJours && <Text>{String(data.nbJours)}</Text>}</View>
                </View>
            </View>

            {/* Moyen de transport */}
            <View style={{ ...styles.section, ...styles.borderBox, padding: 8 }}>
                <Text style={{ ...styles.bold, marginBottom: 6 }}>Moyen de transport</Text>
                <View style={{ ...styles.row, gap: 16 }}>
                    <View style={styles.row}>
                        <Text>a -</Text>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.boxSmall}>
                            <Text>{data?.moyenTransport === 'vehicule_service' ? '☒' : '☐'}</Text>
                        </View>
                        <Text style={{ marginLeft: 4 }}>b - véhicule de service</Text>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.boxSmall}>
                            <Text>{data?.moyenTransport === 'vehicule_personnel' ? '☒' : '☐'}</Text>
                        </View>
                        <Text style={{ marginLeft: 4 }}>c - véhicule personnel</Text>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.boxSmall}>
                            <Text>{data?.moyenTransport === 'autres' ? '☒' : '☐'}</Text>
                        </View>
                        <Text style={{ marginLeft: 4 }}>d - Autres</Text>
                    </View>
                </View>
            </View>

            {/* Indemnité kilométrique */}
            <View style={{ ...styles.section, ...styles.borderBox, padding: 8 }}>
                <Text style={{ ...styles.bold, marginBottom: 6 }}>Indemnité kilométrique</Text>
                <TwoCol
                    left={
                        <View style={styles.row}>
                            <Text style={{ ...styles.label, marginRight: 8 }}>Distance parcourue</Text>
                            <View style={{ ...styles.box, width: 100 }}>{data?.distanceKm && <Text>{String(data.distanceKm)}</Text>}</View>
                            <Text style={{ marginLeft: 6 }}>KM</Text>
                        </View>
                    }
                    right={
                        <View style={styles.row}>
                            <Text style={{ ...styles.label, marginRight: 8 }}>Montant Indemnité kilométrique</Text>
                            <View style={{ ...styles.box, width: 140 }}>{data?.indemniteKm && <Text>{String(data.indemniteKm)}</Text>}</View>
                            <Text style={{ marginLeft: 6 }}>DA</Text>
                        </View>
                    }
                />
            </View>

            {/* Prise en charge */}
            <View style={{ ...styles.section, ...styles.borderBox, padding: 8 }}>
                <Text style={{ ...styles.bold, marginBottom: 6 }}>Prise en charge</Text>
                <TwoCol
                    left={
                        <View>
                            <Text style={{ ...styles.bold, marginBottom: 4 }}>Oui</Text>
                            <View style={{ ...styles.row, marginBottom: 6 }}>
                                <Text style={{ width: 60 }}>Nord</Text>
                                <Text style={{ width: 60 }}>Sud</Text>
                            </View>
                            <View style={{ ...styles.row, marginBottom: 4 }}>
                                <Text style={{ width: 120 }}>Nombre de repas</Text>
                                <View style={{ ...styles.box, width: 40, marginRight: 10 }}>{data?.repasNord && <Text>{String(data.repasNord)}</Text>}</View>
                                <View style={{ ...styles.box, width: 40 }}>{data?.repasSud && <Text>{String(data.repasSud)}</Text>}</View>
                            </View>
                            <View style={{ ...styles.row }}>
                                <Text style={{ width: 120 }}>Nombre de nuits</Text>
                                <View style={{ ...styles.box, width: 40, marginRight: 10 }}>{data?.nuitsNord && <Text>{String(data.nuitsNord)}</Text>}</View>
                                <View style={{ ...styles.box, width: 40 }}>{data?.nuitsSud && <Text>{String(data.nuitsSud)}</Text>}</View>
                            </View>
                        </View>
                    }
                    right={
                        <View>
                            <Text style={{ ...styles.bold, marginBottom: 4 }}>Non</Text>
                            <View style={{ ...styles.row, marginBottom: 6 }}>
                                <Text style={{ width: 60 }}>Nord</Text>
                                <Text style={{ width: 60 }}>Sud</Text>
                            </View>
                            <View style={{ ...styles.row, marginBottom: 4 }}>
                                <Text style={{ width: 120 }}>Nombre de repas</Text>
                                <View style={{ ...styles.box, width: 40 }} />
                                <View style={{ ...styles.box, width: 40, marginLeft: 10 }} />
                            </View>
                            <View style={{ ...styles.row }}>
                                <Text style={{ width: 120 }}>Nombre de nuits</Text>
                                <View style={{ ...styles.box, width: 40 }} />
                                <View style={{ ...styles.box, width: 40, marginLeft: 10 }} />
                            </View>
                        </View>
                    }
                />
            </View>

            {/* Frais de transport et total */}
            <View style={{ ...styles.section, ...styles.borderBox, padding: 8 }}>
                <View style={{ ...styles.row, marginBottom: 6 }}>
                    <Text style={{ ...styles.label, marginRight: 8 }}>Frais de transports engagés</Text>
                    <View style={{ ...styles.box, width: 120 }}>{data?.fraisTransport && <Text>{String(data.fraisTransport)}</Text>}</View>
                    <Text style={{ marginLeft: 6 }}>DA</Text>
                </View>
                <View style={{ ...styles.row }}>
                    <Text style={{ ...styles.label, marginRight: 8, fontWeight: 700 }}>Montant Total</Text>
                    <View style={{ ...styles.box, width: 160 }}>{data?.montantTotal && <Text>{String(data.montantTotal)}</Text>}</View>
                    <Text style={{ marginLeft: 6 }}>DA</Text>
                </View>
            </View>

            {/* Signature area */}
            <View style={{ ...styles.section, flexDirection: 'row', gap: 10 }}>
                <View style={{ ...styles.borderBox, padding: 6, flex: 1 }}>
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Validation par le Chef de Service</Text>
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Paie et Prestation Sociales</Text>
                    <View style={{ height: 40 }} />
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Date / Cachet et signature</Text>
                </View>
                <View style={{ ...styles.borderBox, padding: 6, flex: 1 }}>
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Vérification et prise en charge</Text>
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>par le responsable RH</Text>
                    <View style={{ height: 40 }} />
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Date / Cachet et signature</Text>
                </View>
                <View style={{ ...styles.borderBox, padding: 6, flex: 1 }}>
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Le Responsable de l'entité</Text>
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Déclare avoir ordonné le paiement</Text>
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>de l'indemnité de frais de mission</Text>
                    <View style={{ height: 28 }} />
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Date / Cachet et signature</Text>
                </View>
            </View>

            {/* Optional pseudo-stamp (visual balance) */}
            <View style={{ position: 'absolute', right: 36, bottom: 56, width: 120, height: 120, border: 2, borderColor: '#7aa5cd', borderRadius: 60, opacity: 0.25 }} />
        </Page>
    </Document>
);

export default DecompteDocument;
