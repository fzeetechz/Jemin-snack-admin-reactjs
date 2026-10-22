import { X as CloseOutlined, RefreshCw as ReloadOutlined, Eye as EyeOutlined } from 'lucide-react';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';
import { useEffect, useState } from 'react';
import {
  Tag,
  Button,
  Card,
  Space,
  Typography,
  Flex,
  Select,
  message,
  Popconfirm,
  Modal,
} from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { UserAvatar } from 'src/components';
import leaveService from 'src/services/leaveService';
import { imageUrl, timeConverter } from 'src/utils/convertor';
import { usePermissions } from 'src/hooks';

const { Text } = Typography;

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CL: 'Casual Leave',
  SL: 'Sick Leave',
  PL: 'Paid Leave',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
};

const Leave = () => {
  const { getAllLeaves, updateLeaveStatus } = leaveService();
  const { canRead, canUpdate, canDelete } = usePermissions();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  console.log(canDelete);
  const fetchLeaves = async () => {
    setLoading(true);
    const res: any = await getAllLeaves();
    if (res?.success) setLeaves(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleViewLeave = (leave: any) => {
    setSelectedLeave(leave);
    setViewModalOpen(true);
  };

  const handleStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    const res: any = await updateLeaveStatus(id, status);
    if (res?.success) {
      message.success(`Leave ${status.toLowerCase()} successfully`);
      setLeaves((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status } : l))
      );
    } else {
      message.error(res?.message || 'Failed to update status');
    }
    setActionLoading(null);
  };

  const filtered = leaves.filter((l) => {
    const matchStatus = !statusFilter || l.status === statusFilter;
    const matchType = !typeFilter || l.type === typeFilter;
    return matchStatus && matchType;
  });

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === 'PENDING').length,
    approved: leaves.filter((l) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l) => l.status === 'REJECTED').length,
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, row: any) => (
        <Flex align="center" gap={8}>
          {row?.employeeId?.avatar ? (
            <img
              style={{ width: 30, height: 30, borderRadius: '50%' }}
              src={imageUrl(row?.employeeId?.avatar)}
            ></img>
          ) : (
            <UserAvatar fullName={row.employeeId?.name} />
          )}
          <Flex vertical gap={2}>
            <Text strong>{row.employeeId?.name || '-'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.employeeId?.email}
            </Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => (
        <Tag color="blue">{LEAVE_TYPE_LABELS[v] || v}</Tag>
      ),
    },
    {
      title: 'From',
      dataIndex: 'fromDate',
      key: 'fromDate',
      render: (v: string) => timeConverter(v),
    },
    {
      title: 'To',
      dataIndex: 'toDate',
      key: 'toDate',
      render: (v: string) => timeConverter(v),
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      render: (v: number) => (
        <Tag>
          {v} day{v > 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: 'Applied On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => timeConverter(v),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, row: any) => {
        const actions = [];

        // View button - always available if canRead
        if (canRead('leave')) {
          actions.push(
            <Button
              key="view"
              size="small"
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewLeave(row)}
            >
              View
            </Button>
          );
        }

        // Approve/Reject buttons - only for pending leaves if canUpdate
        if (row.status === 'PENDING' && canUpdate('leave')) {
          actions.push(
            <Popconfirm
              key="approve"
              title="Approve this leave?"
              onConfirm={() => handleStatus(row._id, 'APPROVED')}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                loading={actionLoading === row._id + 'APPROVED'}
              >
                Approve
              </Button>
            </Popconfirm>
          );

          actions.push(
            <Popconfirm
              key="reject"
              title="Reject this leave?"
              onConfirm={() => handleStatus(row._id, 'REJECTED')}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                loading={actionLoading === row._id + 'REJECTED'}
              >
                Reject
              </Button>
            </Popconfirm>
          );
        }

        // Delete button - if canDelete
        // if (canDelete('leave')) {
        //   actions.push(
        //     <Popconfirm
        //       key="delete"
        //       title="Delete this leave?"
        //       onConfirm={() => handleStatus(row._id, 'DELETED')}
        //       okText="Yes"
        //       cancelText="No"
        //     >
        //       <Button size="small" danger type="text">
        //         Delete
        //       </Button>
        //     </Popconfirm>
        //   );
        // }

        return actions.length > 0 ? (
          <Space size="small">{actions}</Space>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
  ];

  return (
    <Flex vertical gap={16} className="module-page">
      {/* Stats Row */}
      <Flex gap={12} wrap="wrap">
        {[
          { label: 'Total', value: stats.total, color: '#1677ff' },
          { label: 'Pending', value: stats.pending, color: '#fa8c16' },
          { label: 'Approved', value: stats.approved, color: '#52c41a' },
          { label: 'Rejected', value: stats.rejected, color: '#ff4d4f' },
        ].map((s) => (
          <Card
            key={s.label}
            size="small"
            style={{ minWidth: 120, borderTop: `3px solid ${s.color}` }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              {s.label}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
          </Card>
        ))}
      </Flex>

      <Card
        title="Leave Requests"
        extra={
          <Space>
            <Select
              placeholder="Filter by type"
              allowClear
              style={{ width: 150 }}
              value={typeFilter}
              onChange={setTypeFilter}
              options={Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={['PENDING', 'APPROVED', 'REJECTED'].map((s) => ({
                value: s,
                label: s,
              }))}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchLeaves}
              loading={loading}
            />
          </Space>
        }
      >
        <ListingTable trashConfig={{ canDelete: canDelete('leave'), modelType: 'leave', onComplete: fetchLeaves }} listingTitle="Leave Requests" fields={LISTING_FIELDS.leave} filterKeys={["status","type"]}
          rowKey="_id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          rowHoverable={false}
          rowClassName={(row) =>
            row.status === 'PENDING' ? 'pending-row' : ''
          }
        />
      </Card>

      {/* View Leave Modal */}
      <Modal
        title="Leave Details"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={700}
        bodyStyle={{ padding: '24px' }}
      >
        {selectedLeave && (
          <Flex vertical gap={24}>
            {/* Employee Info */}
            <Card size="small" style={{ background: '#fafafa' }}>
              <Flex align="center" gap={12}>
                {selectedLeave.employeeId?.avatar ? (
                  <img
                    style={{ width: 30, height: 30, borderRadius: '50%' }}
                    src={imageUrl(selectedLeave?.employeeId?.avatar)}
                  ></img>
                ) : (
                  <UserAvatar
                    fullName={selectedLeave.employeeId?.name}
                    size="large"
                  />
                )}

                <Flex vertical gap={4}>
                  <Text strong style={{ fontSize: 16 }}>
                    {selectedLeave.employeeId?.name || '-'}
                  </Text>
                  <Text type="secondary">
                    {selectedLeave.employeeId?.email}
                  </Text>
                </Flex>
              </Flex>
            </Card>

            {/* Leave Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              {/* Leave Type */}
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                >
                  LEAVE TYPE
                </Text>
                <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
                  {LEAVE_TYPE_LABELS[selectedLeave.type] || selectedLeave.type}
                </Tag>
              </div>

              {/* Status */}
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                >
                  STATUS
                </Text>
                <Tag
                  color={STATUS_COLOR[selectedLeave.status] || 'default'}
                  style={{ fontSize: 13, padding: '4px 12px' }}
                >
                  {selectedLeave.status}
                </Tag>
              </div>

              {/* From Date */}
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                >
                  FROM DATE
                </Text>
                <Text strong>{timeConverter(selectedLeave.fromDate)}</Text>
              </div>

              {/* To Date */}
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                >
                  TO DATE
                </Text>
                <Text strong>{timeConverter(selectedLeave.toDate)}</Text>
              </div>

              {/* Days */}
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                >
                  NUMBER OF DAYS
                </Text>
                <Tag style={{ fontSize: 13, padding: '4px 12px' }}>
                  {selectedLeave.days} day{selectedLeave.days > 1 ? 's' : ''}
                </Tag>
              </div>

              {/* Applied On */}
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                >
                  APPLIED ON
                </Text>
                <Text strong>{timeConverter(selectedLeave.createdAt)}</Text>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Text
                type="secondary"
                style={{ fontSize: 12, display: 'block', marginBottom: 8 }}
              >
                REASON
              </Text>
              <Card size="small" style={{ background: '#f5f5f5' }}>
                <Text>{selectedLeave.reason || 'No reason provided'}</Text>
              </Card>
            </div>

            {/* Action Buttons */}
            {selectedLeave.status === 'PENDING' && canUpdate('leave') && (
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Popconfirm
                  title="Reject this leave?"
                  onConfirm={() => {
                    handleStatus(selectedLeave._id, 'REJECTED');
                    setViewModalOpen(false);
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger size="large" style={{ minWidth: 120 }}>
                    Reject
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="Approve this leave?"
                  onConfirm={() => {
                    handleStatus(selectedLeave._id, 'APPROVED');
                    setViewModalOpen(false);
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="primary" size="large" style={{ minWidth: 120 }}>
                    Approve
                  </Button>
                </Popconfirm>
              </Space>
            )}
          </Flex>
        )}
      </Modal>
    </Flex>
  );
};

export default Leave;
