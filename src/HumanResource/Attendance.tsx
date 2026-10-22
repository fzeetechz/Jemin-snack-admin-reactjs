import {
  PencilLine as EditOutlined,
  Eye as EyeOutlined,
  RefreshCw as ReloadOutlined,
} from 'lucide-react';
import { fetchAllListingPages } from 'src/services/listingService';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';
import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  TimePicker,
  Typography,
  message,
} from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import attendanceService from '../services/attendanceService';
import { usePermissions } from 'src/hooks';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type ApiAttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'leave';

type ApiAttendanceRecord = {
  _id: string;
  employeeId:
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        email?: string;
        phone?: string;
        department?: string;
        position?: string;
        Id?: string;
      }
    | string;
  date: string;
  checkIn?: {
    time?: string;
  };
  checkOut?: {
    time?: string;
  };
  totalBreakMinutes?: number;
  grossMinutes?: number;
  netWorkingMinutes?: number;
  totalHours?: number;
  grossHours?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeMinutes?: number;
  status: ApiAttendanceStatus;
  isLate?: boolean;
  shift?: {
    start?: string;
    end?: string;
  };
  remarks?: string;
};

type AttendanceTableRecord = {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  shiftLabel: string;
  shiftStart: string;
  shiftEnd: string;
  status: ApiAttendanceStatus;
  checkIn: string;
  checkOut: string;
  workHours: string;
  grossHours: string;
  totalBreak: string;
  lateMinutes: string;
  earlyLeaveMinutes: string;
  overtime: string;
  date: string;
  notes: string;
  raw: ApiAttendanceRecord;
};

type AttendanceFormValues = {
  date: Dayjs;
  status: ApiAttendanceStatus;
  checkInTime?: Dayjs | null;
  checkOutTime?: Dayjs | null;
  shiftStart?: Dayjs | null;
  shiftEnd?: Dayjs | null;
  notes: string;
};

const statusConfig: Record<
  ApiAttendanceStatus,
  { label: string; color: string }
> = {
  present: { label: 'Present', color: 'green' },
  late: { label: 'Late', color: 'orange' },
  absent: { label: 'Absent', color: 'red' },
  half_day: { label: 'Half Day', color: 'gold' },
  leave: { label: 'On Leave', color: 'blue' },
};

