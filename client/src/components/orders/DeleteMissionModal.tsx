import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { MissionData } from './CreateOrder';

interface ConfirmDeletionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: MissionData; // Optional: The name of the item to delete
}

const ConfirmDeletionModal: React.FC<ConfirmDeletionModalProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirmation d'Annulation</DialogTitle>
      <DialogContent>
        <Typography>
          Êtes-vous sûr de vouloir Demander Annuler{' '}
          {itemName ? `“${itemName.motif}”` : 'cet mission'} ? Cette Mission a{' '}
          {itemName.Destination}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        <Button onClick={onConfirm} color="error">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeletionModal;
