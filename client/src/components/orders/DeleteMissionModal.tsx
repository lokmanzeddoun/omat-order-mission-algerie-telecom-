import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  ButtonProps,
} from '@mui/material';

interface ItemSummary {
  title?: string;
  motif?: string;
  destination?: string;
}

interface ConfirmDeletionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: ItemSummary | null;
  title?: string;
  message?: string;
  confirmText?: string;
  confirmColor?: ButtonProps['color'];
}

const ConfirmDeletionModal: React.FC<ConfirmDeletionModalProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
  title,
  message,
  confirmText,
  confirmColor = 'error',
}) => {
  const defaultTitle = "Confirmation d'annulation";
  const resolvedTitle = title ?? defaultTitle;

  const missionLabel = itemName?.title ?? itemName?.motif ?? 'cette mission';
  const destinationLabel = itemName?.destination ?? (itemName as any)?.Destination;

  const defaultMessage = destinationLabel
    ? `Êtes-vous sûr de vouloir annuler “${missionLabel}” ? Cette mission a ${destinationLabel}.`
    : `Êtes-vous sûr de vouloir annuler “${missionLabel}” ?`;

  const resolvedMessage = message ?? defaultMessage;
  const resolvedConfirmText = confirmText ?? 'Continuer';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{resolvedTitle}</DialogTitle>
      <DialogContent>
        <Typography>{resolvedMessage}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        <Button onClick={onConfirm} color={confirmColor}>
          {resolvedConfirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeletionModal;
