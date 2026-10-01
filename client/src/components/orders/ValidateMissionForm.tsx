import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { MAX_MISSION_DAYS } from 'constants/mission';
import { Trans, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'helpers/date';
import { calculateMealsAndAccommodation } from 'helpers/utils';
import { Button, DatePicker, DescriptionList, Dialog, Field, FormGrid, FormSection, Input, TimePicker } from 'components/ui';
import { ITEMS, field, zonesOf, type Counts, type CountField, type Item, type Zone } from 'components/decomptes/zones';
import type { IMission } from './orderReducer';

/** Figures entered when validating an ordre de mission (sent to addDecompte). */
export interface DecompteFigures extends Counts {
  heure_sortie: string;
  date_retour: string;
  heure_retour: string;
  distance_km?: number;
  transport_cost?: number;
}

const itemLabel = (key: Item, t: TFunction) => {
  switch (key) {
    case 'hebergement_sans_pec':
      return t('field.nightsNoPec');
    case 'hebergement_pec':
      return t('field.nightsPec');
    case 'repas_sans_pec':
      return t('field.mealsNoPec');
    case 'repas_pec':
      return t('field.mealsPec');
  }
};

const count = (t: TFunction, label: string) =>
  z.string().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 0), t('ordres:validate.errors.wholeNumber', { label }));

const n = (v: string | undefined) => (v === undefined || v === '' ? 0 : Number(v));

const ZONES: Zone[] = ['nord', 'sud'];
// Nights first, as on the paper form.
const FORM_ORDER = [...ITEMS].reverse();
const COUNT_FIELDS = ZONES.flatMap((zone) => ITEMS.map(({ key }) => field(key, zone)));

/** One item added across both zones (a zone outside the ordre stays empty). */
const sum = (v: Partial<Record<CountField, string>>, item: Item) => n(v[field(item, 'nord')]) + n(v[field(item, 'sud')]);

/** Meals / nights the agent is entitled to for the declared schedule. */
const entitlements = (departureDate: string, v: { heure_sortie: string; date_retour: string; heure_retour: string }) =>
  departureDate && v.heure_sortie && v.date_retour && v.heure_retour
    ? calculateMealsAndAccommodation(departureDate, v.heure_sortie, v.date_retour, v.heure_retour)
    : { meals: 0, accommodations: 0 };

/** Which transport figure the means of transport requires: nothing, the distance, or the fees paid. */
const transportInputs = (transport?: string) => ({
  distance: transport === 'PERSONAL_CAR',
  cost: transport === 'TRANSPORT_EMPLOYEE',
});

const amount = (v: string) => !Number.isNaN(Number(v)) && Number(v) >= 0;

// Schedule required, splits must add up to the entitlements, transport figures follow the means of transport.
const schemaFor = (departureDate: string, firstZone: Zone, transport: string | undefined, t: TFunction) =>
  z
    .object({
      date_retour: z.string().min(1, t('ordres:validate.errors.returnDateRequired')),
      heure_sortie: z.string().min(1, t('ordres:validate.errors.departureTimeRequired')),
      heure_retour: z.string().min(1, t('ordres:validate.errors.returnTimeRequired')),
      ...(Object.fromEntries(
        ZONES.flatMap((zone) =>
          ITEMS.map(({ key }) => [
            field(key, zone),
            count(t, `${itemLabel(key, t)} (${t(`enums:direction.${zone.toUpperCase()}`)})`),
          ]),
        ),
      ) as Record<CountField, ReturnType<typeof count>>),
      distance_km: z.string(),
      transport_cost: z.string(),
    })
    .superRefine((v, ctx) => {
      const needs = transportInputs(transport);
      if (needs.distance) {
        if (v.distance_km === '') {
          ctx.addIssue({ code: 'custom', path: ['distance_km'], message: t('ordres:validate.errors.distanceRequired') });
        } else if (!amount(v.distance_km)) {
          ctx.addIssue({ code: 'custom', path: ['distance_km'], message: t('ordres:validate.errors.distanceInvalid') });
        }
      }
      if (needs.cost) {
        if (v.transport_cost === '') {
          ctx.addIssue({ code: 'custom', path: ['transport_cost'], message: t('ordres:validate.errors.costRequired') });
        } else if (!amount(v.transport_cost)) {
          ctx.addIssue({ code: 'custom', path: ['transport_cost'], message: t('ordres:validate.errors.amountInvalid') });
        }
      }
      if (v.date_retour && departureDate && dayjs(v.date_retour).isBefore(dayjs(departureDate), 'day')) {
        ctx.addIssue({ code: 'custom', path: ['date_retour'], message: t('ordres:validate.errors.returnBeforeDeparture') });
      }
      if (v.date_retour && v.heure_retour && departureDate && v.heure_sortie) {
        const start = dayjs(`${departureDate}T${v.heure_sortie}`);
        const end = dayjs(`${v.date_retour}T${v.heure_retour}`);
        if (end.diff(start, 'minute') > MAX_MISSION_DAYS * 24 * 60) {
          ctx.addIssue({ code: 'custom', path: ['date_retour'], message: t('ordres:validate.errors.maxDuration', { count: MAX_MISSION_DAYS }) });
        }
      }
      const { meals, accommodations } = entitlements(departureDate, v);
      // Both zones together must match the entitlements.
      if (sum(v, 'hebergement_sans_pec') + sum(v, 'hebergement_pec') !== accommodations) {
        ctx.addIssue({
          code: 'custom',
          path: [field('hebergement_sans_pec', firstZone)],
          message: t('ordres:validate.errors.nightsTotal', { count: accommodations }),
        });
      }
      if (sum(v, 'repas_sans_pec') + sum(v, 'repas_pec') !== meals) {
        ctx.addIssue({
          code: 'custom',
          path: [field('repas_sans_pec', firstZone)],
          message: t('ordres:validate.errors.mealsTotal', { count: meals }),
        });
      }
    });

