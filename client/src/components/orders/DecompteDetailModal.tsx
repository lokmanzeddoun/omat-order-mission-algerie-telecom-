import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import dayjs from 'helpers/date';
import IconifyIcon from 'components/base/IconifyIcon';
import DestinationIcon from 'assets/icons/majesticons--map-simple-destination.svg?react';
import GoalIcon from 'assets/icons/octicon--goal-16.svg?react';
import DirectionIcon from 'assets/icons/ri--direction-line.svg?react';

interface DecompteDetailModalProps {
  open: boolean;
  onClose: () => void;
  decompte: any;
}

const DecompteDetailModal: React.FC<DecompteDetailModalProps> = ({ open, onClose, decompte }) => {
  if (!decompte) return null;

  const transportMapping: { [key: string]: string } = {
    SERVICE_CAR: 'Véhicule de service',
    TRANSPORT_ENTREPRISE:
      "Autre moyens de transport dont les dépenses sont prises en charge par l'entreprise",
    TRANSPORT_EMPLOYEE: 'Moyens de transport dont les dépenses sont prises en charge par le travailleur',
    PERSONAL_CAR: "Utilisation exceptionnelle du véhicule personnel",
  };

  const statusMap: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default' }> = {
    PENDING: { label: 'En attente', color: 'warning' },
    ACCEPTED: { label: 'Accepté', color: 'success' },
    REGECTED: { label: 'Rejeté', color: 'error' },
  };

  const status = statusMap[decompte.status] || { label: decompte.status, color: 'default' };
  const mission = decompte.mission || {};
  const user = mission.user || {};

  // Calculate mission duration in days
  const calculateDuration = () => {
    if (!mission.date_sortie || !mission.date_retour) return 0;
    const days = Math.ceil(
      (new Date(mission.date_retour).getTime() - new Date(mission.date_sortie).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  const fullName = user ? `${user.nom || ''} ${user.prenom || ''}`.trim() : '';
  const nbrJours = calculateDuration();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={600}>
            Détails du Décompte #{decompte.n_decompte}
          </Typography>
          <Chip label={status.label} size="small" color={status.color} />
        </Box>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Agent: {fullName || '-'} (Matricule: {user.matricule || '-'})
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Decompte Information Section */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Informations du Décompte
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="N° Décompte"
                value={decompte.n_decompte || '-'}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Date Décompte"
                  value={decompte.createdAt ? dayjs(decompte.createdAt).format('DD/MM/YYYY') : '-'}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Durée (jours)"
                  value={nbrJours}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Nom Complet"
                  value={fullName || '-'}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Montant Total"
                  value={decompte.montant != null ? `${decompte.montant.toFixed(2)} DA` : '-'}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>
            </Stack>
          </Box>

          {/* Mission Information Section */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Informations de la Mission
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="N° Mission"
                value={mission.n_mission || '-'}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                label="Motif de Déplacement"
                value={mission.motif || '-'}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconifyIcon icon={GoalIcon} />
                    </InputAdornment>
                  ),
                }}
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Destination"
                value={mission.destination || '-'}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconifyIcon icon={DestinationIcon} />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
              <TextField
                label="Direction"
                value={mission.direction || '-'}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconifyIcon icon={DirectionIcon} />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
              <TextField
                label="Moyen de Transport"
                value={
                  mission.transport
                    ? transportMapping[mission.transport] || mission.transport
                    : '-'
                }
                InputProps={{ readOnly: true }}
                multiline
                rows={2}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Date Sortie"
                  value={
                    mission.date_sortie
                      ? dayjs(mission.date_sortie).format('DD/MM/YYYY')
                      : '-'
                  }
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Heure Sortie"
                  value={
                    mission.date_sortie
                      ? dayjs(mission.date_sortie).format('HH:mm')
                      : '-'
                  }
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Date Retour"
                  value={
                    mission.date_retour
                      ? dayjs(mission.date_retour).format('DD/MM/YYYY')
                      : '-'
                  }
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Heure Retour"
                  value={
                    mission.date_retour
                      ? dayjs(mission.date_retour).format('HH:mm')
                      : '-'
                  }
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>
            </Stack>
          </Box>

          {/* Expenses Section */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Détails des Frais
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Distance Parcours (km)"
                  value={decompte.parcours ?? 0}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">km</InputAdornment>
                  }}
                  fullWidth
                />
                <TextField
                  label="Frais de Transport (DA)"
                  value={'-'}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">DA</InputAdornment>
                  }}
                  helperText="Non disponible dans les données actuelles"
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Repas PEC"
                  value={decompte.repas_pec ?? 0}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Hébergement PEC"
                  value={decompte.hebergement_pec ?? 0}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Repas non PEC"
                  value={decompte.repas_sans_pec ?? 0}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Hébergement non PEC"
                  value={decompte.hebergement_sans_pec ?? 0}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Montant Indemnité Kilométrique (DA)"
                value={'-'}
                InputProps={{
                  readOnly: true,
                  endAdornment: <InputAdornment position="end">DA</InputAdornment>
                }}
                helperText="Calculé automatiquement (non stocké séparément)"
                fullWidth
              />
            </Stack>
          </Box>

          {/* Comments Section */}
          {decompte.messages && decompte.messages.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Commentaires ({decompte.messages.length})
              </Typography>
              <Stack spacing={1.5}>
                {decompte.messages.map((msg: any, idx: number) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(msg.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {msg.content}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DecompteDetailModal;

