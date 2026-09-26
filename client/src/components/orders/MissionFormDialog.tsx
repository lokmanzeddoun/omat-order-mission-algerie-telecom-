import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RootState } from 'store/rootReducer';
import dayjs from 'helpers/date';
import { Button, Dialog, Field, FormGrid, Input, Select, Textarea } from 'components/ui';
import { directionLabels, transportLabels } from 'constants/labels';
import type { IMission } from './orderReducer';

export type MissionFormMode = 'create' | 'edit' | 'view';

// Mirrors the server's CreateMissionDto so errors are caught before submitting.
const schema = z
  .object({
    date_sortie: z.string().min(1, 'La date de départ est obligatoire.'),
    heure_sortie: z.string(),
    date_retour: z.string(),
    heure_retour: z.string(),
    motif: z.string().trim().min(1, 'Le motif est obligatoire.'),
    destination: z.string().trim().min(2, 'La destination doit contenir au moins 2 caractères.'),
    transport: z.string().min(1, 'Choisissez un moyen de transport.'),
    direction: z.string().min(1),
  })
  .refine(
    (v) => {
      if (!v.date_retour) return true;
      const start = dayjs(`${v.date_sortie}T${v.heure_sortie || '00:00'}`);
      const end = dayjs(`${v.date_retour}T${v.heure_retour || '00:00'}`);
      return !end.isBefore(start);
    },
    { path: ['date_retour'], message: 'Le retour doit être postérieur au départ.' },
  );

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  date_sortie: '',
  heure_sortie: '',
  date_retour: '',
  heure_retour: '',
  motif: '',
  destination: '',
  transport: '',
  direction: 'NORD',
};

const toForm = (m: IMission): FormValues => ({
  date_sortie: m.date_sortie ? dayjs(m.date_sortie).format('YYYY-MM-DD') : '',
  heure_sortie: m.heure_sortie ?? (m.date_sortie ? dayjs(m.date_sortie).format('HH:mm') : ''),
  date_retour: m.date_retour ? dayjs(m.date_retour).format('YYYY-MM-DD') : '',
  heure_retour: m.heure_retour ?? (m.date_retour ? dayjs(m.date_retour).format('HH:mm') : ''),
  motif: m.motif ?? '',
  destination: m.destination ?? '',
  transport: m.transport ?? '',
  direction: m.direction ?? 'NORD',
});

const titles: Record<MissionFormMode, string> = {
  create: 'Nouvel ordre de mission',
  edit: 'Modifier l’ordre de mission',
  view: 'Ordre de mission',
};

export interface MissionTarget {
  matricule: number;
  nom?: string;
  prenom?: string;
}

interface Props {
  open: boolean;
  mode: MissionFormMode;
  initial?: IMission | null;
  /** Agent the ordre is created for (defaults to the signed-in user). */
  target?: MissionTarget | null;
  onClose: () => void;
  /** Receives date/heure as separate fields, as the order thunks expect. */
  onSubmit: (mission: IMission) => Promise<unknown> | void;
}

export default function MissionFormDialog({ open, mode, initial, target, onClose, onSubmit }: Props) {
  const me = useSelector((s: RootState) => s.auth.user) as IUser | null;
  const readOnly = mode === 'view';
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(initial ? toForm(initial) : EMPTY);
  }, [open, initial, reset]);

  const owner =
    target ?? ((initial as IMission & { user?: MissionTarget })?.user as MissionTarget | undefined) ?? me ?? null;
  const ownerLabel = owner
    ? owner.matricule === me?.matricule
      ? 'vous-même'
      : `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim() || `matricule ${owner.matricule}`
    : '';

  const submit = handleSubmit(async (v) => {
    await onSubmit({
      ...(initial?.n_mission ? { n_mission: initial.n_mission } : {}),
      ...v,
      date_retour: v.date_retour || undefined,
      direction: v.direction as IMission['direction'],
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={titles[mode]}
      description={ownerLabel ? `Agent concerné : ${ownerLabel}` : undefined}
      footer={
        readOnly ? (
          <Button onClick={onClose}>Fermer</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="mission-form" disabled={isSubmitting}>
              {mode === 'edit' ? 'Enregistrer' : 'Créer l’ordre de mission'}
            </Button>
          </>
        )
      }
    >
      <form id="mission-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Motif de la mission" error={errors.motif?.message} required={!readOnly}>
          <Textarea rows={2} readOnly={readOnly} autoFocus={!readOnly} {...register('motif')} />
        </Field>
        <FormGrid>
          <Field label="Date de départ" error={errors.date_sortie?.message} required={!readOnly}>
            <Input type="date" readOnly={readOnly} {...register('date_sortie')} />
          </Field>
          <Field label="Heure de départ">
            <Input type="time" readOnly={readOnly} {...register('heure_sortie')} />
          </Field>
          <Field label="Date de retour" error={errors.date_retour?.message}>
            <Input type="date" readOnly={readOnly} {...register('date_retour')} />
          </Field>
          <Field label="Heure de retour">
            <Input type="time" readOnly={readOnly} {...register('heure_retour')} />
          </Field>
          <Field
            label="Destination"
            hint="Communes séparées par un tiret, ex. Alger-Oran."
            error={errors.destination?.message}
            required={!readOnly}
          >
            <Input readOnly={readOnly} {...register('destination')} />
          </Field>
          <Field label="Direction" required={!readOnly}>
            <Select disabled={readOnly} {...register('direction')}>
              {Object.entries(directionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Moyen de transport" error={errors.transport?.message} required={!readOnly} full>
            <Select disabled={readOnly} {...register('transport')}>
              <option value="">— Choisir —</option>
              {Object.entries(transportLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
