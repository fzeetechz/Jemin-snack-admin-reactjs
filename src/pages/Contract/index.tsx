import { Plus as PlusOutlined, PencilLine as EditOutlined, Trash2 as DeleteOutlined } from 'lucide-react';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
  Popconfirm,
  Alert,
} from 'antd';

import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

type Contract = {
  id: string;
  customer_id: string;
  customer_name: string;
  subject: string;
  contract_value?: number;
  contract_type?: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  description?: string;
  is_trash?: boolean;
  hide_from_customer?: boolean;
  created_at: string; // YYYY-MM-DD
};

type ContractFormValues = {
  is_trash?: boolean;
  hide_from_customer?: boolean;

  customer_id: string;
  subject: string;

  contract_value?: number;
  contract_type?: string;

  start_date?: dayjs.Dayjs;
  end_date?: dayjs.Dayjs;

  description?: string;
};

const MOCK_CUSTOMERS = [
  { value: 'c1', label: 'ABC Pvt Ltd' },
  { value: 'c2', label: 'TechNova' },
  { value: 'c3', label: 'FinCorp' },
  { value: 'c4', label: 'BlueCart' },
];

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'CT-1001',
    customer_id: 'c1',
    customer_name: 'ABC Pvt Ltd',
    subject: 'Annual Service Contract',
    contract_value: 12000,
    contract_type: 'Annual',
    start_date: '2026-02-01',
    end_date: '2027-01-31',
    description: 'Support + maintenance included.',
    is_trash: false,
    hide_from_customer: false,
    created_at: '2026-02-01',
  },
  {
    id: 'CT-1002',
    customer_id: 'c2',
    customer_name: 'TechNova',
    subject: 'One-time Implementation',
    contract_value: 4500,
    contract_type: 'One-time',
    start_date: '2026-02-10',
    end_date: '',
    description: 'Implementation + onboarding.',
    is_trash: false,
    hide_from_customer: true,
    created_at: '2026-02-10',
  },
];

const money = (n?: number) => {
  if (typeof n !== 'number') return '—';
  return `$${n.toLocaleString()}`;
};

