import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  Tabs,
  Tab,
  Box,
  MenuItem,
  Typography,
} from '@mui/material';
import { IDecompte } from './decompte.reducer';

interface AddCommentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: { title: string; type: string; decompteId?: number }) => void;
  decomptes: IDecompte[];
}

const AddCommentDialog: React.FC<AddCommentDialogProps> = ({
  open,
  onClose,
  onSubmit,
  decomptes,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [selectedDecompte, setSelectedDecompte] = useState<number | ''>('');
  const [error, setError] = useState('');

  // Filter decomptes to show only rejected ones
  const rejectedDecomptes = decomptes.filter((d) => d.status === 'REGECTED');

  const handleSubmit = () => {
    setError('');

    if (!commentText.trim()) {
      setError('Veuillez saisir un commentaire');
      return;
    }

    if (tabValue === 1 && !selectedDecompte) {
      setError('Veuillez sélectionner un décompte');
      return;
    }

    const comment: { title: string; type: string; decompteId?: number } = {
      title: commentText.trim(),
      type: tabValue === 0 ? 'OTHER' : 'DECOMPTE_STATUS',
    };

    if (tabValue === 1 && selectedDecompte) {
      comment.decompteId = selectedDecompte as number;
    }

    onSubmit(comment);

    // Reset form
    setCommentText('');
    setSelectedDecompte('');
    setTabValue(0);
    onClose();
  };

  const handleClose = () => {
    setError('');
    setCommentText('');
    setSelectedDecompte('');
    setTabValue(0);
    onClose();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter un Commentaire</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="comment tabs">
            <Tab label="Commentaire Général" />
            <Tab label="Commentaire sur Décompte" />
          </Tabs>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box>
            {tabValue === 0 ? (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Posez vos questions générales ou signalez un problème
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Votre commentaire"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Décrivez votre question ou problème..."
                  helperText={`${commentText.length}/500 caractères`}
                  inputProps={{ maxLength: 500 }}
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Commentez sur un décompte rejeté
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Sélectionner un décompte rejeté"
                  value={selectedDecompte}
                  onChange={(e) => setSelectedDecompte(Number(e.target.value))}
                  helperText="Choisissez le décompte rejeté pour lequel vous souhaitez ajouter un commentaire"
                >
                  {rejectedDecomptes.length === 0 ? (
                    <MenuItem disabled>Aucun décompte rejeté disponible</MenuItem>
                  ) : (
                    rejectedDecomptes.map((decompte) => (
                      <MenuItem key={decompte.n_decompte} value={decompte.n_decompte}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography>Décompte N° {decompte.n_decompte}</Typography>
                          <Typography variant="caption" color="error">
                            (Rejeté)
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))
                  )}
                </TextField>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Votre commentaire"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Expliquez pourquoi vous contestez ce rejet ou demandez des clarifications..."
                  helperText={`${commentText.length}/500 caractères`}
                  inputProps={{ maxLength: 500 }}
                />
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!commentText.trim() || (tabValue === 1 && !selectedDecompte)}
        >
          Envoyer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCommentDialog;