const getEmployeeName = (employee: ApiAttendanceRecord['employeeId']) => {
  if (!employee || typeof employee === 'string') {
    return 'Unknown Employee';
  }

  if (employee.name?.trim()) {
    return employee.name.trim();
  }

  return (
    `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() ||
    'Unknown Employee'
  );
};

const getEmployeeCode = (employee: ApiAttendanceRecord['employeeId']) => {
  if (!employee || typeof employee === 'string') {
    return '-';
  }

  return employee.Id || employee._id?.slice(-6).toUpperCase() || '-';
};

const formatClockTime = (value?: string) => {
  if (!value) {
    return '-';
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return '-';
  }

  return parsed.format('hh:mm A');
};

const formatDurationFromMinutes = (value?: number) => {
  const totalMinutes = Math.max(Math.round(Number(value ?? 0)), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  if (!minutes) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

const formatHours = (value?: number) =>
  formatDurationFromMinutes(Number(value ?? 0) * 60);
const formatDateLabel = (value?: string) =>
  value && dayjs(value).isValid() ? dayjs(value).format('DD MMM YYYY') : '-';
const parseShiftTime = (value?: string) => {
  const [hours, minutes] = (value || '').split(':').map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
};

const Attendance = () => {
  const [form] = Form.useForm<AttendanceFormValues>();
  const { updateAttendance } = attendanceService();

  const { canUpdate, canDelete, canRead } = usePermissions();
  const [records, setRecords] = useState<AttendanceTableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [datePreset, setDatePreset] = useState<'today' | 'month' | 'custom'>(
    'today'
  );
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >([dayjs(), dayjs()]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<AttendanceTableRecord | null>(null);
  const [viewingRecord, setViewingRecord] =
    useState<AttendanceTableRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: '1',
        limit: '200',
      };

      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }

      if (dateRange?.[0]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
      }

      if (dateRange?.[1]) {
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const items = await fetchAllListingPages<ApiAttendanceRecord>(
        '/attendance',
        'items',
        params
      );
      const mappedRecords = items.map((item) => {
        const employee = item.employeeId;
        const shiftStart = item.shift?.start?.trim() || '-';
        const shiftEnd = item.shift?.end?.trim() || '-';

        return {
          id: item._id,
          employeeName: getEmployeeName(employee),
          employeeCode: getEmployeeCode(employee),
          department:
            typeof employee === 'string'
              ? '-'
              : employee?.department?.trim() || '-',
          designation:
            typeof employee === 'string'
              ? '-'
              : employee?.position?.trim() || '-',
          shiftLabel:
            shiftStart === '-' && shiftEnd === '-'
              ? '-'
              : `${shiftStart} - ${shiftEnd}`,
          shiftStart: item.shift?.start?.trim() || '',
          shiftEnd: item.shift?.end?.trim() || '',
          status: item.status,
          checkIn: formatClockTime(item.checkIn?.time),
          checkOut: formatClockTime(item.checkOut?.time),
          workHours: formatHours(item.totalHours),
          grossHours: formatHours(item.grossHours),
          totalBreak: formatDurationFromMinutes(item.totalBreakMinutes),
          lateMinutes: formatDurationFromMinutes(item.lateMinutes),
          earlyLeaveMinutes: formatDurationFromMinutes(item.earlyLeaveMinutes),
          overtime: formatDurationFromMinutes(item.overtimeMinutes),
          date: item.date,
          notes: item.remarks?.trim() || '-',
          raw: item,
        };
      });

      setRecords(mappedRecords);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      message.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [statusFilter, dateRange]);

  const departments = useMemo(
    () => [
      'All',
      ...new Set(records.map((record) => record.department).filter(Boolean)),
    ],
    [records]
  );

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const query = searchText.trim().toLowerCase();
      const matchesSearch =
        !query ||
        record.employeeName.toLowerCase().includes(query) ||
        record.employeeCode.toLowerCase().includes(query) ||
        record.designation.toLowerCase().includes(query);

      const matchesDepartment =
        departmentFilter === 'All' || record.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [records, searchText, departmentFilter]);

  const summary = useMemo(() => {
    const total = filteredRecords.length;
    const presentCount = filteredRecords.filter(
      (record) => record.status === 'present' || record.status === 'late'
    ).length;
    const absentCount = filteredRecords.filter(
      (record) => record.status === 'absent'
    ).length;
    const leaveCount = filteredRecords.filter(
      (record) => record.status === 'leave'
    ).length;
    const halfDayCount = filteredRecords.filter(
      (record) => record.status === 'half_day'
    ).length;

    return {
      total,
      presentCount,
      absentCount,
      leaveCount,
      halfDayCount,
      rate: total ? Math.round((presentCount / total) * 100) : 0,
    };
  }, [filteredRecords]);

  const openViewModal = (record: AttendanceTableRecord) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingRecord(null);
  };

  const openEditDrawer = (record: AttendanceTableRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      date: dayjs(record.raw.date),
      status: record.status,
      checkInTime: record.raw.checkIn?.time
        ? dayjs(record.raw.checkIn.time)
        : null,
      checkOutTime: record.raw.checkOut?.time
        ? dayjs(record.raw.checkOut.time)
        : null,
      shiftStart: parseShiftTime(record.shiftStart),
      shiftEnd: parseShiftTime(record.shiftEnd),
      notes: record.raw.remarks?.trim() || '',
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const applyTodayFilter = () => {
    const today = dayjs();
    setDatePreset('today');
    setDateRange([today, today]);
  };

  const applyMonthFilter = () => {
    const now = dayjs();
    setDatePreset('month');
    setDateRange([now.startOf('month'), now.endOf('month')]);
  };

  const handleSubmit = async () => {
    if (!editingRecord) {
      return;
    }

    try {
      const values = await form.validateFields();
      const response = (await updateAttendance(editingRecord.id, {
        date: values.date?.format('YYYY-MM-DD'),
        status: values.status,
        checkIn: values.checkInTime
          ? { time: values.checkInTime.toISOString() }
          : {},
        checkOut: values.checkOutTime
          ? { time: values.checkOutTime.toISOString() }
          : {},
        shift: {
          start: values.shiftStart?.format('HH:mm') || '',
          end: values.shiftEnd?.format('HH:mm') || '',
        },
        remarks: values.notes?.trim() || '',
      })) as { success?: boolean; message?: string };

      if (response?.success) {
        message.success(response.message || 'Attendance updated successfully');
        closeDrawer();
        await fetchAttendance();
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      message.error('Failed to update attendance');
    }
  };

  const handleExport = () => {
    if (!filteredRecords.length) {
      message.warning('No attendance records available for export');
      return;
    }

    const header = [
      'Employee Name',
      'Employee Code',
      'Date',
      'Status',
      'Department',
      'Designation',
      'Shift',
      'Check In',
      'Check Out',
      'Net Hours',
      'Gross Hours',
      'Break',
      'Late',
      'Early Leave',
      'Overtime',
      'Notes',
    ];

    const rows = filteredRecords.map((record) => [
      record.employeeName,
      record.employeeCode,
      dayjs(record.date).format('DD MMM YYYY'),
      statusConfig[record.status].label,
      record.department,
      record.designation,
      record.shiftLabel,
      record.checkIn,
      record.checkOut,
      record.workHours,
      record.grossHours,
      record.totalBreak,
      record.lateMinutes,
      record.earlyLeaveMinutes,
      record.overtime,
      record.notes,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${dayjs().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Attendance report exported');
  };

  const columns: ColumnsType<AttendanceTableRecord> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 240,
      render: (_, record) => (
        <Space size={10}>
          <Avatar
            size={38}
            style={{ backgroundColor: '#1677ff', fontWeight: 700 }}
          >
            {record.employeeName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </Avatar>
          <div>
            <Text strong>{record.employeeName}</Text>
            <br />
            <Text type="secondary">{record.employeeCode}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (value: string) => formatDateLabel(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ApiAttendanceStatus) => (
        <Tag color={statusConfig[status].color}>
          {statusConfig[status].label}
        </Tag>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 140,
    },
    {
      title: 'Shift',
      dataIndex: 'shiftLabel',
      key: 'shiftLabel',
      width: 135,
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 110,
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      width: 110,
    },
    {
      title: 'Net',
      dataIndex: 'workHours',
      key: 'workHours',
      width: 100,
    },
    {
      title: 'Gross',
      dataIndex: 'grossHours',
      key: 'grossHours',
      width: 100,
    },
    {
      title: 'Break',
      dataIndex: 'totalBreak',
      key: 'totalBreak',
      width: 90,
    },
    {
      title: 'Late',
      dataIndex: 'lateMinutes',
      key: 'lateMinutes',
      width: 100,
      render: (value: string, record) => (
        <Text type={record.raw.lateMinutes ? 'danger' : 'secondary'}>
          {value}
        </Text>
      ),
    },
    {
      title: 'Early',
      dataIndex: 'earlyLeaveMinutes',
      key: 'earlyLeaveMinutes',
      width: 100,
    },
    {
      title: 'OT',
      dataIndex: 'overtime',
      key: 'overtime',
      width: 100,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Action',
      key: 'action',
      //   fixed: 'right',
      width: 170,
      render: (_, record) => (
        <Space>
          {canRead('timesheet') && (
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record)}
            >
              View
            </Button>
          )}

          {canUpdate('timesheet') && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditDrawer(record)}
            >
              Edit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: 0,
        minHeight: '100%',
      }}
    >
      <Space
        direction="vertical"
        size={16}
        style={{ display: 'flex', width: '100%' }}
      >
        <Card bordered={false}>
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Attendance Register
                </Title>
                <Text type="secondary">
                  {filteredRecords.length} records visible
                </Text>
              </div>
              <Space wrap>
                <Button
                  type={datePreset === 'today' ? 'primary' : 'default'}
                  onClick={applyTodayFilter}
                >
                  Today
                </Button>
                <Button
                  type={datePreset === 'month' ? 'primary' : 'default'}
                  onClick={applyMonthFilter}
                >
                  This Month
                </Button>
                <Button icon={<CalendarOutlined />} onClick={handleExport}>
                  Export
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchAttendance}>
                  Refresh
                </Button>
              </Space>
            </Flex>

            <Row gutter={[12, 12]}>
              {/* <Col xs={24} sm={12} lg={6}>
                                <Card size="small" bordered={false} style={{ background: '#fafafa' }}>
                                    <Text type="secondary">Attendance Rate</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Text strong style={{ fontSize: 22 }}>
                                            {summary.rate}%
                                        </Text>
                                    </div>
                                    <Progress
                                        percent={summary.rate}
                                        showInfo={false}
                                        strokeColor="#52c41a"
                                        style={{ marginTop: 10, marginBottom: 0 }}
                                    />
                                </Card>
                            </Col> */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  size="small"
                  bordered={false}
                  style={{ background: '#fafafa' }}
                >
                  <Text type="secondary">Present / Late</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 22 }}>
                      {summary.presentCount}
                    </Text>
                  </div>
                </Card>
              </Col>
              {/* <Col xs={24} sm={12} lg={6}>
                                <Card size="small" bordered={false} style={{ background: '#fafafa' }}>
                                    <Text type="secondary">Absentees</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Text strong style={{ fontSize: 22 }}>
                                            {summary.absentCount}
                                        </Text>
                                    </div>
                                </Card>
                            </Col> */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  size="small"
                  bordered={false}
                  style={{ background: '#fafafa' }}
                >
                  <Text type="secondary">Leave / Half Day</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 22 }}>
                      {summary.leaveCount + summary.halfDayCount}
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Input.Search
                  allowClear
                  placeholder="Search by employee, code, or designation"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </Col>
              <Col xs={24} md={5}>
                <Select
                  style={{ width: '100%' }}
                  value={departmentFilter}
                  onChange={setDepartmentFilter}
                  options={departments.map((department) => ({
                    label: department,
                    value: department,
                  }))}
                />
              </Col>
              <Col xs={24} md={5}>
                <Select
                  style={{ width: '100%' }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Present', value: 'present' },
                    { label: 'Late', value: 'late' },
                    { label: 'Half Day', value: 'half_day' },
                    { label: 'Absent', value: 'absent' },
                    { label: 'On Leave', value: 'leave' },
                  ]}
                />
              </Col>
              <Col xs={24} md={6}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={(value) => {
                    setDatePreset('custom');
                    setDateRange(value);
                  }}
                />
              </Col>
            </Row>
          </Flex>
        </Card>

        <Card bordered={false}>
          <Spin spinning={loading}>
            <ListingTable
              trashConfig={{
                canDelete: canDelete('attendance'),
                modelType: 'attendance',
                onComplete: fetchAttendance,
                getId: (row) => row.id,
              }}
              listingTitle="Attendance"
              fields={LISTING_FIELDS.attendance}
              filterKeys={['status', 'department', 'designation']}
              rowKey="id"
              columns={columns}
              dataSource={filteredRecords}
              size="small"
              pagination={{ pageSize: 14 }}
              scroll={{ x: 1550 }}
              rowHoverable={false}
            />
          </Spin>
        </Card>
      </Space>

      <Modal
        title="Attendance Details"
        open={isViewModalOpen}
        onCancel={closeViewModal}
        footer={[
          <Button key="close" type="primary" onClick={closeViewModal}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {viewingRecord && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              size="small"
              bordered={false}
              style={{ background: '#fafafa' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Employee Name</Text>
                  <br />
                  <Text strong>{viewingRecord.employeeName}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Employee Code</Text>
                  <br />
                  <Text strong>{viewingRecord.employeeCode}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Department</Text>
                  <br />
                  <Text strong>{viewingRecord.department}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Designation</Text>
                  <br />
                  <Text strong>{viewingRecord.designation}</Text>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              bordered={false}
              style={{ background: '#fafafa' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Date</Text>
                  <br />
                  <Text strong>{formatDateLabel(viewingRecord.date)}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Status</Text>
                  <br />
                  <Tag color={statusConfig[viewingRecord.status].color}>
                    {statusConfig[viewingRecord.status].label}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Shift</Text>
                  <br />
                  <Text strong>{viewingRecord.shiftLabel}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Check In</Text>
                  <br />
                  <Text strong>{viewingRecord.checkIn}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Check Out</Text>
                  <br />
                  <Text strong>{viewingRecord.checkOut}</Text>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              bordered={false}
              style={{ background: '#fafafa' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Text type="secondary">Net Hours</Text>
                  <br />
                  <Text strong>{viewingRecord.workHours}</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Gross Hours</Text>
                  <br />
                  <Text strong>{viewingRecord.grossHours}</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Break</Text>
                  <br />
                  <Text strong>{viewingRecord.totalBreak}</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Late</Text>
                  <br />
                  <Text
                    strong
                    type={
                      viewingRecord.raw.lateMinutes ? 'danger' : 'secondary'
                    }
                  >
                    {viewingRecord.lateMinutes}
                  </Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Early Leave</Text>
                  <br />
                  <Text strong>{viewingRecord.earlyLeaveMinutes}</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Overtime</Text>
                  <br />
                  <Text strong>{viewingRecord.overtime}</Text>
                </Col>
              </Row>
            </Card>

            {viewingRecord.notes !== '-' && (
              <Card
                size="small"
                bordered={false}
                style={{ background: '#fafafa' }}
              >
                <Text type="secondary">Remarks / Notes</Text>
                <br />
                <Text>{viewingRecord.notes}</Text>
              </Card>
            )}
          </Space>
        )}
      </Modal>

      <Drawer
        title={editingRecord ? 'Edit Attendance Entry' : 'Edit Attendance'}
        width={560}
        open={isDrawerOpen}
        onClose={closeDrawer}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>
              Update
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Card
                size="small"
                bordered={false}
                style={{ background: '#fafafa' }}
              >
                <Text strong>{editingRecord?.employeeName}</Text>
                <br />
                <Text type="secondary">
                  {editingRecord?.employeeCode} • {editingRecord?.department}
                </Text>
              </Card>
            </Col>
            <Col span={24}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Status is required' }]}
              >
                <Select
                  options={[
                    { label: 'Present', value: 'present' },
                    { label: 'Late', value: 'late' },
                    { label: 'Half Day', value: 'half_day' },
                    { label: 'Absent', value: 'absent' },
                    { label: 'On Leave', value: 'leave' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="date"
                label="Attendance Date"
                rules={[
                  { required: true, message: 'Attendance date is required' },
                ]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="checkInTime" label="Check In">
                <DatePicker
                  allowClear
                  showTime={{ format: 'HH:mm' }}
                  format="DD MMM YYYY HH:mm"
                  style={{ width: '100%' }}
                  placeholder="Select check-in"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="checkOutTime" label="Check Out">
                <DatePicker
                  allowClear
                  showTime={{ format: 'HH:mm' }}
                  format="DD MMM YYYY HH:mm"
                  style={{ width: '100%' }}
                  placeholder="Select check-out"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shiftStart" label="Shift Start">
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  placeholder="10:00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shiftEnd" label="Shift End">
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  placeholder="19:00"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Card
                size="small"
                bordered={false}
                style={{ background: '#fafafa' }}
              >
                <Row gutter={[12, 8]}>
                  <Col span={8}>
                    <Text type="secondary">Late</Text>
                    <br />
                    <Text strong>{editingRecord?.lateMinutes || '0m'}</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">Early Leave</Text>
                    <br />
                    <Text strong>
                      {editingRecord?.earlyLeaveMinutes || '0m'}
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">Overtime</Text>
                    <br />
                    <Text strong>{editingRecord?.overtime || '0m'}</Text>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label="Remarks / Notes">
                <Input.TextArea
                  rows={4}
                  placeholder="Add manual correction reason or manager remark"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
};

export default Attendance;
