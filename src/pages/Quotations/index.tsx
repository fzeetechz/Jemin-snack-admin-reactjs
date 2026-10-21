import { Trash2 as DeleteOutlined, Eye as EyeOutlined, PencilLine as EditOutlined, Plus as PlusOutlined, RefreshCw as ReloadOutlined } from 'lucide-react';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS, listingImport } from 'src/components/shared/listing/listing-presets';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { FilePdfOutlined, ShoppingOutlined, UserOutlined } from '@ant-design/icons';
import apiClient, { BASEURL } from '../../services/api/apiClient';
import { tokenStorage } from '../../services/auth/tokenStorage';
import useProducts from '../../services/useProducts';
import { usePermissions } from '../../hooks/usePermissions';

const { Text } = Typography;

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  PROCESSING: 'purple',
  SHIPPED: 'cyan',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

type BillTo = { name: string; phone: string; email: string; address: string };

const EMPTY_BILL: BillTo = { name: '', phone: '', email: '', address: '' };

const QuotationsPage = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const openViewDrawer = async (row: any) => {
    setViewingOrder(row);
    try {
      setViewLoading(true);
      const res: any = await apiClient.get(`/quotations/${row._id}`);
      if (res.data?.success) setViewingOrder(res.data.data);
    } finally {
      setViewLoading(false);
    }
  };
  const [pendingStatus, setPendingStatus] = useState<{
    id: string;
    status: string;
  } | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<any>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [sourceType, setSourceType] = useState<'lead' | 'customer'>('lead');
  const [billTo, setBillTo] = useState<BillTo>(EMPTY_BILL);

  // cart state
  type CartRow = {
    productId: string;
    size: number | undefined;
    price: number;
    pieces: number;
    quantity: number;
  };
  const [cart, setCart] = useState<CartRow[]>([]);
  const [tax, setTax] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  const subtotal = cart.reduce(
    (s, c) => s + c.price * c.pieces * c.quantity,
    0
  );
  const total = subtotal + tax - discount;

  const { getProducts } = useProducts();
  const { canCreate, canUpdate } = usePermissions();

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/quotations');
      if (res.data?.success) setQuotations(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();

    getProducts({ limit: 1000 }).then((res: any) => {
      const body = res?.data ?? res;
      const list = body?.data?.products ?? body?.products ?? [];
      setAllProducts(Array.isArray(list) ? list : []);
    });

    apiClient
      .get('/leads')
      .then((res: any) => {
        const data = res.data?.data;
        setLeads(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    apiClient
      .get('/customers?limit=1000')
      .then((res: any) => {
        const data = res.data?.data;
        setCustomers(Array.isArray(data) ? data : data?.customers ?? []);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill billTo when lead/customer selected
  const handleSourceSelect = (id: string) => {
    if (sourceType === 'lead') {
      const l = leads.find((x: any) => x._id === id);
      if (l)
        setBillTo({
          name: l.name || '',
          phone: l.phone || '',
          email: l.email || '',
          address: [l.address, l.city, l.state, l.zip]
            .filter(Boolean)
            .join(', '),
        });
    } else {
      const c = customers.find((x: any) => x._id === id);
      if (c)
        setBillTo({
          name: c.name || '',
          phone: c.phone || '',
          email: c.email || '',
          address: [
            c.address?.street,
            c.address?.city,
            c.address?.state,
            c.address?.pincode,
          ]
            .filter(Boolean)
            .join(', '),
        });
    }
  };

  const updateOrderStatus = async (
    id: string,
    status: string,
    deliveryDate?: any
  ) => {
    try {
      setStatusUpdating(id);
      const payload: any = { orderStatus: status };
      if (deliveryDate) {
        const d = deliveryDate.toDate();
        d.setHours(12, 0, 0, 0);
        payload.expectedDeliveryDate = d.toISOString();
      }
      const res: any = await apiClient.put(
        `/quotations/orderstatus/${id}`,
        payload
      );
      if (res.data?.success) {
        message.success('Status updated');
        setQuotations((prev) =>
          prev.map((q) => (q._id === id ? { ...q, orderStatus: status } : q))
        );
      } else {
        message.error(res.data?.message || 'Failed to update status');
      }
    } catch {
      message.error('Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const DELIVERY_DATE_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED'];

  const handleStatusChange = (id: string, status: string) => {
    if (DELIVERY_DATE_STATUSES.includes(status)) {
      const existing = quotations.find((q) => q._id === id);
      const prefill = existing?.expectedDeliveryDate
        ? dayjs(existing.expectedDeliveryDate)
        : null;
      setExpectedDeliveryDate(prefill);
      setPendingStatus({ id, status });
    } else {
      updateOrderStatus(id, status);
    }
  };

  const openEditDrawer = (quotation: any) => { setEditingQuotation(quotation); setEditDrawerOpen(true); editForm.setFieldsValue({ tax: quotation.tax ?? 0, discount: quotation.discount ?? 0 }); setBillTo(quotation.billTo ?? EMPTY_BILL); };

  const closeEditDrawer = () => {
    setEditDrawerOpen(false);
    setEditingQuotation(null);
    editForm.resetFields();
    setBillTo(EMPTY_BILL);
  };

  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      const res: any = await apiClient.put(
        `/quotations/${editingQuotation._id}`,
        {
          billTo,
          tax: values.tax,
          discount: values.discount,
        }
      );
      if (res.data?.success) {
        message.success('Order updated!');
        closeEditDrawer();
        fetchQuotations();
      } else {
        message.error(res.data?.message || 'Failed');
      }
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const openPdf = (id: string) => {
    const token = tokenStorage.getAccessToken();
    window.open(`${BASEURL}/api/quotations/${id}/pdf?token=${token}`, '_blank');
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setBillTo(EMPTY_BILL);
    setSourceType('lead');
    setCart([]);
    setTax(0);
    setDiscount(0);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!cart.length) {
        message.warning('Please add at least one product');
        return;
      }
      setSaving(true);

      const products = cart.map((c) => ({
        productId: c.productId,
        price: c.price,
        pieces: c.pieces,
        quantity: c.quantity,
        ...(c.size != null ? { size: c.size } : {}),
      }));

      const payload: any = { products, tax, discount, billTo };
      if (sourceType === 'lead') payload.leadId = values.sourceId;
      else payload.customerId = values.sourceId;

      const res: any = await apiClient.post('/quotations/manual', payload);
      if (res.data?.success) {
        message.success('Order created!');
        closeDrawer();
        fetchQuotations();
        openPdf(res.data.data._id);
      } else {
        message.error(res.data?.message || 'Failed');
      }
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Order No',
      dataIndex: 'quotationNo',
      render: (v: string) => (
        <Text strong style={{ color: '#1677ff' }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Bill To',
      dataIndex: 'billTo',
      render: (b: any) =>
        b?.name ? (
          <div>
            <Text strong>{b.name}</Text>
            {b.phone && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {b.phone}
                </Text>
              </div>
            )}
            {b.email && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {b.email}
                </Text>
              </div>
            )}
          </div>
        ) : (
          '—'
        ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      render: (s: string) => (
        <Tag color={s === 'activity' ? 'blue' : 'green'}>{s}</Tag>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'products',
      render: (p: any[]) => <Tag>{p?.length || 0} items</Tag>,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      render: (v: number) => (
        <Text strong>₹{(v || 0).toLocaleString('en-IN')}</Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('en-IN'),
    },
    {
      title: 'Status',
      dataIndex: 'orderStatus',
      render: (status: string, row: any) => (
        <Spin spinning={statusUpdating === row._id} size="small">
          <Select
            size="small"
            value={status || 'PENDING'}
            disabled={statusUpdating === row._id || !canUpdate('quotations')}
            style={{ width: 120 }}
            options={STATUS_OPTIONS.map((o) => ({
              ...o,
              label: <Tag color={STATUS_COLORS[o.value]}>{o.label}</Tag>,
            }))}
            onChange={(val) => handleStatusChange(row._id, val)}
          />
        </Spin>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          {canUpdate('quotations') && <Button icon={<EditOutlined />} onClick={() => openEditDrawer(row)}>Edit</Button>}
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: '#1677ff' }} />}
              onClick={() => openViewDrawer(row)}
            />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button
              type="text"
              icon={
                <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
              }
              onClick={() => openPdf(row._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="module-page">
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <div>
          <Text style={{ fontSize: 20, fontWeight: 700 }}>Orders</Text>
          <div>
            <Text type="secondary">
              Auto-generated from activities + manually created
            </Text>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchQuotations}>
            Refresh
          </Button>
          {canCreate('quotations') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setDrawerOpen(true)}
            >
              Create Order
            </Button>
          )}
        </Space>
      </Flex>

      <Card>
        <ListingTable listingTitle="Quotations" fields={LISTING_FIELDS.quotations} filterKeys={["orderStatus"]} importConfig={canCreate('quotations') && listingImport('quotations', fetchQuotations)}
          rowKey="_id"
          columns={columns}
          dataSource={quotations}
          loading={loading}
          rowHoverable={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No orders yet"
              />
            ),
          }}
        />
      </Card>

      {/* ── View Order Drawer ── */}
      <Drawer
        title={
          <Flex align="center" gap={10}>
            <Text strong style={{ fontSize: 16 }}>
              Order Details
            </Text>
            {viewingOrder?.quotationNo && (
              <Tag color="blue" style={{ fontSize: 13 }}>
                {viewingOrder.quotationNo}
              </Tag>
            )}
          </Flex>
        }
        open={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        width={560}
        extra={
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => openPdf(viewingOrder?._id)}
          >
            Download PDF
          </Button>
        }
      >
        {viewingOrder &&
          (() => {
            if (viewLoading)
              return (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              );
            const o = viewingOrder;
            const taxable = (o.products || []).reduce(
              (s: number, p: any) =>
                s + (p.price || 0) * (p.pieces || 1) * (p.quantity || 1),
              0
            );
            const cgst = parseFloat(((taxable * 2.5) / 100).toFixed(2));
            const sgst = parseFloat(((taxable * 2.5) / 100).toFixed(2));
            const grandTotal = Math.round(
              taxable + cgst + sgst - (o.discount || 0)
            );
            const fmt = (v: number) =>
              Number(v || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              });
            const fmtDate = (d: string) =>
              d
                ? new Date(d).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';

            return (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Status + Source */}
                <Flex gap={10} wrap="wrap">
                  <Tag
                    color={STATUS_COLORS[o.orderStatus] || 'default'}
                    style={{ fontSize: 13, padding: '4px 12px' }}
                  >
                    {STATUS_OPTIONS.find((s) => s.value === o.orderStatus)
                      ?.label ||
                      o.orderStatus ||
                      'Pending'}
                  </Tag>
                  <Tag
                    color={o.source === 'activity' ? 'blue' : 'green'}
                    style={{ fontSize: 13, padding: '4px 12px' }}
                  >
                    {o.source}
                  </Tag>
                </Flex>

                {/* Bill To */}
                <Card
                  size="small"
                  title={<Text strong>Bill To</Text>}
                  style={{ borderRadius: 10 }}
                >
                  <Text strong style={{ fontSize: 15 }}>
                    {o.billTo?.name || '—'}
                  </Text>
                  {o.billTo?.phone && (
                    <div>
                      <Text type="secondary">📞 {o.billTo.phone}</Text>
                    </div>
                  )}
                  {o.billTo?.email && (
                    <div>
                      <Text type="secondary">✉️ {o.billTo.email}</Text>
                    </div>
                  )}
                  {o.billTo?.address && (
                    <div>
                      <Text type="secondary">📍 {o.billTo.address}</Text>
                    </div>
                  )}
                </Card>

                {/* Dates */}
                <Card
                  size="small"
                  title={<Text strong>Dates</Text>}
                  style={{ borderRadius: 10 }}
                >
                  <Row gutter={[12, 8]}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Order Date
                      </Text>
                      <div>
                        <Text strong>{fmtDate(o.createdAt)}</Text>
                      </div>
                    </Col>
                    {o.expectedDeliveryDate && (
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Expected Delivery
                        </Text>
                        <div>
                          <Text strong style={{ color: '#1677ff' }}>
                            {fmtDate(o.expectedDeliveryDate)}
                          </Text>
                        </div>
                      </Col>
                    )}
                    {o.deliveredAt && (
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Delivered On
                        </Text>
                        <div>
                          <Text strong style={{ color: '#16a34a' }}>
                            {fmtDate(o.deliveredAt)}
                          </Text>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card>

                {/* Products */}
                <Card
                  size="small"
                  title={
                    <Text strong>Products ({o.products?.length || 0})</Text>
                  }
                  style={{ borderRadius: 10, padding: 0 }}
                >
                  {(o.products || []).map((p: any, i: number) => (
                    <Flex
                      key={i}
                      justify="space-between"
                      align="center"
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <Flex align="center" gap={10}>
                        {p.image ? (
                          <img
                            src={`${BASEURL}/${p.image}`}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 6,
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 6,
                              background: '#f0f0f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ShoppingOutlined style={{ color: '#bbb' }} />
                          </div>
                        )}
                        <div>
                          <Text strong style={{ fontSize: 13 }}>
                            {p.name || 'Product'}
                          </Text>
                          <div>
                            {p.size && (
                              <Tag style={{ fontSize: 11 }}>
                                {p.size}
                                {p.unit || 'gm'}
                              </Tag>
                            )}
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Qty: {p.quantity || 1} &nbsp;|&nbsp; ₹{p.price}/pc
                            </Text>
                          </div>
                        </div>
                      </Flex>
                      <Text strong style={{ color: '#16a34a' }}>
                        ₹
                        {fmt(
                          (p.price || 0) * (p.pieces || 1) * (p.quantity || 1)
                        )}
                      </Text>
                    </Flex>
                  ))}
                </Card>

                {/* Bill Summary */}
                <Card
                  size="small"
                  title={<Text strong>Bill Summary</Text>}
                  style={{ borderRadius: 10 }}
                >
                  <Flex justify="space-between" style={{ marginBottom: 6 }}>
                    <Text type="secondary">Taxable Value</Text>
                    <Text>₹{fmt(taxable)}</Text>
                  </Flex>
                  <Flex justify="space-between" style={{ marginBottom: 6 }}>
                    <Text type="secondary">CGST (2.5%)</Text>
                    <Text>₹{fmt(cgst)}</Text>
                  </Flex>
                  <Flex justify="space-between" style={{ marginBottom: 6 }}>
                    <Text type="secondary">SGST (2.5%)</Text>
                    <Text>₹{fmt(sgst)}</Text>
                  </Flex>
                  {!!o.discount && (
                    <Flex justify="space-between" style={{ marginBottom: 6 }}>
                      <Text type="secondary">Discount</Text>
                      <Text style={{ color: '#16a34a' }}>
                        - ₹{fmt(o.discount)}
                      </Text>
                    </Flex>
                  )}
                  <Divider style={{ margin: '8px 0' }} />
                  <Flex justify="space-between">
                    <Text strong style={{ fontSize: 15 }}>
                      Grand Total
                    </Text>
                    <Text strong style={{ fontSize: 16, color: '#16a34a' }}>
                      ₹{fmt(grandTotal)}
                    </Text>
                  </Flex>
                </Card>
              </div>
            );
          })()}
      </Drawer>

      {/* ── Expected Delivery Date Modal ── */}
      <Modal
        title="Set Expected Delivery Date"
        open={!!pendingStatus}
        onCancel={() => {
          setPendingStatus(null);
          setExpectedDeliveryDate(null);
        }}
        onOk={() => {
          if (pendingStatus)
            updateOrderStatus(
              pendingStatus.id,
              pendingStatus.status,
              expectedDeliveryDate
            );
          setPendingStatus(null);
          setExpectedDeliveryDate(null);
        }}
        okText="Confirm"
        okButtonProps={{ disabled: !expectedDeliveryDate }}
      >
        <div style={{ marginBottom: 8 }}>
          <Tag color={STATUS_COLORS[pendingStatus?.status || '']}>
            {
              STATUS_OPTIONS.find((o) => o.value === pendingStatus?.status)
                ?.label
            }
          </Tag>
        </div>
        <DatePicker
          style={{ width: '100%' }}
          placeholder="Select expected delivery date"
          value={expectedDeliveryDate}
          onChange={(date) => setExpectedDeliveryDate(date)}
          disabledDate={(d) => d && d.isBefore(new Date(), 'day')}
        />
      </Modal>

      {/* ── Edit Drawer ── */}
      <Drawer
        title={`Edit Order — ${editingQuotation?.quotationNo || ''}`}
        open={editDrawerOpen}
        onClose={closeEditDrawer}
        width={480}
        extra={
          <Space>
            <Button onClick={closeEditDrawer}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleUpdate}>
              Save Changes
            </Button>
          </Space>
        }
      >
        <Form form={editForm} layout="vertical">
          {editingQuotation?.billTo && (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 10,
              }}
              title={
                <Flex align="center" gap={6}>
                  <UserOutlined style={{ color: '#52c41a' }} />
                  <Text strong style={{ fontSize: 13 }}>
                    Bill To Details
                  </Text>
                </Flex>
              }
            >
              <Row gutter={[12, 8]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Name
                  </Text>
                  <Input
                    size="small"
                    value={billTo.name}
                    onChange={(e) =>
                      setBillTo((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Phone
                  </Text>
                  <Input
                    size="small"
                    value={billTo.phone}
                    onChange={(e) =>
                      setBillTo((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Email
                  </Text>
                  <Input
                    size="small"
                    value={billTo.email}
                    onChange={(e) =>
                      setBillTo((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Address
                  </Text>
                  <Input
                    size="small"
                    value={billTo.address}
                    onChange={(e) =>
                      setBillTo((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </Col>
              </Row>
            </Card>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tax" label="Tax (₹)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discount" label="Discount (₹)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      <Drawer
        title="Create Order"
        open={drawerOpen}
        onClose={closeDrawer}
        width={680}
        extra={
          <Space>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              Create & Download PDF
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
          {/* ── Source toggle ── */}
          <Form.Item label="Bill To Source">
            <Flex gap={8}>
              <Button
                type={sourceType === 'lead' ? 'primary' : 'default'}
                onClick={() => {
                  setSourceType('lead');
                  form.setFieldValue('sourceId', undefined);
                  setBillTo(EMPTY_BILL);
                }}
              >
                From Lead
              </Button>
              <Button
                type={sourceType === 'customer' ? 'primary' : 'default'}
                onClick={() => {
                  setSourceType('customer');
                  form.setFieldValue('sourceId', undefined);
                  setBillTo(EMPTY_BILL);
                }}
              >
                From Customer
              </Button>
            </Flex>
          </Form.Item>

          <Form.Item
            name="sourceId"
            label={sourceType === 'lead' ? 'Select Lead' : 'Select Customer'}
            rules={[{ required: true, message: 'Please select' }]}
          >
            <Select
              showSearch
              allowClear
              placeholder={
                sourceType === 'lead' ? 'Search lead...' : 'Search customer...'
              }
              optionFilterProp="label"
              onChange={handleSourceSelect}
              onClear={() => setBillTo(EMPTY_BILL)}
              options={
                sourceType === 'lead'
                  ? leads.map((l: any) => ({
                      value: l._id,
                      label: `${l.name}${l.phone ? ' — ' + l.phone : ''}`,
                    }))
                  : customers.map((c: any) => ({
                      value: c._id,
                      label: `${c.name}${c.phone ? ' — ' + c.phone : ''}`,
                    }))
              }
            />
          </Form.Item>

          {/* ── Auto-fetched + editable Bill To details ── */}
          {(billTo.name || billTo.phone || billTo.email) && (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 10,
              }}
              title={
                <Flex align="center" gap={6}>
                  <UserOutlined style={{ color: '#52c41a' }} />
                  <Text strong style={{ fontSize: 13 }}>
                    Bill To Details
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    (editable)
                  </Text>
                </Flex>
              }
            >
              <Row gutter={[12, 8]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Name
                  </Text>
                  <Input
                    value={billTo.name}
                    onChange={(e) =>
                      setBillTo((p) => ({ ...p, name: e.target.value }))
                    }
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Phone
                  </Text>
                  <Input
                    value={billTo.phone}
                    onChange={(e) =>
                      setBillTo((p) => ({ ...p, phone: e.target.value }))
                    }
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Email
                  </Text>
                  <Input
                    value={billTo.email}
                    onChange={(e) =>
                      setBillTo((p) => ({ ...p, email: e.target.value }))
                    }
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Address
                  </Text>
                  <Input
                    value={billTo.address}
                    onChange={(e) =>
                      setBillTo((p) => ({ ...p, address: e.target.value }))
                    }
                    size="small"
                  />
                </Col>
              </Row>
            </Card>
          )}

          <Divider style={{ margin: '8px 0 16px' }} />

          {/* ── Products ── */}
          <div>
            <Flex
              justify="space-between"
              align="center"
              style={{ marginBottom: 10 }}
            >
              <Text strong style={{ fontSize: 14 }}>
                Products
              </Text>
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() =>
                  setCart((prev) => [
                    ...prev,
                    {
                      productId: '',
                      size: undefined,
                      price: 0,
                      pieces: 1,
                      quantity: 1,
                    },
                  ])
                }
              >
                Add Product
              </Button>
            </Flex>

            {cart.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No products added"
                style={{ margin: '16px 0' }}
              />
            )}

            {cart.map((item, idx) => {
              const found = allProducts.find(
                (p: any) => p._id === item.productId
              );
              return (
                <Card
                  key={idx}
                  size="small"
                  style={{
                    marginBottom: 10,
                    borderRadius: 10,
                    border: '1px solid #e8e8e8',
                    background: '#fafafa',
                  }}
                >
                  <Flex gap={8} align="flex-start">
                    {/* product image */}
                    {found?.image ? (
                      <img
                        src={`${BASEURL}/${found.image}`}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ShoppingOutlined
                          style={{ color: '#bbb', fontSize: 20 }}
                        />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* product select */}
                      <Select
                        showSearch
                        placeholder="Select product"
                        style={{ width: '100%', marginBottom: 8 }}
                        optionFilterProp="label"
                        value={item.productId || undefined}
                        options={allProducts.map((p: any) => ({
                          value: p._id,
                          label: p.name,
                        }))}
                        onChange={(val) => {
                          // just set product, reset size & price — no auto-merge on product select
                          setCart((prev) =>
                            prev.map((c, i) =>
                              i === idx
                                ? {
                                    ...c,
                                    productId: val,
                                    size: undefined,
                                    price: 0,
                                    pieces: 1,
                                  }
                                : c
                            )
                          );
                        }}
                      />

                      <Row gutter={8}>
                        {/* size select from prices array */}
                        {found?.prices?.length > 0 && (
                          <Col span={8}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Size
                            </Text>
                            <Select
                              size="small"
                              style={{ width: '100%' }}
                              value={item.size}
                              placeholder="Select size"
                              options={found.prices.map((pr: any) => ({
                                value: pr.size,
                                label: `${pr.size} ${found.unit}`,
                              }))}
                              onChange={(val) => {
                                const pr = found.prices.find(
                                  (p: any) => p.size === val
                                );
                                const newPrice = pr?.price ?? item.price;
                                const newPieces = pr?.pieces ?? 1;
                                setCart((prev) => {
                                  const dupIdx = prev.findIndex(
                                    (c, i) =>
                                      i !== idx &&
                                      c.productId === item.productId &&
                                      c.size === val
                                  );
                                  if (dupIdx !== -1) {
                                    return prev
                                      .map((c, i) =>
                                        i === dupIdx
                                          ? {
                                              ...c,
                                              quantity:
                                                c.quantity + item.quantity,
                                            }
                                          : c
                                      )
                                      .filter((_, i) => i !== idx);
                                  }
                                  return prev.map((c, i) =>
                                    i === idx
                                      ? {
                                          ...c,
                                          size: val,
                                          price: newPrice,
                                          pieces: newPieces,
                                        }
                                      : c
                                  );
                                });
                              }}
                            />
                          </Col>
                        )}

                        <Col span={found?.prices?.length > 0 ? 8 : 12}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Price (₹)
                          </Text>
                          <InputNumber
                            size="small"
                            style={{ width: '100%', background: '#f5f5f5' }}
                            min={0}
                            value={item.price}
                            readOnly
                          />
                        </Col>

                        <Col span={found?.prices?.length > 0 ? 8 : 12}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Qty
                          </Text>
                          <InputNumber
                            size="small"
                            style={{ width: '100%' }}
                            min={1}
                            value={item.quantity}
                            onChange={(v) =>
                              setCart((prev) =>
                                prev.map((c, i) =>
                                  i === idx ? { ...c, quantity: v ?? 1 } : c
                                )
                              )
                            }
                          />
                        </Col>
                      </Row>
                    </div>

                    <Flex align="center" gap={4} style={{ flexShrink: 0 }}>
                      <Text
                        strong
                        style={{
                          color: '#389e0d',
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ₹
                        {(
                          item.price *
                          item.pieces *
                          item.quantity
                        ).toLocaleString('en-IN')}
                      </Text>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          setCart((prev) => prev.filter((_, i) => i !== idx))
                        }
                      />
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </div>

          {/* ── Summary ── */}
          {cart.length > 0 && (
            <Card
              size="small"
              style={{
                marginTop: 8,
                borderRadius: 10,
                background: '#f6ffed',
                border: '1px solid #d9f7be',
              }}
            >
              <Row gutter={[16, 8]} align="middle">
                <Col span={24}>
                  <Flex justify="space-between">
                    <Text type="secondary">Subtotal</Text>
                    <Text strong>₹{subtotal.toLocaleString('en-IN')}</Text>
                  </Flex>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tax (₹)
                  </Text>
                  <InputNumber
                    size="small"
                    style={{ width: '100%' }}
                    min={0}
                    value={tax}
                    onChange={(v) => setTax(v ?? 0)}
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Discount (₹)
                  </Text>
                  <InputNumber
                    size="small"
                    style={{ width: '100%' }}
                    min={0}
                    value={discount}
                    onChange={(v) => setDiscount(v ?? 0)}
                  />
                </Col>
                <Col span={24}>
                  <Divider style={{ margin: '6px 0' }} />
                  <Flex justify="space-between" align="center">
                    <Text strong style={{ fontSize: 15 }}>
                      Total
                    </Text>
                    <Text strong style={{ fontSize: 18, color: '#389e0d' }}>
                      ₹{total.toLocaleString('en-IN')}
                    </Text>
                  </Flex>
                </Col>
              </Row>
            </Card>
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default QuotationsPage;
