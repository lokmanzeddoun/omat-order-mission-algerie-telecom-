import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { loadUser } from 'components/auth/auth.thunk';
import { changePassword } from 'components/users/users.thunk';
import { Button, DescriptionList, Field, FormGrid, PageHeader, Panel, PasswordInput } from 'components/ui';
import { homeFor } from 'routes/navigation';

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  USER: 'Agent',
};

const categoryLabel: Record<string, string> = {
  CADRE: 'Cadre',
  CADRE_SUPERIEUR: 'Cadre supérieur',
  EXECUTION_MAITRISE: 'Exécution / Maîtrise',
};

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Saisissez votre mot de passe actuel.'),
    password: z.string().min(12, 'Le mot de passe doit contenir au moins 12 caractères.'),
    passwordConfirm: z.string().min(1, 'Confirmez le nouveau mot de passe.'),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Les mots de passe ne correspondent pas.',
  });

type PasswordForm = z.infer<typeof passwordSchema>;

const EMPTY_FORM: PasswordForm = { currentPassword: '', password: '', passwordConfirm: '' };

export default function MyProfile() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth) as { user: IUser; token: string | null };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema), defaultValues: EMPTY_FORM });

  // The session payload may omit some fields (e.g. grade); load the full profile once.
  useEffect(() => {
    if (!user.grade) void dispatch(loadUser());
  }, [dispatch, user.grade]);

  // The thunk reports success/failure to the user itself.
  const onSubmit = async (values: PasswordForm) => {
    if (await dispatch(changePassword(token, values))) reset(EMPTY_FORM);
  };

  return (
    <>
      <PageHeader
        title={t('nav.profile')}
        description="Vos informations et la sécurité de votre compte."
        breadcrumbs={[{ label: t('nav.home'), to: homeFor(user.role) }, { label: t('nav.profile') }]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Informations personnelles">
          <DescriptionList
            items={[
              { label: 'Nom', value: user.nom },
              { label: 'Prénom', value: user.prenom },
              { label: 'Matricule', value: user.matricule },
              { label: 'Grade', value: user.grade },
              { label: 'Adresse e-mail', value: user.email },
              { label: 'Rôle', value: roleLabel[user.role] ?? user.role },
              { label: 'Catégorie', value: user.category ? (categoryLabel[user.category] ?? user.category) : undefined },
            ]}
          />
          <p className="mt-3 text-xs text-fg-subtle">
            Pour corriger ces informations, contactez l’administrateur de votre direction.
          </p>
        </Panel>

        <Panel title="Changer le mot de passe">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Field label="Mot de passe actuel" error={errors.currentPassword?.message} required full>
              <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
            </Field>
            <FormGrid>
              <Field label="Nouveau mot de passe" hint="12 caractères minimum." error={errors.password?.message} required>
                <PasswordInput autoComplete="new-password" {...register('password')} />
              </Field>
              <Field label="Confirmer le mot de passe" error={errors.passwordConfirm?.message} required>
                <PasswordInput autoComplete="new-password" {...register('passwordConfirm')} />
              </Field>
            </FormGrid>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button onClick={() => reset(EMPTY_FORM)} disabled={isSubmitting}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? t('table.loading') : t('actions.save')}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
