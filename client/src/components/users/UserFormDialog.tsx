import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { getAllStructures } from 'components/structures/structure.thunk';
import type { IStructure } from 'components/structures/structure.reducer';
import { Button, Dialog, Field, FormGrid, Input, Select } from 'components/ui';
import { categoryLabels, roleLabels } from 'constants/labels';

export type UserFormMode = 'create' | 'edit' | 'view';

export interface UserFormValues {
  matricule: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  category: string;
  grade: string;
  serviceId: string;
}

/** Form state: the matricule is edited as text and converted on submit. */
type FormState = Omit<UserFormValues, 'matricule'> & { matricule: string };

const required = (label: string) => z.string().trim().min(1, `${label} est obligatoire.`);

const schemaFor = (mode: UserFormMode) =>
  z.object({
    matricule: z
      .string()
      .trim()
      .min(1, 'Le matricule est obligatoire.')
      .regex(/^\d+$/, 'Le matricule doit être un nombre.'),
    nom: required('Le nom'),
    prenom: required('Le prénom'),
    email: z.string().trim().min(1, 'L’adresse e-mail est obligatoire.').email('Adresse e-mail invalide.'),
    role: z.string().min(1),
    category: z.string().min(1),
    grade: required('Le grade'),
    // The service was only mandatory at creation in the previous form.
    serviceId: mode === 'create' ? required('Le service') : z.string(),
  });

const EMPTY: FormState = {
  matricule: '',
  nom: '',
  prenom: '',
  email: '',
  role: 'USER',
  category: 'CADRE',
  grade: '',
  serviceId: '',
};

const titles: Record<UserFormMode, string> = {
  create: 'Ajouter un utilisateur',
  edit: 'Modifier l’utilisateur',
  view: 'Détails de l’utilisateur',
};

interface Props {
  open: boolean;
  mode: UserFormMode;
  initial?: Partial<UserFormValues> | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
}

export default function UserFormDialog({ open, mode, initial, onClose, onSubmit }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const structures = useSelector((s: RootState) => s.structures.structures) as IStructure[];
  const readOnly = mode === 'view';
  // Identity fields are fixed once the account exists (same rule as before).
  const locked = mode !== 'create';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormState>({ resolver: zodResolver(schemaFor(mode)), defaultValues: EMPTY });

  useEffect(() => {
    if (open && structures.length === 0) void dispatch(getAllStructures());
  }, [open, structures.length, dispatch]);

  useEffect(() => {
    if (open)
      reset({
        ...EMPTY,
        ...initial,
        matricule: initial?.matricule ? String(initial.matricule) : '',
        serviceId: initial?.serviceId ?? '',
      });
  }, [open, initial, reset]);

  // A native <select> drops a value whose <option> is not rendered yet. When the services
  // arrive after the form opened, re-apply only the service (never the whole form, which
  // would erase what the user typed) so an edit can't silently clear it.
  const servicesReady = structures.length > 0;
  useEffect(() => {
    if (open && servicesReady && initial?.serviceId) setValue('serviceId', initial.serviceId);
  }, [open, servicesReady, initial?.serviceId, setValue]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={titles[mode]}
      footer={
        readOnly ? (
          <Button onClick={onClose}>Fermer</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="user-form" disabled={isSubmitting}>
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </>
        )
      }
    >
      <form id="user-form" noValidate onSubmit={handleSubmit(async (v) => onSubmit({ ...v, matricule: Number(v.matricule) }))} className="flex flex-col gap-4">
        <FormGrid>
          <Field label="Matricule" error={errors.matricule?.message} required={!readOnly}>
            <Input type="number" inputMode="numeric" readOnly={locked} autoFocus={mode === 'create'} {...register('matricule')} />
          </Field>
          <Field label="Adresse e-mail" error={errors.email?.message} required={!readOnly}>
            <Input type="email" autoComplete="off" readOnly={readOnly} {...register('email')} />
          </Field>
          <Field label="Nom" error={errors.nom?.message} required={!readOnly}>
            <Input readOnly={readOnly} {...register('nom')} />
          </Field>
          <Field label="Prénom" error={errors.prenom?.message} required={!readOnly}>
            <Input readOnly={readOnly} {...register('prenom')} />
          </Field>
          <Field label="Rôle" required={!readOnly}>
            <Select disabled={locked} {...register('role')}>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Catégorie" required={!readOnly}>
            <Select disabled={locked} {...register('category')}>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Grade (fonction)" error={errors.grade?.message} required={!readOnly}>
            <Input readOnly={readOnly} {...register('grade')} />
          </Field>
          <Field label="Service" error={errors.serviceId?.message} required={mode === 'create'}>
            <Select disabled={readOnly} {...register('serviceId')}>
              <option value="">— Choisir un service —</option>
              {structures.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
