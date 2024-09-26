import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface ConfirmDeletionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string | null; // Optional: The name of the item to delete
}

const ConfirmDeletionModal: React.FC<ConfirmDeletionModalProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirmation de Suppression</DialogTitle>
      <DialogContent>
        <Typography>
          Êtes-vous sûr de vouloir supprimer {itemName ? `“${itemName}”` : 'cet élément'} ? Cette
          action est irréversible.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        <Button onClick={onConfirm} color="error">
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeletionModal;
