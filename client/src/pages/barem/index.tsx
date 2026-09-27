import { useTranslation } from 'react-i18next';
import { PageHeader, Panel } from 'components/ui';
import baremJson from 'data/barem.json';
import paths from 'routes/paths';
import { categoryLabels } from 'constants/labels';
import { formatDA } from 'lib/format';

interface BaremData {
  id: string;
  libelle: string;
  repas_nord: number;
  hebergement_nord: number;
  repas_sud: number;
  hebergement_sud: number;
  montant_km: number;
}

const rows: BaremData[] = baremJson;

const da = (value: number) => formatDA(value, 0);

// Barème rows are keyed by the official category number.
const categoryOf: Record<string, string> = { '01': 'EXECUTION_MAITRISE', '02': 'CADRE', '03': 'CADRE_SUPERIEUR' };

const th = 'border border-border px-3 py-2 font-semibold';
const td = 'border border-border px-3 py-2 tabular-nums';

/** Read-only official rate table (per catégorie and Direction). */
export default function BaremTable() {
  const { t } = useTranslation();
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
              {rows.map((row) => (
                <tr key={row.id} className="even:bg-surface-muted">
                  <th scope="row" className={`${td} text-start font-medium`}>
                    {row.id}
                  </th>
                  <td className={td}>{categoryLabels[categoryOf[row.id]] ?? row.libelle}</td>
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
