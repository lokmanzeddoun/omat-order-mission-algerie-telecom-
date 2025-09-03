import React, { FormEvent, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Chip,
  // InputAdornment,
  // MenuItem,
} from '@mui/material';
// import IconifyIcon from 'components/base/IconifyIcon';
// import { useDispatch } from 'react-redux';
// import { setAlert } from 'components/alert/alert.reducer';
// import { AlertTypes } from 'constants/alert';
// import { AppDispatch } from 'store';
import moment from 'moment';
import { IMission } from './orderReducer';
import { calculateMealsAndAccommodation } from 'helpers/utils';
interface IDecompte {
  heure_sortie: string;
  date_retour: string;
  heure_retour: string;
  hebergement_sans_pec?: number;
  repas_sans_pec?: number;
  repas_pec?: number;
  hebergement_pec?: number;
  distance_km?: number;
  transport_cost?: number;
}

interface DecompteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IDecompte) => void;
  isEdit?: boolean; // To identify if it's edit mode
  initialData?: IDecompte; // Initial data for edit mode
  readOnly?: boolean; // New prop to determine if fields should be read-only
  order: IMission;
}

const DecompteModal: React.FC<DecompteModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
  order,
  readOnly = false, // Default to false
}) => {
  // const dispatch = useDispatch<AppDispatch>();
  const initialFormData: IDecompte = initialData || {
    heure_sortie: '',
    date_retour: '',
    heure_retour: '',
    hebergement_sans_pec: undefined,
    repas_sans_pec: undefined,
    repas_pec: undefined,
    hebergement_pec: undefined,
    distance_km: undefined,
    transport_cost: undefined,
  };

  const [formData, setFormData] = useState<IDecompte>(initialFormData);
  const [hebergement, setHebergement] = useState(0);
  const [repas, setRepas] = useState(0);
  const [errors, setErrors] = useState({
    date_retour: false,
    heure_sortie: false,
    heure_retour: false,
    hebergement: false,
    repas: false,
  });

  useEffect(() => {
    const updatedFormData = {
      ...initialData,
      date_retour: moment(order.date_retour).format('YYYY-MM-DD'),
      heure_retour: order.heure_retour,
      heure_sortie: order.heure_sortie,
    };
    setFormData(updatedFormData);
    console.log(updatedFormData);
    setErrors({
      date_retour: false,
      heure_sortie: false,
      heure_retour: false,
      hebergement: false,
      repas: false,
    });
    console.log(order.date_sortie);

    const result = calculateMealsAndAccommodation(
      moment.utc(order.date_sortie).format('YYYY-MM-DD'),
      updatedFormData.heure_sortie,
      updatedFormData.date_retour,
      updatedFormData.heure_retour,
    );

    setHebergement(result.accommodations);
    setRepas(result.meals);
  }, [isEdit, order, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'hebergement_sans_pec',
      'repas_sans_pec',
      'repas_pec',
      'hebergement_pec',
      'distance_km',
      'transport_cost',
    ];

    // Update formData
    const updatedFormData = {
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : value, // Convert to number if it's a numeric field
    };

    // Update state
    setFormData(updatedFormData);
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: false, // Clear the error when field is modified
    }));
    if (['heure_sortie', 'heure_retour', 'date_retour'].includes(name)) {
      const result = calculateMealsAndAccommodation(
        moment.utc(order.date_sortie).format('YYYY-MM-DD'), // Assuming this is fixed
        updatedFormData.heure_sortie,
        updatedFormData.date_retour,
        updatedFormData.heure_retour,
      );

      // Update hebergement and repas state
      setHebergement(result.accommodations);
      setRepas(result.meals);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(moment(formData.date_retour).isBefore(order.date_sortie.split('T')[0]));
    // Error handling logic
    const newErrors = {
      date_retour:
        !formData.date_retour ||
        formData.date_retour === 'Invalid date' ||
        moment(formData.date_retour).isBefore(order.date_sortie.split('T')[0]),
      heure_sortie: !formData.heure_sortie,
      heure_retour: !formData.heure_retour,
      hebergement:
        (formData.hebergement_sans_pec || 0) + (formData.hebergement_pec || 0) !== hebergement,
      repas: (formData.repas_sans_pec || 0) + (formData.repas_pec || 0) !== repas,
    };

    if (Object.values(newErrors).some((err) => err)) {
      setErrors(newErrors);
      return;
    }

    if (isEdit) {
      const updatedData: Partial<IDecompte> = {};

      if (Object.keys(updatedData).length > 0) {
        onSubmit(updatedData as IDecompte);
      }
    } else {
      onSubmit(formData);
    }

    onClose();
    setErrors({
      date_retour: false,
      heure_sortie: false,
      heure_retour: false,
      hebergement: false,
      repas: false,
    });
    // setFormData(initialFormData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editer Mission' : 'Completer Mission'}</DialogTitle>
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
            name="date_retour"
            label="Date Retour"
            type="date"
            fullWidth
            // required
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={formData.date_retour}
            onChange={readOnly ? undefined : handleChange} // Prevent change if read-only
            InputProps={{ readOnly }} // Make field read-only
            error={errors.date_retour}
            helperText={errors.date_retour ? 'Date est obligatoire' : ''}
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
            error={errors.heure_sortie}
            helperText={errors.heure_sortie ? 'Heure de sortie est obligatoire' : ''}
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
            error={errors.heure_retour}
            helperText={errors.heure_retour ? 'Heure de retour est obligatoire' : ''}
          />
          <Stack direction="row" gap={2}>
            <TextField
              name="hebergement_sans_pec"
              placeholder="Hébergement sans PEC"
              type="number" // Change to number
              fullWidth
              variant="outlined"
              value={formData.hebergement_sans_pec || ''} // Ensure it's treated as a number
              onChange={handleChange}
              InputProps={{ readOnly }} // Maintain readOnly functionality
              error={errors.hebergement}
              helperText={errors.hebergement ? `Total hébergement doit être ${hebergement}` : ''}
            />

            <TextField
              name="repas_sans_pec"
              placeholder="Repas sans PEC"
              type="number" // Change to number
              fullWidth
              variant="outlined"
              value={formData.repas_sans_pec || ''} // Ensure it's treated as a number
              onChange={handleChange}
              InputProps={{ readOnly }}
              error={errors.repas}
              helperText={errors.repas ? `Total repas doit être ${repas}` : ''}
            />
          </Stack>

          <Stack direction="row" gap={2}>
            <TextField
              name="repas_pec"
              placeholder="Repas avec PEC"
              type="number" // Change to number
              fullWidth
              variant="outlined"
              value={formData.repas_pec || ''} // Ensure it's treated as a number
              onChange={handleChange}
              InputProps={{ readOnly }}
              error={errors.repas}
              helperText={errors.repas ? `Total repas doit être ${repas}` : ''}
            />

            <TextField
              name="hebergement_pec"
              placeholder="Hébergement avec PEC"
              type="number" // Change to number
              fullWidth
              variant="outlined"
              value={formData.hebergement_pec || ''} // Ensure it's treated as a number
              onChange={handleChange}
              InputProps={{ readOnly }}
              error={errors.hebergement}
              helperText={errors.hebergement ? `Total hébergement doit être ${hebergement}` : ''}
            />
          </Stack>
          <Stack direction="row" gap={2}>
            <TextField
              name="distance_km"
              placeholder="Distance parcourue (KM)"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.distance_km || ''}
              onChange={handleChange}
              InputProps={{ readOnly }}
            />
            <TextField
              name="transport_cost"
              placeholder="Frais de transport engagés (DA)"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.transport_cost || ''}
              onChange={handleChange}
              InputProps={{ readOnly }}
            />
          </Stack>
          {/* Display calculated chips */}
          <Stack
            direction="row"
            spacing={2}
            mt={2}
            alignItems="center" // Centers vertically
            justifyContent="center"
          >
            <Chip
              label={`Repas disponibles: ${repas}`}
              color="primary"
              sx={{ width: '160px' }} // Set custom width here
            />
            <Chip
              label={`Hébergement disponibles: ${hebergement}`}
              color="secondary"
              sx={{ width: '230px' }} // Set custom width here
            />
          </Stack>
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

export default DecompteModal;
