import fs from 'node:fs';
const update = (file, fn) => fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')));
update('src/components/shared/listing/ListingTable.tsx', (s) => {
 s = s.replace('Flex, Input,', 'Flex, Input, DatePicker,').replace("import { useEffect", "import dayjs from 'dayjs';\nimport { useEffect");
 s = s.replace("  const filtered = useMemo", "  const dateKey = !serverSide ? fields.find((field) => ['createdAt', 'date', 'dueDate', 'start_date', 'fromDate'].includes(field.key))?.key : undefined;\n  const filtered = useMemo");
 s = s.replace('        {(search || Object.values(filters).some(Boolean))', `        {dateKey && <DatePicker.RangePicker aria-label="Filter date range" value={filters.__dateFrom && filters.__dateTo ? [dayjs(filters.__dateFrom), dayjs(filters.__dateTo)] : null} onChange={(dates) => updateFilters(search, { ...filters, __dateField: dateKey, __dateFrom: dates?.[0]?.format('YYYY-MM-DD') ?? '', __dateTo: dates?.[1]?.format('YYYY-MM-DD') ?? '' })} />}
        {(search || Object.values(filters).some(Boolean))`);
 s = s.replace('displayValue(row.payload[field.key]) })),', "field.key === 'password' ? '••••••••' : displayValue(row.payload[field.key]) })),");
 return s;
});
update('src/components/shared/listing/listing-utils.ts', (s) => s.replace("Object.entries(filters).every(([key, value]) => !value || displayValue(getValue(row, key)) === value)", "Object.entries(filters).every(([key, value]) => key.startsWith('__') || !value || displayValue(getValue(row, key)) === value) && (!filters.__dateFrom || (displayValue(getValue(row, filters.__dateField)).slice(0, 10) >= filters.__dateFrom && displayValue(getValue(row, filters.__dateField)).slice(0, 10) <= filters.__dateTo))"));
update('src/pages/Config/index.tsx', (s) => {
 s = "import ListingTable from 'src/components/shared/listing/ListingTable';\nimport { usePermissions } from 'src/hooks';\n" + s;
 s = s.replace('  Card,\n', '').replace('  Spin,\n', '').replace('  Divider,', '  Divider,\n  Popconfirm,');
 s = s.replace('  const [configs, setConfigs] = useState([]);', "  const [configs, setConfigs] = useState<any[]>([]);\n  const { canCreate, canUpdate, canDelete } = usePermissions();");
 s = s.replace('  if (loading) return <Spin size="large" />;\n', '');
 s = s.replace('        <Button\n          type="primary"', "        {canCreate('settings') && <Button\n          type=\"primary\"").replace('          Add Config\n        </Button>', '          Add Config\n        </Button>}');
 const start = s.indexOf('      <Row gutter={[16, 16]}>'); const end = s.indexOf('\n      <Modal', start);
 s = s.slice(0, start) + `<ListingTable listingTitle="Configuration" fields={[{ key: 'key', label: 'Key' }, { key: 'description', label: 'Description' }, { key: 'value', label: 'Values' }]} dataSource={configs} rowKey="_id" loading={loading} onRefresh={fetchConfigs}
        importConfig={canCreate('settings') && { fields: [{ key: 'key', label: 'Key', required: true, unique: true }, { key: 'description', label: 'Description' }, { key: 'value', label: 'Values JSON', required: true, type: 'json', example: '[{"value":"new","label":"New","color":"blue","order":1}]' }], create: createConfig, onComplete: fetchConfigs, validate: (row) => Array.isArray(row.value) && row.value.every((item) => item && typeof item.value === 'string' && typeof item.label === 'string') ? [] : ['Values must be an array with value and label strings'] }}
        columns={[{ title: 'Key', dataIndex: 'key' }, { title: 'Description', dataIndex: 'description' }, { title: 'Values', render: (_, row) => <Space wrap>{[...(row.value ?? [])].sort((a, b) => a.order - b.order).map((item, index) => <Tag key={index} color={item.color}>{item.label}</Tag>)}</Space> }, { title: 'Actions', render: (_, row) => <Space>{canUpdate('settings') && <Button icon={<EditOutlined />} onClick={() => openModal(row)}>Edit</Button>}{canDelete('settings') && <Popconfirm title="Delete configuration?" onConfirm={() => handleDelete(row._id)} okButtonProps={{ danger: true }}><Button danger icon={<DeleteOutlined />}>Delete</Button></Popconfirm>}</Space> }]} />
` + s.slice(end);
 return s;
});
update('src/pages/Contract/index.tsx', (s) => {
 s = s.replace("import { useMemo, useState }", "import { useEffect, useMemo, useState }").replace('  message,', '  message,\n  Popconfirm,\n  Alert,');
 s = s.replace("import { PlusOutlined }", "import { PlusOutlined, EditOutlined, DeleteOutlined }");
 s = s.replace('useState<Contract[]>(INITIAL_CONTRACTS)', `useState<Contract[]>(() => { try { const stored = JSON.parse(localStorage.getItem('jemini_contracts') ?? 'null'); return Array.isArray(stored) ? stored : INITIAL_CONTRACTS; } catch { return INITIAL_CONTRACTS; } })`);
 s = s.replace('  const [drawerOpen,', `  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  useEffect(() => { try { localStorage.setItem('jemini_contracts', JSON.stringify(contracts)); } catch { message.error('Unable to save contracts on this device'); } }, [contracts]);
  const editContract = (row: Contract) => { setEditingContract(row); form.setFieldsValue({ ...row, start_date: dayjs(row.start_date), end_date: row.end_date ? dayjs(row.end_date) : undefined }); setDrawerOpen(true); };
  const [drawerOpen,`);
 s = s.replace(/      render: \(\) => \(\n        <Space>\n          <Button size="small">View<\/Button>\n          <Button size="small">Edit<\/Button>\n        <\/Space>\n      \),/, `      render: (_, row) => <Space><Button size="small" icon={<EditOutlined />} onClick={() => editContract(row)}>Edit</Button><Popconfirm title="Delete contract?" onConfirm={() => setContracts((items) => items.filter((item) => item.id !== row.id))} okButtonProps={{ danger: true }}><Button size="small" danger icon={<DeleteOutlined />}>Delete</Button></Popconfirm></Space>,`);
 s = s.replace('  const openNewContract = () => {', '  const openNewContract = () => {\n    setEditingContract(null);');
 s = s.replace('  const closeDrawer = () => {', '  const closeDrawer = () => {\n    setEditingContract(null);');
 s = s.replace('const nextId = `CT-${1000 + contracts.length + 1}`;', "const nextId = editingContract?.id ?? `CT-${crypto.randomUUID()}`;");
 s = s.replace("created_at: dayjs().format('YYYY-MM-DD'),", "created_at: editingContract?.created_at ?? dayjs().format('YYYY-MM-DD'),");
 s = s.replace('    setContracts([newContract, ...contracts]);', '    setContracts((items) => editingContract ? items.map((item) => item.id === editingContract.id ? newContract : item) : [newContract, ...items]);').replace("message.success('Contract added (static)');", "message.success(editingContract ? 'Contract updated' : 'Contract added');");
 s = s.replace('      <Card>\n        <ListingTable', '      <Alert type="info" showIcon message="Contracts are saved on this device." style={{ marginBottom: 16 }} />\n      <Card>\n        <ListingTable');
 s = s.replace('listingTitle="Contracts"', `listingTitle="Contracts" importConfig={{ fields: [{ key: 'customer_id', label: 'Customer ID', required: true, options: MOCK_CUSTOMERS.map((customer) => customer.value) }, { key: 'subject', label: 'Subject', required: true }, { key: 'contract_value', label: 'Value', type: 'number' }, { key: 'contract_type', label: 'Type', options: contractTypes }, { key: 'start_date', label: 'Start date', required: true, type: 'date' }, { key: 'end_date', label: 'End date', type: 'date' }, { key: 'description', label: 'Description' }, { key: 'hide_from_customer', label: 'Hidden', type: 'boolean' }, { key: 'is_trash', label: 'Trash', type: 'boolean' }], validate: (row) => row.end_date && String(row.end_date) < String(row.start_date) ? ['End date must be on or after start date'] : [], create: async (row) => { const contract = { ...row, id: 'CT-' + crypto.randomUUID(), customer_name: MOCK_CUSTOMERS.find((customer) => customer.value === row.customer_id)?.label ?? '', created_at: dayjs().format('YYYY-MM-DD') } as Contract; setContracts((items) => [contract, ...items]); return { success: true }; }, onComplete: () => {} }}`);
 return s;
});
