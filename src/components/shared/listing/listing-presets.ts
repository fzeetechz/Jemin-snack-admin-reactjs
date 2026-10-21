import { apiRequest } from '../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../services/api/endpoints';
import { MODULES } from '../../../config/permissions';
import type { ImportRow, ListingField } from './listing-utils';
import type { ListingImport } from './ListingTable';

const field = (key: string, label: string, extra: Partial<ListingField> = {}): ListingField => ({ key, label, ...extra });
const name = field('name', 'Name', { required: true });
const email = field('email', 'Email', { type: 'email' });
const phone = field('phone', 'Phone');
const status = field('status', 'Status');
export const LISTING_FIELDS = {
  products: [name, field('description', 'Description'), field('category', 'Type'), field('subCategory', 'Subtype'), field('unit', 'Unit'), field('prices', 'Sizes and prices'), field('quantity', 'Quantity'), field('isActive', 'Active')],
  types: [name],
  subtypes: [name, field('category', 'Type')],
  leads: [name, email, phone, field('company', 'Company'), status, field('source', 'Source'), field('priority', 'Priority'), field('assignedTo', 'Assigned to'), field('city', 'City'), field('state', 'State'), field('leadValue', 'Lead value'), field('createdAt', 'Created at')],
  customers: [name, email, phone, field('altPhone', 'Alternate phone'), field('type', 'Type'), field('isActive', 'Active'), field('companyName', 'Company'), field('address.street', 'Street'), field('address.city', 'City'), field('address.state', 'State'), field('address.pincode', 'Pincode'), field('address.country', 'Country')],
  tasks: [field('subject', 'Subject'), status, field('priority', 'Priority'), field('assignee', 'Assignee'), field('relatedTo.type', 'Related type'), field('relatedTo.id', 'Related record'), field('dueDate', 'Due date'), field('description', 'Description'), field('createdAt', 'Created at')],
  quotations: [field('quotationNo', 'Order number'), field('billTo.name', 'Customer'), field('billTo.phone', 'Phone'), field('billTo.email', 'Email'), field('billTo.address', 'Address'), field('orderStatus', 'Status'), field('products', 'Products'), field('subtotal', 'Subtotal'), field('tax', 'Tax'), field('discount', 'Discount'), field('total', 'Total'), field('createdAt', 'Created at')],
  contracts: [field('customer_name', 'Customer'), field('subject', 'Subject'), field('contract_value', 'Value'), field('contract_type', 'Type'), field('start_date', 'Start date'), field('end_date', 'End date'), field('hide_from_customer', 'Hidden'), field('is_trash', 'Trash'), field('description', 'Description')],
  staff: [field('firstName', 'First name'), field('lastName', 'Last name'), email, phone, field('roleId', 'Role'), status, field('shiftId', 'Shift'), field('createdAt', 'Created at')],
  roles: [name, field('description', 'Description'), field('isSystem', 'System role'), field('users_count', 'Users'), field('permissions', 'Permissions'), field('createdAt', 'Created at')],
  calls: [field('leadId', 'Lead'), field('userId', 'Agent'), field('from', 'From'), field('to', 'To'), field('direction', 'Direction', { options: ['incoming', 'outgoing'] }), field('status', 'Status', { options: ['completed', 'failed', 'in-progress', 'busy', 'no-answer'] }), field('startedAt', 'Started at'), field('duration', 'Duration (seconds)'), field('recordingUrl', 'Recording')],
  candidates: [name, email, field('mobile', 'Mobile'), field('designation', 'Designation'), status, field('source', 'Source'), field('isBDE', 'BDE')],
  attendance: [field('employeeName', 'Employee'), field('employeeCode', 'Employee code'), field('department', 'Department'), field('designation', 'Designation'), field('date', 'Date'), status, field('checkIn', 'Check in'), field('checkOut', 'Check out'), field('workHours', 'Working hours'), field('notes', 'Remarks')],
  leave: [field('employeeId', 'Employee'), field('userId', 'Staff'), field('leaveType', 'Leave type'), field('type', 'Type'), status, field('fromDate', 'Start date'), field('toDate', 'End date'), field('days', 'Days'), field('reason', 'Reason'), field('createdAt', 'Created at')],
  salary: [field('firstName', 'First name'), field('lastName', 'Last name'), email, phone, field('roleId', 'Role'), status, field('isSalaryAssigned', 'Salary assigned'), field('grossSalary', 'Gross salary'), field('netSalary', 'Net salary')],
  payslips: [field('employee.name', 'Employee'), field('employee.email', 'Email'), field('period.month', 'Month'), field('period.year', 'Year'), field('summary.presentDays', 'Present days'), field('summary.absentDays', 'Absent days'), field('salary.grossSalary', 'Gross salary'), field('salary.totalDeductions', 'Deductions'), field('salary.netSalary', 'Net salary')],
} satisfies Record<string, ListingField[]>;

