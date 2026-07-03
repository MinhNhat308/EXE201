import * as XLSX from 'xlsx';

export type ExcelSheet = {
  name: string;
  rows: Record<string, string | number | undefined>[];
};

/** Xuất một hoặc nhiều sheet ra file .xlsx */
export function exportToExcel(sheets: ExcelSheet[], filename: string) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const safeName = sheet.name.slice(0, 31).replace(/[\\/?*[\]]/g, '_');
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, safeName || 'Sheet');
  }
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/** Xuất toàn bộ bundle báo cáo cửa hàng — nhiều sheet */
export function exportStoreReportBundle(
  sheets: ExcelSheet[],
  storeName: string,
  date: string,
) {
  const slug = storeName.replace(/\s+/g, '_').slice(0, 20);
  exportToExcel(sheets, `BaoCao_${slug}_${date}.xlsx`);
}
