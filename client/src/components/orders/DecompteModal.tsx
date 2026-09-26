import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Chip,
} from '@mui/material';
import dayjs from 'helpers/date';
import { IMission } from './orderReducer';
import { calculateMealsAndAccommodation } from 'helpers/utils';

export interface IDecompte {
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
  isEdit?: boolean;
  initialData?: IDecompte;
  readOnly?: boolean;
  order: IMission;
}

const normalizeDateValue = (value: unknown): string => {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const parsed = dayjs(raw, 'YYYY-MM-DD', true);
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
  const fallback = dayjs(raw);
  return fallback.isValid() ? fallback.format('YYYY-MM-DD') : '';
};

const normalizeTimeValue = (value: unknown): string => {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const [hours = '', minutes = '', seconds = ''] = raw.split(':');
  if (!hours) return '';
  const paddedHours = hours.padStart(2, '0');
  const paddedMinutes = (minutes || '00').padStart(2, '0');
  return seconds
    ? `${paddedHours}:${paddedMinutes}:${seconds.padStart(2, '0')}`
    : `${paddedHours}:${paddedMinutes}`;
};

const buildDecompteFormData = (order: IMission, base?: IDecompte): IDecompte => ({
  heure_sortie: normalizeTimeValue(
    base?.heure_sortie ??
      order?.heure_sortie ??
      (order?.date_sortie ? dayjs(order.date_sortie).format('HH:mm') : ''),
  ),
  date_retour: normalizeDateValue(base?.date_retour ?? order?.date_retour),
  heure_retour: normalizeTimeValue(
    base?.heure_retour ??
      order?.heure_retour ??
      (order?.date_retour ? dayjs(order.date_retour).format('HH:mm') : ''),
  ),
  hebergement_sans_pec: base?.hebergement_sans_pec,
  repas_sans_pec: base?.repas_sans_pec,
  repas_pec: base?.repas_pec,
  hebergement_pec: base?.hebergement_pec,
  distance_km: base?.distance_km,
  transport_cost: base?.transport_cost,
});