export type ImportKind = 'products' | 'types' | 'subtypes' | 'leads' | 'customers' | 'tasks' | 'quotations' | 'staff' | 'roles' | 'candidates' | 'salary';
const IMPORT_FIELDS: Record<ImportKind, ListingField[]> = {
  types: [{ ...name, unique: true }],
  subtypes: [name, field('category', 'Type ID', { required: true })],
  products: [name, field('description', 'Description'), field('category', 'Type ID', { required: true }), field('unit', 'Unit', { required: true, example: 'gm' }), field('prices', 'Prices JSON', { required: true, type: 'json', example: '[{"size":100,"price":50,"pieces":1}]' }), field('isActive', 'Active', { type: 'boolean', example: true })],
  leads: [name, { ...phone, required: true, unique: true }, email, field('company', 'Company'), status, field('source', 'Source'), field('priority', 'Priority'), field('assignedTo', 'Assigned staff ID'), field('city', 'City'), field('state', 'State'), field('leadValue', 'Value', { type: 'number' })],
  customers: [name, { ...phone, required: true, unique: true }, email, field('altPhone', 'Alternate phone'), field('type', 'Type', { options: ['individual', 'company'], example: 'individual' }), field('companyName', 'Company'), field('address.street', 'Street'), field('address.city', 'City'), field('address.state', 'State'), field('address.pincode', 'Pincode'), field('address.country', 'Country')],
  tasks: [field('subject', 'Subject', { required: true }), field('assignee', 'Assignee staff ID', { required: true }), field('relatedTo.type', 'Related type', { required: true, example: 'Lead' }), field('relatedTo.id', 'Related record ID', { required: true }), field('dueDate', 'Due date', { required: true, type: 'date' }), status, field('priority', 'Priority', { options: ['Low', 'Medium', 'High', 'Urgent'] }), field('description', 'Description')],
  quotations: [field('leadId', 'Lead ID'), field('customerId', 'Customer ID'), field('billTo.name', 'Bill to name', { required: true }), field('billTo.phone', 'Bill to phone', { required: true }), field('billTo.email', 'Bill to email', { type: 'email' }), field('billTo.address', 'Bill to address'), field('products', 'Products JSON', { required: true, type: 'json', example: '[{"productId":"EXISTING_PRODUCT_ID","size":100,"price":50,"pieces":1,"quantity":2}]' }), field('tax', 'Tax', { type: 'number' }), field('discount', 'Discount', { type: 'number' })],
  staff: [field('firstName', 'First name', { required: true }), field('lastName', 'Last name', { required: true }), { ...email, required: true, unique: true }, { ...phone, required: true, unique: true }, field('password', 'Initial password', { required: true }), field('roleId', 'Role ID', { required: true }), field('shiftId', 'Shift ID'), { ...status, options: ['active', 'inactive'] }],
  roles: [{ ...name, unique: true }, field('description', 'Description'), field('permissions', 'Permissions JSON', { required: true, type: 'json', example: '[{"module":"leads","actions":["read"],"scope":"own"}]' })],
  candidates: [name, { ...email, required: true, unique: true }, field('mobile', 'Mobile', { required: true, unique: true }), field('designation', 'Designation', { required: true }), field('source', 'Source'), field('isBDE', 'BDE', { type: 'boolean' })],
  salary: [field('staffId', 'Staff ID', { required: true, unique: true }), field('effectiveFrom', 'Effective from', { required: true, type: 'date' }), field('basic', 'Basic salary', { required: true, type: 'number' }), field('hra', 'HRA', { type: 'number' }), field('allowance', 'Allowance', { type: 'number' }), field('bonus', 'Bonus', { type: 'number' }), field('pf', 'PF', { type: 'number' }), field('pfType', 'PF type', { options: ['percentage', 'fixed'] }), field('other', 'Other deduction', { type: 'number' }), field('advanceDeduction', 'Advance deduction', { type: 'number' })],
};
const ENDPOINTS: Record<ImportKind, string> = { types: API_ENDPOINTS.PRODUCT.TYPE.POST, subtypes: API_ENDPOINTS.PRODUCT.SUBTYPE.POST, products: API_ENDPOINTS.PRODUCT.PRODUCT.POST, leads: API_ENDPOINTS.LEADS.CREATE, customers: API_ENDPOINTS.CUSTOMERS.CREATE, tasks: API_ENDPOINTS.TASK.CREATE, quotations: API_ENDPOINTS.QUOTATIONS.CREATE_MANUAL, staff: API_ENDPOINTS.STAFF.CREATE, roles: API_ENDPOINTS.ROLES.CREATE, candidates: API_ENDPOINTS.CANDIDATES.CREATE, salary: API_ENDPOINTS.SALARY.CREATE };
const nestRow = (row: ImportRow): ImportRow => {
  const result: ImportRow = {};
  for (const [key, value] of Object.entries(row)) {
    const parts = key.split('.'); let target = result;
    parts.slice(0, -1).forEach((part) => { target[part] ??= {}; target = target[part] as ImportRow; });
    target[parts[parts.length - 1]] = value;
  }
  return result;
};
export function listingImport(kind: ImportKind, onComplete: () => Promise<unknown> | void, validate?: (row: ImportRow) => string[]): ListingImport {
  return {
    fields: IMPORT_FIELDS[kind], onComplete,
    validate: (row) => {
      const errors = validate?.(row) ?? [];
      if ((kind === 'products' || kind === 'quotations') && (!Array.isArray(row[kind === 'products' ? 'prices' : 'products']) || !(row[kind === 'products' ? 'prices' : 'products'] as unknown[]).length)) errors.push('Provide at least one item in the JSON array');
      const items = row[kind === 'products' ? 'prices' : 'products'];
      if (Array.isArray(items)) items.forEach((item, index) => {
        if (!item || typeof item !== 'object') { errors.push(`Item ${index + 1} must be an object`); return; }
        const requiredNumbers = kind === 'products' ? ['size', 'price'] : ['price', 'pieces', 'quantity'];
        requiredNumbers.forEach((key) => { if (typeof item[key] !== 'number' || !Number.isFinite(item[key]) || item[key] < 0 || (key !== 'price' && item[key] === 0)) errors.push(`Item ${index + 1}: invalid ${key}`); });
        if (kind === 'quotations' && !item.productId) errors.push(`Item ${index + 1}: productId is required`);
      });
      if (kind === 'quotations' && (!!row.leadId === !!row.customerId)) errors.push('Provide exactly one Lead ID or Customer ID');
      if (kind === 'staff' && String(row.password ?? '').length < 6) errors.push('Initial password must have at least 6 characters');
      if (kind === 'candidates' && !/^[6-9]\d{9}$/.test(String(row.mobile ?? ''))) errors.push('Mobile must be a valid Indian 10-digit number');
      if (kind === 'roles') {
        if (!Array.isArray(row.permissions)) errors.push('Permissions must be an array');
        else row.permissions.forEach((permission, index) => {
          const module = MODULES[permission?.module as keyof typeof MODULES];
          if (!module || !Array.isArray(permission.actions) || !permission.actions.length || !permission.actions.every((action: string) => (module.actions as readonly string[]).includes(action)) || !(module.scopes as readonly string[]).includes(permission.scope)) errors.push(`Permission ${index + 1} has an invalid module, action or scope`);
        });
      }
      return errors;
    },
    create: async (row) => {
      let payload = nestRow(row);
      if (kind === 'leads') payload = { status: 'New', source: 'Website', country: 'India', ...payload };
      if (kind === 'customers') payload = { type: 'individual', ...payload, address: { country: 'India', ...(payload.address as object ?? {}) } };
      if (kind === 'tasks') payload = { status: 'inProgress', priority: 'Medium', ...payload };
      if (kind === 'staff') payload = { status: 'active', ...payload };
      if (kind === 'candidates') payload = { status: 'PENDING', ...payload };
      if (kind === 'salary') payload = { staffId: row.staffId, effectiveFrom: row.effectiveFrom, salaryType: 'monthly', earnings: { basic: row.basic, hra: row.hra ?? 0, allowance: row.allowance ?? 0, bonus: row.bonus ?? 0 }, deductions: { pf: { type: row.pfType ?? 'percentage', value: row.pf ?? 0, pfEnabled: Number(row.pf ?? 0) > 0 }, other: row.other ?? 0 }, advanceDeduction: row.advanceDeduction ?? 0 };
      if (kind === 'products') {
        const form = new FormData(); Object.entries({ isActive: true, ...payload }).forEach(([key, value]) => form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value)));
        return apiRequest.post(ENDPOINTS[kind], form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return apiRequest.post(ENDPOINTS[kind], payload);
    }
  };
}
