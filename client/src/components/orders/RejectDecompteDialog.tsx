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
  Alert,
} from '@mui/material';

interface RejectDecompteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  decompte: any;
}

const RejectDecompteDialog: React.FC<RejectDecompteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  decompte,
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!message.trim()) {
      setError('Le message de rejet est obligatoire');
      return;
    }
    onConfirm(message.trim());
    setMessage('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setMessage('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rejeter le Décompte</DialogTitle>
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

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Raison du rejet *"
            multiline
            rows={4}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError('');
            }}
            error={!!error}
            placeholder="Veuillez indiquer la raison du rejet (ex: Pièces justificatives manquantes, montant incorrect, etc.)"
            fullWidth
            required
          />

          <Typography variant="body2" color="error.main">
            Attention: Cette action créera un commentaire visible par l'utilisateur.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Annuler
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          Rejeter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectDecompteDialog;
