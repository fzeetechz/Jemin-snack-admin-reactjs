import { X as CloseOutlined, Trash2 as DeleteOutlined, Plus as PlusOutlined, Search as SearchOutlined } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, ClockCircleOutlined, FilePdfOutlined, MinusOutlined, PictureOutlined, SendOutlined, ShoppingCartOutlined, ShoppingOutlined } from '@ant-design/icons';
import activityLogservices from '../../services/activityService';
import { getAttachmentUrl } from '../../utils/convertor';
import useProducts from '../../services/useProducts';
import { BASEURL } from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../services/api/endpoints';
import { tokenStorage } from '../../services/auth/tokenStorage';

type Activity = {
  _id: string;
  content: string;
  attachments?: Array<{
    url: string;
    name?: string;
    type?: string;
    size?: number;
  }>;
  callData?: { direction?: string; status?: string; duration?: number };
  taskId?: { subject?: string };
  products?: Array<{
    productId?: string;
    size?: number;
    price?: number;
    quantity?: number;
    product?: {
      name?: string;
      image?: string;
      unit?: string;
      availableSize?: number[];
      price?: number;
    };
  }>;
  createdBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };
  leadId: string;
  createdAt: string;
};

type CartItem = {
  productId: string;
  size: number;
  price: number;
  quantity: number;
};

const { Text, Paragraph } = Typography;

const formatDuration = (d?: number) => {
  if (!d) return '0s';
  if (d < 60) return `${d}s`;
  const m = Math.floor(d / 60),
    s = d % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
};

const callStatusColor = (s?: string) => {
  switch ((s || '').toLowerCase()) {
    case 'completed':
      return 'success';
    case 'failed':
    case 'missed':
    case 'no-answer':
    case 'busy':
      return 'error';
    default:
      return 'default';
  }
};

const ProductImage = ({
  image,
  name,
  size = 40,
}: {
  image?: string;
  name?: string;
  size?: number;
}) =>
  image ? (
    <img
      src={`${BASEURL}/${image}`}
      alt={name}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: 8,
        flexShrink: 0,
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <ShoppingOutlined style={{ color: '#bbb', fontSize: size * 0.4 }} />
    </div>
  );

