import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Dialog, Field, PasswordInput } from 'components/ui';

const schemaFor = (t: TFunction) =>
  z
    .object({
      password: z.string().min(6, t('users:password.min')),
      confirm: z.string().min(1, t('users:password.confirmRequired')),
    })
    .refine((v) => v.password === v.confirm, { path: ['confirm'], message: t('users:password.mismatch') });

type Values = z.infer<ReturnType<typeof schemaFor>>;

interface Props {
  open: boolean;
  userName: string;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void> | void;
}

/** Admin reset of another user's password (same 6-character rule as before). */
export default function ResetPasswordDialog({ open, userName, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(() => schemaFor(t), [t]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } });

  useEffect(() => {
    if (open) reset({ password: '', confirm: '' });
  }, [open, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t('users:resetPassword')}
      description={t('users:resetPasswordFor', { name: userName })}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="reset-password-form" disabled={isSubmitting}>
            {t('actions.reset')}
          </Button>
        </>
      }
    >
      <form
        id="reset-password-form"
        noValidate
        onSubmit={handleSubmit(async (v) => onSubmit(v.password))}
        className="flex flex-col gap-4"
      >
        <Field label={t('users:password.new')} hint={t('users:password.hint')} error={errors.password?.message} required>
          <PasswordInput autoComplete="new-password" autoFocus {...register('password')} />
        </Field>
        <Field label={t('users:password.confirm')} error={errors.confirm?.message} required>
          <PasswordInput autoComplete="new-password" {...register('confirm')} />
        </Field>
      </form>
    </Dialog>
  );
}
