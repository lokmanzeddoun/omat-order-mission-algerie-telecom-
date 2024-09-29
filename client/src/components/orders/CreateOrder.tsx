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
import IconifyIcon from 'components/base/IconifyIcon';
import { TransportType } from 'constants/transport';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';

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
  transport: TransportType; // Mode of transportation (e.g., car, flight, train)
  Destination: string; // Destination location
}

const MissionModal: React.FC<MissionModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
}) => {
  const initialFormData: MissionData = initialData || {
    date_sortie: '',
    heure_sortie: '',
    date_retour: '',
    heure_retour: '',
    motif: '',
    transport: TransportType.personal,
    Destination: '',
  };

  const [formData, setFormData] = useState<MissionData>(initialFormData);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData(initialData);
    }
  }, [isEdit, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(value);
    const mappedValue = transportMapping[value] || value; // Default to value if not found in mapping
    setFormData({
      ...formData,
      [name]: mappedValue, // Update the field based on the input
    });
  };

  const handleSubmit = () => {
    console.log(formData);
    onSubmit(formData); // Send the entire formData for both create and edit
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
            value={formData.transport || ''} // Default value to empty string for placeholder
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
