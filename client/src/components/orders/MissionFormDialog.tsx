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
import OwnersPicker from './OwnersPicker';
import { MAX_MISSION_DAYS } from 'constants/mission';

export type MissionFormMode = 'create' | 'edit' | 'view';

// Mirrors the server's CreateMissionDto so errors are caught before submitting.
// Hours are never assumed: a date without its hour (or the reverse) is an error,
// so a same-day return is never compared against a made-up 00:00.
const schemaFor = (t: TFunction) =>
  z
    .object({
      date_sortie: z.string().min(1, t('ordres:form.errors.departureRequired')),
      heure_sortie: z.string().min(1, t('ordres:form.errors.departureTimeRequired')),
      date_retour: z.string(),
      heure_retour: z.string(),
      motif: z.string().trim().min(1, t('ordres:form.errors.motifRequired')),
      destination: z.string().min(1, t('ordres:form.errors.destinationRequired')),
      transport: z.string().min(1, t('ordres:form.errors.transportRequired')),
      direction: z.string().min(1),
    })
    .superRefine((v, ctx) => {
      if (v.date_retour && !v.heure_retour) {
        ctx.addIssue({ code: 'custom', path: ['heure_retour'], message: t('ordres:form.errors.returnTimeRequired') });
      }
      if (v.heure_retour && !v.date_retour) {
        ctx.addIssue({ code: 'custom', path: ['date_retour'], message: t('ordres:form.errors.returnDateRequired') });
      }
      // Compare only full datetimes; a missing part is reported above.
      if (!v.date_sortie || !v.heure_sortie || !v.date_retour || !v.heure_retour) return;
      const start = dayjs(`${v.date_sortie}T${v.heure_sortie}`);
      const end = dayjs(`${v.date_retour}T${v.heure_retour}`);
      if (!end.isAfter(start)) {
        ctx.addIssue({ code: 'custom', path: ['date_retour'], message: t('ordres:form.errors.returnAfterDeparture') });
      } else if (end.diff(start, 'minute') > MAX_MISSION_DAYS * 24 * 60) {
        ctx.addIssue({ code: 'custom', path: ['date_retour'], message: t('ordres:form.errors.maxDuration', { count: MAX_MISSION_DAYS }) });
      }
    });

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
  /**
   * Enables the multi-user picker (admins creating from the shell). Called when
   * several users are selected; resolves with per-user error messages (by
   * matricule) when the server refused the batch, nothing on success.
   */
  onSubmitBatch?: (mission: IMission, matricules: number[]) => Promise<BatchErrors | void>;
}

/** Per-user server errors of a refused batch, by matricule. */
export type BatchErrors = Record<number, string>;

export default function MissionFormDialog({ open, mode, initial, target, onClose, onSubmit, onSubmitBatch }: Props) {
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

  // Admins creating from the shell (no fixed target) can choose one or several users to create the ordre for.
  const [selected, setSelected] = useState<number[]>([]);
  const [batchErrors, setBatchErrors] = useState<BatchErrors>({});
  const [pickError, setPickError] = useState(false);
  const canPick =
    mode === 'create' && !target && !!me && (me.role === 'ADMIN' || me.role === 'SUPER_ADMIN') && !!onSubmitBatch;

  useEffect(() => {
    if (open) {
      reset(initial ? toForm(initial) : EMPTY);
      setSelected(me ? [me.matricule] : []);
      setBatchErrors({});
      setPickError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-seed the selection only when the dialog opens
  }, [open, initial, reset]);

  const owner =
    target ?? ((initial as IMission & { user?: MissionTarget })?.user as MissionTarget | undefined) ?? me ?? null;
  const ownerLabel = owner
    ? owner.matricule === me?.matricule
      ? t('ordres:form.yourself')
      : `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim() || t('ordres:form.matriculeOf', { matricule: owner.matricule })
    : '';

  const changeSelection = (next: number[]) => {
    setSelected(next);
    setBatchErrors({});
    setPickError(false);
  };

  const submit = handleSubmit(async (v) => {
    const mission = {
      ...(initial?.n_mission ? { n_mission: initial.n_mission } : {}),
      ...v,
      date_retour: v.date_retour || undefined,
      direction: v.direction as IMission['direction'],
    };
    if (canPick && onSubmitBatch) {
      if (selected.length === 0) {
        setPickError(true);
        return;
      }
      if (selected.length > 1) {
        const errors = await onSubmitBatch(mission, selected);
        setBatchErrors(errors ?? {});
        return;
      }
      // One person: the usual single creation (for oneself, or for the picked user).
      const [only] = selected;
      await onSubmit({ ...mission, ...(only !== me?.matricule ? { userMatricule: only } : {}) });
      return;
    }
    await onSubmit(mission);
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
        {canPick && me && <OwnersPicker me={me} value={selected} onChange={changeSelection} errors={batchErrors} />}
        {canPick && pickError && (
          <p role="alert" className="-mt-2 text-xs text-danger">
            {t('ordres:form.errors.ownersRequired')}
          </p>
        )}
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
              <Field label={t('ordres:form.departureTime')} error={errors.heure_sortie?.message} required={!readOnly}>
                <TimePicker readOnly={readOnly} value={field.value} onChange={field.onChange} ref={field.ref} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="date_retour"
            render={({ field }) => (
              <Field label={t('ordres:form.returnDate')} error={errors.date_retour?.message}>
                <DatePicker readOnly={readOnly} value={field.value} onChange={field.onChange} ref={field.ref} min={watch('date_sortie') || undefined} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="heure_retour"
            render={({ field }) => (
              <Field label={t('ordres:form.returnTime')} error={errors.heure_retour?.message} required={!readOnly && !!watch('date_retour')}>
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
