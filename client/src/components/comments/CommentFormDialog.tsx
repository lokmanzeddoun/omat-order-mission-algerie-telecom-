import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Dialog, Field, Select, Textarea } from 'components/ui';
import type { IDecompte } from 'components/orders/decompte.reducer';

export interface NewComment {
  title: string;
  type: 'OTHER' | 'DECOMPTE_STATUS';
  decompteId?: number;
}

const schemaFor = (t: TFunction) =>
  z
    .object({
      about: z.enum(['general', 'decompte']),
      decompteId: z.string(),
      title: z.string().trim().min(1, t('comments:form.errors.textRequired')),
    })
    .refine((v) => v.about === 'general' || v.decompteId !== '', {
      path: ['decompteId'],
      message: t('comments:form.errors.decompteRequired'),
    });

type Values = z.infer<ReturnType<typeof schemaFor>>;

interface Props {
  open: boolean;
  /** Décomptes the agent may comment on (rejected ones, as before). */
  rejected: IDecompte[];
  /** Pre-select a décompte (e.g. from its row). */
  decompteId?: number | null;
  onClose: () => void;
  onSubmit: (comment: NewComment) => Promise<unknown> | void;
}

/** General comment to the administration, or a comment about a rejected décompte. */
export default function CommentFormDialog({ open, rejected, decompteId, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(() => schemaFor(t), [t]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { about: 'general', decompteId: '', title: '' } });
  const about = useWatch({ control, name: 'about' });

  useEffect(() => {
    if (open)
      reset({
        about: decompteId ? 'decompte' : 'general',
        decompteId: decompteId ? String(decompteId) : '',
        title: '',
      });
  }, [open, decompteId, reset]);

  const submit = handleSubmit(async (v) => {
    await onSubmit(
      v.about === 'general'
        ? { title: v.title.trim(), type: 'OTHER' }
        : { title: v.title.trim(), type: 'DECOMPTE_STATUS', decompteId: Number(v.decompteId) },
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t('comments:add')}
      description={t('comments:form.description')}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="comment-form" disabled={isSubmitting}>
            {t('actions.submit')}
          </Button>
        </>
      }
    >
      <form id="comment-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t('comments:form.subject')}</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" value="general" className="accent-primary" {...register('about')} />
            {t('comments:form.general')}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" value="decompte" className="accent-primary" {...register('about')} />
            {t('comments:form.aboutRejected')}
          </label>
        </fieldset>
        {about === 'decompte' && (
          <Field
            label={t('comments:form.decompte')}
            error={errors.decompteId?.message}
            hint={rejected.length === 0 ? t('comments:form.noRejected') : undefined}
            required
          >
            <Select disabled={rejected.length === 0} {...register('decompteId')}>
              <option value="">{t('ordres:form.choose')}</option>
              {rejected.map((d) => (
                <option key={d.n_decompte} value={d.n_decompte}>
                  {t('decomptes:title', { n: d.n_decompte })}
                  {(d.mission as { destination?: string } | undefined)?.destination
                    ? ` — ${(d.mission as { destination?: string }).destination}`
                    : ''}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t('comments:form.text')} error={errors.title?.message} required>
          <Textarea rows={4} {...register('title')} />
        </Field>
      </form>
    </Dialog>
  );
}
