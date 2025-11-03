import React from 'react';
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
import { Archive as ArchiveIcon } from '@mui/icons-material';

interface ConfirmDeletionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string | null; // Optional: The name of the item to archive
}

const ConfirmDeletionModal: React.FC<ConfirmDeletionModalProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ArchiveIcon color="warning" />
        Confirmation d'Archivage
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Cette action archivera la structure. Vous pourrez la consulter dans la section "Archives".
        </Alert>
        <Box>
          <Typography variant="body1" gutterBottom>
            Êtes-vous sûr de vouloir archiver la structure{' '}
            {itemName ? <strong>"{itemName}"</strong> : 'cette structure'} ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Les utilisateurs associés à cette structure pourront toujours être consultés, mais la
            structure ne sera plus active pour de nouvelles assignations.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" variant="outlined">
          Annuler
        </Button>
        <Button onClick={onConfirm} color="warning" variant="contained" startIcon={<ArchiveIcon />}>
          Archiver
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeletionModal;
