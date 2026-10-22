import { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

type JsonRecord = Record<string, unknown>;
export interface TrashRecord extends JsonRecord {
  _id: string;
  modelType: string;
  originalId: string;
  name: string;
  deletedAt: string;
  source: 'server' | 'device';
}
export interface TrashModel {
  value: string;
  label: string;
}
export const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
const endpoints = API_ENDPOINTS.TRASH;
const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');
const aliases: Record<string, string[]> = {
  staff: ['user', 'users', 'employee', 'employees'],
  activityLog: ['activity', 'activities', 'activityLogs'],
  productType: ['type', 'types', 'productTypes'],
  productSubType: ['subtype', 'subtypes', 'productSubTypes'],
  call: ['callLog', 'callLogs', 'calls'],
  config: ['configuration', 'configurations'],
  quotation: ['order', 'orders'],
  payslip: ['salarySlip', 'salarySlips'],
};
export const trashModule = (model: string): string => {
  const modules: Record<string, string> = {
    lead: 'leads',
    customer: 'customers',
    task: 'tasks',
    staff: 'users',
    user: 'users',
    employee: 'users',
    role: 'roles',
    candidate: 'candidates',
    product: 'products',
    producttype: 'products',
    productsubtype: 'products',
    type: 'products',
    subtype: 'products',
    quotation: 'quotations',
    order: 'quotations',
    attendance: 'attendance',
    leave: 'leave',
    salary: 'salary',
    payslip: 'payroll',
    call: 'calls',
    calllog: 'calls',
    recording: 'recordings',
    activitylog: 'leads',
    activity: 'leads',
    config: 'settings',
    configuration: 'settings',
    shift: 'settings',
    holiday: 'settings',
    leavepolicy: 'settings',
    leavepolicies: 'settings',
    salaryslip: 'payroll',
    salaries: 'salary',
    weeklyoff: 'settings',
    contract: 'customers',
  };
  const key = normalize(model);
  return modules[key] ?? modules[key.replace(/s$/, '')] ?? model;
};
export const trashRecordModule = (row: TrashRecord): string => {
  const model = normalize(row.modelType).replace(/s$/, '');
  if (model === 'activitylog' || model === 'activity') {
    const data = asRecord(
      row.originalData ??
        row.data ??
        row.document ??
        row.deletedData ??
        row.snapshot
    );
    if (data.taskId) return 'tasks';
  }
  return trashModule(row.modelType);
};
async function checked(request: Promise<unknown>): Promise<JsonRecord> {
  const response = await request;
  const body = Array.isArray(response)
    ? { data: response }
    : asRecord(response);
  if (body.success === false)
    throw new Error(String(body.message ?? 'Trash request failed'));
  return { ...body, success: true };
}
export function collection(response: unknown, keys: string[]): unknown[] {
  if (Array.isArray(response)) return response;
  const body = asRecord(response);
  if (Array.isArray(body.data)) return body.data;
  for (const key of keys) {
    if (Array.isArray(body[key])) return body[key] as unknown[];
    if (Array.isArray(asRecord(body.data)[key]))
      return asRecord(body.data)[key] as unknown[];
  }
  throw new Error(
    'Unexpected Trash API response. Please check the server response format.'
  );
}
export function parseModels(response: unknown): TrashModel[] {
  return collection(response, ['models', 'modelTypes', 'items'])
    .map((item) => {
      if (typeof item === 'string') return { value: item, label: item };
      const row = asRecord(item);
      const value = String(
        row.modelType ?? row.key ?? row.value ?? row.model ?? row.name ?? ''
      );
      return {
        value,
        label: String(row.label ?? row.displayName ?? row.name ?? value),
      };
    })
    .filter((item) => item.value.trim());
}
export function parseTrashRecord(value: unknown): TrashRecord {
  const row = asRecord(value);
  const data = asRecord(
    row.originalData ??
      row.data ??
      row.document ??
      row.deletedData ??
      row.snapshot
  );
  const name =
    data.name ??
    data.title ??
    data.subject ??
    data.companyName ??
    data.productName ??
    [data.firstName, data.lastName].filter(Boolean).join(' ');
  return {
    ...row,
    _id: String(row._id ?? row.id ?? ''),
    modelType: String(row.modelType ?? row.model ?? ''),
    originalId: String(
      row.originalId ??
        row.documentId ??
        row.recordId ??
        data._id ??
        data.id ??
        ''
    ),
    name: String(name || row.name || data.email || 'Deleted record'),
    deletedAt: String(row.deletedAt ?? row.createdAt ?? ''),
    source: 'server',
  };
}
const CONTRACT_KEY = 'jemini_contracts';
const LOCAL_PREFIX = 'device-contract:';
function contracts(): JsonRecord[] {
  const stored: unknown = JSON.parse(
    localStorage.getItem(CONTRACT_KEY) ?? '[]'
  );
  if (!Array.isArray(stored))
    throw new Error('Unable to read contracts saved on this device');
  return stored.map(asRecord);
}
function deviceTrash(): TrashRecord[] {
  return contracts()
    .filter((row) => row.is_trash)
    .map((row) => ({
      ...row,
      _id: LOCAL_PREFIX + String(row.id),
      modelType: 'contract',
      originalId: String(row.id),
      name: String(row.subject ?? 'Contract'),
      deletedAt: String(row.deletedAt ?? ''),
      source: 'device',
    }));
}
function changeDevice(ids: string[], restore: boolean) {
  if (!ids.length) return;
  const selected = new Set(ids.map((id) => id.slice(LOCAL_PREFIX.length)));
  const rows = contracts();
  localStorage.setItem(
    CONTRACT_KEY,
    JSON.stringify(
      restore
        ? rows.map((row) =>
            selected.has(String(row.id))
              ? { ...row, is_trash: false, deletedAt: undefined }
              : row
          )
        : rows.filter((row) => !selected.has(String(row.id)))
    )
  );
}
export const trashService = {
  async models() {
    const response = await checked(apiRequest.get(endpoints.MODELS));
    return parseModels(response);
  },
  async move(id: string, requestedModel: string) {
    if (!id) throw new Error('Record ID is missing');
    const models = await this.models();
    const candidates = [
      requestedModel,
      requestedModel + 's',
      ...(aliases[requestedModel] ?? []),
    ].map(normalize);
    const model = candidates
      .map((candidate) =>
        models.find((item) => normalize(item.value) === candidate)
      )
      .find((item) => item !== undefined);
    if (!model)
      throw new Error(
        `The server does not support moving ${requestedModel} records to Trash.`
      );
    const result = await checked(
      apiRequest.post(endpoints.MOVE, { id, modelType: model.value })
    );
    return {
      ...result,
      success: true,
      message: String(result.message ?? 'Moved to Trash'),
    };
  },
  async list(): Promise<TrashRecord[]> {
    const rows: TrashRecord[] = [];
    const seen = new Set<string>();
    let page = 1;
    while (true) {
      const response = await checked(
        apiRequest.get(endpoints.LIST, { params: { page, limit: 100 } })
      );
      const batch = collection(response, [
        'items',
        'trash',
        'trashes',
        'records',
        'trashItems',
      ]).map(parseTrashRecord);
      if (batch.some((row) => !row._id))
        throw new Error('Trash response is missing a trash ID');
      if (batch.some((row) => seen.has(row._id)))
        throw new Error('The server returned duplicate Trash pages');
      batch.forEach((row) => seen.add(row._id));
      rows.push(...batch);
      const body = asRecord(response.data);
      const pagination = asRecord(
        body.pagination ??
          response.pagination ??
          (Array.isArray(response.data) ? response : body)
      );
      const pages = Number(
        pagination.totalPages ??
          pagination.pages ??
          (pagination.total != null
            ? Math.ceil(
                Number(pagination.total) / Number(pagination.limit ?? 100)
              )
            : 1)
      );
      if (page >= pages || !batch.length) break;
      page += 1;
    }
    return [...rows, ...deviceTrash()];
  },
  async get(id: string) {
    if (id.startsWith(LOCAL_PREFIX))
      return deviceTrash().find((row) => row._id === id);
    const response = await checked(apiRequest.get(endpoints.GET(id)));
    return response.data ?? response;
  },
  async restore(ids: string[]) {
    const remote = ids.filter((id) => !id.startsWith(LOCAL_PREFIX));
    if (remote.length === 1)
      await checked(apiRequest.post(endpoints.RESTORE(remote[0])));
    else if (remote.length)
      await checked(apiRequest.post(endpoints.RESTORE_BULK, { ids: remote }));
    changeDevice(
      ids.filter((id) => id.startsWith(LOCAL_PREFIX)),
      true
    );
  },
  async permanent(ids: string[]) {
    const remote = ids.filter((id) => !id.startsWith(LOCAL_PREFIX));
    if (remote.length === 1)
      await checked(apiRequest.delete(endpoints.PERMANENT(remote[0])));
    else if (remote.length)
      await checked(apiRequest.post(endpoints.PERMANENT_BULK, { ids: remote }));
    changeDevice(
      ids.filter((id) => id.startsWith(LOCAL_PREFIX)),
      false
    );
  },
  async empty(modelType?: string) {
    if (modelType !== 'device-contract') {
      await checked(
        apiRequest.delete(endpoints.EMPTY, {
          params: modelType ? { modelType: modelType.trim() } : undefined,
        })
      );
    }
    if (!modelType || modelType === 'device-contract')
      changeDevice(
        deviceTrash().map((row) => row._id),
        false
      );
  },
};
