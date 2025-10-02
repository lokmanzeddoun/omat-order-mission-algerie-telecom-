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

// Transport labels used in UI
const transports = [
  'Véhicule de service',
  "Autre moyens de transport  dont les dépenses sont prises en charge par l’entreprise",
  'Moyens de transport   dont les dépenses sont prises en charge par le travailleur',
  'Utilisation exceptionnel du véhicule Personnel, à la demande de la hiérarchie',
];

// Map UI label -> API enum
const transportLabelToEnum: Record<string, TransportType> = {
  'Véhicule de service': TransportType.service,
  "Autre moyens de transport  dont les dépenses sont prises en charge par l’entreprise":
    TransportType.entreprise,
  'Moyens de transport   dont les dépenses sont prises en charge par le travailleur':
    TransportType.employee,
  'Utilisation exceptionnel du véhicule Personnel, à la demande de la hiérarchie':
    TransportType.personal,
};

// Map API enum -> UI label
const transportEnumToLabel: Record<TransportType | string, string> = {
  [TransportType.service]: 'Véhicule de service',
  [TransportType.entreprise]:
    "Autre moyens de transport  dont les dépenses sont prises en charge par l’entreprise",
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
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [returnDateError, setReturnDateError] = useState<string | null>(null);

  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

  // Keep a reference to the normalized initial data for comparison
  const [normalizedInitialData, setNormalizedInitialData] = useState<IMission | null>(null);

  useEffect(() => {
    if (isEdit && initialData) {
      const normalized = {
        ...initialData,
        // Ensure dates are in input-friendly format
        date_sortie: initialData.date_sortie
          ? moment(initialData.date_sortie).format('YYYY-MM-DD')
          : '',
        date_retour: initialData.date_retour
          ? moment(initialData.date_retour).format('YYYY-MM-DD')
          : '',
        // Show transport label in the select if backend stores enum
        transport:
          transportEnumToLabel[(initialData.transport as any) || ''] ||
          (initialData.transport || ''),
      };
      setFormData(normalized);
      setNormalizedInitialData(normalized);
    }
  }, [isEdit, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Map transport value or keep the input value
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'destination') {
      setDestinationError(null);
    }
    if (name === 'date_retour' || name === 'heure_retour' || name === 'date_sortie' || name === 'heure_sortie') {
      setReturnDateError(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const departStr = `${formData.date_sortie}T${formData.heure_sortie || '00:00'}:00`;
    const dateDepart = new Date(departStr);
    if (formData.date_retour != null && String(formData.date_retour).trim() !== '') {
      const retourStr = `${formData.date_retour}T${formData.heure_retour || '00:00'}:00`;
      const dateRetour = new Date(retourStr);
      // Business rule (Option B): return must be strictly after depart
      if (!(dateRetour.getTime() > dateDepart.getTime())) {
        const msg =
          'La date/heure de retour doit être strictement postérieure à la date/heure de départ.';
        setReturnDateError(msg);
        dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
        return; // Prevent submission
      }
    }

    // Frontend destination validation (hyphen-separated communes, case-insensitive)
    try {
      const citiesModule = await import('data/algeria_cities.json');
      const cities: Array<{ commune_name_ascii?: string }> = citiesModule.default;
      const set = new Set<string>();
      for (const c of cities) {
        if (c && c.commune_name_ascii) set.add(normalize(c.commune_name_ascii));
      }
      const parts = formData.destination
        .split(/[-–—]/)
        .map((p) => normalize(p))
        .filter((p) => p.length > 0);
      const allValid = parts.length > 0 && parts.every((p) => set.has(p));
      if (!allValid) {
        const msg =
          "Destination invalide. Utilisez des communes valides (commune_name_ascii), séparées par '-'.";
        setDestinationError(msg);
        dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
        return;
      }
    } catch {
      const msg = "Impossible de valider la destination côté client.";
      setDestinationError(msg);
      dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
      return;
    }
    // Normalize transport to API enum value if label is used
    const mappedValue =
      transportLabelToEnum[formData.transport as keyof typeof transportLabelToEnum] || formData.transport;
    const newFormData = { ...formData, transport: mappedValue };

    if (isEdit) {
      const updatedData: Partial<IMission> = {};
      // Use normalizedInitialData instead of initialData for comparison
      const baseline: IMission = normalizedInitialData || initialFormData;

      // Map the baseline transport to enum as well for accurate comparison
      const baselineTransport = transportLabelToEnum[baseline.transport as keyof typeof transportLabelToEnum] || baseline.transport;

      (Object.keys(newFormData) as Array<keyof IMission>).forEach((key) => {
        const newValue = newFormData[key];
        const oldValue = key === 'transport' ? baselineTransport : baseline[key];

        // Compare values, treating empty strings and null/undefined as equivalent
        const isChanged = (newValue || '') !== (oldValue || '');

        if (isChanged) {
          updatedData[key] = newFormData[key] as any;
        }
      });

      updatedData.n_mission = formData.n_mission;

      if (Object.keys(updatedData).length > 1 || (Object.keys(updatedData).length === 1 && 'n_mission' in updatedData)) {
        // Ensure we send at least some updatable field; if only n_mission changed, do nothing
        if (Object.keys(updatedData).some((k) => k !== 'n_mission')) {
          onSubmit(updatedData as IMission);
        } else {
          dispatch(setAlert({ msg: 'Aucune modification détectée', type: AlertTypes.SUCCESS }));
        }
      } else {
        dispatch(setAlert({ msg: 'Aucune modification détectée', type: AlertTypes.SUCCESS }));
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
            error={Boolean(returnDateError)}
            helperText={returnDateError ?? undefined}
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
            error={Boolean(destinationError)}
            helperText={destinationError ?? undefined}
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
