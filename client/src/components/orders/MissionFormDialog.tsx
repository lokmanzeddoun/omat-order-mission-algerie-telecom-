import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RootState } from 'store/rootReducer';
import dayjs from 'helpers/date';
import { Button, Dialog, DatePicker, DestinationInput, Field, FormGrid, Select, Textarea, TimePicker } from 'components/ui';
import { directionLabels, transportLabels } from 'constants/labels';
import type { IMission } from './orderReducer';
import OwnerPicker, { type OwnerOption } from './OwnerPicker';

export type MissionFormMode = 'create' | 'edit' | 'view';

// Mirrors the server's CreateMissionDto so errors are caught before submitting.
const schemaFor = (t: TFunction) =>
  z
    .object({
      date_sortie: z.string().min(1, t('ordres:form.errors.departureRequired')),
      heure_sortie: z.string(),
      date_retour: z.string(),
      heure_retour: z.string(),
      motif: z.string().trim().min(1, t('ordres:form.errors.motifRequired')),
      destination: z.string().min(1, t('ordres:form.errors.destinationRequired')),
      transport: z.string().min(1, t('ordres:form.errors.transportRequired')),
      direction: z.string().min(1),
    })
    .refine(
      (v) => {
        if (!v.date_retour) return true;
        const start = dayjs(`${v.date_sortie}T${v.heure_sortie || '00:00'}`);
        const end = dayjs(`${v.date_retour}T${v.heure_retour || '00:00'}`);
        return !end.isBefore(start);
      },
      { path: ['date_retour'], message: t('ordres:form.errors.returnAfterDeparture') },
    );

type FormValues = z.infer<ReturnType<typeof schemaFor>>;

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
  const { t } = useTranslation();
  const me = useSelector((s: RootState) => s.auth.user) as IUser | null;
  const readOnly = mode === 'view';
  const schema = useMemo(() => schemaFor(t), [t]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  // Admins creating from the shell (no fixed target) can choose who the ordre is for.
  const [picked, setPicked] = useState<OwnerOption | null>(null);
  const canPick = mode === 'create' && !target && !!me && (me.role === 'ADMIN' || me.role === 'SUPER_ADMIN');

  useEffect(() => {
    if (open) {
      reset(initial ? toForm(initial) : EMPTY);
      setPicked(null);
    }
  }, [open, initial, reset]);

  const owner =
    target ?? ((initial as IMission & { user?: MissionTarget })?.user as MissionTarget | undefined) ?? me ?? null;
  const ownerLabel = owner
    ? owner.matricule === me?.matricule
      ? t('ordres:form.yourself')
      : `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim() || t('ordres:form.matriculeOf', { matricule: owner.matricule })
    : '';

  const submit = handleSubmit(async (v) => {
    await onSubmit({
      ...(initial?.n_mission ? { n_mission: initial.n_mission } : {}),
      ...v,
      ...(canPick && picked && picked.matricule !== me?.matricule ? { userMatricule: picked.matricule } : {}),
      date_retour: v.date_retour || undefined,
      direction: v.direction as IMission['direction'],
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t(`ordres:form.title.${mode}`)}
      description={ownerLabel && !canPick ? t('ordres:form.owner', { name: ownerLabel }) : undefined}
      footer={
        readOnly ? (
          <Button onClick={onClose}>{t('actions.close')}</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isSubmitting}>
              {t('actions.cancel')}
            </Button>
            <Button variant="primary" type="submit" form="mission-form" disabled={isSubmitting}>
              {mode === 'edit' ? t('actions.save') : t('ordres:form.create')}
            </Button>
          </>
        )
      }
    >
      <form id="mission-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {canPick && me && <OwnerPicker me={me} value={picked ?? me} onChange={setPicked} />}
        <Field label={t('ordres:form.motif')} error={errors.motif?.message} required={!readOnly}>
          <Textarea rows={2} readOnly={readOnly} autoFocus={!readOnly} {...register('motif')} />
        </Field>
        <FormGrid>
          <Controller
            control={control}
            name="date_sortie"
            render={({ field }) => (
              <Field label={t('ordres:form.departureDate')} error={errors.date_sortie?.message} required={!readOnly}>
                <DatePicker readOnly={readOnly} value={field.value} onChange={field.onChange} ref={field.ref} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="heure_sortie"
            render={({ field }) => (
              <Field label={t('ordres:form.departureTime')} >
                <TimePicker readOnly={readOnly} value={field.value} onChange={field.onChange} ref={field.ref} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="date_retour"
            render={({ field }) => (
              <Field label={t('ordres:form.returnDate')} error={errors.date_retour?.message} >
                <DatePicker readOnly={readOnly} value={field.value} onChange={field.onChange} ref={field.ref} min={watch('date_sortie') || undefined} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="heure_retour"
            render={({ field }) => (
              <Field label={t('ordres:form.returnTime')} >
                <TimePicker readOnly={readOnly} value={field.value} onChange={field.onChange} ref={field.ref} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="destination"
            render={({ field }) => (
              <Field
                label={t('field.destination')}
                hint={readOnly ? undefined : t('ordres:form.destinationHint')}
                error={errors.destination?.message}
                required={!readOnly}
                full
              >
                <DestinationInput readOnly={readOnly} value={field.value} onChange={field.onChange} ref={field.ref} />
              </Field>
            )}
          />
          <Field label={t('field.direction')} required={!readOnly}>
            <Select disabled={readOnly} {...register('direction')}>
              {Object.entries(directionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('field.transportMode')} error={errors.transport?.message} required={!readOnly} full>
            <Select disabled={readOnly} {...register('transport')}>
              <option value="">{t('ordres:form.choose')}</option>
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
