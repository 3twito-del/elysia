import ExcelJS from "exceljs";

import { toDisplayString } from "~/lib/stringify";
import { reportToMatrix, type ReportResult } from "~/server/services/report-engine";

/**
 * Excel export for saved reports (RPT-003). Uses the pure reportToMatrix
 * flattening so the sheet mirrors the CSV export, with measures kept numeric.
 */

/** Builds an .xlsx workbook as a plain ArrayBuffer from a report result. */
export async function buildReportXlsx(
  result: ReportResult,
  sheetName = "דוח",
): Promise<ArrayBuffer> {
  const matrix = reportToMatrix(result);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Elysia";
  workbook.created = new Date();

  // Excel caps sheet names at 31 chars and forbids some characters.
  const safeName = sheetName.replace(/[*?:\\/[\]]/g, " ").slice(0, 31) || "דוח";
  const sheet = workbook.addWorksheet(safeName, { views: [{ rightToLeft: true }] });

  const headerRow = sheet.addRow(matrix.header);
  headerRow.font = { bold: true };

  for (const row of matrix.rows) {
    sheet.addRow(row);
  }

  const totalsRow = sheet.addRow(matrix.totals);
  totalsRow.font = { bold: true };

  sheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const length = toDisplayString(cell.value ?? "").length;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 40);
  });

  const written = await workbook.xlsx.writeBuffer();
  // Copy into a fresh, plain ArrayBuffer so it is a valid Web Response body.
  const bytes = new Uint8Array(written);
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}
