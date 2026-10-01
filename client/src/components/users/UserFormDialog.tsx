import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { sortTree, structureLabel } from 'helpers/structureTree';
import { getAllStructures } from 'components/structures/structure.thunk';
import type { IStructure } from 'components/structures/structure.reducer';
import { Button, Dialog, Field, FormGrid, Input, Select } from 'components/ui';
import { categoryLabels, roleLabels } from 'constants/labels';
import { isEmail } from 'lib/email';
import { Role } from 'constants/role';

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

const required = (message: string) => z.string().trim().min(1, message);

const schemaFor = (mode: UserFormMode, t: TFunction) =>
  z.object({
    matricule: z
      .string()
      .trim()
      .min(1, t('users:errors.matriculeRequired'))
      .regex(/^\d+$/, t('users:errors.matriculeNumber')),
    nom: required(t('users:errors.nomRequired')),
    prenom: required(t('users:errors.prenomRequired')),
    email: z
      .string()
      .trim()
      .min(1, t('users:errors.emailRequired'))
      .refine(isEmail, t('users:errors.emailInvalid')),
    role: z.string().min(1),
    category: z.string().min(1),
    grade: required(t('users:errors.gradeRequired')),
    // The service was only mandatory at creation in the previous form.
    serviceId: mode === 'create' ? required(t('users:errors.serviceRequired')) : z.string(),
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

interface Props {
  open: boolean;
  mode: UserFormMode;
  initial?: Partial<UserFormValues> | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
}

export default function UserFormDialog({ open, mode, initial, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const structures = useSelector((s: RootState) => s.structures.structures) as IStructure[];
  const readOnly = mode === 'view';
  // Identity fields are fixed once the account exists (same rule as before).
  const locked = mode !== 'create';
  // The API only lets super administrators change a role; admins may still change the category.
  const actor = useSelector((s: RootState) => s.auth.user);
  const isSuperAdmin = actor.role === Role.super_admin;
  // A plain admin can only create regular users, in their own service or a sub-service (the API
  // enforces it too; it already lists only those structures to them).
  const adminScoped = mode === 'create' && actor.role === Role.admin;
  const ownService = actor.serviceId ?? '';
  const roleLocked = readOnly || adminScoped || (mode === 'edit' && !isSuperAdmin);
  const schema = useMemo(() => schemaFor(mode, t), [mode, t]);
  const ownServiceListed = structures.some((s) => s.code === ownService);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormState>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open && structures.length === 0) void dispatch(getAllStructures());
  }, [open, structures.length, dispatch]);

  useEffect(() => {
    if (open)
      reset({
        ...EMPTY,
        ...initial,
        matricule: initial?.matricule ? String(initial.matricule) : '',
        ...(adminScoped ? { role: 'USER' as const } : {}),
        // An admin starts on their own service when the API lists it to them.
        serviceId: initial?.serviceId ?? '',
      });
  }, [open, initial, reset, adminScoped]);

  // An admin starts on their own service once the API has listed it to them (it only does when it has a responsible).
  useEffect(() => {
    if (open && adminScoped && ownServiceListed && !getValues('serviceId')) setValue('serviceId', ownService);
  }, [open, adminScoped, ownServiceListed, ownService, getValues, setValue]);

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
      title={t(`users:form.title.${mode}`)}
      footer={
        readOnly ? (
          <Button onClick={onClose}>{t('actions.close')}</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isSubmitting}>
              {t('actions.cancel')}
            </Button>
            <Button variant="primary" type="submit" form="user-form" disabled={isSubmitting}>
              {mode === 'edit' ? t('actions.save') : t('actions.add')}
            </Button>
          </>
        )
      }
    >
      <form id="user-form" noValidate onSubmit={handleSubmit(async (v) =>
          onSubmit({
            ...v,
            matricule: Number(v.matricule),
            ...(adminScoped ? { role: 'USER' as const } : {}),
          }),
        )} className="flex flex-col gap-4">
        <FormGrid>
          <Field label={t('field.matricule')} error={errors.matricule?.message} required={!readOnly}>
            <Input type="number" inputMode="numeric" dir="ltr" readOnly={locked} autoFocus={mode === 'create'} {...register('matricule')} />
          </Field>
          <Field label={t('auth.email')} error={errors.email?.message} required={!readOnly}>
            <Input type="text" inputMode="email" spellCheck={false} dir="ltr" autoComplete="off" readOnly={readOnly} {...register('email')} />
          </Field>
          <Field label={t('users:field.nom')} error={errors.nom?.message} required={!readOnly}>
            <Input readOnly={readOnly} {...register('nom')} />
          </Field>
          <Field label={t('users:field.prenom')} error={errors.prenom?.message} required={!readOnly}>
            <Input readOnly={readOnly} {...register('prenom')} />
          </Field>
          <Field label={t('users:field.role')} required={!readOnly}>
            <Select disabled={roleLocked} {...register('role')}>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('users:field.category')} required={!readOnly}>
            <Select disabled={readOnly} {...register('category')}>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('users:field.gradeFunction')} error={errors.grade?.message} required={!readOnly}>
            <Input readOnly={readOnly} {...register('grade')} />
          </Field>
          <Field label={t('users:field.service')} error={errors.serviceId?.message} required={mode === 'create'}>
            <Select disabled={readOnly} {...register('serviceId')}>
              <option value="">{t('users:form.chooseService')}</option>
              {sortTree(structures).map((s) => (
                <option key={s.code} value={s.code}>
                  {structureLabel(s)}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
