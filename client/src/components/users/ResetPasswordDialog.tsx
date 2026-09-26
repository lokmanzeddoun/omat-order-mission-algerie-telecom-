import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Dialog, Field, PasswordInput } from 'components/ui';

const schema = z
  .object({
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères.'),
    confirm: z.string().min(1, 'Confirmez le mot de passe.'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Les mots de passe ne correspondent pas.' });

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  userName: string;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void> | void;
}

/** Admin reset of another user's password (same 6-character rule as before). */
export default function ResetPasswordDialog({ open, userName, onClose, onSubmit }: Props) {
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
      title="Réinitialiser le mot de passe"
      description={`Nouveau mot de passe pour ${userName}.`}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" form="reset-password-form" disabled={isSubmitting}>
            Réinitialiser
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
        <Field label="Nouveau mot de passe" hint="6 caractères minimum." error={errors.password?.message} required>
          <PasswordInput autoComplete="new-password" autoFocus {...register('password')} />
        </Field>
        <Field label="Confirmer le mot de passe" error={errors.confirm?.message} required>
          <PasswordInput autoComplete="new-password" {...register('confirm')} />
        </Field>
      </form>
    </Dialog>
  );
}
