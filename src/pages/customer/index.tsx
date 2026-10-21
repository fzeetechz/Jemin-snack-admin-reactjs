import { Trash2 as DeleteOutlined, PencilLine as EditOutlined, Eye as EyeOutlined, Plus as PlusOutlined, RefreshCw as ReloadOutlined } from 'lucide-react';
import { fetchAllListingPages } from 'src/services/listingService';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS, listingImport } from 'src/components/shared/listing/listing-presets';
import { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { TeamOutlined, UserOutlined, BranchesOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import useCustomerService from 'src/services/useCustomerService';
import { usePermissions } from 'src/hooks';
import stateService from 'src/services/stateService';
import leadServices from 'src/services/leadServices';

const { Text, Title } = Typography;

type Customer = {
  _id: string;
  customerCode?: string;
  name: string;
  phone: string;
  altPhone?: string;
  email?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  type?: 'individual' | 'company';
  companyName?: string;
  gstNumber?: string;
  isActive?: boolean;
  lead?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    status?: string;
  } | null;
  createdAt?: string;
};

const CustomersPage = () => {
  const { createCustomer, updateCustomer, deleteCustomer } =
    useCustomerService();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const { getState } = stateService();
  const { getLeads } = leadServices();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [allStates, setAllStates] = useState<
    { value: string; label: string }[]
  >([]);
  const [allCities, setAllCities] = useState<
    { value: string; label: string }[]
  >([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setCustomers((await fetchAllListingPages<Customer>('/customers', 'customers')).reverse());
    } catch {
      message.error('Unable to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    getState(null).then((res: any) => {
      if (res?.success && Array.isArray(res.data))
        setAllStates(res.data.map((s: string) => ({ value: s, label: s })));
    });
    getLeads().then((res: any) => {
      if (res?.success) setLeads(res.data || []);
    });
  }, []);

  const handleStateChange = async (stateName: string) => {
    form.setFieldValue('city', undefined);
    setAllCities([]);
    if (!stateName) return;
    try {
      setLoadingCities(true);
      const res = (await getState(stateName)) as any;
      if (res?.success && res.data?.districts)
        setAllCities(
          res.data.districts.map((d: string) => ({ value: d, label: d }))
        );
    } finally {
      setLoadingCities(false);
    }
  };

  const openDrawer = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    setDrawerOpen(true);
    setAllCities([]);
    if (customer) {
      form.setFieldsValue({
        name: customer.name,
        phone: customer.phone,
        altPhone: customer.altPhone,
        email: customer.email,
        type: customer.type || 'individual',
        companyName: customer.companyName,
        gstNumber: customer.gstNumber,
        panNumber: customer.panNumber,
        aadhaarNumber: customer.aadhaarNumber,
        street: customer.address?.street,
        city: customer.address?.city,
        state: customer.address?.state,
        pincode: customer.address?.pincode,
        country: customer.address?.country || 'India',
      });
      if (customer.address?.state) handleStateChange(customer.address.state);
    } else {
      form.resetFields();
      form.setFieldsValue({ type: 'individual', country: 'India' });
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingCustomer(null);
    setAllCities([]);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        name: values.name,
        phone: values.phone,
        altPhone: values.altPhone,
        email: values.email,
        type: values.type,
        companyName: values.companyName,
        gstNumber: values.gstNumber,
        panNumber: values.panNumber,
        aadhaarNumber: values.aadhaarNumber,
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          country: values.country || 'India',
        },
      };
      if (editingCustomer) {
        await updateCustomer(editingCustomer._id, payload);
        message.success('Customer updated');
      } else {
        await createCustomer(payload);
        message.success('Customer created');
      }
      closeDrawer();
      await fetchCustomers();
    } catch (err) {
      if (!(err as any)?.errorFields) message.error('Unable to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCustomer(id);
      message.success('Customer deleted');
      await fetchCustomers();
    } catch {
      message.error('Unable to delete customer');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'Customer',
      render: (_, r) => (
        <Flex align="center" gap={10}>
          <Avatar
            size={38}
            style={{
              background: r.lead ? '#52c41a' : '#1677ff',
              flexShrink: 0,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {r.name?.[0]?.toUpperCase()}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 14 }}>
              {r.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.customerCode || '—'}
            </Text>
            {r.lead && (
              <Tag
                color="green"
                icon={<BranchesOutlined />}
                style={{ fontSize: 11, marginTop: 2 }}
              >
                {r.lead.name}
              </Tag>
            )}
          </Space>
        </Flex>
      ),
    },
    {
      title: 'Contact',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text>{r.phone}</Text>
          {r.email ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.email}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              No email
            </Text>
          )}
          {r.altPhone && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.altPhone}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Location',
      render: (_, r) =>
        r.address?.city || r.address?.state ? (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>
              {[r.address?.city, r.address?.state].filter(Boolean).join(', ')}
            </Text>
            {r.address?.pincode && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.address.pincode}
              </Text>
            )}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Type',
      width: 120,
      render: (_, r) => (
        <Space direction="vertical" size={4}>
          <Tag
            color={r.type === 'company' ? 'blue' : 'purple'}
            icon={r.type === 'company' ? <TeamOutlined /> : <UserOutlined />}
          >
            {r.type === 'company' ? 'Company' : 'Individual'}
          </Tag>
          <Tag color={r.isActive ? 'green' : 'red'} style={{ fontSize: 11 }}>
            {r.isActive ? 'Active' : 'Inactive'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Actions',
      width: 110,
      align: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="View">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setViewCustomer(r)}
            />
          </Tooltip>
          {canUpdate('customers') && (
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openDrawer(r)}
              />
            </Tooltip>
          )}
          {canDelete('customers') && (
            <Popconfirm
              title="Delete customer?"
              description={`Delete "${r.name}"?`}
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(r._id)}
            >
              <Tooltip title="Delete">
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deletingId === r._id}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="module-page">
      <Space
        direction="vertical"
        size={20}
        style={{ display: 'flex', width: '100%' }}
      >
        <Flex justify="space-between" align="flex-start" wrap gap={12}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Customers
            </Title>
            <Text type="secondary">
              Manage your customers and converted leads.
            </Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>
              Refresh
            </Button>
            {canCreate('customers') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openDrawer()}
              >
                Add Customer
              </Button>
            )}
          </Space>
        </Flex>

        <Card
          title="Customer List"
        >
          <ListingTable listingTitle="Customers" fields={LISTING_FIELDS.customers} filterKeys={["type","isActive","address.city"]} importConfig={canCreate('customers') && listingImport('customers', fetchCustomers)}
            rowKey="_id"
            columns={columns}
            dataSource={customers}
            loading={loading}
            rowHoverable={false}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No customers found"
                />
              ),
            }}
          />
        </Card>
      </Space>

      <Drawer
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        open={drawerOpen}
        onClose={closeDrawer}
        width={680}
        extra={
          <Space>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {editingCustomer ? 'Update' : 'Save'}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={(label, { required }) =>
            required ? (
              <>
                {label} <span style={{ color: '#ff4d4f' }}>*</span>
              </>
            ) : (
              <span>
                {label}&nbsp;
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  (Optional)
                </span>
              </span>
            )
          }
        >
          {/* Lead info banner — only on edit if customer came from a lead */}
          {editingCustomer?.lead && (
            <div
              style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>🔗</span>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Converted from Lead
                </Text>
                <br />
                <Text strong>{editingCustomer.lead.name}</Text>
                {editingCustomer.lead.phone && (
                  <Text type="secondary"> — {editingCustomer.lead.phone}</Text>
                )}
                {editingCustomer.lead.status && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {editingCustomer.lead.status}
                  </Tag>
                )}
              </div>
            </div>
          )}

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Name is required' }]}
              >
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Phone is required' }]}
              >
                <Input placeholder="+91 XXXXX XXXXX" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="altPhone" label="Alt Phone">
                <Input placeholder="Alternate number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="type" label="Type">
                <Select
                  options={[
                    { value: 'individual', label: 'Individual' },
                    { value: 'company', label: 'Company' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
                {({ getFieldValue }) =>
                  getFieldValue('type') === 'company' ? (
                    <Form.Item name="companyName" label="Company Name">
                      <Input placeholder="Company name" />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="panNumber" label="PAN Number">
                <Input placeholder="ABCDE1234F" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="aadhaarNumber" label="Aadhaar Number">
                <Input placeholder="XXXX XXXX XXXX" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="gstNumber" label="GST Number">
                <Input placeholder="GST number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="street" label="Street">
            <Input.TextArea rows={2} placeholder="Street address" />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="state" label="State">
                <Select
                  showSearch
                  allowClear
                  placeholder="Select state"
                  options={allStates}
                  onChange={handleStateChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="city" label="City">
                <Select
                  showSearch
                  allowClear
                  placeholder={
                    allCities.length ? 'Select city' : 'Select state first'
                  }
                  options={allCities}
                  loading={loadingCities}
                  disabled={!allCities.length && !loadingCities}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="pincode" label="Pincode">
                <Input placeholder="Pincode" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="country" label="Country">
                <Input placeholder="Country" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      <Modal
        title="Customer Details"
        open={!!viewCustomer}
        onCancel={() => setViewCustomer(null)}
        footer={null}
        width={600}
      >
        {viewCustomer && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Text type="secondary">Code</Text>
                <br />
                <Text strong>{viewCustomer.customerCode || '—'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Name</Text>
                <br />
                <Text strong>{viewCustomer.name}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Phone</Text>
                <br />
                <Text>{viewCustomer.phone}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Email</Text>
                <br />
                <Text>{viewCustomer.email || '—'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Type</Text>
                <br />
                <Tag>{viewCustomer.type || 'individual'}</Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">Status</Text>
                <br />
                <Tag color={viewCustomer.isActive ? 'green' : 'red'}>
                  {viewCustomer.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Col>
              {viewCustomer.companyName && (
                <Col span={12}>
                  <Text type="secondary">Company</Text>
                  <br />
                  <Text>{viewCustomer.companyName}</Text>
                </Col>
              )}
              {viewCustomer.gstNumber && (
                <Col span={12}>
                  <Text type="secondary">GST</Text>
                  <br />
                  <Text>{viewCustomer.gstNumber}</Text>
                </Col>
              )}
              {viewCustomer.panNumber && (
                <Col span={12}>
                  <Text type="secondary">PAN</Text>
                  <br />
                  <Text>{viewCustomer.panNumber}</Text>
                </Col>
              )}
              {viewCustomer.aadhaarNumber && (
                <Col span={12}>
                  <Text type="secondary">Aadhaar</Text>
                  <br />
                  <Text>{viewCustomer.aadhaarNumber}</Text>
                </Col>
              )}
              {viewCustomer.address?.city && (
                <Col span={24}>
                  <Text type="secondary">Address</Text>
                  <br />
                  <Text>
                    {[
                      viewCustomer.address.street,
                      viewCustomer.address.city,
                      viewCustomer.address.state,
                      viewCustomer.address.pincode,
                      viewCustomer.address.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </Col>
              )}
              {viewCustomer.lead && (
                <Col span={24}>
                  <Text type="secondary">Converted from Lead</Text>
                  <br />
                  <Tag color="green">
                    {viewCustomer.lead.name} — {viewCustomer.lead.status}
                  </Tag>
                </Col>
              )}
            </Row>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default CustomersPage;
