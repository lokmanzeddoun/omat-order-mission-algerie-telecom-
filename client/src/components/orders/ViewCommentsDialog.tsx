import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import moment from 'moment';

interface ViewCommentsDialogProps {
  open: boolean;
  onClose: () => void;
  decompte: any;
}

const ViewCommentsDialog: React.FC<ViewCommentsDialogProps> = ({
  open,
  onClose,
  decompte,
}) => {
  const messages = decompte?.messages || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Commentaires - Décompte N° {decompte?.n_decompte}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              Aucun commentaire disponible
            </Typography>
          ) : (
            messages.map((msg: any, index: number) => (
              <Box key={msg.id || index}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip
                      label={msg.status === 'REJECTED' ? 'Rejeté' : msg.status === 'ACCEPTED' ? 'Accepté' : msg.status}
                      size="small"
                      color={msg.status === 'REJECTED' ? 'error' : msg.status === 'ACCEPTED' ? 'success' : 'default'}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {moment(msg.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                    {msg.user && (
                      <Typography variant="caption" color="text.secondary">
                        par {msg.user.nom} {msg.user.prenom} ({msg.user.role})
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="body1">{msg.title}</Typography>
                </Stack>
                {index < messages.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewCommentsDialog;
