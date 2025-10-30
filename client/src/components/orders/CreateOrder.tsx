import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
  MenuItem,
  Typography,
} from '@mui/material';
import { Direction } from 'constants/direction';
import IconifyIcon from 'components/base/IconifyIcon';
import { TransportType } from 'constants/transport';
import { useDispatch, useSelector } from 'react-redux';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import moment from 'moment';
import { IMission } from './orderReducer';
import DirectionIcon from 'assets/icons/ri--direction-line.svg?react';
import GoalIcon from 'assets/icons/octicon--goal-16.svg?react';
import DestinationIcon from 'assets/icons/majesticons--map-simple-destination.svg?react';

const directions = ['NORD', 'SUD'];

interface MissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IMission) => void;
  isEdit?: boolean;
  initialData?: IMission;
  readOnly?: boolean;
  // Optional target user context when creating/editing on behalf of a user from Users page
  targetUser?: { matricule: number; nom?: string; prenom?: string };
}

const transports = [
  'Véhicule de service',
  'Autre moyens de transport  dont les dépenses sont prises en charge par l’entreprise',
  'Moyens de transport   dont les dépenses sont prises en charge par le travailleur',
  'Utilisation exceptionnel du véhicule Personnel, à la demande de la hiérarchie',
];

const transportMapping = {
  'Véhicule de service': TransportType.service,
  'Autre moyens de transport  dont les dépenses sont prises en charge par l’entreprise':
    TransportType.entreprise,
  'Moyens de transport   dont les dépenses sont prises en charge par le travailleur':
    TransportType.employee,
  'Utilisation exceptionnel du véhicule Personnel, à la demande de la hiérarchie':
    TransportType.personal,
};

// Reverse mapping: enum value -> human-readable label
const transportLabelByEnum: Record<string, string> = {
  [TransportType.service]: 'Véhicule de service',
  [TransportType.entreprise]:
    'Autre moyens de transport  dont les dépenses sont prises en charge par l’entreprise',
  [TransportType.employee]:
    'Moyens de transport   dont les dépenses sont prises en charge par le travailleur',
  [TransportType.personal]:
    'Utilisation exceptionnel du véhicule Personnel, à la demande de la hiérarchie',
};

