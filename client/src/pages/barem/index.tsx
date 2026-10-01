import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import http from 'helpers/http';
import { useApiHandler } from 'components/hooks/useErrorHandler';
import { PageHeader, Panel } from 'components/ui';
import paths from 'routes/paths';
import { categoryLabels } from 'constants/labels';
import { formatDA } from 'lib/format';

type Category = 'EXECUTION_MAITRISE' | 'CADRE' | 'CADRE_SUPERIEUR';

/** A barème row as stored on the server: the rates décomptes are computed with. */
interface BaremData {
  id: number;
  libell: Category;
  repas_nord: number;
  hebergement_nord: number;
  repas_sud: number;
  hebergement_sud: number;
  montant_km: number;
}

const da = (value: number) => formatDA(value, 0);

// The official category number, which also orders the table.
const codeOf: Record<Category, string> = { EXECUTION_MAITRISE: '01', CADRE: '02', CADRE_SUPERIEUR: '03' };

const th = 'border border-border px-3 py-2 font-semibold';
const td = 'border border-border px-3 py-2 tabular-nums';

/** Read-only official rate table (per catégorie and Direction), as used by the décompte calculation. */
export default function BaremTable() {
  const { t } = useTranslation();
  const { handleError } = useApiHandler();
  const [rows, setRows] = useState<BaremData[] | null>(null);

  useEffect(() => {
    http
      .get<BaremData[]>('/barem')
      .then((res) => setRows([...res.data].sort((a, b) => codeOf[a.libell].localeCompare(codeOf[b.libell]))))
      .catch((err) => {
        handleError(err);
        setRows([]);
      });
  }, [handleError]);

  return (
    <>
      <PageHeader
        title={t('barem:title')}
        description={t('barem:description')}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.barem') }]}
      />
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{t('barem:caption')}</caption>
            <thead className="bg-surface-header text-fg">
              <tr>
                <th scope="col" rowSpan={2} className={`${th} text-start`}>
                  {t('barem:category')}
                </th>
                <th scope="col" rowSpan={2} className={`${th} text-start`}>
                  {t('barem:label')}
                </th>
                <th scope="colgroup" colSpan={2} className={`${th} text-center`}>
                  {t('barem:north')}
                </th>
                <th scope="colgroup" colSpan={2} className={`${th} text-center`}>
                  {t('barem:south')}
                </th>
                <th scope="col" rowSpan={2} className={`${th} text-end`}>
                  {t('barem:perKm')}
                </th>
              </tr>
              <tr>
                <th scope="col" className={`${th} text-end`}>{t('barem:meal')}</th>
                <th scope="col" className={`${th} text-end`}>{t('barem:lodging')}</th>
                <th scope="col" className={`${th} text-end`}>{t('barem:meal')}</th>
                <th scope="col" className={`${th} text-end`}>{t('barem:lodging')}</th>
              </tr>
            </thead>
            <tbody>
              {rows === null || rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`${td} text-center text-fg-muted`}>
                    {rows === null ? t('table.loading') : t('table.empty')}
                  </td>
                </tr>
              ) : null}
              {rows?.map((row) => (
                <tr key={row.id} className="even:bg-surface-muted">
                  <th scope="row" className={`${td} text-start font-medium`}>
                    {codeOf[row.libell]}
                  </th>
                  <td className={td}>{categoryLabels[row.libell] ?? row.libell}</td>
                  <td className={`${td} text-end`}>{da(row.repas_nord)}</td>
                  <td className={`${td} text-end`}>{da(row.hebergement_nord)}</td>
                  <td className={`${td} text-end`}>{da(row.repas_sud)}</td>
                  <td className={`${td} text-end`}>{da(row.hebergement_sud)}</td>
                  <td className={`${td} text-end`}>{t('barem:perKmValue', { amount: da(row.montant_km) })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="mt-3 text-xs text-fg-subtle">{t('barem:note')}</p>
    </>
  );
}