const ContractPage = () => {
  const [contracts, setContracts] = useState<Contract[]>(() => { try { const stored = JSON.parse(localStorage.getItem('jemini_contracts') ?? 'null'); return Array.isArray(stored) ? stored : INITIAL_CONTRACTS; } catch { return INITIAL_CONTRACTS; } });

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  useEffect(() => { try { localStorage.setItem('jemini_contracts', JSON.stringify(contracts)); } catch { message.error('Unable to save contracts on this device'); } }, [contracts]);
  const editContract = (row: Contract) => { setEditingContract(row); form.setFieldsValue({ ...row, start_date: dayjs(row.start_date), end_date: row.end_date ? dayjs(row.end_date) : undefined }); setDrawerOpen(true); };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<ContractFormValues>();

  const [contractTypes, setContractTypes] = useState<string[]>([
    'Monthly',
    'Quarterly',
    'Annual',
    'One-time',
  ]);
  const [newType, setNewType] = useState('');

  const customerOptions = useMemo(() => MOCK_CUSTOMERS, []);

  const columns: ColumnsType<Contract> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 110 },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (v) => <Typography.Text strong>{v}</Typography.Text>,
    },
    { title: 'Subject', dataIndex: 'subject', key: 'subject' },
    {
      title: 'Value',
      dataIndex: 'contract_value',
      key: 'contract_value',
      render: (v) => money(v),
      sorter: (a, b) => (a.contract_value || 0) - (b.contract_value || 0),
      width: 140,
    },
    {
      title: 'Type',
      dataIndex: 'contract_type',
      key: 'contract_type',
      render: (v) => (v ? <Tag>{v}</Tag> : '—'),
      width: 130,
    },
    { title: 'Start', dataIndex: 'start_date', key: 'start_date', width: 120 },
    {
      title: 'End',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (v) => v || '—',
    },
    {
      title: 'Visibility',
      key: 'visibility',
      width: 160,
      render: (_, row) => (
        <Space>
          {row.hide_from_customer ? (
            <Tag color="orange">Hidden</Tag>
          ) : (
            <Tag color="green">Visible</Tag>
          )}
          {row.is_trash ? <Tag color="red">Trash</Tag> : null}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, row) => <Space><Button size="small" icon={<EditOutlined />} onClick={() => editContract(row)}>Edit</Button><Popconfirm title="Move contract to Trash?" description="You can restore it from the Trash page on this device." onConfirm={() => setContracts((items) => items.map((item) => item.id === row.id ? { ...item, is_trash: true, deletedAt: new Date().toISOString() } : item))} okButtonProps={{ danger: true }}><Button size="small" danger icon={<DeleteOutlined />} aria-label="Move contract to Trash" title="Move to Trash" /></Popconfirm></Space>,
    },
  ];

  const openNewContract = () => {
    setEditingContract(null);
    setDrawerOpen(true);
    form.resetFields();
    form.setFieldsValue({
      is_trash: false,
      hide_from_customer: false,
      contract_type: undefined,
      contract_value: undefined,
      description: '',
    });
  };

  const closeDrawer = () => {
    setEditingContract(null);
    setDrawerOpen(false);
    form.resetFields();
  };

  const onSave = async () => {
    const values = await form.validateFields();

    const customer = MOCK_CUSTOMERS.find((c) => c.value === values.customer_id);
    const customer_name = customer?.label || '—';

    const start_date = values.start_date
      ? dayjs(values.start_date).format('YYYY-MM-DD')
      : '';
    const end_date = values.end_date
      ? dayjs(values.end_date).format('YYYY-MM-DD')
      : '';

    const nextId = editingContract?.id ?? `CT-${crypto.randomUUID()}`;

    const newContract: Contract = {
      id: nextId,
      customer_id: values.customer_id,
      customer_name,
      subject: values.subject,
      contract_value: values.contract_value
        ? Number(values.contract_value)
        : undefined,
      contract_type: values.contract_type,
      start_date,
      end_date,
      description: values.description,
      is_trash: !!values.is_trash,
      hide_from_customer: !!values.hide_from_customer,
      created_at: editingContract?.created_at ?? dayjs().format('YYYY-MM-DD'),
    };

    setContracts((items) => editingContract ? items.map((item) => item.id === editingContract.id ? newContract : item) : [newContract, ...items]);
    message.success(editingContract ? 'Contract updated' : 'Contract added');
    closeDrawer();
  };

  return (
    <div className="module-page">
      <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Contracts
        </Typography.Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openNewContract}
        >
          New Contract
        </Button>
      </Flex>

      <Alert type="info" showIcon message="Contracts are saved on this device." style={{ marginBottom: 16 }} />
      <Card>
        <ListingTable listingTitle="Contracts" importConfig={{ fields: [{ key: 'customer_id', label: 'Customer ID', required: true, options: MOCK_CUSTOMERS.map((customer) => customer.value) }, { key: 'subject', label: 'Subject', required: true }, { key: 'contract_value', label: 'Value', type: 'number' }, { key: 'contract_type', label: 'Type', options: contractTypes }, { key: 'start_date', label: 'Start date', required: true, type: 'date' }, { key: 'end_date', label: 'End date', type: 'date' }, { key: 'description', label: 'Description' }, { key: 'hide_from_customer', label: 'Hidden', type: 'boolean' }, { key: 'is_trash', label: 'Trash', type: 'boolean' }], validate: (row) => row.end_date && String(row.end_date) < String(row.start_date) ? ['End date must be on or after start date'] : [], create: async (row) => { const contract = { ...row, id: 'CT-' + crypto.randomUUID(), customer_name: MOCK_CUSTOMERS.find((customer) => customer.value === row.customer_id)?.label ?? '', created_at: dayjs().format('YYYY-MM-DD') } as Contract; setContracts((items) => [contract, ...items]); return { success: true }; }, onComplete: () => {} }} fields={LISTING_FIELDS.contracts} filterKeys={["contract_type","hide_from_customer","is_trash"]}
          rowKey="id"
          columns={columns}
          dataSource={contracts.filter((item) => !item.is_trash)}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 900 }}
          rowHoverable={false}
        />
      </Card>

      {/* Drawer: Add New Contract */}
      <Drawer
        title="Contract Information"
        open={drawerOpen}
        onClose={closeDrawer}
        width={920}
        extra={
          <Space>
            <Button onClick={closeDrawer}>Close</Button>
            <Button type="primary" onClick={onSave}>
              Save
            </Button>
          </Space>
        }
        styles={{ body: { paddingBottom: 24 } }}
      >
        <Card>
          <Form form={form} layout="vertical">
            {/* Top checkboxes */}
            <Flex gap={16} style={{ marginBottom: 10 }}>
              <Form.Item
                name="is_trash"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Trash</Checkbox>
              </Form.Item>

              <Form.Item
                name="hide_from_customer"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Hide from customer</Checkbox>
              </Form.Item>
            </Flex>

            {/* Customer */}
            <Form.Item
              name="customer_id"
              label={
                <>
                  <span style={{ color: 'red' }}>*</span> Customer
                </>
              }
              rules={[{ required: true, message: 'Customer is required' }]}
            >
              <Select
                showSearch
                placeholder="Select and begin typing"
                options={customerOptions}
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            {/* Subject */}
            <Form.Item
              name="subject"
              label={
                <>
                  <span style={{ color: 'red' }}>*</span> Subject
                </>
              }
              rules={[{ required: true, message: 'Subject is required' }]}
            >
              <Input />
            </Form.Item>

            {/* Contract Value */}
            <Form.Item name="contract_value" label="Contract Value">
              <Input type="number" addonAfter="$" />
            </Form.Item>

            {/* Contract type + "+" */}
            <Form.Item label="Contract type">
              <Row gutter={8} align="middle">
                <Col flex="auto">
                  <Form.Item name="contract_type" noStyle>
                    <Select
                      placeholder="Nothing selected"
                      options={contractTypes.map((t) => ({
                        value: t,
                        label: t,
                      }))}
                      dropdownRender={(menu) => (
                        <div>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Flex gap={8} style={{ padding: 8 }}>
                            <Input
                              placeholder="Add new type"
                              value={newType}
                              onChange={(e) => setNewType(e.target.value)}
                            />
                            <Button
                              icon={<PlusOutlined />}
                              onClick={() => {
                                const v = newType.trim();
                                if (!v) return;
                                if (!contractTypes.includes(v)) {
                                  setContractTypes((prev) => [...prev, v]);
                                }
                                form.setFieldValue('contract_type', v);
                                setNewType('');
                              }}
                            />
                          </Flex>
                        </div>
                      )}
                    />
                  </Form.Item>
                </Col>

                <Col>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const v = newType.trim();
                      if (!v) return;
                      if (!contractTypes.includes(v)) {
                        setContractTypes((prev) => [...prev, v]);
                      }
                      form.setFieldValue('contract_type', v);
                      setNewType('');
                    }}
                  />
                </Col>
              </Row>
            </Form.Item>

            {/* Dates */}
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="start_date"
                  label={
                    <>
                      <span style={{ color: 'red' }}>*</span> Start Date
                    </>
                  }
                  rules={[
                    { required: true, message: 'Start date is required' },
                  ]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="end_date" label="End Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            {/* Description */}
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={6} />
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
    </div>
  );
};

export default ContractPage;
