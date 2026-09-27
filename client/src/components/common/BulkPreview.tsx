import { useTranslation } from 'react-i18next';

/** How many names a bulk confirmation lists before "et N autres". */
const PREVIEW = 5;

/** The first rows of a bulk confirmation, then "… et N autres". */
export function BulkPreview({ names, total }: { names: string[]; total: number }) {
  const { t } = useTranslation();
  return (
    <ul className="list-inside list-disc text-sm">
      {names.slice(0, PREVIEW).map((name, i) => (
        <li key={i}>{name}</li>
      ))}
      {total > PREVIEW && <li className="list-none text-fg-muted">{t('bulk:andOthers', { count: total - PREVIEW })}</li>}
    </ul>
  );
}
