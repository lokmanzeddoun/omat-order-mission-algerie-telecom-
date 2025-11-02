import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ArchiveDecompteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  decompte: any;
}

const ArchiveDecompteDialog = ({ open, onClose, onConfirm, decompte }: ArchiveDecompteDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Archiver le Décompte
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Cette action archivera le décompte. Vous pourrez le consulter dans la section "Archives".
        </Alert>
        <Box>
          <Typography variant="body1" gutterBottom>
            Êtes-vous sûr de vouloir archiver ce décompte ?
          </Typography>
          {decompte && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>N° Décompte:</strong> {decompte.n_decompte}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>N° Mission:</strong> {decompte.mission?.n_mission}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Utilisateur:</strong>{' '}
                {decompte.mission?.user
                  ? `${decompte.mission.user.nom} ${decompte.mission.user.prenom}`
                  : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Montant:</strong> {decompte.montant?.toFixed(2)} DA
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="warning">
          Archiver
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveDecompteDialog;
