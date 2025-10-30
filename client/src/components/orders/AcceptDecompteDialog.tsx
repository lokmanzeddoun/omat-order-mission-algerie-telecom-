import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
} from '@mui/material';

interface AcceptDecompteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (message?: string) => void;
  decompte: any;
}

const AcceptDecompteDialog: React.FC<AcceptDecompteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  decompte,
}) => {
  const [message, setMessage] = useState('');

  const handleConfirm = () => {
    onConfirm(message.trim() || undefined);
    setMessage('');
    onClose();
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Accepter le Décompte</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Décompte N°: <strong>{decompte?.n_decompte}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mission N°: <strong>{decompte?.mission?.n_mission}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Utilisateur:{' '}
              <strong>
                {decompte?.mission?.user?.nom} {decompte?.mission?.user?.prenom}
              </strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Montant: <strong>{decompte?.montant?.toFixed(2)} DA</strong>
            </Typography>
          </Box>

          <TextField
            label="Message (optionnel)"
            multiline
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ajouter un commentaire d'acceptation..."
            fullWidth
          />

          <Typography variant="body2" color="text.secondary">
            Êtes-vous sûr de vouloir accepter ce décompte ?
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Annuler
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="success">
          Accepter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AcceptDecompteDialog;
