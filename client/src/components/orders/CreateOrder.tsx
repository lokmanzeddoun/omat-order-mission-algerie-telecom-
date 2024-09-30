import React, { useEffect, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { AppDispatch } from 'store';

const directions = ['NORD', 'SUD'];
interface MissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MissionData) => void;
  isEdit?: boolean;
  initialData?: MissionData; // Initial data for edit mode
}
// Your transport options
const transports = [
  'Véhicule de service',
  'Autre moyens de transport  dont les dépenses sont  prises en charge par l’entreprise',
  'Moyens de transport   dont les dépenses sont prises en charge par le travailleur',
  'Utilisation exceptionnel du véhicule Personnel, à la demande de la hiérarchie',
];
const transportMapping = {
  'Véhicule de service': TransportType.service,
  'Autre moyens de transport  dont les dépenses sont  prises en charge par l’entreprise':
    TransportType.entreprise,
  'Moyens de transport   dont les dépenses sont prises en charge par le travailleur':
    TransportType.employee,
  'Utilisation exceptionnel du véhicule Personnel, à la demande de la hiérarchie':
    TransportType.personal,
};
interface MissionData {
  date_sortie: string; // Date of departure
  heure_sortie: string; // Time of departure
  date_retour: string; // Date of return
  heure_retour: string; // Time of return
  motif: string; // Reason for the mission
  transport: TransportType | string; // Mode of transportation (e.g., car, flight, train)
  Destination: string; // Destination location
  direction: Direction; // Destination location
}

const MissionModal: React.FC<MissionModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const initialFormData: MissionData = initialData || {
    date_sortie: '',
    heure_sortie: '',
    date_retour: '',
    heure_retour: '',
    motif: '',
    transport: '',
    Destination: '',
    direction: Direction.nord,
  };

  const [formData, setFormData] = useState<MissionData>(initialFormData);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData(initialData);
    }
  }, [isEdit, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Map transport value or keep the input value
    // const mappedValue = name === 'transport' ? transportMapping[value] || value : value;
    console.log(value);
    setFormData({
      ...formData,
      [name]: value, // Only update the specific field being changed
    });
  };

  const handleSubmit = () => {
    const date1 = new Date(formData.date_retour);
    const date2 = new Date(formData.date_sortie);
    if (Math.abs(date2.getTime() - date1.getTime()) < 0) {
      dispatch(
        setAlert({ msg: 'Date De Retour est grand quand Date Depart', type: AlertTypes.ERROR }),
      );
    }
    const mappedValue = transportMapping[formData.transport as keyof typeof transportMapping];
    const newFormData = { ...formData, transport: mappedValue };
    onSubmit(newFormData); // Send the entire formData for both create and edit
    onClose(); // Close the modal
    setFormData(initialFormData); // Reset form after submission
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editer Mission' : 'Ajouter Nouvelle Mission'}</DialogTitle>
      <DialogContent>
        <Stack component="form" mt={3} direction="column" gap={2}>
          {/* Date de Sortie */}
          <TextField
            name="date_sortie"
            label="Date Depart"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={formData.date_sortie}
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
          />

          {/* Motif */}
          <TextField
            name="motif"
            fullWidth
            variant="filled"
            placeholder="Entrez le Motif"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon="mdi:reason" />
                </InputAdornment>
              ),
            }}
            value={formData.motif}
            onChange={handleChange}
          />

          {/* Transport */}
          <TextField
            name="transport"
            variant="filled"
            fullWidth
            disabled={isEdit} // Disable if editing
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
            name="Destination"
            fullWidth
            variant="filled"
            placeholder="Entrez la Destination"
            value={formData.Destination}
            onChange={handleChange}
          />
          <TextField
            name="direction"
            variant="filled"
            disabled={isEdit} // Disable if editing
            fullWidth
            margin="none"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon="ri:direction-line" />
                </InputAdornment>
              ),
            }}
            select
            value={formData.direction}
            onChange={handleChange}
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
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        <Button onClick={handleSubmit} color="primary">
          {isEdit ? 'Mettre à Jour' : 'Soumettre'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MissionModal;