const DecompteModal: React.FC<DecompteModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
  order,
  readOnly = false,
}) => {
  const [formData, setFormData] = useState<IDecompte>(() => buildDecompteFormData(order, initialData));
  const [hebergement, setHebergement] = useState(0);
  const [repas, setRepas] = useState(0);
  const [errors, setErrors] = useState({
    date_retour: false,
    heure_sortie: false,
    heure_retour: false,
    hebergement: false,
    repas: false,
    distance_km: false,
  });

  const missionDepartureDate = useMemo(
    () => normalizeDateValue(order?.date_sortie),
    [order?.date_sortie],
  );

  useEffect(() => {
    const updatedFormData = buildDecompteFormData(order, initialData);
    setFormData(updatedFormData);
    setErrors({
      date_retour: false,
      heure_sortie: false,
      heure_retour: false,
      hebergement: false,
      repas: false,
      distance_km: false,
    });

    if (
      missionDepartureDate &&
      updatedFormData.date_retour &&
      updatedFormData.heure_sortie &&
      updatedFormData.heure_retour
    ) {
      const result = calculateMealsAndAccommodation(
        missionDepartureDate,
        normalizeTimeValue(updatedFormData.heure_sortie),
        normalizeDateValue(updatedFormData.date_retour),
        normalizeTimeValue(updatedFormData.heure_retour),
      );
      setHebergement(result.accommodations);
      setRepas(result.meals);
    } else {
      setHebergement(0);
      setRepas(0);
    }
  }, [isEdit, order, initialData, missionDepartureDate, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = new Set([
      'hebergement_sans_pec',
      'repas_sans_pec',
      'repas_pec',
      'hebergement_pec',
      'distance_km',
      'transport_cost',
    ]);

    const updatedFormData = {
      ...formData,
      [name]: numericFields.has(name)
        ? value === ''
          ? undefined
          : Number(value)
        : value,
    } as IDecompte;

    setFormData(updatedFormData);
    setErrors((prev) => ({
      ...prev,
      [name]: false,
    }));

    if (['heure_sortie', 'heure_retour', 'date_retour'].includes(name)) {
      if (
        missionDepartureDate &&
        updatedFormData.heure_sortie &&
        updatedFormData.date_retour &&
        updatedFormData.heure_retour
      ) {
        const result = calculateMealsAndAccommodation(
          missionDepartureDate,
          normalizeTimeValue(updatedFormData.heure_sortie),
          normalizeDateValue(updatedFormData.date_retour),
          normalizeTimeValue(updatedFormData.heure_retour),
        );
        setHebergement(result.accommodations);
        setRepas(result.meals);
      } else {
        setHebergement(0);
        setRepas(0);
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const retourMoment = dayjs(formData.date_retour, 'YYYY-MM-DD', true);
    const sortieMoment = missionDepartureDate
      ? dayjs(missionDepartureDate, 'YYYY-MM-DD', true)
      : null;

    const newErrors = {
      date_retour:
        !formData.date_retour ||
        !retourMoment.isValid() ||
        (sortieMoment?.isValid() ? retourMoment.isBefore(sortieMoment) : false),
      heure_sortie: !formData.heure_sortie,
      heure_retour: !formData.heure_retour,
      hebergement:
        (formData.hebergement_sans_pec || 0) + (formData.hebergement_pec || 0) !== hebergement,
      repas: (formData.repas_sans_pec || 0) + (formData.repas_pec || 0) !== repas,
      distance_km: formData.distance_km === undefined || formData.distance_km === null || (typeof formData.distance_km === 'number' && formData.distance_km < 0),
    };

    if (Object.values(newErrors).some(Boolean)) {
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
      distance_km: false,
    });
    setFormData(buildDecompteFormData(order, initialData));
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
          <TextField
            name="date_retour"
            label="Date Retour"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={formData.date_retour}
            onChange={readOnly ? undefined : handleChange}
            InputProps={{ readOnly }}
            error={errors.date_retour}
            helperText={errors.date_retour ? 'Date est obligatoire' : ''}
          />

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
              type="number"
              fullWidth
              variant="outlined"
              value={formData.hebergement_sans_pec ?? ''}
              onChange={readOnly ? undefined : handleChange}
              InputProps={{ readOnly }}
              error={errors.hebergement}
              helperText={errors.hebergement ? `Total hébergement doit être ${hebergement}` : ''}
            />

            <TextField
              name="repas_sans_pec"
              placeholder="Repas sans PEC"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.repas_sans_pec ?? ''}
              onChange={readOnly ? undefined : handleChange}
              InputProps={{ readOnly }}
              error={errors.repas}
              helperText={errors.repas ? `Total repas doit être ${repas}` : ''}
            />
          </Stack>

          <Stack direction="row" gap={2}>
            <TextField
              name="repas_pec"
              placeholder="Repas avec PEC"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.repas_pec ?? ''}
              onChange={readOnly ? undefined : handleChange}
              InputProps={{ readOnly }}
              error={errors.repas}
              helperText={errors.repas ? `Total repas doit être ${repas}` : ''}
            />

            <TextField
              name="hebergement_pec"
              placeholder="Hébergement avec PEC"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.hebergement_pec ?? ''}
              onChange={readOnly ? undefined : handleChange}
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
              value={formData.distance_km ?? ''}
              onChange={readOnly ? undefined : handleChange}
              InputProps={{ readOnly }}
              required
              error={errors.distance_km}
              helperText={errors.distance_km ? 'La distance parcourue est obligatoire' : ''}
            />
            <TextField
              name="transport_cost"
              placeholder="Frais de transport engagés (DA)"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.transport_cost ?? ''}
              onChange={readOnly ? undefined : handleChange}
              InputProps={{ readOnly }}
            />
          </Stack>

          <Stack direction="row" spacing={2} mt={2} alignItems="center" justifyContent="center">
            <Chip label={`Repas disponibles: ${repas}`} color="primary" sx={{ width: '160px' }} />
            <Chip
              label={`Hébergement disponibles: ${hebergement}`}
              color="secondary"
              sx={{ width: '230px' }}
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
