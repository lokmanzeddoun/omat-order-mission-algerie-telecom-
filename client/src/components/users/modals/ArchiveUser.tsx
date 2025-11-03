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
  itemName: string | null;
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
          Cette action archivera l'utilisateur. Vous pourrez le consulter dans la section "Archives".
        </Alert>
        <Box>
          <Typography variant="body1" gutterBottom>
            Êtes-vous sûr de vouloir archiver l'utilisateur{' '}
            {itemName ? <strong>"{itemName}"</strong> : 'cet utilisateur'} ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            L'utilisateur archivé ne pourra plus se connecter ni effectuer d'actions, mais toutes
            ses données et son historique seront préservés dans les archives.
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
