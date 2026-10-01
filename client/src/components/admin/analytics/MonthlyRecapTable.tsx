import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import i18n from "i18n";
import type { AppDispatch } from "store";
import { setAlert } from "components/alert/alert.reducer";
import { AlertTypes } from "constants/alert";
import { Button, Loader, Panel } from "components/ui";
import { extractErrorMessage } from "helpers/errorHandler";
import { formatDA, formatNumber, intlLocale } from "lib/format";
import { cn } from "lib/utils";
import {
  downloadMonthlyRecap,
  getMonthlyRecap,
  type MonthlyRecap,
  type MonthlyRecapRow,
} from "./api";

const da = (v: number) => formatDA(v, 0);

/** "2026-03" → "mars 2026" / "مارس 2026". */
const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(intlLocale(), {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

const cell = "border-b border-border px-3 py-2";
const num = cn(cell, "text-end tabular-nums");

/** Décomptes cumulated per month (counts and amounts per status), exportable to Excel. */
export default function MonthlyRecapTable({
  exerciceId,
  fileSuffix,
}: {
  exerciceId?: number;
  fileSuffix: string;
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [recap, setRecap] = useState<MonthlyRecap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRecap(null);
    setError(null);
    getMonthlyRecap(exerciceId)
      .then((r) => !cancelled && setRecap(r))
      .catch((err) => !cancelled && setError(extractErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [exerciceId]);

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadMonthlyRecap(
        exerciceId,
        `recap-decomptes-${fileSuffix}.xlsx`,
      );
      dispatch(
        setAlert({
          msg: i18n.t("toasts:recapExported"),
          type: AlertTypes.SUCCESS,
        }),
      );
    } catch (err) {
      dispatch(
        setAlert({ msg: extractErrorMessage(err), type: AlertTypes.ERROR }),
      );
    } finally {
      setExporting(false);
    }
  };

  const row = (r: MonthlyRecapRow, isTotal = false) => (
    <tr
      key={r.month}
      className={
        isTotal ? "bg-surface-header font-semibold" : "even:bg-surface-muted"
      }
    >
      <th
        scope="row"
        className={cn(
          cell,
          "text-start",
          isTotal ? "font-semibold" : "font-medium",
        )}
      >
        {isTotal ? t("analytics:monthlyRecap.total") : monthLabel(r.month)}
      </th>
      <td className={num}>{formatNumber(r.totalCount)}</td>
      <td className={num}>{formatNumber(r.pendingCount)}</td>
      <td className={num}>{da(r.pendingAmount)}</td>
      <td className={num}>{formatNumber(r.acceptedCount)}</td>
      <td className={num}>{da(r.acceptedAmount)}</td>
      <td className={num}>{formatNumber(r.rejectedCount)}</td>
      <td className={num}>{da(r.rejectedAmount)}</td>
      <td className={cn(num, "font-semibold")}>{da(r.totalAmount)}</td>
      <td className={num}>{da(r.feesTransport)}</td>
      <td className={num}>{formatNumber(r.distance, 0)}</td>
      <td className={num}>{formatNumber(r.agents)}</td>
    </tr>
  );

  const head = "border-b border-border px-3 py-2 font-semibold";
  const nb = t("analytics:monthlyRecap.nb");
  const amount = t("analytics:monthlyRecap.amount");

  return (
    <Panel
      title={t("analytics:monthlyRecap.title")}
      bodyClassName="p-0"
      actions={
        <Button
          onClick={() => void onExport()}
          disabled={exporting || !recap || recap.total.totalCount === 0}
        >
          <Download />
          {t("analytics:monthlyRecap.exportExcel")}
        </Button>
      }
    >
      {error && (
        <p role="alert" className="px-4 py-6 text-sm text-danger">
          {error}
        </p>
      )}
      {!error && !recap && <Loader />}
      {recap && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <caption className="sr-only">
              {t("analytics:monthlyRecap.caption")}
            </caption>
            <thead className="bg-surface-header">
              <tr>
                <th scope="col" rowSpan={2} className={cn(head, "text-start")}>
                  {t("analytics:monthlyRecap.month")}
                </th>
                <th scope="col" rowSpan={2} className={cn(head, "text-end")}>
                  {t("analytics:monthlyRecap.count")}
                </th>
                <th
                  scope="colgroup"
                  colSpan={2}
                  className={cn(head, "text-center")}
                >
                  {t("analytics:monthlyRecap.pending")}
                </th>
                <th
                  scope="colgroup"
                  colSpan={2}
                  className={cn(head, "text-center")}
                >
                  {t("analytics:monthlyRecap.accepted")}
                </th>
                <th
                  scope="colgroup"
                  colSpan={2}
                  className={cn(head, "text-center")}
                >
                  {t("analytics:monthlyRecap.rejected")}
                </th>
                <th scope="col" rowSpan={2} className={cn(head, "text-end")}>
                  {t("analytics:monthlyRecap.totalAmount")}
                </th>
                <th scope="col" rowSpan={2} className={cn(head, "text-end")}>
                  {t("analytics:monthlyRecap.fees")}
                </th>
                <th scope="col" rowSpan={2} className={cn(head, "text-end")}>
                  {t("analytics:monthlyRecap.distance")}
                </th>
                <th scope="col" rowSpan={2} className={cn(head, "text-end")}>
                  {t("analytics:monthlyRecap.agents")}
                </th>
              </tr>
              <tr>
                {[0, 1, 2].flatMap((i) => [
                  <th
                    key={`nb${i}`}
                    scope="col"
                    className={cn(head, "text-end font-medium text-fg-muted")}
                  >
                    {nb}
                  </th>,
                  <th
                    key={`amt${i}`}
                    scope="col"
                    className={cn(head, "text-end font-medium text-fg-muted")}
                  >
                    {amount}
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {recap.rows.map((r) => row(r))}
              {recap.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-6 text-center text-fg-muted"
                  >
                    {t("analytics:noData")}
                  </td>
                </tr>
              )}
            </tbody>
            {recap.rows.length > 0 && <tfoot>{row(recap.total, true)}</tfoot>}
          </table>
        </div>
      )}
    </Panel>
  );
}
