import {
  PencilLine as EditOutlined,
  RefreshCw as ReloadOutlined,
  Save as SaveOutlined,
} from 'lucide-react';
import ListingTable from 'src/components/shared/listing/ListingTable';
import {
  LISTING_FIELDS,
  listingImport,
} from 'src/components/shared/listing/listing-presets';
import { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Drawer,
  Flex,
  InputNumber,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableProps } from 'antd';

import dayjs, { Dayjs } from 'dayjs';
import { useSalary } from './../zustand';
import { usePermissions } from 'src/hooks';

const { Title, Text } = Typography;

type StaffRole = { _id?: string; name?: string };

type Staff = {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleId?: StaffRole | string | null;
  status?: string;
  position?: string;
  department?: string;
  managerId?: string | null;
  avatar?: string;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  role?: string;
  netSalary?: number;
  grossSalary?: number;
  salaryId?: string;
  isSalaryAssigned?: boolean;
};

type Earnings = {
  basic: number;
  hra: number;
  allowance: number;
  bonus?: number;
};
type Deductions = {
  pf: number;
  pfType: 'percentage' | 'fixed';
  advance: number;
  otherDeduction: number;
};
type DeductionSettings = { pfEnabled: boolean };

type SalaryDraft = {
  salaryId?: string;
  effectiveMonth: Dayjs;
  earnings: Earnings;
  deductions: Deductions;
  deductionSettings: DeductionSettings;
  salaryType: 'monthly';
  isActive: boolean;
};

type StaffPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const earningFields: Array<{
  key: keyof Earnings;
  label: string;
  hint: string;
}> = [
  { key: 'basic', label: 'Basic', hint: 'Fixed monthly component' },
  { key: 'hra', label: 'HRA', hint: 'House rent allowance' },
  { key: 'allowance', label: 'Allowance', hint: 'Extra monthly allowance' },
];

const deductionFields: Array<{
  key: 'advance' | 'otherDeduction';
  label: string;
  hint: string;
}> = [
  { key: 'advance', label: 'Advance', hint: 'Important deduction head' },
  {
    key: 'otherDeduction',
    label: 'Other Deduction',
    hint: 'Manual adjustment if needed',
  },
];

const defaultEarnings = (): Earnings => ({
  basic: 0,
  hra: 0,
  allowance: 0,
  bonus: 0,
});
const defaultDeductions = (): Deductions => ({
  pf: 0,
  pfType: 'percentage',
  advance: 0,
  otherDeduction: 0,
});
const createDefaultDraft = (): SalaryDraft => ({
  effectiveMonth: dayjs(),
  earnings: defaultEarnings(),
  deductions: defaultDeductions(),
  deductionSettings: { pfEnabled: true },
  salaryType: 'monthly',
  isActive: true,
});

const mapSalaryToDraft = (activeSalary?: any): SalaryDraft => {
  if (!activeSalary) return createDefaultDraft();
  return {
    salaryId: activeSalary._id,
    effectiveMonth: activeSalary.effectiveFrom
      ? dayjs(activeSalary.effectiveFrom)
      : dayjs(),
    earnings: {
      basic: activeSalary.earnings?.basic ?? 0,
      hra: activeSalary.earnings?.hra ?? 0,
      allowance: activeSalary.earnings?.allowance ?? 0,
      bonus: activeSalary.earnings?.bonus ?? 0,
    },
    deductions: {
      pf:
        typeof activeSalary.deductions?.pf === 'number'
          ? activeSalary.deductions.pf
          : activeSalary.deductions?.pf?.value ?? 0,
      pfType:
        activeSalary.deductions?.pf?.type === 'fixed' ? 'fixed' : 'percentage',
      advance: activeSalary.advanceDeduction ?? 0,
      otherDeduction: activeSalary.deductions?.other ?? 0,
    },
    deductionSettings: {
      pfEnabled: Boolean(activeSalary.deductions?.pf?.pfEnabled),
    },
    salaryType: activeSalary.salaryType || 'monthly',
    isActive: activeSalary.isActive ?? true,
  };
};

const rowStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: '#fafafa',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 8,
};

