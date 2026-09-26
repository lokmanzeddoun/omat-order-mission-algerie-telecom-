import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Alert,
  Box,
} from '@mui/material';
import { Warning as WarningIcon, Room as DestinationIcon, DirectionsCar as TransportIcon } from '@mui/icons-material';
import dayjs from 'helpers/date';
import { IMission } from './orderReducer';

interface ArchiveMissionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mission: IMission | null;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = dayjs(value);
  if (!date.isValid()) return '-';
  return date.format('DD/MM/YYYY HH:mm');
};

const ArchiveMissionDialog = ({ open, onClose, onConfirm, mission }: ArchiveMissionDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Archiver la Mission
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Cette action archivera la mission. Vous pourrez la consulter dans la section "Archives".
        </Alert>
        {mission && (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Mission N°:</strong> {mission.n_mission}
            </Typography>
            {mission.motif && (
              <Typography variant="body2" color="text.secondary">
                <strong>Motif:</strong> {mission.motif}
              </Typography>
            )}
            {mission.destination && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DestinationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {mission.destination}
                </Typography>
              </Box>
            )}
            {mission.transport && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TransportIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {mission.transport}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              <strong>Date de sortie:</strong> {formatDateTime(mission.date_sortie)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Date de retour:</strong> {formatDateTime(mission.date_retour)}
            </Typography>
          </Stack>
        )}
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

export default ArchiveMissionDialog;
