import ExcelJS from 'exceljs';
import { sanitizeCell } from './import-validation';

/** Builds a simple, formula-safe XLSX worksheet from records. */
export async function exportWorkbook(
  sheetName: string,
  rows: Record<string, unknown>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(headers.map((header) => sanitizeCell(row[header])));
  }
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => {
    column.width = Math.min(
      40,
      Math.max(
        12,
        ...column.values
          .slice(1)
          .map((value) => String(value ?? '').length + 2),
      ),
    );
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