const SalarySetting = () => {
  const {
    getEmployeDetailsWithSalary,
    employeSalary,
    getSalaryWithStaffId,
    employe,
    createSalary,
    updateSalary,
  } = useSalary();
  const { canCreate, canUpdate, canDelete, hasPermission } = usePermissions();
  const [allStaffs, setAllStaffs] = useState<Staff[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Staff | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SalaryDraft>>({});
  const [salaryDraft, setSalaryDraft] =
    useState<SalaryDraft>(createDefaultDraft);
  const staffLoading = false;
  const [pagination, setPagination] = useState<StaffPagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const getEmployeeName = (staff: Staff) =>
    staff.name || `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim();
  const getRoleName = (staff: Staff) =>
    !staff.roleId
      ? 'No role'
      : typeof staff.roleId === 'string'
        ? staff.roleId
        : staff.roleId.name || 'No role';
  const getStatusColor = (status?: string) =>
    status === 'active'
      ? 'success'
      : status === 'inactive'
        ? 'default'
        : 'warning';
  const getInitials = (staff: Staff) => {
    const n = getEmployeeName(staff);
    if (!n) return 'NA';
    return n
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  };

  useEffect(() => {
    setAllStaffs(employeSalary);
    setPagination((prev) => ({
      ...prev,
      total: employeSalary.length,
      pages: Math.max(1, Math.ceil(employeSalary.length / prev.limit)),
    }));
  }, [employeSalary]);

  useEffect(() => {
    if (!selectedEmployee) return;
    setSalaryDraft(mapSalaryToDraft(employe?.activeSalary));
  }, [employe, selectedEmployee]);

  useEffect(() => {
    if (hasPermission('salary', 'read')) getEmployeDetailsWithSalary();
  }, [hasPermission('salary', 'read')]);

  const gross = Object.values(salaryDraft.earnings).reduce(
    (sum, v) => sum + v,
    0
  );
  const pfAmount = salaryDraft.deductionSettings.pfEnabled
    ? salaryDraft.deductions.pfType === 'percentage'
      ? (gross * salaryDraft.deductions.pf) / 100
      : salaryDraft.deductions.pf
    : 0;
  const totalDeduction =
    pfAmount +
    salaryDraft.deductions.advance +
    salaryDraft.deductions.otherDeduction;
  const netSalary = gross - totalDeduction;
  const assignedSalaryCount = allStaffs.filter(
    (staff) => staff.isSalaryAssigned
  ).length;
  const pendingSalaryCount = allStaffs.length - assignedSalaryCount;

  const handleSelectEmployee = async (employee: Staff) => {
    setSelectedEmployee(employee);
    setIsDrawerOpen(true);
    setSalaryDraft(drafts[employee._id] ?? createDefaultDraft());
    await getSalaryWithStaffId(employee._id);
  };

  const updateEarning = (key: keyof Earnings, value: number | null) =>
    setSalaryDraft((prev) => ({
      ...prev,
      earnings: { ...prev.earnings, [key]: Number(value || 0) },
    }));

  const updateDeduction = (key: keyof Deductions, value: number | null) =>
    setSalaryDraft((prev) => ({
      ...prev,
      deductions: { ...prev.deductions, [key]: Number(value || 0) },
    }));

  const togglePf = (checked: boolean) =>
    setSalaryDraft((prev) => ({
      ...prev,
      deductionSettings: { ...prev.deductionSettings, pfEnabled: checked },
      deductions: {
        ...prev.deductions,
        pf: checked ? prev.deductions.pf || 12 : 0,
      },
    }));

  const resetDraft = () => setSalaryDraft(createDefaultDraft());
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleSave = async () => {
    if (!selectedEmployee) {
      message.warning('Please select an employee');
      return;
    }
    const payload = {
      staffId: selectedEmployee._id,
      effectiveFrom: salaryDraft.effectiveMonth
        .startOf('month')
        .format('YYYY-MM-DD'),
      salaryType: salaryDraft.salaryType,
      earnings: {
        basic: Number(salaryDraft.earnings.basic || 0),
        hra: Number(salaryDraft.earnings.hra || 0),
        allowance: Number(salaryDraft.earnings.allowance || 0),
        bonus: Number(salaryDraft.earnings.bonus || 0),
      },
      deductions: {
        pf: salaryDraft.deductionSettings.pfEnabled
          ? {
              type: salaryDraft.deductions.pfType,
              value: Number(salaryDraft.deductions.pf || 0),
              pfEnabled: true,
            }
          : { type: 'percentage', value: 0 },
        other: Number(salaryDraft.deductions.otherDeduction || 0),
      },
      advanceDeduction: Number(salaryDraft.deductions.advance || 0),
    };
    try {
      if (selectedEmployee.isSalaryAssigned) {
        const res = await updateSalary(selectedEmployee._id, payload);
        if (res.success) closeDrawer();
      } else {
        const res = await createSalary(payload);
        if (res.success) closeDrawer();
      }
      setDrafts((prev) => ({ ...prev, [selectedEmployee._id]: salaryDraft }));
      await getEmployeDetailsWithSalary();
      await getSalaryWithStaffId(selectedEmployee._id);
      message.success(`Salary saved for ${getEmployeeName(selectedEmployee)}`);
    } catch {
      message.error('Unable to save salary');
    }
  };

  const columns: TableProps<Staff>['columns'] = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Flex align="center" gap={10}>
          <Avatar
            size={36}
            style={{ background: '#B42014', fontWeight: 600, flexShrink: 0 }}
          >
            {getInitials(record)}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {getEmployeeName(record)}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email || '-'}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => v || '-',
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (v: number) => (v ? `₹${v}` : '-'),
    },
    {
      title: 'Gross Salary',
      dataIndex: 'grossSalary',
      key: 'grossSalary',
      render: (v: number) => (v ? `₹${v}` : '-'),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => (
        <Text style={{ fontSize: 13 }}>
          {record.role || getRoleName(record)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={getStatusColor(v)}>{v || 'unknown'}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) =>
        canUpdate('salary') || canCreate('salary') ? (
          <Button
            type={selectedEmployee?._id === record._id ? 'primary' : 'default'}
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectEmployee(record);
            }}
          >
            Edit
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="salary-settings-page">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Flex
          className="salary-settings-heading"
          justify="space-between"
          align="center"
          wrap
          gap={16}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Salary Settings
            </Title>
            <Text type="secondary">
              Review employee compensation and manage monthly salary structures.
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => getEmployeDetailsWithSalary()}
          >
            Refresh staff
          </Button>
        </Flex>
        <Row gutter={[12, 12]} className="salary-settings-stats">
          {[
            {
              label: 'Total employees',
              value: allStaffs.length,
              tone: 'neutral',
            },
            {
              label: 'Salary assigned',
              value: assignedSalaryCount,
              tone: 'success',
            },
            {
              label: 'Needs salary setup',
              value: pendingSalaryCount,
              tone: 'warning',
            },
          ].map((stat) => (
            <Col xs={24} sm={8} key={stat.label}>
              <Card
                className={`salary-stat-card salary-stat-${stat.tone}`}
                bordered={false}
              >
                <Text type="secondary">{stat.label}</Text>
                <Title level={3}>{stat.value.toLocaleString('en-IN')}</Title>
              </Card>
            </Col>
          ))}
        </Row>
        <Card
          className="salary-settings-card"
          title={
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Employee salary overview
            </span>
          }
        >
          <ListingTable
            trashConfig={{
              canDelete: canDelete('salary'),
              modelType: 'salary',
              getId: (row) => row.salaryId,
              onComplete: getEmployeDetailsWithSalary,
            }}
            listingTitle="Salary Settings"
            showRecordId={false}
            fields={LISTING_FIELDS.salary}
            filterKeys={['status', 'roleId', 'isSalaryAssigned']}
            importConfig={
              canCreate('salary') &&
              listingImport('salary', getEmployeDetailsWithSalary, (row) => {
                const staff = allStaffs.find(
                  (item) => item._id === row.staffId
                );
                return !staff
                  ? ['Staff ID does not exist']
                  : staff.isSalaryAssigned
                    ? ['Salary already assigned; use Edit for this employee']
                    : [];
              })
            }
            rowKey="_id"
            columns={columns}
            className="salary-settings-table"
            dataSource={allStaffs}
            loading={staffLoading}
            rowHoverable={false}
            scroll={{ x: 'max-content' }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: allStaffs.length,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} employees`,
              onChange: (page, pageSize) =>
                setPagination((prev) => ({
                  ...prev,
                  page,
                  limit: pageSize,
                  pages: Math.max(1, Math.ceil(allStaffs.length / pageSize)),
                })),
            }}
            onRow={(record) => ({
              style: {
                backgroundColor:
                  selectedEmployee?._id === record._id
                    ? 'rgba(180,32,20,0.05)'
                    : undefined,
                cursor: 'pointer',
              },
            })}
            locale={{
              emptyText: staffLoading ? 'Loading staff...' : 'No staff found',
            }}
          />
        </Card>

        <Drawer
          title={
            <Flex align="center" gap={10}>
              <Avatar
                size={30}
                style={{
                  background: '#B42014',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {selectedEmployee ? getInitials(selectedEmployee) : 'S'}
              </Avatar>
              <span style={{ fontWeight: 600, fontSize: 15 }}>
                {selectedEmployee
                  ? getEmployeeName(selectedEmployee)
                  : 'Edit Salary'}
              </span>
            </Flex>
          }
          placement="right"
          width="min(600px, 100vw)"
          className="salary-settings-drawer"
          open={isDrawerOpen}
          onClose={closeDrawer}
          destroyOnClose={false}
          styles={{ body: { padding: 20, background: '#f8f9fb' } }}
          extra={
            <Space>
              <Button onClick={resetDraft}>Reset</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                Save Salary
              </Button>
            </Space>
          }
        >
          {selectedEmployee ? (
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {/* Employee Banner */}
              <div
                style={{
                  background:
                    'linear-gradient(135deg, #B42014 0%, #8B1510 100%)',
                  borderRadius: 10,
                  padding: '16px 20px',
                }}
              >
                <Flex align="center" gap={14}>
                  <Avatar
                    size={50}
                    style={{
                      background: 'rgba(255,255,255,0.25)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(selectedEmployee)}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Title level={5} style={{ margin: 0, color: '#fff' }}>
                      {getEmployeeName(selectedEmployee)}
                    </Title>
                    <Text
                      style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}
                    >
                      {getRoleName(selectedEmployee)}
                    </Text>
                    <br />
                    <Text
                      style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                    >
                      {selectedEmployee.email || '-'} •{' '}
                      {selectedEmployee.phone || '-'}
                    </Text>
                  </div>
                  <Tag
                    color={
                      selectedEmployee.status === 'active'
                        ? 'success'
                        : 'default'
                    }
                    style={{ flexShrink: 0 }}
                  >
                    {selectedEmployee.status || 'unknown'}
                  </Tag>
                </Flex>
              </div>

              {/* Salary Structure */}
              <Card
                title={
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    Salary Structure
                  </span>
                }
                extra={
                  <DatePicker
                    picker="month"
                    value={salaryDraft.effectiveMonth}
                    onChange={(value) =>
                      setSalaryDraft((prev) => ({
                        ...prev,
                        effectiveMonth: value || dayjs(),
                      }))
                    }
                  />
                }
                styles={{ body: { padding: 14 } }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {/* Summary */}
                  <Row gutter={[10, 10]}>
                    {[
                      { label: 'Gross', value: gross, color: '#52c41a' },
                      {
                        label: 'Deductions',
                        value: Number(totalDeduction).toFixed(2),
                        color: '#ff4d4f',
                      },
                      {
                        label: 'Net Salary',
                        value: netSalary.toFixed(2),
                        color: '#B42014',
                      },
                    ].map((item) => (
                      <Col xs={24} sm={8} key={item.label}>
                        <div
                          style={{
                            background: '#fff',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            textAlign: 'center',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              color: 'rgba(0,0,0,0.45)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 4,
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              color: item.color,
                            }}
                          >
                            ₹{item.value}
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>

                  {/* Earnings */}
                  <Card
                    size="small"
                    title={
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#52c41a',
                        }}
                      >
                        ↑ Earnings
                      </span>
                    }
                    styles={{
                      body: { padding: '10px 12px' },
                      header: {
                        padding: '8px 12px',
                        minHeight: 'unset',
                        borderBottom: '1px solid rgba(82,196,26,0.2)',
                        background: 'rgba(82,196,26,0.04)',
                      },
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: '100%' }}
                    >
                      {earningFields.map((field) => (
                        <Flex
                          key={field.key}
                          justify="space-between"
                          align="center"
                          wrap
                          gap={12}
                          style={rowStyle}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong style={{ fontSize: 13 }}>
                              {field.label}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {field.hint}
                            </Text>
                          </div>
                          <InputNumber
                            min={0}
                            prefix="₹"
                            style={{ width: 150, flexShrink: 0 }}
                            value={salaryDraft.earnings[field.key]}
                            onChange={(value) =>
                              updateEarning(field.key, value)
                            }
                          />
                        </Flex>
                      ))}
                    </Space>
                  </Card>

                  {/* Deductions */}
                  <Card
                    size="small"
                    title={
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#ff4d4f',
                        }}
                      >
                        ↓ Deductions
                      </span>
                    }
                    styles={{
                      body: { padding: '10px 12px' },
                      header: {
                        padding: '8px 12px',
                        minHeight: 'unset',
                        borderBottom: '1px solid rgba(255,77,79,0.2)',
                        background: 'rgba(255,77,79,0.04)',
                      },
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: '100%' }}
                    >
                      {/* PF Row */}
                      <Flex
                        justify="space-between"
                        align="center"
                        wrap
                        gap={12}
                        style={rowStyle}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 13 }}>
                            PF
                          </Text>
                          <br />
                          <Checkbox
                            checked={salaryDraft.deductionSettings.pfEnabled}
                            onChange={(e) => togglePf(e.target.checked)}
                            style={{ marginTop: 4, fontSize: 12 }}
                          >
                            Enable PF
                          </Checkbox>
                        </div>
                        <Flex gap={6} align="center" style={{ flexShrink: 0 }}>
                          <Segmented
                            size="small"
                            value={salaryDraft.deductions.pfType}
                            options={[
                              { label: '%', value: 'percentage' },
                              { label: '₹', value: 'fixed' },
                            ]}
                            disabled={!salaryDraft.deductionSettings.pfEnabled}
                            onChange={(val) =>
                              setSalaryDraft((prev) => ({
                                ...prev,
                                deductions: {
                                  ...prev.deductions,
                                  pfType: val as 'percentage' | 'fixed',
                                  pf: 0,
                                },
                              }))
                            }
                          />
                          <InputNumber
                            min={0}
                            max={
                              salaryDraft.deductions.pfType === 'percentage'
                                ? 100
                                : undefined
                            }
                            prefix={
                              salaryDraft.deductions.pfType === 'percentage'
                                ? '%'
                                : '₹'
                            }
                            style={{ width: 110 }}
                            value={salaryDraft.deductions.pf}
                            disabled={!salaryDraft.deductionSettings.pfEnabled}
                            onChange={(value) => updateDeduction('pf', value)}
                          />
                          {salaryDraft.deductionSettings.pfEnabled && (
                            <Text
                              type="secondary"
                              style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                            >
                              ₹{Math.round(pfAmount)}
                            </Text>
                          )}
                        </Flex>
                      </Flex>

                      {deductionFields.map((field) => (
                        <Flex
                          key={field.key}
                          justify="space-between"
                          align="center"
                          wrap
                          gap={12}
                          style={rowStyle}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Flex align="center" gap={6}>
                              <Text strong style={{ fontSize: 13 }}>
                                {field.label}
                              </Text>
                              {field.key === 'advance' && (
                                <Tag
                                  color="volcano"
                                  style={{ marginInlineEnd: 0, fontSize: 11 }}
                                >
                                  Important
                                </Tag>
                              )}
                            </Flex>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {field.hint}
                            </Text>
                          </div>
                          <InputNumber
                            min={0}
                            prefix="₹"
                            style={{ width: 150, flexShrink: 0 }}
                            value={salaryDraft.deductions[field.key]}
                            onChange={(value) =>
                              updateDeduction(field.key, value)
                            }
                          />
                        </Flex>
                      ))}
                    </Space>
                  </Card>

                  {/* Salary History */}
                  {employe?.history?.length ? (
                    <Card
                      size="small"
                      title={
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          Salary History
                        </span>
                      }
                      styles={{
                        body: { padding: '10px 12px' },
                        header: { padding: '8px 12px', minHeight: 'unset' },
                      }}
                    >
                      <Space
                        direction="vertical"
                        size={6}
                        style={{ width: '100%' }}
                      >
                        {[...employe.history].reverse().map((salary: any) => (
                          <Flex
                            key={salary._id}
                            justify="space-between"
                            align="center"
                            style={rowStyle}
                          >
                            <div>
                              <Text strong style={{ fontSize: 13 }}>
                                {salary.effectiveFrom
                                  ? dayjs(salary.effectiveFrom).format(
                                      'MMM YYYY'
                                    )
                                  : '-'}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Gross ₹{salary.grossSalary || 0} • Net ₹
                                {salary.netSalary || 0}
                              </Text>
                            </div>
                            {salary.isActive ? (
                              <Tag color="success">Active</Tag>
                            ) : null}
                          </Flex>
                        ))}
                      </Space>
                    </Card>
                  ) : null}
                </Space>
              </Card>
            </Space>
          ) : null}
        </Drawer>
      </Space>
    </div>
  );
};

export default SalarySetting;
