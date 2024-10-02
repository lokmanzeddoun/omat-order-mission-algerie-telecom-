import React, { FormEvent, useEffect, useState } from 'react';
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
} from '@mui/material';
import { Direction } from 'constants/direction';
import IconifyIcon from 'components/base/IconifyIcon';
import { TransportType } from 'constants/transport';
import { useDispatch } from 'react-redux';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';
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
  isEdit?: boolean; // To identify if it's edit mode
  initialData?: IMission; // Initial data for edit mode
  readOnly?: boolean; // New prop to determine if fields should be read-only
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

const MissionModal: React.FC<MissionModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
  readOnly = false, // Default to false
}) => {
  const dispatch = useDispatch<AppDispatch>();
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

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        ...initialData,
        date_sortie: moment(initialData.date_sortie).format('YYYY-MM-DD'),
        date_retour: moment(initialData.date_retour).format('YYYY-MM-DD'),
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
    e.preventDefault();
    const date1 = new Date(formData.date_retour);
    const date2 = new Date(formData.date_sortie);
    if (Math.abs(date2.getTime() - date1.getTime()) < 0) {
      dispatch(
        setAlert({ msg: 'Date De Retour est grand quand Date Depart', type: AlertTypes.ERROR }),
      );
    }
    const mappedValue = transportMapping[formData.transport as keyof typeof transportMapping];
    const newFormData = { ...formData, transport: mappedValue };

    if (isEdit) {
      const updatedData: Partial<IMission> = {};
      Object.keys(newFormData).forEach((key) => {
        if (newFormData[key] !== initialFormData[key as keyof IMission]) {
          updatedData[key as keyof IMission] = newFormData[key as keyof IMission];
        }
      });
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
            value={formData.transport} // Default value to empty string for placeholder
            onChange={handleChange}
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
