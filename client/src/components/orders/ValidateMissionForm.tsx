import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'helpers/date';
import { calculateMealsAndAccommodation } from 'helpers/utils';
import { Button, DescriptionList, Dialog, Field, FormGrid, FormSection, Input } from 'components/ui';
import type { IMission } from './orderReducer';

/** Figures entered when validating an ordre de mission (sent to addDecompte). */
export interface DecompteFigures {
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

const count = (label: string) =>
  z.string().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 0), `${label} : nombre entier positif attendu.`);

const n = (v: string) => (v === '' ? 0 : Number(v));

/** Meals / nights the agent is entitled to for the declared schedule. */
export const entitlements = (departureDate: string, v: { heure_sortie: string; date_retour: string; heure_retour: string }) =>
  departureDate && v.heure_sortie && v.date_retour && v.heure_retour
    ? calculateMealsAndAccommodation(departureDate, v.heure_sortie, v.date_retour, v.heure_retour)
    : { meals: 0, accommodations: 0 };

// Same rules as the previous dialog: schedule required, splits must add up to the entitlements.
const schemaFor = (departureDate: string) =>
  z
    .object({
      date_retour: z.string().min(1, 'La date de retour est obligatoire.'),
      heure_sortie: z.string().min(1, 'L’heure de départ est obligatoire.'),
      heure_retour: z.string().min(1, 'L’heure de retour est obligatoire.'),
      hebergement_sans_pec: count('Hébergement sans prise en charge'),
      hebergement_pec: count('Hébergement avec prise en charge'),
      repas_sans_pec: count('Repas sans prise en charge'),
      repas_pec: count('Repas avec prise en charge'),
      distance_km: z
        .string()
        .min(1, 'La distance parcourue est obligatoire.')
        .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Distance invalide.'),
      transport_cost: z.string().refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Montant invalide.'),
    })
    .superRefine((v, ctx) => {
      if (v.date_retour && departureDate && dayjs(v.date_retour).isBefore(dayjs(departureDate), 'day')) {
        ctx.addIssue({ code: 'custom', path: ['date_retour'], message: 'Le retour ne peut pas précéder le départ.' });
      }
      const { meals, accommodations } = entitlements(departureDate, v);
      if (n(v.hebergement_sans_pec) + n(v.hebergement_pec) !== accommodations) {
        ctx.addIssue({
          code: 'custom',
          path: ['hebergement_sans_pec'],
          message: `La répartition doit totaliser ${accommodations} nuitée(s).`,
        });
      }
      if (n(v.repas_sans_pec) + n(v.repas_pec) !== meals) {
        ctx.addIssue({ code: 'custom', path: ['repas_sans_pec'], message: `La répartition doit totaliser ${meals} repas.` });
      }
    });

type FormValues = z.infer<ReturnType<typeof schemaFor>>;

const fromMission = (m: IMission): FormValues => ({
  date_retour: m.date_retour ? dayjs(m.date_retour).format('YYYY-MM-DD') : '',
  heure_sortie: m.date_sortie ? dayjs(m.date_sortie).format('HH:mm') : '',
  heure_retour: m.date_retour ? dayjs(m.date_retour).format('HH:mm') : '',
  hebergement_sans_pec: '',
  hebergement_pec: '',
  repas_sans_pec: '',
  repas_pec: '',
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
  const schema = useMemo(() => schemaFor(departureDate), [departureDate]);
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
      hebergement_sans_pec: n(v.hebergement_sans_pec),
      hebergement_pec: n(v.hebergement_pec),
      repas_sans_pec: n(v.repas_sans_pec),
      repas_pec: n(v.repas_pec),
      distance_km: Number(v.distance_km),
      transport_cost: v.transport_cost === '' ? undefined : Number(v.transport_cost),
    });
  });

  if (!mission) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Valider l’ordre de mission"
      description="La validation crée le décompte de la mission."
      size="md"
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" form="validate-mission-form" disabled={isSubmitting}>
            Valider et créer le décompte
          </Button>
        </>
      }
    >
      <form id="validate-mission-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
        <FormSection title="Ordre de mission">
          <DescriptionList
            items={[
              { label: 'N°', value: mission.n_mission },
              { label: 'Destination', value: mission.destination },
              { label: 'Départ', value: departureDate ? dayjs(departureDate).format('DD/MM/YYYY') : '—' },
              { label: 'Motif', value: mission.motif },
            ]}
          />
        </FormSection>

        <FormSection title="Horaires effectifs">
          <FormGrid className="sm:grid-cols-3">
            <Field label="Heure de départ" error={errors.heure_sortie?.message} required>
              <Input type="time" {...register('heure_sortie')} />
            </Field>
            <Field label="Date de retour" error={errors.date_retour?.message} required>
              <Input type="date" {...register('date_retour')} />
            </Field>
            <Field label="Heure de retour" error={errors.heure_retour?.message} required>
              <Input type="time" {...register('heure_retour')} />
            </Field>
          </FormGrid>
          <p className="mt-3 border-s-4 border-info bg-info-soft px-3 py-2 text-sm text-fg" aria-live="polite">
            Droits calculés : <strong>{meals}</strong> repas et <strong>{accommodations}</strong> nuitée(s).
          </p>
        </FormSection>

        <FormSection title="Répartition">
          <FormGrid>
            <Field label="Nuitées sans prise en charge" error={errors.hebergement_sans_pec?.message}>
              <Input type="number" min={0} inputMode="numeric" {...register('hebergement_sans_pec')} />
            </Field>
            <Field label="Nuitées avec prise en charge" error={errors.hebergement_pec?.message}>
              <Input type="number" min={0} inputMode="numeric" {...register('hebergement_pec')} />
            </Field>
            <Field label="Repas sans prise en charge" error={errors.repas_sans_pec?.message}>
              <Input type="number" min={0} inputMode="numeric" {...register('repas_sans_pec')} />
            </Field>
            <Field label="Repas avec prise en charge" error={errors.repas_pec?.message}>
              <Input type="number" min={0} inputMode="numeric" {...register('repas_pec')} />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Transport">
          <FormGrid>
            <Field label="Distance parcourue (km)" error={errors.distance_km?.message} required>
              <Input type="number" min={0} inputMode="decimal" {...register('distance_km')} />
            </Field>
            <Field label="Frais de transport engagés (DA)" error={errors.transport_cost?.message}>
              <Input type="number" min={0} inputMode="decimal" {...register('transport_cost')} />
            </Field>
          </FormGrid>
        </FormSection>
      </form>
    </Dialog>
  );
}
