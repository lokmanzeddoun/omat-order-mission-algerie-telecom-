import { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Divider,
  Box,
  Stack,
  Chip,
  Button,
} from '@mui/material';
import { Comment as CommentIcon, Add as AddIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { fetchUserDecompte, addCommentToDecompte } from './decompte.thunk';
import dayjs from 'helpers/date';
import ViewCommentsDialog from './ViewCommentsDialog';
import AddCommentDialog from './AddCommentDialog';

const DecompteCommentsButton = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDecompte, setSelectedDecompte] = useState<any>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [addCommentDialogOpen, setAddCommentDialogOpen] = useState(false);

  const { decomptes, loading } = useSelector((state: RootState) => state.decompte);
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (token) {
      dispatch(fetchUserDecompte(token));
    }
  }, [dispatch, token]);

  // Count decomptes with messages (comments)
  const decompteWithComments = decomptes.filter(
    (d) => d.messages && d.messages.length > 0
  );

  // Count rejected and accepted decomptes (note: backend uses REGECTED typo)
  const rejectedCount = decomptes.filter((d) => d.status === 'REGECTED').length;
  const acceptedCount = decomptes.filter((d) => d.status === 'ACCEPTED').length;
  const totalNotifications = rejectedCount + acceptedCount;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewComments = (decompte: any) => {
    setSelectedDecompte(decompte);
    setCommentsDialogOpen(true);
    handleClose();
  };

  const handleAddComment = () => {
    setAddCommentDialogOpen(true);
    handleClose();
  };

  const handleSubmitComment = async (comment: { title: string; type: string; decompteId?: number }) => {
    await dispatch(addCommentToDecompte(comment, token));
    setAddCommentDialogOpen(false);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          onClick={handleClick}
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Badge badgeContent={totalNotifications} color="error">
            <CommentIcon />
          </Badge>
        </IconButton>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddComment}
          size="medium"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          Ajouter Commentaire
        </Button>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 400,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="h6" fontWeight={600}>
            État des Décomptes
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              label={`${acceptedCount} Accepté${acceptedCount > 1 ? 's' : ''}`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${rejectedCount} Rejeté${rejectedCount > 1 ? 's' : ''}`}
              size="small"
              color="error"
              variant="outlined"
            />
          </Stack>
        </Box>
        <Divider />

        {loading ? (
          <MenuItem disabled>
            <ListItemText primary="Chargement..." />
          </MenuItem>
        ) : decompteWithComments.length === 0 ? (
          <MenuItem disabled>
            <ListItemText
              primary="Aucun commentaire"
              secondary="Pas de commentaires disponibles"
            />
          </MenuItem>
        ) : (
          decompteWithComments.map((decompte) => {
            const lastMessage = decompte.messages?.[decompte.messages.length - 1];
            const statusColor =
              decompte.status === 'ACCEPTED'
                ? 'success'
                : decompte.status === 'REGECTED'
                  ? 'error'
                  : 'default';

            return (
              <MenuItem
                key={decompte.n_decompte}
                onClick={() => handleViewComments(decompte)}
                sx={{ py: 1.5 }}
              >
                <Stack spacing={0.5} width={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={600}>
                      Décompte N° {decompte.n_decompte}
                    </Typography>
                    <Chip
                      label={decompte.status === 'ACCEPTED' ? 'Accepté' : decompte.status === 'REGECTED' ? 'Rejeté' : decompte.status}
                      size="small"
                      color={statusColor}
                    />
                  </Stack>
                  {lastMessage && (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {lastMessage.title}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {dayjs(lastMessage.createdAt).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </>
                  )}
                  <Typography variant="caption" color="primary">
                    {decompte.messages?.length || 0} commentaire{(decompte.messages?.length || 0) > 1 ? 's' : ''}
                  </Typography>
                </Stack>
              </MenuItem>
            );
          })
        )}

        {decompteWithComments.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button fullWidth size="small" onClick={handleClose}>
                Fermer
              </Button>
            </Box>
          </>
        )}
      </Menu>

      {selectedDecompte && (
        <ViewCommentsDialog
          open={commentsDialogOpen}
          onClose={() => {
            setCommentsDialogOpen(false);
            setSelectedDecompte(null);
          }}
          decompte={selectedDecompte}
        />
      )}

      <AddCommentDialog
        open={addCommentDialogOpen}
        onClose={() => setAddCommentDialogOpen(false)}
        onSubmit={handleSubmitComment}
        decomptes={decomptes}
      />
    </>
  );
};

export default DecompteCommentsButton;
