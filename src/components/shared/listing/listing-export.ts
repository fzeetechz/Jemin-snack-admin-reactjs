import { displayValue, getItemId, getValue } from './listing-utils';
import type { ListingField } from './listing-utils';
export const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export async function exportListing(title: string, rows: readonly object[], fields: ListingField[], format: 'excel' | 'pdf' | 'doc') {
  const headers = ['Item ID', ...fields.map((field) => field.label)];
  const values = rows.map((row) => [getItemId(row), ...fields.map((field) => displayValue(getValue(row, field.key)))]);
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}`;
  if (format === 'excel') {
    const XLSX = await import('xlsx'); const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...values]); sheet['!cols'] = headers.map(() => ({ wch: 24 })); sheet['!autofilter'] = { ref: sheet['!ref']! };
    XLSX.utils.book_append_sheet(workbook, sheet, 'Records'); XLSX.writeFile(workbook, `${filename}.xlsx`);
  } else if (format === 'pdf') {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ orientation: 'landscape', format: 'a3' }); doc.setFontSize(16); doc.text(title, 14, 16); doc.setFontSize(10); doc.text(`${rows.length} records | ${new Date().toLocaleString()}`, 14, 24);
    autoTable(doc, { head: [headers], body: values, startY: 30, styles: { fontSize: 7, overflow: 'linebreak' }, headStyles: { fillColor: [22, 119, 255] }, margin: { bottom: 16 }, didDrawPage: () => { doc.text(`Page ${doc.getNumberOfPages()}`, 14, doc.internal.pageSize.height - 8); } }); doc.save(`${filename}.pdf`);
  } else {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, PageOrientation } = await import('docx');
    const tableRows = [headers, ...values].map((row, index) => new TableRow({ tableHeader: index === 0, children: row.map((value) => new TableCell({ children: [new Paragraph(value)] })) }));
    const doc = new Document({ sections: [{ properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } }, children: [new Paragraph({ text: title, heading: 'Heading1' }), new Paragraph(`${rows.length} records | ${new Date().toLocaleString()}`), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows })] }] });
    saveBlob(await Packer.toBlob(doc), `${filename}.docx`);
  }
}
