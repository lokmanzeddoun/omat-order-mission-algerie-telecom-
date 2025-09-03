import React from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import DecomptePdf from './DecomptePdf';
import { IMission } from './orderReducer';
import { IDecompte } from './decompte.reducer';

interface Props {
    open: boolean;
    onClose: () => void;
    mission: IMission;
    decompte: IDecompte;
    user?: { matricule?: number; nom?: string; prenom?: string; grade?: string; structure?: string };
}

const DecomptePdfPreview: React.FC<Props> = ({ open, onClose, mission, decompte, user }) => {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>
                Prévisualisation du Décompte
                <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ height: '80vh' }}>
                <Stack direction="row" justifyContent="flex-end" mb={1}>
                    <PDFDownloadLink
                        document={<DecomptePdf mission={mission} decompte={decompte} user={user} />}
                        fileName={`decompte_${mission.n_mission}.pdf`}
                    >
                        {({ loading }: { loading: boolean }) => (
                            <Button variant="contained" size="small" disabled={loading}>
                                {loading ? 'Préparation…' : 'Télécharger PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </Stack>
                <PDFViewer width="100%" height="100%">
                    <DecomptePdf mission={mission} decompte={decompte} user={user} />
                </PDFViewer>
            </DialogContent>
        </Dialog>
    );
};

export default DecomptePdfPreview;
