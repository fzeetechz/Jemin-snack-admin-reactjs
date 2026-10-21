import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Descriptions, Dropdown, Flex, Input, DatePicker, Modal, Select, Space, Table, Typography, Upload, message } from 'antd';
import { DownloadOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { exportListing } from './listing-export';
import { displayValue, filterRows, getItemId, getValue, validateImport } from './listing-utils';
import type { TableProps } from 'antd';
import type { ImportRow, ListingField, ValidatedRow } from './listing-utils';

export interface ListingImport {
  fields: ListingField[];
  create: (row: ImportRow) => Promise<unknown>;
  onComplete: () => Promise<unknown> | void;
  validate?: (row: ImportRow) => string[];
}
interface ListingTableProps<T extends object> extends TableProps<T> {
  listingTitle: string;
  searchPlaceholder?: string;
  fields: ListingField[];
  filterKeys?: string[];
  importConfig?: ListingImport | false;
  onRefresh?: () => Promise<unknown> | void;
  serverSide?: boolean;
  onFiltersChange?: (search: string, filters: Record<string, string>) => void;
  loadExportRows?: () => Promise<T[]>;
}

export default function ListingTable<T extends object>({ listingTitle, searchPlaceholder, fields, filterKeys = [], importConfig, onRefresh, serverSide = false, onFiltersChange, loadExportRows, dataSource = [], columns = [], pagination, onChange, ...props }: ListingTableProps<T>) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exporting, setExporting] = useState(false);
  const [viewing, setViewing] = useState<T | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [reading, setReading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const dateKey = !serverSide ? fields.find((field) => ['createdAt', 'date', 'dueDate', 'start_date', 'fromDate'].includes(field.key))?.key : undefined;
  const filtered = useMemo(() => serverSide ? [...dataSource] : filterRows(dataSource, search, filters, fields), [dataSource, search, filters, fields, serverSide]);
  useEffect(() => { setPage(1); }, [search, filters, dataSource]);
  const updateFilters = (query: string, next: Record<string, string>) => { setSearch(query); setFilters(next); onFiltersChange?.(query, next); };
  const tableColumns: TableProps<T>['columns'] = [
    { title: 'Item ID', key: '__itemId', width: 190, render: (_, row) => <Typography.Text copyable={{ text: getItemId(row) }} style={{ fontFamily: 'monospace', fontSize: 12 }}>{getItemId(row) || 'Unavailable'}</Typography.Text> },
    ...columns.map((column) => {
      if ('children' in column) return column;
      const field = 'dataIndex' in column ? fields.find((item) => item.key === (Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : String(column.dataIndex))) : undefined;
      return { ...column, ...(field && !column.sorter && !serverSide ? { sorter: (a: T, b: T) => displayValue(getValue(a, field.key)).localeCompare(displayValue(getValue(b, field.key)), undefined, { numeric: true }) } : {}), ...(column.title === 'Actions' || column.key === 'actions' ? { width: Math.max(Number(column.width) || 160, 160) } : {}) };
    }),
    { title: 'Details', key: '__view', width: 90, render: (_, row) => <Button size="small" icon={<EyeOutlined />} onClick={() => setViewing(row)} aria-label={`View ${listingTitle} ${getItemId(row)}`}>View</Button> },
  ];
  const download = async (format: 'excel' | 'pdf' | 'doc') => {
    try { setExporting(true); const rows = loadExportRows ? await loadExportRows() : filtered; if (!rows.length) { message.info('No records to download'); return; } await exportListing(listingTitle, rows, fields, format); }
    catch (error) { message.error(error instanceof Error ? error.message : 'Download failed'); }
    finally { setExporting(false); }
  };
  const template = async () => {
    if (!importConfig) return;
    try {
      const XLSX = await import('xlsx'); const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([importConfig.fields.map((field) => field.key)]), 'Import');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Column', 'Required', 'Format', 'Allowed values', 'Example'], ...importConfig.fields.map((field) => [field.key, field.required ? 'Yes' : 'No', field.type ?? 'text', field.options?.join(', ') ?? '', field.example ?? ''])]), 'Instructions');
      XLSX.writeFile(workbook, `${listingTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-template.xlsx`);
    } catch { message.error('Unable to download template'); }
  };
  const readFile = async (file: File) => {
    if (!importConfig) return false;
    setImportError(''); setImportedCount(0); setImportRows([]);
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { setImportError('Select an Excel (.xlsx/.xls) or CSV file'); return false; }
    if (file.size > 10 * 1024 * 1024) { setImportError('Maximum file size is 10 MB'); return false; }
    try {
      setReading(true);
      const XLSX = await import('xlsx'); const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error('Workbook has no worksheets');
      const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: '', raw: false });
      if (!rows.length) throw new Error('The first worksheet is empty');
      if (rows.length > 1000) throw new Error('Upload up to 1,000 rows at a time');
      const validated = validateImport(rows, importConfig.fields, dataSource);
      setImportRows(validated.map((row) => ({ ...row, errors: [...row.errors, ...(importConfig.validate?.(row.payload) ?? [])] })));
    } catch (error) { setImportError(error instanceof Error ? error.message : 'Unable to read workbook'); }
    finally { setReading(false); }
    return false;
  };
  const runImport = async () => {
    if (!importConfig || !importRows.length || importRows.some((row) => row.errors.length)) return;
    setImporting(true); setImportError('');
    const failures: ValidatedRow[] = []; let successes = 0;
    try {
      for (const row of importRows) {
        try {
          const response = await importConfig.create(row.payload);
          const body = response && typeof response === 'object' && 'data' in response && !('success' in response) ? (response as { data: unknown }).data : response;
          if (!body || (typeof body === 'object' && 'success' in body && (body as { success: boolean }).success === false)) throw new Error(typeof body === 'object' && body && 'message' in body ? String(body.message) : 'Server did not confirm creation');
          successes += 1;
        } catch (error) { failures.push({ ...row, errors: [error instanceof Error ? error.message : 'Failed to create record'] }); }
      }
      setImportedCount((count) => count + successes); setImportRows(failures);
      if (failures.length) setImportError(`${failures.length} rows failed. Download the error report, correct them, and upload again. Successful rows have been removed to avoid importing them twice.`);
      else message.success(`${successes} records imported`);
      await importConfig.onComplete();
    } catch { setImportError('Import finished, but refreshing the listing failed. Refresh the page to see saved records.'); }
    finally { setImporting(false); }
  };
  const errorReport = async () => {
    const XLSX = await import('xlsx'); const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(importRows.map((row) => ({ ...row.source, 'Excel row': row.rowNumber, Errors: row.errors.join('; ') }))), 'Errors');
    XLSX.writeFile(workbook, 'import-errors.xlsx');
  };
  const paginationOptions = pagination && typeof pagination === 'object' ? pagination : {};
  return <>
    <Flex wrap gap={10} align="center" justify="space-between" style={{ marginBottom: 16 }}>
      <Space wrap>
        <Input value={search} onChange={(event) => updateFilters(event.target.value, filters)} prefix={<SearchOutlined />} placeholder={searchPlaceholder ?? `Search ${listingTitle.toLowerCase()} or Item ID`} allowClear aria-label={`Search ${listingTitle}`} style={{ width: 260 }} />
        {filterKeys.map((key) => {
          const field = fields.find((item) => item.key === key);
          const options = field?.options ?? [...new Set(dataSource.map((row) => displayValue(getValue(row, key))).filter(Boolean))].sort();
          return <Select key={key} value={filters[key] || undefined} options={options.map((value) => ({ value, label: value === 'true' ? 'Active' : value === 'false' ? 'Inactive' : value }))} placeholder={field?.label ?? key} allowClear showSearch optionFilterProp="label" aria-label={`Filter ${field?.label ?? key}`} style={{ minWidth: 150 }} onChange={(value) => updateFilters(search, { ...filters, [key]: value ?? '' })} />;
        })}
        {dateKey && <DatePicker.RangePicker aria-label="Filter date range" value={filters.__dateFrom && filters.__dateTo ? [dayjs(filters.__dateFrom), dayjs(filters.__dateTo)] : null} onChange={(dates) => updateFilters(search, { ...filters, __dateField: dateKey, __dateFrom: dates?.[0]?.format('YYYY-MM-DD') ?? '', __dateTo: dates?.[1]?.format('YYYY-MM-DD') ?? '' })} />}
        {(search || Object.values(filters).some(Boolean)) && <Button onClick={() => updateFilters('', {})}>Clear filters</Button>}
      </Space>
      <Space wrap>
        {onRefresh && <Button icon={<ReloadOutlined />} onClick={async () => { try { await onRefresh(); } catch { message.error('Unable to refresh records'); } }}>Refresh</Button>}
        <Dropdown menu={{ items: [{ key: 'doc', label: 'Word document (.docx)' }, { key: 'pdf', label: 'PDF (.pdf)' }, { key: 'excel', label: 'Excel (.xlsx)' }], onClick: ({ key }) => void download(key as 'excel' | 'pdf' | 'doc') }} disabled={exporting || (!filtered.length && !loadExportRows)}><Button icon={<DownloadOutlined />} loading={exporting}>Download {serverSide && !loadExportRows ? 'current page' : 'filtered records'}</Button></Dropdown>
        {importConfig && <Button icon={<UploadOutlined />} onClick={() => { setImportOpen(true); setImportRows([]); setImportError(''); setImportedCount(0); }}>Upload Excel</Button>}
      </Space>
    </Flex>
    <Table<T> {...props} dataSource={filtered} columns={tableColumns} scroll={{ x: 'max-content', ...props.scroll }} pagination={{ defaultPageSize: 10, ...(serverSide ? paginationOptions : { current: Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize))), pageSize, total: filtered.length, onChange: (next, size) => { setPage(next); setPageSize(size); } }), showSizeChanger: true, showQuickJumper: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} records` }} onChange={onChange} />
    <Modal title={`${listingTitle} details`} open={!!viewing} onCancel={() => setViewing(null)} footer={<Button onClick={() => setViewing(null)}>Close</Button>} width={720}>
      {viewing && <Descriptions bordered column={1} items={[{ key: '__id', label: 'Item ID', children: <Typography.Text copyable>{getItemId(viewing)}</Typography.Text> }, ...fields.map((field) => ({ key: field.key, label: field.label, children: displayValue(getValue(viewing, field.key)) || '—' }))]} />}
    </Modal>
    {importConfig && <Modal title={`Bulk upload ${listingTitle.toLowerCase()}`} open={importOpen} onCancel={() => { if (!importing && !reading) setImportOpen(false); }} closable={!importing && !reading} maskClosable={!importing && !reading} width={1000} footer={<Space><Button disabled={importing || reading} onClick={() => setImportOpen(false)}>Close</Button><Button type="primary" loading={importing} disabled={reading || !importRows.length || importRows.some((row) => row.errors.length > 0)} onClick={() => void runImport()}>Import {importRows.length} records</Button></Space>}>
      <Space orientation="vertical" style={{ width: '100%' }} size={16}>
        <Alert type="info" showIcon message="Download the template, fill the first worksheet, then upload it for review." description="This creates new records. Required columns and formats are explained in the Instructions worksheet. Existing records are never overwritten." />
        <Space><Button icon={<DownloadOutlined />} onClick={() => void template()}>Download template</Button><Upload accept=".xlsx,.xls,.csv" showUploadList={false} disabled={importing || reading} beforeUpload={readFile}><Button icon={<UploadOutlined />} loading={reading}>Choose Excel file</Button></Upload>{importRows.some((row) => row.errors.length) && <Button onClick={() => void errorReport()}>Download error report</Button>}</Space>
        {importError && <Alert type="error" showIcon message={importError} />}
        {importedCount > 0 && <Alert type="success" showIcon message={`${importedCount} records saved successfully`} />}
        {importRows.length > 0 && <><Typography.Text>{importRows.length} rows · {importRows.filter((row) => row.errors.length).length} with errors. Fix errors before importing.</Typography.Text><Table<ValidatedRow> size="small" rowKey="rowNumber" dataSource={importRows} scroll={{ x: 'max-content', y: 350 }} pagination={{ defaultPageSize: 10, showSizeChanger: true }} columns={[{ title: 'Excel row', dataIndex: 'rowNumber', width: 90 }, ...importConfig.fields.map((field) => ({ title: field.label, key: field.key, render: (_: unknown, row: ValidatedRow) => field.key === 'password' ? '••••••••' : displayValue(row.payload[field.key]) })), { title: 'Validation', key: 'errors', width: 250, render: (_, row) => <Typography.Text type={row.errors.length ? 'danger' : 'success'}>{row.errors.join('; ') || 'Ready'}</Typography.Text> }]} /></>}
      </Space>
    </Modal>}
  </>;
}
