import fs from 'node:fs';
const update = (file, fn) => fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')));
update('src/pages/Leads/index.tsx', (s) => {
 s = s.replace('useMemo, ', '').replace(/^  Table,\n/m, '').replace(/^  Alert,\n/m, '').replace(/^  DownloadOutlined,\n/m, '').replace(/^import \* as XLSX.*\n/m, '').replace(/^import \{ exportLeads \}.*\n/m, '');
 s = s.replace('    bulkCreateLeads,\n', '');
 s = s.replace(/  const \[(q|stage|source|importModal|importRows|importLoading|importError),[^\n]*\n/g, '');
 s = s.replace(/  const filtered = useMemo\([\s\S]*?\n  const handleStateChange/, '  const handleStateChange');
 s = s.replace(/  const handleFileUpload =[\s\S]*?\n  const columns =/, '  const columns =');
 s = s.replace(/                      <Button\n                        icon=\{<UploadOutlined \/>\}[\s\S]*?                      <Button\n                        type="primary"/, '                      <Button\n                        type="primary"');
 s = s.replace(/            <Row gutter=\{\[12, 12\]\} style=\{\{ marginBottom: 12 \}\}>[\s\S]*?<\/Row>\n\n/, '');
 s = s.replace('dataSource={filtered}', 'dataSource={leads}').replace("listingTitle=\"Leads\"", 'listingTitle="Leads" onRefresh={fetchLeads}');
 s = s.replace(/\n      <Modal\n        title="Import Leads"[\s\S]*?<\/Modal>/, '');
 s = s.replace('LeadStage, LeadSource, ', '');
 return s;
});
update('src/pages/Products/Products.tsx', (s) => {
 s = s.replace(/^  const \[(searchText|categoryFilter),[^\n]*\n/g, '').replace(/^  SearchOutlined,\n/m, '');
 s = s.replace(/  const filteredProducts = useMemo\([\s\S]*?\n  const uncategorizedCount/, '  const uncategorizedCount');
 s = s.replace(/              title="Products"\n              extra=\{[\s\S]*?\n            >/, '              title="Products"\n            >');
 return s.replace('dataSource={filteredProducts}', 'dataSource={products}');
});
update('src/pages/customer/index.tsx', (s) => {
 s = s.replace(/^  const \[search,.*\n/m, '').replace(/  const filtered = customers.filter\([\s\S]*?\n  const columns:/, '  const columns:');
 s = s.replace(/          title="Customer List"\n          extra=\{[\s\S]*?\n        >/, '          title="Customer List"\n        >');
 return s.replace('dataSource={filtered}', 'dataSource={customers}');
});
update('src/pages/Leads/Tasks.tsx', (s) => {
 s = s.replace(/^  const \[(searchText|filterStatus|filterPriority),.*\n/gm, '').replace(/^  SearchOutlined,\n/m, '');
 s = s.replace('[lead, searchText, filterStatus, filterPriority]', '[lead]');
 s = s.replace(/      if \(searchText\).*\n/m, '').replace(/      if \(filterStatus\).*\n/m, '').replace(/      if \(filterPriority\).*\n/m, '');
 s = s.replace(/            <Input\n              placeholder="Search tasks\.\.\."[\s\S]*?            \{canCreate\('tasks'\)/, "            {canCreate('tasks')");
 return s.replace('bodyStyle={{ padding: 14 }}', 'styles={{ body: { padding: 14 } }}').replace('listingTitle="Tasks"', 'listingTitle="Tasks" onRefresh={fetchTasks}');
});
update('src/pages/settings/Staff/index.tsx', (s) => s.replace("canCreate('staff') && listingImport", "canCreate('settings.users') && listingImport").replace('listingTitle="Staff"', 'listingTitle="Staff" onRefresh={getStaffs}'));
update('src/pages/settings/roles/index.tsx', (s) => s.replace("canCreate('roles') && listingImport", "canCreate('settings.roles') && listingImport").replace('listingTitle="Roles"', 'listingTitle="Roles" onRefresh={getAllRoles}'));
update('src/pages/Location.tsx', (s) => s.replace('listingTitle="Staff Locations"', 'listingTitle="Staff Locations" onRefresh={getStaffs}'));
update('src/HumanResource/Candidate.tsx', (s) => s.replace('listingTitle="Candidates"', 'listingTitle="Candidates" rowKey="_id" onRefresh={fetchData}').replace('disabled={!_._id}', 'disabled={!record._id}').replace('setSelectedUser(_)', 'setSelectedUser(record)').replace('size="small"\n                type="primary"\n              >\n                <Trash', 'size="small"\n                danger\n                aria-label="Delete candidate"\n              >\n                <Trash'));