const MissionModal: React.FC<MissionModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
  readOnly = false, // Default to false
  targetUser,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((s: RootState) => (s as any).auth?.user);
  const initialFormData: IMission = initialData || {
    date_sortie: '',
    heure_sortie: '',
    date_retour: '',
    heure_retour: '',
    motif: '',
    transport: '',
    destination: '',
    direction: Direction.nord,
  };

  const [formData, setFormData] = useState<IMission>(initialFormData);
  // Determine banner target user (prefer explicit prop, else missionData.user if present, else auth user)
  const bannerTarget = useMemo(() => {
    const missionUser = (initialData as any)?.user as
      | { matricule?: number; nom?: string; prenom?: string }
      | undefined;
    return (
      targetUser ||
      (missionUser && missionUser.matricule
        ? {
            matricule: missionUser.matricule as number,
            nom: missionUser.nom,
            prenom: missionUser.prenom,
          }
        : authUser)
    );
  }, [targetUser, initialData, authUser]);
  const bannerLabel = useMemo(() => {
    if (!bannerTarget) return '';
    const isSelf = authUser && bannerTarget?.matricule === authUser?.matricule;
    if (isSelf) return 'Vous';
    const n = `${bannerTarget?.nom ?? ''} ${bannerTarget?.prenom ?? ''}`.trim();
    return n || `#${bannerTarget?.matricule}`;
  }, [bannerTarget, authUser]);

  useEffect(() => {
    if (isEdit && initialData) {
      // Determine transport label for display if value is an enum
      const incomingTransport = initialData.transport;
      const asLabel = transports.includes(incomingTransport as any)
        ? (incomingTransport as string)
        : transportLabelByEnum[incomingTransport as keyof typeof transportLabelByEnum] || '';

      setFormData({
        ...initialData,
        // Use human-readable label for the select
        transport: asLabel,
        date_sortie: initialData.date_sortie
          ? moment(initialData.date_sortie).format('YYYY-MM-DD')
          : '',
        date_retour: initialData.date_retour
          ? moment(initialData.date_retour).format('YYYY-MM-DD')
          : '',
        // Prefill time fields from DateTime if legacy heure_* not present
        heure_sortie:
          initialData.heure_sortie ??
          (initialData.date_sortie ? moment(initialData.date_sortie).format('HH:mm') : ''),
        heure_retour:
          initialData.heure_retour ??
          (initialData.date_retour ? moment(initialData.date_retour).format('HH:mm') : ''),
      });
    }
  }, [isEdit, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Map transport value or keep the input value
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    console.log('Form Data on Submit:', formData);
    e.preventDefault();
    const retourStr = formData.date_retour
      ? `${formData.date_retour}T${(formData.heure_retour || '00:00').trim()}:00`
      : '';
    const sortieStr = `${formData.date_sortie}T${(formData.heure_sortie || '00:00').trim()}:00`;
    const date1 = formData.date_retour ? new Date(retourStr) : null;
    const date2 = new Date(sortieStr);
    // Ensure return date/time is not before departure date/time
    if (date1 && date1.getTime() < date2.getTime()) {
      dispatch(
        setAlert({
          msg: 'La date de retour doit être postérieure à la date de départ',
          type: AlertTypes.ERROR,
        }),
      );
      return;
    }
    const mappedValue = transportMapping[formData.transport as keyof typeof transportMapping];
    const newFormData: IMission = { ...formData, transport: mappedValue };

    if (isEdit) {
      const updatedEntries = (Object.keys(newFormData) as Array<keyof IMission>)
        .filter((key) => newFormData[key] !== initialFormData[key])
        .map((key) => [key, newFormData[key]] as const);
      const updatedData = Object.fromEntries(updatedEntries) as Partial<IMission>;
      updatedData.n_mission = formData.n_mission;
      if (Object.keys(updatedData).length > 0) {
        onSubmit(updatedData as IMission);
      }
    } else {
      onSubmit(newFormData);
    }
    onClose();
    setFormData(initialFormData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editer Mission' : 'Ajouter Nouvelle Mission'}</DialogTitle>
      <DialogContent>
        {/* Target user banner */}
        {bannerLabel ? (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Mission pour:
            </Typography>
            <Typography variant="body2" color="primary" fontWeight={600}>
              {bannerLabel}
            </Typography>
          </Stack>
        ) : null}
        <Stack
          component="form"
          mt={3}
          id="mission-form"
          direction="column"
          onSubmit={handleSubmit}
          gap={2}
        >
          {/* Date de Sortie */}
          <TextField
            name="date_sortie"
            label="Date Depart"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={formData.date_sortie}
            onChange={readOnly ? undefined : handleChange} // Prevent change if read-only
            InputProps={{ readOnly }} // Make field read-only
          />

          {/* Heure de Sortie */}
          <TextField
            name="heure_sortie"
            label="Heure Depart"
            type="time"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={formData.heure_sortie}
            onChange={readOnly ? undefined : handleChange}
            InputProps={{ readOnly }}
          />

          {/* Date de Retour */}
          <TextField
            id="date"
            name="date_retour"
            label="Date Retour"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={formData.date_retour}
            onChange={readOnly ? undefined : handleChange}
            InputProps={{ readOnly }}
          />

          {/* Heure de Retour */}
          <TextField
            name="heure_retour"
            label="Heure Retour"
            type="time"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={formData.heure_retour}
            onChange={readOnly ? undefined : handleChange}
            InputProps={{ readOnly }}
          />

          {/* Motif */}
          <TextField
            name="motif"
            fullWidth
            variant="filled"
            required
            placeholder="Entrez le Motif"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={GoalIcon} />
                </InputAdornment>
              ),
              readOnly, // Make field read-only
            }}
            value={formData.motif}
            onChange={readOnly ? undefined : handleChange}
          />

          <TextField
            name="transport"
            variant="filled"
            fullWidth
            select
            value={formData.transport} // value is the human-readable label
            onChange={readOnly ? undefined : handleChange}
            disabled={readOnly}
            sx={{
              '& .MuiSelect-select span::before': {
                content: "'-- Choisir La Méthode De Transport --'",
              },
            }}
          >
            {/* Map the transport options */}
            {transports.map((transport) => (
              <MenuItem key={transport} value={transport}>
                {transport}
              </MenuItem>
            ))}
          </TextField>

          {/* Destination */}
          <TextField
            name="destination"
            fullWidth
            variant="filled"
            required
            placeholder="Entrez la Destination"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={DestinationIcon} />
                </InputAdornment>
              ),
              readOnly,
            }}
            value={formData.destination}
            onChange={readOnly ? undefined : handleChange}
          />

          <TextField
            name="direction"
            variant="filled"
            fullWidth
            margin="none"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={DirectionIcon} />
                </InputAdornment>
              ),
              readOnly,
            }}
            select
            value={formData.direction}
            onChange={readOnly ? undefined : handleChange}
            sx={{ width: 230 }}
          >
            {directions.map((direction) => (
              <MenuItem key={direction} value={direction}>
                {direction}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="submit" form="mission-form" color="primary" disabled={readOnly}>
          {isEdit ? 'Mettre à Jour' : 'Soumettre'}
        </Button>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MissionModal;