type FormValues = z.infer<ReturnType<typeof schemaFor>>;

const fromMission = (m: IMission): FormValues => ({
  date_retour: m.date_retour ? dayjs(m.date_retour).format('YYYY-MM-DD') : '',
  heure_sortie: m.date_sortie ? dayjs(m.date_sortie).format('HH:mm') : '',
  heure_retour: m.date_retour ? dayjs(m.date_retour).format('HH:mm') : '',
  ...(Object.fromEntries(COUNT_FIELDS.map((f) => [f, ''])) as Record<CountField, string>),
  distance_km: '',
  transport_cost: '',
});

interface Props {
  open: boolean;
  mission: IMission | null;
  onClose: () => void;
  onSubmit: (figures: DecompteFigures) => Promise<unknown> | void;
}

/** Validates an ordre de mission and records the figures of its décompte. */
export default function ValidateMissionForm({ open, mission, onClose, onSubmit }: Props) {
  const departureDate = mission?.date_sortie ? dayjs(mission.date_sortie).format('YYYY-MM-DD') : '';
  const { t } = useTranslation();
  const zones = zonesOf(mission?.direction);
  const firstZone = zones[0];
  const transport = mission?.transport;
  const needs = transportInputs(transport);
  const schema = useMemo(() => schemaFor(departureDate, firstZone, transport, t), [departureDate, firstZone, transport, t]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: mission ? fromMission(mission) : undefined });

  useEffect(() => {
    if (open && mission) reset(fromMission(mission));
  }, [open, mission, reset]);

  const schedule = useWatch({ control, name: ['heure_sortie', 'date_retour', 'heure_retour'] });
  const { meals, accommodations } = entitlements(departureDate, {
    heure_sortie: schedule[0] ?? '',
    date_retour: schedule[1] ?? '',
    heure_retour: schedule[2] ?? '',
  });

  const submit = handleSubmit(async (v) => {
    await onSubmit({
      date_retour: v.date_retour,
      heure_sortie: v.heure_sortie,
      heure_retour: v.heure_retour,
      // A zone outside the ordre's Direction is sent as 0.
      ...Object.fromEntries(COUNT_FIELDS.map((f) => [f, n(v[f])])),
      // Only the figure the means of transport asks for is recorded.
      distance_km: needs.distance ? Number(v.distance_km) : undefined,
      transport_cost: needs.cost ? Number(v.transport_cost) : undefined,
    });
  });

  if (!mission) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t('ordres:validate.title')}
      description={t('ordres:validate.description')}
      size="md"
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="validate-mission-form" disabled={isSubmitting}>
            {t('ordres:validate.submit')}
          </Button>
        </>
      }
    >
      <form id="validate-mission-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
        <FormSection title={t('field.missionOrder')}>
          <DescriptionList
            items={[
              { label: t('field.number'), value: mission.n_mission },
              { label: t('field.destination'), value: mission.destination },
              { label: t('field.departure'), value: departureDate ? dayjs(departureDate).format('DD/MM/YYYY') : '—' },
              { label: t('field.motif'), value: mission.motif },
            ]}
          />
        </FormSection>

        <FormSection title={t('ordres:validate.schedule')}>
          <FormGrid className="sm:grid-cols-3">
            <Controller
              control={control}
              name="heure_sortie"
              render={({ field }) => (
                <Field label={t('ordres:form.departureTime')} error={errors.heure_sortie?.message} required>
                  <TimePicker value={field.value} onChange={field.onChange} ref={field.ref} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="date_retour"
              render={({ field }) => (
                <Field label={t('ordres:form.returnDate')} error={errors.date_retour?.message} required>
                  <DatePicker value={field.value} onChange={field.onChange} ref={field.ref} min={departureDate || undefined} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="heure_retour"
              render={({ field }) => (
                <Field label={t('ordres:form.returnTime')} error={errors.heure_retour?.message} required>
                  <TimePicker value={field.value} onChange={field.onChange} ref={field.ref} />
                </Field>
              )}
            />
          </FormGrid>
          <p className="mt-3 border-s-4 border-info bg-info-soft px-3 py-2 text-sm text-fg" aria-live="polite">
            <Trans t={t} i18nKey="ordres:validate.entitlements" values={{ meals, nights: accommodations }} components={{ b: <strong /> }} />
          </p>
        </FormSection>

        {zones.map((zone) => (
          <FormSection
            key={zone}
            title={zones.length > 1 ? `${t('ordres:validate.split')} — ${t(`enums:direction.${zone.toUpperCase()}`)}` : t('ordres:validate.split')}
          >
            <FormGrid>
              {FORM_ORDER.map(({ key }) => (
                <Field key={key} label={itemLabel(key, t)} error={errors[field(key, zone)]?.message}>
                  <Input type="number" min={0} inputMode="numeric" {...register(field(key, zone))} />
                </Field>
              ))}
            </FormGrid>
          </FormSection>
        ))}

        {(needs.distance || needs.cost) && (
          <FormSection title={t('field.transport')}>
            <FormGrid>
              {needs.distance && (
                <Field label={t('ordres:validate.distanceKm')} error={errors.distance_km?.message} required>
                  <Input type="number" min={0} inputMode="decimal" {...register('distance_km')} />
                </Field>
              )}
              {needs.cost && (
                <Field label={t('ordres:validate.transportCost')} error={errors.transport_cost?.message} required>
                  <Input type="number" min={0} inputMode="decimal" {...register('transport_cost')} />
                </Field>
              )}
            </FormGrid>
          </FormSection>
        )}
      </form>
    </Dialog>
  );
}
