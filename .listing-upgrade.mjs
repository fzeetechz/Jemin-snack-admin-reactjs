import fs from 'node:fs';
const entries = [
 ['src/pages/Products/Products.tsx', 'types', 'Product Types', 'types', [], "canCreate('products') && listingImport('types', fetchTypes)"],
 ['src/pages/Products/Products.tsx', 'subTypes', 'Product Subtypes', 'subtypes', ['category'], "canCreate('products') && listingImport('subtypes', fetchSubTypes, (row) => types.some((type) => type._id === row.category) ? [] : ['Type ID does not exist'])"],
 ['src/pages/Products/Products.tsx', 'filteredProducts', 'Products', 'products', ['category', 'isActive'], "canCreate('products') && listingImport('products', fetchProducts, (row) => types.some((type) => type._id === row.category) ? [] : ['Type ID does not exist'])"],
 ['src/pages/Leads/index.tsx', 'filtered', 'Leads', 'leads', ['status', 'source', 'priority', 'assignedTo'], "canCreate('leads') && listingImport('leads', fetchLeads)"],
 ['src/pages/customer/index.tsx', 'filtered', 'Customers', 'customers', ['type', 'isActive', 'address.city'], "canCreate('customers') && listingImport('customers', fetchCustomers)"],
 ['src/pages/Leads/Tasks.tsx', 'tasks', 'Tasks', 'tasks', ['status', 'priority', 'assignee'], "canCreate('tasks') && listingImport('tasks', fetchTasks)"],
 ['src/pages/Quotations/index.tsx', 'quotations', 'Quotations', 'quotations', ['orderStatus'], "canCreate('quotations') && listingImport('quotations', fetchQuotations)"],
 ['src/pages/settings/Staff/index.tsx', 'users', 'Staff', 'staff', ['status', 'roleId', 'shiftId'], "canCreate('staff') && listingImport('staff', getStaffs, (row) => roles.some((role) => role._id === row.roleId) ? [] : ['Role ID does not exist'])"],
 ['src/pages/settings/roles/index.tsx', 'roles', 'Roles', 'roles', ['isSystem'], "canCreate('roles') && listingImport('roles', getAllRoles)"],
 ['src/pages/Location.tsx', 'users', 'Staff Locations', 'staff', ['status', 'roleId'], null],
 ['src/pages/Contract/index.tsx', 'contracts', 'Contracts', 'contracts', ['contract_type', 'hide_from_customer', 'is_trash'], null],
 ['src/HumanResource/Candidate.tsx', 'candidates', 'Candidates', 'candidates', ['status', 'designation', 'source'], "canCreate('candidates') && listingImport('candidates', fetchData)"],
 ['src/HumanResource/Attendance.tsx', 'filteredRecords', 'Attendance', 'attendance', ['status', 'department', 'designation'], null],
 ['src/HumanResource/Leave.tsx', 'filtered', 'Leave Requests', 'leave', ['status', 'type'], null],
 ['src/HumanResource/SalarySetting.tsx', 'filteredStaffs', 'Salary Settings', 'salary', ['status', 'roleId', 'isSalaryAssigned'], "canCreate('salary') && listingImport('salary', getEmployeDetailsWithSalary, (row) => { const staff = allStaffs.find((item) => item._id === row.staffId); return !staff ? ['Staff ID does not exist'] : staff.isSalaryAssigned ? ['Salary already assigned; use Edit for this employee'] : []; })"],
 ['src/HumanResource/SalarySlip.tsx', 'data?.payslips ?? []', 'Payslips', 'payslips', ['period.month', 'period.year'], null],
];
const files = new Map();
for (const [file, source, title, preset, filters, config] of entries) {
 let content = files.get(file) ?? fs.readFileSync(file, 'utf8');
 const marker = `dataSource={${source}}`;
 const index = content.indexOf(marker); if (index < 0) throw new Error(`${file}: missing ${marker}`);
 const start = content.lastIndexOf('<Table', index); if (start < 0) throw new Error(`${file}: missing Table`);
 const attrs = ` listingTitle="${title}" fields={LISTING_FIELDS.${preset}} filterKeys={${JSON.stringify(filters)}}${config ? ` importConfig={${config}}` : ''}`;
 content = content.slice(0, start) + '<ListingTable' + attrs + content.slice(start + '<Table'.length);
 files.set(file, content);
}
for (const [file, initial] of files) {
 let content = `import ListingTable from 'src/components/shared/listing/ListingTable';\nimport { LISTING_FIELDS${initial.includes('listingImport(') ? ', listingImport' : ''} } from 'src/components/shared/listing/listing-presets';\n` + initial;
 if (!/<Table\b/.test(content)) content = content.replace(/^  Table,\r?\n/gm, '').replace(/, Table,/g, ',');
 fs.writeFileSync(file, content);
}
