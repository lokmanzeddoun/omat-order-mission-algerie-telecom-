import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Dialog, Field, FormGrid, Input } from 'components/ui';
import type { IStructure } from './structure.reducer';

const schema = z.object({
  code: z.string().trim().min(1, 'Le code est obligatoire.'),
  name: z.string().trim().min(1, 'Le nom du service est obligatoire.'),
});

export type StructureFormMode = 'create' | 'edit' | 'view';

const titles: Record<StructureFormMode, string> = {
  create: 'Ajouter un service',
  edit: 'Modifier le service',
  view: 'Détails du service',
};

interface Props {
  open: boolean;
  mode: StructureFormMode;
  initial?: IStructure | null;
  onClose: () => void;
  onSubmit: (data: IStructure) => Promise<void> | void;
}

/** Create / edit / view a service (structure). The code cannot change once created. */
export default function StructureFormDialog({ open, mode, initial, onClose, onSubmit }: Props) {
  const readOnly = mode === 'view';
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
      title={titles[mode]}
      size="sm"
      footer={
        readOnly ? (
          <Button onClick={onClose}>Fermer</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="structure-form" disabled={isSubmitting}>
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </>
        )
      }
    >
      <form id="structure-form" onSubmit={submit} noValidate>
        <FormGrid className="sm:grid-cols-1">
          <Field label="Code" error={errors.code?.message} required={!readOnly}>
            <Input autoFocus={mode === 'create'} readOnly={mode !== 'create'} {...register('code')} />
          </Field>
          <Field label="Nom du service" error={errors.name?.message} required={!readOnly}>
            <Input autoFocus={mode === 'edit'} readOnly={readOnly} {...register('name')} />
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
