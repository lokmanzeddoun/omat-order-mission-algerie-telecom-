import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import http from 'helpers/http';
import { categoryLabels, toOptions } from 'constants/labels';
import { higherCategories, type GradeCategory, type GradeKind } from 'lib/grade-assignments';
import { Button, DatePicker, Dialog, Field, FormGrid, Input, Select } from 'components/ui';

export interface GradeAssignmentInput {
  userId: number;
  kind: GradeKind;
  targetCategory: GradeCategory;
  startDate: string;
  endDate: string;
  decisionRef: string;
}

interface UserOption {
  matricule: number;
  nom: string;
  prenom: string;
  category: string;
  status?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GradeAssignmentInput) => Promise<void>;
}

const empty = { userId: '', kind: 'INTERIM', targetCategory: '', startDate: '', endDate: '', decisionRef: '' };

/** Creates an Interim / Remplaçant period (super admin). The server checks caps, overlaps and the target category. */
export default function GradeAssignmentDialog({ open, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState(empty);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(empty);
    setTouched(false);
    let cancelled = false;
    http
      .get<UserOption[]>('/users')
      .then((res) => !cancelled && setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => !cancelled && setUsers([]));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const user = users.find((u) => String(u.matricule) === form.userId);
  const targets = useMemo(() => higherCategories(user?.category), [user]);
  const set = (patch: Partial<typeof empty>) => setForm((f) => ({ ...f, ...patch }));

  const errors = {
    userId: !form.userId ? t('gradeAssignments:errors.userRequired') : undefined,
    targetCategory: !form.targetCategory ? t('gradeAssignments:errors.targetRequired') : undefined,
    startDate: !form.startDate ? t('gradeAssignments:errors.startRequired') : undefined,
    endDate: !form.endDate
      ? t('gradeAssignments:errors.endRequired')
      : form.startDate && form.endDate < form.startDate
        ? t('gradeAssignments:errors.endBeforeStart')
        : undefined,
    decisionRef: !form.decisionRef.trim() ? t('gradeAssignments:errors.decisionRequired') : undefined,
  };
  const valid = Object.values(errors).every((e) => !e);
  const shown = (key: keyof typeof errors) => (touched ? errors[key] : undefined);

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({
        userId: Number(form.userId),
        kind: form.kind as GradeKind,
        targetCategory: form.targetCategory as GradeCategory,
        startDate: form.startDate,
        endDate: form.endDate,
        decisionRef: form.decisionRef.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t('gradeAssignments:form.title')}
      size="md"
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>
            {t('actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="grade-assignment-form" disabled={submitting}>
            {t('actions.add')}
          </Button>
        </>
      }
    >
      <form
        id="grade-assignment-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <FormGrid>
          <Field label={t('gradeAssignments:field.user')} error={shown('userId')} required full>
            <Select value={form.userId} onChange={(e) => set({ userId: e.target.value, targetCategory: '' })}>
              <option value="">{t('gradeAssignments:form.pickUser')}</option>
              {users
                .filter((u) => u.status !== 'INACTIVE' && higherCategories(u.category).length > 0)
                .map((u) => (
                  <option key={u.matricule} value={u.matricule}>
                    {`${u.prenom} ${u.nom} (${u.matricule}) · ${categoryLabels[u.category] ?? u.category}`}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label={t('gradeAssignments:field.kind')} required>
            <Select value={form.kind} onChange={(e) => set({ kind: e.target.value })}>
              <option value="INTERIM">{t('gradeAssignments:kind.INTERIM')}</option>
              <option value="REMPLACANT">{t('gradeAssignments:kind.REMPLACANT')}</option>
            </Select>
          </Field>
          <Field
            label={t('gradeAssignments:field.target')}
            error={shown('targetCategory')}
            hint={form.kind === 'REMPLACANT' ? t('gradeAssignments:form.capRemplacant') : t('gradeAssignments:form.capInterim')}
            required
          >
            <Select value={form.targetCategory} onChange={(e) => set({ targetCategory: e.target.value })} disabled={!user}>
              <option value="">{t('gradeAssignments:form.pickTarget')}</option>
              {toOptions(categoryLabels)
                .filter((o) => targets.includes(o.value as GradeCategory))
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label={t('gradeAssignments:field.start')} error={shown('startDate')} required>
            <DatePicker value={form.startDate} onChange={(v) => set({ startDate: v })} />
          </Field>
          <Field label={t('gradeAssignments:field.end')} error={shown('endDate')} required>
            <DatePicker value={form.endDate} onChange={(v) => set({ endDate: v })} min={form.startDate || undefined} />
          </Field>
          <Field label={t('gradeAssignments:field.decisionRef')} error={shown('decisionRef')} required full>
            <Input value={form.decisionRef} onChange={(e) => set({ decisionRef: e.target.value })} />
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
