import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Dialog, Field, FormGrid, Input } from 'components/ui';
import type { IStructure } from './structure.reducer';

const schemaFor = (t: TFunction) =>
  z.object({
    code: z.string().trim().min(1, t('structures:errors.codeRequired')),
    name: z.string().trim().min(1, t('structures:errors.nameRequired')),
  });

export type StructureFormMode = 'create' | 'edit' | 'view';

interface Props {
  open: boolean;
  mode: StructureFormMode;
  initial?: IStructure | null;
  onClose: () => void;
  onSubmit: (data: IStructure) => Promise<void> | void;
}

/** Create / edit / view a service (structure). The code cannot change once created. */
export default function StructureFormDialog({ open, mode, initial, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const readOnly = mode === 'view';
  const schema = useMemo(() => schemaFor(t), [t]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IStructure>({ resolver: zodResolver(schema), defaultValues: { code: '', name: '' } });

  useEffect(() => {
    if (open) reset(initial ?? { code: '', name: '' });
  }, [open, initial, reset]);

  const submit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t(`structures:form.title.${mode}`)}
      size="sm"
      footer={
        readOnly ? (
          <Button onClick={onClose}>{t('actions.close')}</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isSubmitting}>
              {t('actions.cancel')}
            </Button>
            <Button variant="primary" type="submit" form="structure-form" disabled={isSubmitting}>
              {mode === 'edit' ? t('actions.save') : t('actions.add')}
            </Button>
          </>
        )
      }
    >
      <form id="structure-form" onSubmit={submit} noValidate>
        <FormGrid className="sm:grid-cols-1">
          <Field label={t('structures:field.code')} error={errors.code?.message} required={!readOnly}>
            <Input autoFocus={mode === 'create'} readOnly={mode !== 'create'} {...register('code')} />
          </Field>
          <Field label={t('structures:field.name')} error={errors.name?.message} required={!readOnly}>
            <Input autoFocus={mode === 'edit'} readOnly={readOnly} {...register('name')} />
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
