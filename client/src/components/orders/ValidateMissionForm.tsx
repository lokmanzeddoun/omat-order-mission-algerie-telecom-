import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { MAX_MISSION_DAYS, MIN_PARCOURS_KM } from 'constants/mission';
import { Trans, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'helpers/date';
import { Button, DatePicker, DescriptionList, Dialog, Field, FormGrid, FormSection, Input, TimePicker } from 'components/ui';
import { ITEMS, field, zonesOf, type Counts, type CountField, type Item, type Zone } from 'components/decomptes/zones';
import type { IMission } from './orderReducer';
import { agentName } from './format';
import { common, departureDateOf, entitlements, groupByEntitlement } from './bulkValidate';

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

/** Which transport figure the means of transport requires: nothing, the distance, or the fees paid. */
const transportInputs = (transport?: string) => ({
  distance: transport === 'PERSONAL_CAR',
  cost: transport === 'TRANSPORT_EMPLOYEE',
});

const amount = (v: string) => !Number.isNaN(Number(v)) && Number(v) >= 0;

// Schedule required, splits must add up to the entitlements, transport figures follow the means of transport.
// With several ordres, every departure must fit the shared return; the totals
// are checked against the first ordre, all being entitled to the same ones.
const schemaFor = (departureDates: string[], firstZone: Zone, transport: string | undefined, t: TFunction) =>
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
        } else if (Number(v.distance_km) < MIN_PARCOURS_KM) {
          ctx.addIssue({ code: 'custom', path: ['distance_km'], message: t('ordres:validate.errors.distanceMin', { count: MIN_PARCOURS_KM }) });
        }
      }
      if (needs.cost) {
        if (v.transport_cost === '') {
          ctx.addIssue({ code: 'custom', path: ['transport_cost'], message: t('ordres:validate.errors.costRequired') });
        } else if (!amount(v.transport_cost)) {
          ctx.addIssue({ code: 'custom', path: ['transport_cost'], message: t('ordres:validate.errors.amountInvalid') });
        }
      }
      const dates = departureDates.filter(Boolean).sort();
      const [first, last] = [dates[0], dates[dates.length - 1]];
      if (v.date_retour && last && dayjs(v.date_retour).isBefore(dayjs(last), 'day')) {
        ctx.addIssue({ code: 'custom', path: ['date_retour'], message: t('ordres:validate.errors.returnBeforeDeparture') });
      }
      if (v.date_retour && v.heure_retour && first && v.heure_sortie) {
        const start = dayjs(`${first}T${v.heure_sortie}`);
        const end = dayjs(`${v.date_retour}T${v.heure_retour}`);
        if (end.diff(start, 'minute') > MAX_MISSION_DAYS * 24 * 60) {
          ctx.addIssue({ code: 'custom', path: ['date_retour'], message: t('ordres:validate.errors.maxDuration', { count: MAX_MISSION_DAYS }) });
        }
      }
      const { meals, accommodations } = entitlements(departureDates[0] ?? '', v);
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

/** Pre-fills what every ordre agrees on; a value they differ on stays empty. */
const fromMissions = (ms: IMission[]): FormValues => ({
  date_retour: common(ms.map((m) => (m.date_retour ? dayjs(m.date_retour).format('YYYY-MM-DD') : ''))),
  heure_sortie: common(ms.map((m) => (m.date_sortie ? dayjs(m.date_sortie).format('HH:mm') : ''))),
  heure_retour: common(ms.map((m) => (m.date_retour ? dayjs(m.date_retour).format('HH:mm') : ''))),
  ...(Object.fromEntries(COUNT_FIELDS.map((f) => [f, ''])) as Record<CountField, string>),
  distance_km: '',
  transport_cost: '',
});

interface Props {
  open: boolean;
  /** One ordre, or several validated with the same figures. */
  missions: IMission[];
  onClose: () => void;
  /** Receives the figures and the ordres still in the form (some may have been removed). */
  onSubmit: (figures: DecompteFigures, missions: IMission[]) => Promise<unknown> | void;
}