const ActivityComp = (props: any) => {
  const { id: leadId } = props;

  const [allActivity, setAllActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // product picker state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const { getByActivityId, creatactivityLogs, deleteactivityLogs } =
    activityLogservices();
  const { getProducts } = useProducts();

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await getByActivityId(leadId);
      if (res?.success) setAllActivity([...(res.data || [])].reverse());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!leadId) return;
    load();
    getProducts({ limit: 1000 }).then((res: any) => {
      // apiClient (axios) returns full response → res.data = API body
      // API body shape: { success, data: { products: [...], pagination: {} } }
      const body = res?.data ?? res;
      const list = body?.data?.products ?? body?.products ?? body?.data ?? [];
      setAllProducts(Array.isArray(list) ? list : []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const filteredProducts = useMemo(
    () =>
      allProducts.filter(
        (p: any) => p.name?.toLowerCase().includes(search.toLowerCase())
      ),
    [allProducts, search]
  );

  // per-product selected size in left panel
  const [pickerSize, setPickerSize] = useState<Record<string, number>>({});

  const getCartItem = (productId: string, size: number) =>
    cart.find((c) => c.productId === productId && c.size === size);

  const addToCart = (product: any, size: number) => {
    const price = product.prices?.find((p: any) => p.size === size)?.price ?? 0;
    setCart((prev) => {
      const exists = prev.find(
        (c) => c.productId === product._id && c.size === size
      );
      if (exists)
        return prev.map((c) =>
          c.productId === product._id && c.size === size
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      return [...prev, { productId: product._id, size, price, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string, size: number) => {
    setCart((prev) => {
      const item = prev.find(
        (c) => c.productId === productId && c.size === size
      );
      if (!item) return prev;
      if (item.quantity <= 1)
        return prev.filter(
          (c) => !(c.productId === productId && c.size === size)
        );
      return prev.map((c) =>
        c.productId === productId && c.size === size
          ? { ...c, quantity: c.quantity - 1 }
          : c
      );
    });
  };

  const updateCartField = (
    productId: string,
    size: number,
    field: 'price' | 'quantity',
    value: number
  ) => {
    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId && c.size === size
          ? { ...c, [field]: value }
          : c
      )
    );
  };

  const totalCartQty = cart.reduce((s, c) => s + c.quantity, 0);

  const onCreate = async () => {
    const content = note.trim();
    if (!content) return message.warning('Please write something');

    // check if any product with sizes has no size selected
    const missingSizes = cart.filter((item) => !item.size);
    if (missingSizes.length > 0) {
      const names = missingSizes
        .map((item) => {
          const p = allProducts.find((ap: any) => ap._id === item.productId);
          return p?.name || 'Unknown';
        })
        .join(', ');
      message.warning(`Please select size for: ${names}`);
      setPickerOpen(true);
      return;
    }

    try {
      setCreating(true);
      const payload = new FormData();
      payload.append('leadId', leadId);
      payload.append('content', content);
      fileList.forEach((file) =>
        payload.append('leadAttachments', file.originFileObj)
      );
      if (cart.length > 0) payload.append('products', JSON.stringify(cart));
      const res: any = await creatactivityLogs(payload);
      if (res?.success) {
        message.success('Activity posted!');
        setNote('');
        setFileList([]);
        setCart([]);
        load();
      } else {
        message.error(res?.message || 'Failed');
      }
    } catch (e: any) {
      message.error(e?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (activityId: string) => {
    try {
      setDeletingId(activityId);
      const res: any = await deleteactivityLogs(activityId);
      if (res?.success) {
        message.success('Deleted');
        setAllActivity((prev) => prev.filter((x) => x._id !== activityId));
      } else {
        message.error(res?.message || 'Failed');
      }
    } catch (e: any) {
      message.error(e?.message || 'Failed');
    } finally {
      setDeletingId(null);
    }
  };

  const downloadPdf = (activityId: string) => {
    const token = tokenStorage.getAccessToken();
    const url = `${BASEURL}/api${API_ENDPOINTS.QUOTATIONS.BY_ACTIVITY(
      activityId
    )}`;
    // fetch quotation id then open pdf
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((body) => {
        if (body?.success && body?.data?._id) {
          window.open(
            `${BASEURL}/api${API_ENDPOINTS.QUOTATIONS.PDF(
              body.data._id
            )}?token=${token}`,
            '_blank'
          );
        } else {
          message.error('Quotation not found for this activity');
        }
      })
      .catch(() => message.error('Failed to fetch quotation'));
  };

  const timelineItems = useMemo(
    () =>
      allActivity.map((a) => {
        const fullName =
          [a.createdBy?.firstName, a.createdBy?.lastName]
            .filter(Boolean)
            .join(' ') || '—';
        const when = a.createdAt ? new Date(a.createdAt).toLocaleString() : '';
        const hasProducts = !!a.products?.length;

        return {
          key: a._id,
          children: (
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: '1px solid #f0f0f0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <Flex gap={12} align="flex-start">
                <Avatar
                  src={a.createdBy?.avatar}
                  style={{ background: '#1677ff', flexShrink: 0 }}
                  size={36}
                >
                  {fullName[0]?.toUpperCase() || 'U'}
                </Avatar>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Flex justify="space-between" align="flex-start">
                    <div>
                      <Space size={6}>
                        <Text strong style={{ fontSize: 13 }}>
                          {fullName}
                        </Text>
                        {a.taskId?.subject && (
                          <Tag color="blue" style={{ fontSize: 11 }}>
                            {a.taskId.subject}
                          </Tag>
                        )}
                      </Space>
                      <Flex align="center" gap={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {when}
                        </Text>
                        {hasProducts && (
                          <Tooltip title="Download Quotation PDF">
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <FilePdfOutlined
                                  style={{ color: '#ff4d4f', fontSize: 14 }}
                                />
                              }
                              style={{ padding: '0 4px', height: 20 }}
                              onClick={() => downloadPdf(a._id)}
                            />
                          </Tooltip>
                        )}
                      </Flex>
                    </div>
                    <Popconfirm
                      title="Move this activity to Trash?"
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                      onConfirm={() => onDelete(a._id)}
                    >
                      <Button
                        danger
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        loading={deletingId === a._id}
                      />
                    </Popconfirm>
                  </Flex>

                  <Paragraph
                    style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}
                  >
                    {a.content}
                  </Paragraph>

                  {/* Call info */}
                  {a.callData && (
                    <Space size={6} wrap style={{ marginTop: 10 }}>
                      <Tag
                        icon={
                          a.callData.direction === 'outgoing' ? (
                            <ArrowUpOutlined />
                          ) : (
                            <ArrowDownOutlined />
                          )
                        }
                        color={
                          a.callData.direction === 'outgoing' ? 'green' : 'blue'
                        }
                      >
                        {a.callData.direction || 'incoming'}
                      </Tag>
                      <Tag icon={<ClockCircleOutlined />}>
                        {formatDuration(a.callData.duration)}
                      </Tag>
                      <Tag color={callStatusColor(a.callData.status)}>
                        {a.callData.status || 'unknown'}
                      </Tag>
                    </Space>
                  )}

                  {/* Attachments */}
                  {!!a.attachments?.length && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      {a.attachments.map((att, i) => (
                        <img
                          key={i}
                          src={getAttachmentUrl(att.url)}
                          alt={att.name || 'attachment'}
                          onClick={() =>
                            window.open(getAttachmentUrl(att.url), '_blank')
                          }
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 8,
                            cursor: 'pointer',
                            border: '1px solid #e8e8e8',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Products */}
                  {!!a.products?.length && (
                    <div style={{ marginTop: 12 }}>
                      <Divider style={{ margin: '8px 0' }} />
                      <Flex align="center" gap={6} style={{ marginBottom: 8 }}>
                        <ShoppingCartOutlined style={{ color: '#52c41a' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Products Added
                        </Text>
                      </Flex>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {a.products.map((p, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              background: '#f6ffed',
                              border: '1px solid #d9f7be',
                              borderRadius: 10,
                              padding: '8px 12px',
                            }}
                          >
                            <ProductImage
                              image={p.product?.image}
                              name={p.product?.name}
                              size={38}
                            />
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ fontSize: 13 }}>
                                {p.product?.name || '—'}
                              </Text>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 8,
                                  marginTop: 2,
                                  flexWrap: 'wrap',
                                }}
                              >
                                {p.size ? (
                                  <Tag style={{ fontSize: 11, margin: 0 }}>
                                    {p.size} {p.product?.unit}
                                  </Tag>
                                ) : p.product?.unit ? (
                                  <Tag style={{ fontSize: 11, margin: 0 }}>
                                    {p.product.unit}
                                  </Tag>
                                ) : null}
                                <Tag
                                  color="green"
                                  style={{ fontSize: 11, margin: 0 }}
                                >
                                  Qty: {p.quantity}
                                </Tag>
                                {p.price != null && (
                                  <Tag
                                    color="blue"
                                    style={{ fontSize: 11, margin: 0 }}
                                  >
                                    ₹{p.price}
                                  </Tag>
                                )}
                              </div>
                            </div>
                            {p.price != null && p.quantity && (
                              <Text
                                strong
                                style={{
                                  fontSize: 13,
                                  color: '#389e0d',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                ₹{(p.price * p.quantity).toLocaleString()}
                              </Text>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* total */}
                      {a.products.some((p) => p.price && p.quantity) && (
                        <Flex justify="flex-end" style={{ marginTop: 6 }}>
                          <Text strong style={{ fontSize: 13 }}>
                            Total: ₹
                            {a.products
                              .reduce(
                                (s, p) =>
                                  s + (p.price || 0) * (p.quantity || 1),
                                0
                              )
                              .toLocaleString()}
                          </Text>
                        </Flex>
                      )}
                    </div>
                  )}
                </div>
              </Flex>
            </Card>
          ),
        };
      }),
    [allActivity, deletingId]
  );

  return (
    <div>
      {/* Timeline */}
      <Card
        title={
          <Flex align="center" gap={8}>
            <ClockCircleOutlined />
            Activity Log
          </Flex>
        }
        loading={loading}
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 16 }}
      >
        {allActivity.length ? (
          <Timeline items={timelineItems} />
        ) : (
          <Empty description="No activity yet" />
        )}
      </Card>

      {/* Composer */}
      <Card
        style={{
          marginTop: 16,
          borderRadius: 16,
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Input.TextArea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a note... (e.g., Called customer, sent proposal, follow-up scheduled)"
          autoSize={{ minRows: 3, maxRows: 8 }}
          style={{ borderRadius: 8, fontSize: 14, marginBottom: 12 }}
        />

        {/* Image previews */}
        {fileList.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            {fileList.map((file, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={URL.createObjectURL(file.originFileObj)}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '2px solid #e8e8e8',
                  }}
                />
                <Button
                  type="primary"
                  danger
                  size="small"
                  shape="circle"
                  icon={<CloseOutlined />}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    minWidth: 20,
                    fontSize: 10,
                  }}
                  onClick={() =>
                    setFileList(fileList.filter((_, j) => j !== i))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Cart preview */}
        {cart.length > 0 && (
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #d9f7be',
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Flex
              justify="space-between"
              align="center"
              style={{ marginBottom: 8 }}
            >
              <Flex align="center" gap={6}>
                <ShoppingCartOutlined style={{ color: '#52c41a' }} />
                <Text strong style={{ fontSize: 13 }}>
                  {cart.length} product{cart.length > 1 ? 's' : ''} added
                </Text>
              </Flex>
              <Button
                type="link"
                size="small"
                onClick={() => setPickerOpen(true)}
                style={{ padding: 0 }}
              >
                Edit
              </Button>
            </Flex>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cart.map((item) => {
                const p = allProducts.find(
                  (ap: any) => ap._id === item.productId
                );
                return (
                  <div
                    key={`${item.productId}_${item.size}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: '#fff',
                      border: '1px solid #d9f7be',
                      borderRadius: 10,
                      padding: '8px 12px',
                    }}
                  >
                    <ProductImage image={p?.image} name={p?.name} size={38} />
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 13 }}>
                        {p?.name || '—'}
                      </Text>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          marginTop: 2,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Tag style={{ fontSize: 11, margin: 0 }}>
                          {item.size} {p?.unit}
                        </Tag>
                        <Tag color="green" style={{ fontSize: 11, margin: 0 }}>
                          Qty: {item.quantity}
                        </Tag>
                        <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                          ₹{item.price}
                        </Tag>
                      </div>
                    </div>
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        color: '#389e0d',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </Text>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() =>
                        setCart((prev) =>
                          prev.filter(
                            (c) =>
                              !(
                                c.productId === item.productId &&
                                c.size === item.size
                              )
                          )
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <Flex justify="flex-end">
              <Text strong>
                Total: ₹
                {cart
                  .reduce((s, c) => s + c.price * c.quantity, 0)
                  .toLocaleString()}
              </Text>
            </Flex>
          </div>
        )}

        <Flex justify="space-between" align="center">
          <Space>
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              multiple
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<PictureOutlined />} style={{ borderRadius: 8 }}>
                Images
              </Button>
            </Upload>

            <Badge count={totalCartQty} size="small">
              <Button
                icon={<ShoppingCartOutlined />}
                style={{ borderRadius: 8 }}
                type={cart.length > 0 ? 'primary' : 'default'}
                onClick={() => setPickerOpen(true)}
              >
                Products
              </Button>
            </Badge>
          </Space>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={onCreate}
            loading={creating}
            disabled={!note.trim()}
            style={{ borderRadius: 8, paddingInline: 24 }}
          >
            Post Activity
          </Button>
        </Flex>
      </Card>

      {/* Product Picker Modal */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <ShoppingCartOutlined />
            <span>Add Products</span>
            {totalCartQty > 0 && (
              <Tag color="green">{totalCartQty} in cart</Tag>
            )}
          </Flex>
        }
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        footer={
          <Flex justify="space-between" align="center">
            <Text type="secondary" style={{ fontSize: 12 }}>
              {cart.length} product{cart.length !== 1 ? 's' : ''} · ₹
              {cart
                .reduce((s, c) => s + c.price * c.quantity, 0)
                .toLocaleString()}
            </Text>
            <Space>
              <Button onClick={() => setCart([])}>Clear All</Button>
              <Button type="primary" onClick={() => setPickerOpen(false)}>
                Done
              </Button>
            </Space>
          </Flex>
        }
        width={860}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: 'flex', height: 540 }}>
          {/* Left: product list */}
          <div
            style={{
              flex: 1,
              borderRight: '1px solid #f0f0f0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <Input
                prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {filteredProducts.length === 0 && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No products found"
                  style={{ marginTop: 40 }}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredProducts.map((p: any) => {
                  const selectedSize = pickerSize[p._id] ?? p.prices?.[0]?.size;
                  const cartItem = selectedSize
                    ? getCartItem(p._id, selectedSize)
                    : null;
                  const inCart = !!cartItem;
                  const cartCount = cart
                    .filter((c) => c.productId === p._id)
                    .reduce((s, c) => s + c.quantity, 0);
                  return (
                    <div
                      key={p._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${
                          cartCount > 0 ? '#b7eb8f' : '#f0f0f0'
                        }`,
                        background: cartCount > 0 ? '#f6ffed' : '#fff',
                      }}
                    >
                      <ProductImage image={p.image} name={p.name} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 13 }}>
                          {p.name}
                        </Text>
                        {cartCount > 0 && (
                          <Text
                            type="secondary"
                            style={{ fontSize: 11, display: 'block' }}
                          >
                            {cartCount} in cart
                          </Text>
                        )}
                      </div>
                      {p.prices?.length > 0 && (
                        <Select
                          size="small"
                          style={{ width: 150 }}
                          value={selectedSize}
                          onChange={(val) =>
                            setPickerSize((prev) => ({ ...prev, [p._id]: val }))
                          }
                          options={p.prices.map((pr: any) => ({
                            value: pr.size,
                            label: `${pr.size} ${p.unit} — ₹${pr.price}`,
                          }))}
                        />
                      )}
                      {inCart ? (
                        <Flex align="center" gap={4}>
                          <Button
                            size="small"
                            shape="circle"
                            icon={<MinusOutlined />}
                            onClick={() => removeFromCart(p._id, selectedSize!)}
                          />
                          <Text
                            strong
                            style={{ minWidth: 18, textAlign: 'center' }}
                          >
                            {cartItem!.quantity}
                          </Text>
                          <Button
                            size="small"
                            shape="circle"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => addToCart(p, selectedSize!)}
                          />
                        </Flex>
                      ) : (
                        <Button
                          size="small"
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() =>
                            selectedSize && addToCart(p, selectedSize)
                          }
                          disabled={!selectedSize}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: cart / edit details */}
          <div style={{ width: 340, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <Text strong style={{ fontSize: 13 }}>
                Cart
              </Text>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {cart.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No items"
                  style={{ marginTop: 40 }}
                />
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {cart.map((item) => {
                    const p = allProducts.find(
                      (ap: any) => ap._id === item.productId
                    );
                    return (
                      <div
                        key={`${item.productId}_${item.size}`}
                        style={{
                          background: '#fafafa',
                          borderRadius: 10,
                          padding: 10,
                          border: '1px solid #f0f0f0',
                        }}
                      >
                        <Flex
                          align="center"
                          gap={8}
                          style={{ marginBottom: 8 }}
                        >
                          <ProductImage
                            image={p?.image}
                            name={p?.name}
                            size={32}
                          />
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: 12 }}>
                              {p?.name}
                            </Text>
                            <Text
                              type="secondary"
                              style={{ fontSize: 11, display: 'block' }}
                            >
                              {item.size} {p?.unit} — ₹{item.price}
                            </Text>
                          </div>
                          <Tooltip title="Remove">
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={() =>
                                setCart((prev) =>
                                  prev.filter(
                                    (c) =>
                                      !(
                                        c.productId === item.productId &&
                                        c.size === item.size
                                      )
                                  )
                                )
                              }
                            />
                          </Tooltip>
                        </Flex>

                        <Row gutter={6}>
                          <Col span={12}>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 11,
                                display: 'block',
                                marginBottom: 4,
                              }}
                            >
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
                          <Col span={12}>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 11,
                                display: 'block',
                                marginBottom: 4,
                              }}
                            >
                              Qty
                            </Text>
                            <InputNumber
                              size="small"
                              style={{ width: '100%' }}
                              min={1}
                              value={item.quantity}
                              onChange={(v) =>
                                updateCartField(
                                  item.productId,
                                  item.size,
                                  'quantity',
                                  v ?? 1
                                )
                              }
                            />
                          </Col>
                        </Row>
                        <Flex justify="flex-end" style={{ marginTop: 6 }}>
                          <Text style={{ fontSize: 12, color: '#389e0d' }}>
                            = ₹{(item.price * item.quantity).toLocaleString()}
                          </Text>
                        </Flex>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div
                style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0' }}
              >
                <Flex justify="space-between">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Total
                  </Text>
                  <Text strong style={{ color: '#389e0d' }}>
                    ₹
                    {cart
                      .reduce((s, c) => s + c.price * c.quantity, 0)
                      .toLocaleString()}
                  </Text>
                </Flex>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityComp;
