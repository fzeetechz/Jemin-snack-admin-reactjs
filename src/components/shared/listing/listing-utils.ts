export interface ListingField {
  key: string;
  label: string;
  required?: boolean;
  type?: 'number' | 'boolean' | 'date' | 'json' | 'email';
  options?: string[];
  unique?: boolean;
  example?: string | number | boolean;
}
export type ImportRow = Record<string, unknown>;
export const getValue = (row: object, path: string): unknown => path.split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as ImportRow)[key] : undefined, row);
export const displayValue = (value: unknown): string => {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (typeof value === 'object') {
    const item = value as ImportRow;
    return String(item.name ?? item.label ?? ([item.firstName, item.lastName].filter(Boolean).join(' ') || JSON.stringify(value)));
  }
  return String(value);
};
export const getItemId = (row: object): string => {
  const record = row as ImportRow;
  if (record.employee && record.period) { const employee = record.employee as ImportRow; const period = record.period as ImportRow; return `${employee._id}-${period.year}-${String(period.month).padStart(2, '0')}`; }
  return String(record.itemId ?? record.customerCode ?? record.quotationNo ?? record._id ?? record.id ?? record.key ?? '');
};
export interface ValidatedRow { rowNumber: number; source: ImportRow; payload: ImportRow; errors: string[] }
const normalized = (key: string) => key.toLowerCase().replace(/[\s_*.-]/g, '');
export function validateImport(rows: ImportRow[], fields: ListingField[], existing: readonly object[] = []): ValidatedRow[] {
  const seen = new Map<string, Set<string>>();
  fields.filter((field) => field.unique).forEach((field) => seen.set(field.key, new Set(existing.map((row) => displayValue(getValue(row, field.key)).trim().toLowerCase()).filter(Boolean))));
  return rows.map((source, index) => {
    const payload: ImportRow = {};
    const errors: string[] = [];
    const headers = new Map(Object.entries(source).map(([key, value]) => [normalized(key), value]));
    for (const field of fields) {
      const raw = headers.get(normalized(field.key)) ?? headers.get(normalized(field.label));
      const text = String(raw ?? '').trim();
      if (!text) { if (field.required) errors.push(`${field.label} is required`); continue; }
      let value: unknown = text;
      if (field.type === 'number') { value = Number(text); if (!Number.isFinite(value) || Number(value) < 0) errors.push(`${field.label} must be a non-negative number`); }
      else if (field.type === 'boolean') { if (!['true', 'false', 'yes', 'no', '1', '0'].includes(text.toLowerCase())) errors.push(`${field.label} must be true or false`); value = ['true', 'yes', '1'].includes(text.toLowerCase()); }
      else if (field.type === 'date') { if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text) errors.push(`${field.label} must be a valid YYYY-MM-DD date`); }
      else if (field.type === 'json') { try { value = JSON.parse(text); } catch { errors.push(`${field.label} must contain valid JSON`); } }
      else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) errors.push(`${field.label} is invalid`);
      if (field.options && !field.options.includes(text)) errors.push(`${field.label}: choose ${field.options.join(', ')}`);
      if (field.unique) { const values = seen.get(field.key)!; const key = text.toLowerCase(); if (values.has(key)) errors.push(`${field.label} already exists or is duplicated in this file`); values.add(key); }
      payload[field.key] = value;
    }
    return { rowNumber: index + 2, source, payload, errors };
  });
}
export function filterRows<T extends object>(rows: readonly T[], search: string, filters: Record<string, string>, fields: ListingField[]): T[] {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => (!query || [getItemId(row), ...fields.map((field) => displayValue(getValue(row, field.key)))].join(' ').toLowerCase().includes(query)) && Object.entries(filters).every(([key, value]) => key.startsWith('__') || !value || displayValue(getValue(row, key)) === value) && (!filters.__dateFrom || (displayValue(getValue(row, filters.__dateField)).slice(0, 10) >= filters.__dateFrom && displayValue(getValue(row, filters.__dateField)).slice(0, 10) <= filters.__dateTo)));
}