/** Validates one or several ordres de mission and records the figures of their décomptes. */
export default function ValidateMissionForm({ open, missions, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  // The ordres in the form: "Retirer" drops the ones that don't fit the shared figures.
  const [list, setList] = useState(missions);
  useEffect(() => {
    if (open) setList(missions);
  }, [open, missions]);

  const mission = list[0] ?? null;
  const bulk = list.length > 1;
  const departureDates = useMemo(() => list.map(departureDateOf), [list]);
  const departureDate = departureDates[0] ?? '';
  const zones = zonesOf(mission?.direction);
  const firstZone = zones[0];
  const transport = mission?.transport;
  const needs = transportInputs(transport);
  const schema = useMemo(() => schemaFor(departureDates, firstZone, transport, t), [departureDates, firstZone, transport, t]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: fromMissions(missions) });

  useEffect(() => {
    if (open) reset(fromMissions(missions));
  }, [open, missions, reset]);

  const watched = useWatch({ control, name: ['heure_sortie', 'date_retour', 'heure_retour'] });
  const schedule = { heure_sortie: watched[0] ?? '', date_retour: watched[1] ?? '', heure_retour: watched[2] ?? '' };
  const { meals, accommodations } = entitlements(departureDate, schedule);
  const groups = groupByEntitlement(list, schedule);

  const submit = handleSubmit(async (v) => {
    if (groups.mismatch) return;
    await onSubmit({
      date_retour: v.date_retour,
      heure_sortie: v.heure_sortie,
      heure_retour: v.heure_retour,
      // A zone outside the ordre's Direction is sent as 0.
      ...Object.fromEntries(COUNT_FIELDS.map((f) => [f, n(v[f])])),
      // Only the figure the means of transport asks for is recorded.
      distance_km: needs.distance ? Number(v.distance_km) : undefined,
      transport_cost: needs.cost ? Number(v.transport_cost) : undefined,
    }, list);
  });

  if (!mission) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={bulk ? t('ordres:validate.bulkTitle', { count: list.length }) : t('ordres:validate.title')}
      description={bulk ? t('ordres:validate.bulkDescription') : t('ordres:validate.description')}
      size="md"
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="validate-mission-form" disabled={isSubmitting || groups.mismatch}>
            {t('ordres:validate.submit')}
          </Button>
        </>
      }
    >
      <form id="validate-mission-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
        {bulk ? (
          <FormSection title={t('ordres:validate.ordres', { count: list.length })}>
            {groups.mismatch && (
              <div role="alert" className="mb-3 border-s-4 border-warning bg-warning-soft px-3 py-2 text-sm text-fg">
                <p className="font-semibold">{t('ordres:validate.mismatch')}</p>
                <p>{t('ordres:validate.mismatchHint')}</p>
              </div>
            )}
            <ul className="flex flex-col divide-y divide-border rounded-sm border border-border text-sm">
              {groups.rows.map(({ mission: m, meals, nights, odd }) => (
                <li key={m.n_mission} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 ${odd ? 'bg-warning-soft' : ''}`}>
                  <span className="tabular-nums font-medium">{t('numbered', { n: m.n_mission })}</span>
                  <span>{agentName((m as IMission & { user?: { nom?: string; prenom?: string } }).user)}</span>
                  <span className="text-fg-muted">{m.destination}</span>
                  <span className="text-fg-muted">{departureDateOf(m) ? dayjs(departureDateOf(m)).format('DD/MM/YYYY') : '—'}</span>
                  <span className="ms-auto tabular-nums">{t('ordres:validate.rowEntitlements', { meals, nights })}</span>
                  <Button size="sm" variant={odd ? 'danger' : 'secondary'} onClick={() => setList((l) => l.filter((x) => x !== m))}>
                    {t('ordres:validate.remove')}
                  </Button>
                </li>
              ))}
            </ul>
          </FormSection>
        ) : (
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
        )}

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
                  <DatePicker value={field.value} onChange={field.onChange} ref={field.ref} min={[...departureDates].sort().pop() || undefined} />
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
