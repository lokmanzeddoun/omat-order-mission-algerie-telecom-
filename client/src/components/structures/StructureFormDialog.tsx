import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import http from 'helpers/http';
import { parentCandidates, structureLabel } from 'helpers/structureTree';
import { Button, Dialog, Field, FormGrid, Input, Select } from 'components/ui';
import type { IStructure } from './structure.reducer';

export type StructureFormMode = 'create' | 'edit' | 'view';

const schemaFor = (t: TFunction, mode: StructureFormMode) =>
  z
    .object({
      code: z.string().trim(),
      name: z.string().trim().min(1, t('structures:errors.nameRequired')),
      parentCode: z.string().optional(),
      responsibleUserId: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      if (mode === 'create' && !v.code) ctx.addIssue({ code: 'custom', path: ['code'], message: t('structures:errors.codeRequired') });
    });

type FormState = z.infer<ReturnType<typeof schemaFor>>;

interface Props {
  open: boolean;
  mode: StructureFormMode;
  initial?: IStructure | null;
  /** Every structure, to choose a parent among. */
  structures: IStructure[];
  onClose: () => void;
  onSubmit: (data: IStructure) => Promise<void> | void;
}

interface Member {
  matricule: number;
  nom: string;
  prenom: string;
  serviceId?: string | null;
}

const EMPTY: FormState = { code: '', name: '', parentCode: '', responsibleUserId: '' };

/**
 * Create / edit / view a structure. The code (the HR "Unité org." number) and the parent cannot
 * change once created (a move is a separate action).
 */
export default function StructureFormDialog({ open, mode, initial, structures, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const readOnly = mode === 'view';
  const schema = useMemo(() => schemaFor(t, mode), [t, mode]);
  const [members, setMembers] = useState<Member[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormState>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const parentCode = mode === 'create' ? watch('parentCode') : (initial?.parentCode ?? '');
  const parents = useMemo(() => parentCandidates(structures), [structures]);
  const parent = structures.find((s) => s.code === parentCode);

  useEffect(() => {
    if (open)
      reset(
        initial
          ? {
              code: initial.code,
              name: initial.name,
              parentCode: initial.parentCode ?? '',
              responsibleUserId: initial.responsibleUserId ? String(initial.responsibleUserId) : '',
            }
          : EMPTY,
      );
  }, [open, initial, reset]);

  // The responsible is picked among the users of the structure itself.
  useEffect(() => {
    if (!open || mode === 'create' || !initial) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    http
      .get<Member[]>('/users')
      .then(({ data }) => {
        if (!cancelled) setMembers(data.filter((u) => u.serviceId === initial.code));
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mode, initial]);

  // A native <select> drops a value whose <option> is not rendered yet: re-apply it once the members arrive.
  useEffect(() => {
    if (open && members.length > 0 && initial?.responsibleUserId) setValue('responsibleUserId', String(initial.responsibleUserId));
  }, [open, members, initial?.responsibleUserId, setValue]);

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      code: mode === 'create' ? data.code : (initial?.code ?? data.code),
      name: data.name,
      parentCode: data.parentCode || null,
      responsibleUserId: data.responsibleUserId ? Number(data.responsibleUserId) : null,
    });
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
          <Field label={t('structures:field.parent')} hint={mode === 'create' ? t('structures:form.maxDepth') : undefined}>
            {mode === 'create' ? (
              <Select {...register('parentCode')}>
                <option value="">{t('structures:form.parentNone')}</option>
                {parents.map((s) => (
                  <option key={s.code} value={s.code}>
                    {structureLabel(s)}
                  </option>
                ))}
              </Select>
            ) : (
              <Input readOnly value={parent ? structureLabel(parent) : parentCode || t('structures:form.parentNone')} />
            )}
          </Field>
          <Field label={t('structures:field.code')} hint={mode === 'create' ? t('structures:form.codeHint') : undefined} error={errors.code?.message} required={!readOnly}>
            <Input autoFocus={mode === 'create'} readOnly={mode !== 'create'} dir="ltr" {...register('code')} />
          </Field>
          <Field label={t('structures:field.name')} error={errors.name?.message} required={!readOnly}>
            <Input autoFocus={mode === 'edit'} readOnly={readOnly} {...register('name')} />
          </Field>
          {mode !== 'create' && (
            <Field label={t('structures:field.responsible')} hint={t('structures:form.responsibleHint')}>
              <Select disabled={readOnly} {...register('responsibleUserId')}>
                <option value="">{t('structures:form.responsibleNone')}</option>
                {members.map((u) => (
                  <option key={u.matricule} value={u.matricule}>
                    {`${u.nom} ${u.prenom} (${u.matricule})`}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </FormGrid>
      </form>
    </Dialog>
  );
}
