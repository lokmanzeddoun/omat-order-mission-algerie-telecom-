import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { loadUser } from 'components/auth/auth.thunk';
import { changePassword } from 'components/users/users.thunk';
import { Button, DescriptionList, Field, FormGrid, PageHeader, Panel, PasswordInput } from 'components/ui';
import { categoryLabels, roleLabels } from 'constants/labels';
import { homeFor } from 'routes/navigation';

const passwordSchemaFor = (t: TFunction) =>
  z
    .object({
      currentPassword: z.string().min(1, t('profile:errors.currentRequired')),
      password: z.string().min(12, t('profile:errors.min')),
      passwordConfirm: z.string().min(1, t('profile:errors.confirmRequired')),
    })
    .refine((v) => v.password === v.passwordConfirm, {
      path: ['passwordConfirm'],
      message: t('users:password.mismatch'),
    });

type PasswordForm = z.infer<ReturnType<typeof passwordSchemaFor>>;

const EMPTY_FORM: PasswordForm = { currentPassword: '', password: '', passwordConfirm: '' };

export default function MyProfile() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth) as { user: IUser; token: string | null };
  const passwordSchema = useMemo(() => passwordSchemaFor(t), [t]);

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
        description={t('profile:description')}
        breadcrumbs={[{ label: t('nav.home'), to: homeFor(user.role) }, { label: t('nav.profile') }]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title={t('profile:personalInfo')}>
          <DescriptionList
            items={[
              { label: t('users:field.nom'), value: user.nom },
              { label: t('users:field.prenom'), value: user.prenom },
              { label: t('field.matricule'), value: user.matricule },
              { label: t('users:field.grade'), value: user.grade },
              { label: t('auth.email'), value: <span dir="ltr">{user.email}</span> },
              { label: t('users:field.role'), value: roleLabels[user.role] ?? user.role },
              { label: t('users:field.category'), value: user.category ? (categoryLabels[user.category] ?? user.category) : undefined },
            ]}
          />
          <p className="mt-3 text-xs text-fg-subtle">{t('profile:contactAdmin')}</p>
        </Panel>

        <Panel title={t('profile:changePassword')}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Field label={t('profile:currentPassword')} error={errors.currentPassword?.message} required full>
              <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
            </Field>
            <FormGrid>
              <Field label={t('users:password.new')} hint={t('profile:hint')} error={errors.password?.message} required>
                <PasswordInput autoComplete="new-password" {...register('password')} />
              </Field>
              <Field label={t('users:password.confirm')} error={errors.passwordConfirm?.message} required>
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
