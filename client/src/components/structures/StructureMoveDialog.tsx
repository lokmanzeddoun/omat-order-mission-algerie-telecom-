import { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { canBecomeRoot, moveTargets, structureLabel } from 'helpers/structureTree';
import { Button, Dialog, Field, Select } from 'components/ui';
import type { IStructure } from './structure.reducer';

const ROOT = '__root__';

interface Props {
  /** The structure to move; null keeps the dialog closed. */
  structure: IStructure | null;
  structures: IStructure[];
  onClose: () => void;
  onMove: (target: { parentCode: string | null }) => Promise<void> | void;
}

/**
 * Moves a structure and its subtree (super admin); codes never change. Only the places the API would accept are
 * offered: never under itself or a descendant, and never deeper than three levels.
 */
export default function StructureMoveDialog({ structure, structures, onClose, onMove }: Props) {
  const { t } = useTranslation();
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const targets = useMemo(() => (structure ? moveTargets(structure, structures) : []), [structure, structures]);
  const rootAllowed = !!structure && canBecomeRoot(structure, structures);

  useEffect(() => {
    setTarget('');
    setTouched(false);
  }, [structure]);

  const submit = async () => {
    setTouched(true);
    if (!target) return;
    setBusy(true);
    try {
      await onMove({ parentCode: target === ROOT ? null : target });
    } finally {
      setBusy(false);
    }
  };

  const nothing = targets.length === 0 && !rootAllowed;

  return (
    <Dialog
      open={structure !== null}
      onOpenChange={(o) => !o && onClose()}
      title={t('structures:move.title')}
      description={
        <Trans t={t} i18nKey="structures:move.description" values={{ name: structure ? structureLabel(structure) : '' }} components={{ b: <strong /> }} />
      }
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || nothing}>
            {t('structures:move.confirm')}
          </Button>
        </>
      }
    >
      {nothing ? (
        <p className="text-sm text-fg-muted">{t('structures:move.none')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label={t('structures:move.target')} error={touched && !target ? t('structures:errors.parentUnknown') : undefined} required>
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">{t('structures:move.choose')}</option>
              {rootAllowed && <option value={ROOT}>{t('structures:move.asRoot')}</option>}
              {targets.map((s) => (
                <option key={s.code} value={s.code}>
                  {structureLabel(s)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
    </Dialog>
  );
}
