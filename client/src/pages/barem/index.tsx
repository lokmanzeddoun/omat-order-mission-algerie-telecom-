import { useTranslation } from 'react-i18next';
import { PageHeader, Panel } from 'components/ui';
import baremJson from 'data/barem.json';
import paths from 'routes/paths';

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

const amount = new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 });
const da = (value: number) => `${amount.format(value)} DA`;

const th = 'border border-border px-3 py-2 font-semibold';
const td = 'border border-border px-3 py-2 tabular-nums';

/** Read-only official rate table (per catégorie and Direction). */
export default function BaremTable() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title="Barème des frais de mission"
        description="Tarifs applicables pour les frais de repas, d’hébergement et de transport, par catégorie et par direction."
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.barem') }]}
      />
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Barème des frais de mission par catégorie</caption>
            <thead className="bg-surface-header text-fg">
              <tr>
                <th scope="col" rowSpan={2} className={`${th} text-start`}>
                  Catégorie
                </th>
                <th scope="col" rowSpan={2} className={`${th} text-start`}>
                  Libellé
                </th>
                <th scope="colgroup" colSpan={2} className={`${th} text-center`}>
                  Direction Nord
                </th>
                <th scope="colgroup" colSpan={2} className={`${th} text-center`}>
                  Direction Sud
                </th>
                <th scope="col" rowSpan={2} className={`${th} text-end`}>
                  Indemnité kilométrique
                </th>
              </tr>
              <tr>
                <th scope="col" className={`${th} text-end`}>Repas</th>
                <th scope="col" className={`${th} text-end`}>Hébergement</th>
                <th scope="col" className={`${th} text-end`}>Repas</th>
                <th scope="col" className={`${th} text-end`}>Hébergement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="even:bg-surface-muted">
                  <th scope="row" className={`${td} text-start font-medium`}>
                    {row.id}
                  </th>
                  <td className={td}>{row.libelle}</td>
                  <td className={`${td} text-end`}>{da(row.repas_nord)}</td>
                  <td className={`${td} text-end`}>{da(row.hebergement_nord)}</td>
                  <td className={`${td} text-end`}>{da(row.repas_sud)}</td>
                  <td className={`${td} text-end`}>{da(row.hebergement_sud)}</td>
                  <td className={`${td} text-end`}>{da(row.montant_km)} / km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="mt-3 text-xs text-fg-subtle">Montants exprimés en dinars algériens (DA).</p>
    </>
  );
}
