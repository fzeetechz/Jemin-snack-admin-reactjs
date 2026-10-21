import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS, listingImport } from 'src/components/shared/listing/listing-presets';
import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Row,
  Segmented,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableProps } from 'antd';
import { EditOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useSalary } from './../zustand';
import { usePermissions } from 'src/hooks';

const { Title, Text } = Typography;

type StaffRole = {
  _id?: string;
  name?: string;
};

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

type DeductionSettings = {
  pfEnabled: boolean;
};

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
  deductionSettings: {
    pfEnabled: true,
  },
  salaryType: 'monthly',
  isActive: true,
});

const mapSalaryToDraft = (activeSalary?: any): SalaryDraft => {
  if (!activeSalary) {
    return createDefaultDraft();
  }

  console.log(activeSalary);
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

const SalarySetting = () => {
  const {
    getEmployeDetailsWithSalary,
    employeSalary,
    getSalaryWithStaffId,
    employe,
    createSalary,
    updateSalary,
  } = useSalary();

  const { canCreate, canUpdate, hasPermission } = usePermissions();
  const [allStaffs, setAllStaffs] = useState<Staff[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Staff | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SalaryDraft>>({});
  const [searchText, setSearchText] = useState('');
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

  const getRoleName = (staff: Staff) => {
    if (!staff.roleId) {
      return 'No role';
    }

    return typeof staff.roleId === 'string'
      ? staff.roleId
      : staff.roleId.name || 'No role';
  };

  const getStatusColor = (status?: string) =>
    status === 'active' ? 'green' : status === 'inactive' ? 'default' : 'gold';

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '-';
    }

    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('DD MMM YYYY, hh:mm A') : value;
  };

  const getInitials = (staff: Staff) => {
    const fullName = getEmployeeName(staff);
    if (!fullName) {
      return 'NA';
    }

    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
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
    if (!selectedEmployee) {
      return;
    }

    setSalaryDraft(mapSalaryToDraft(employe?.activeSalary));
  }, [employe, selectedEmployee]);

  useEffect(() => {
    console.log(hasPermission('salary', 'read'));
    if (hasPermission('salary', 'read')) {
      getEmployeDetailsWithSalary();
    }
  }, [hasPermission('salary', 'read')]);

  const filteredStaffs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) {
      return allStaffs;
    }

    return allStaffs.filter((staff) =>
      [
        getEmployeeName(staff),
        staff.email,
        staff.phone,
        getRoleName(staff),
        staff.department,
        staff.position,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [allStaffs, searchText]);

  const gross = Object.values(salaryDraft.earnings).reduce(
    (sum, amount) => sum + amount,
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

  const handleSelectEmployee = async (employee: Staff) => {
    setSelectedEmployee(employee);
    setIsDrawerOpen(true);
    setSalaryDraft(drafts[employee._id] ?? createDefaultDraft());
    await getSalaryWithStaffId(employee._id);
  };

  const updateEarning = (key: keyof Earnings, value: number | null) => {
    setSalaryDraft((prev) => ({
      ...prev,
      earnings: {
        ...prev.earnings,
        [key]: Number(value || 0),
      },
    }));
  };

  const updateDeduction = (key: keyof Deductions, value: number | null) => {
    setSalaryDraft((prev) => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        [key]: Number(value || 0),
      },
    }));
  };

  const togglePf = (checked: boolean) => {
    setSalaryDraft((prev) => ({
      ...prev,
      deductionSettings: {
        ...prev.deductionSettings,
        pfEnabled: checked,
      },
      deductions: {
        ...prev.deductions,
        pf: checked ? prev.deductions.pf || 12 : 0,
      },
    }));
  };

  const resetDraft = () => {
    setSalaryDraft(createDefaultDraft());
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

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
              pfEnabled: salaryDraft.deductionSettings.pfEnabled,
            }
          : { type: 'percentage', value: 0 },
        other: Number(salaryDraft.deductions.otherDeduction || 0),
      },
      advanceDeduction: Number(salaryDraft.deductions.advance || 0),
    };
    // console.log(payload)
    // return
    try {
      console.log(selectedEmployee);
      if (selectedEmployee.isSalaryAssigned) {
        const res = await updateSalary(selectedEmployee._id, payload);
        if (res.success) {
          closeDrawer();
        }
      } else {
        const res = await createSalary(payload);
        if (res.success) {
          closeDrawer();
        }
      }

      setDrafts((prev) => ({
        ...prev,
        [selectedEmployee._id]: salaryDraft,
      }));
      await getEmployeDetailsWithSalary();
      await getSalaryWithStaffId(selectedEmployee._id);
      message.success(`Salary saved for ${getEmployeeName(selectedEmployee)}`);
    } catch (error) {
      console.log(error);
      message.error('Unable to save salary');
    }
  };

  const columns: TableProps<Staff>['columns'] = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <Avatar size={40}>{getInitials(record)}</Avatar>
          <div>
            <Text strong>{getEmployeeName(record)}</Text>
            <br />
            <Text type="secondary">{record.email || '-'}</Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (value: string) => value || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (value: string) => value || '-',
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (value: string) => value || '-',
    },
    {
      title: 'Gross Salary',
      dataIndex: 'grossSalary',
      key: 'grossSalary',
      render: (value: string) => value || '-',
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => <Text>{record.role || getRoleName(record)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => (
        <Tag color={getStatusColor(value)}>{value || 'unknown'}</Tag>
      ),
    },

    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <>
          {(canUpdate('salary') || canCreate('salary')) && (
            <Button
              type={
                selectedEmployee?._id === record._id ? 'primary' : 'default'
              }
              icon={<EditOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                handleSelectEmployee(record);
              }}
            >
              Edit
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 10 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card
          title="Staff Listing"
          extra={
            <Space>
              <Input.Search
                allowClear
                placeholder="Search employee, role, email, phone"
                style={{ width: 280 }}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => getEmployeDetailsWithSalary()}
              >
                Refresh
              </Button>
            </Space>
          }
        >
          <ListingTable listingTitle="Salary Settings" fields={LISTING_FIELDS.salary} filterKeys={["status","roleId","isSalaryAssigned"]} importConfig={canCreate('salary') && listingImport('salary', getEmployeDetailsWithSalary, (row) => { const staff = allStaffs.find((item) => item._id === row.staffId); return !staff ? ['Staff ID does not exist'] : staff.isSalaryAssigned ? ['Salary already assigned; use Edit for this employee'] : []; })}
            rowKey="_id"
            columns={columns}
            dataSource={filteredStaffs}
            loading={staffLoading}
            rowHoverable={false}
            scroll={{ x: 920 }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} employees`,
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  page,
                  limit: pageSize,
                  pages: Math.max(1, Math.ceil(allStaffs.length / pageSize)),
                }));
              },
            }}
            onRow={(record) => ({
              style: {
                backgroundColor:
                  selectedEmployee?._id === record._id ? '#f0f7ff' : undefined,
              },
            })}
            locale={{
              emptyText: staffLoading ? 'Loading staff...' : 'No staff found',
            }}
          />
        </Card>

        <Drawer
          title={
            selectedEmployee
              ? `Edit Salary: ${getEmployeeName(selectedEmployee)}`
              : 'Edit Salary'
          }
          placement="right"
          width={560}
          open={isDrawerOpen}
          onClose={closeDrawer}
          destroyOnClose={false}
          extra={
            <Space>
              <Button onClick={resetDraft}>Reset</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                Update Salary
              </Button>
            </Space>
          }
        >
          {selectedEmployee ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card
                bordered={false}
                title="Employee Details"
                extra={
                  <Tag color={getStatusColor(selectedEmployee.status)}>
                    {selectedEmployee.status || 'unknown'}
                  </Tag>
                }
              >
                <Flex align="center" gap={16} style={{ marginBottom: 20 }}>
                  <Avatar size={56}>{getInitials(selectedEmployee)}</Avatar>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {getEmployeeName(selectedEmployee)}
                    </Title>
                    <Text type="secondary">
                      {getRoleName(selectedEmployee)}
                    </Text>
                  </div>
                </Flex>

                <Descriptions
                  column={1}
                  size="small"
                  items={[
                    {
                      key: 'email',
                      label: 'Email',
                      children: selectedEmployee.email || '-',
                    },
                    {
                      key: 'phone',
                      label: 'Phone',
                      children: selectedEmployee.phone || '-',
                    },

                    {
                      key: 'lastLogin',
                      label: 'Last Login',
                      children: formatDate(selectedEmployee.lastLoginAt),
                    },
                  ]}
                />
              </Card>

              <Card
                title="Salary Structure"
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
              >
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Card
                    size="small"
                    style={{ background: '#fafcff', borderColor: '#dbeafe' }}
                  >
                    <Row gutter={[12, 12]}>
                      <Col xs={24} sm={8}>
                        <Statistic
                          title="Gross Salary"
                          prefix="₹"
                          value={gross}
                        />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic
                          title="Total Deduction"
                          prefix="₹"
                          value={Number(totalDeduction).toFixed(2)}
                        />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic
                          title="Net Salary"
                          prefix="₹"
                          value={netSalary.toFixed(2)}
                        />
                      </Col>
                    </Row>
                  </Card>

                  <Card size="small" title="Earnings Breakdown">
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: '100%' }}
                    >
                      {earningFields.map((field) => (
                        <Flex
                          key={field.key}
                          justify="space-between"
                          align="center"
                          gap={16}
                          style={{
                            padding: '12px 14px',
                            border: '1px solid #f0f0f0',
                            borderRadius: 12,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong>{field.label}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {field.hint}
                            </Text>
                          </div>
                          <InputNumber
                            min={0}
                            prefix="₹"
                            style={{ width: 170, flexShrink: 0 }}
                            value={salaryDraft.earnings[field.key]}
                            onChange={(value) =>
                              updateEarning(field.key, value)
                            }
                          />
                        </Flex>
                      ))}
                    </Space>
                  </Card>

                  <Card size="small" title="Deductions Breakdown">
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: '100%' }}
                    >
                      {/* PF Row - separate */}
                      <Flex
                        justify="space-between"
                        align="center"
                        gap={16}
                        style={{
                          padding: '12px 14px',
                          border: '1px solid #f0f0f0',
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong>PF</Text>
                          <br />
                          <Space size={8} style={{ marginTop: 4 }}>
                            {/* {JSON.stringify(salaryDraft.deductionSettings.pfEnabled)} */}
                            <Checkbox
                              checked={salaryDraft.deductionSettings.pfEnabled}
                              onChange={(e) => togglePf(e.target.checked)}
                            >
                              Enable PF
                            </Checkbox>
                          </Space>
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
                            style={{ width: 120 }}
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
                          gap={16}
                          style={{
                            padding: '12px 14px',
                            border: '1px solid #f0f0f0',
                            borderRadius: 12,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Flex align="center" gap={8} wrap="wrap">
                              <Text strong>{field.label}</Text>
                              {field.key === 'advance' ? (
                                <Tag
                                  color="volcano"
                                  style={{ marginInlineEnd: 0 }}
                                >
                                  Important
                                </Tag>
                              ) : null}
                            </Flex>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {field.hint}
                            </Text>
                          </div>
                          <InputNumber
                            min={0}
                            prefix="₹"
                            style={{ width: 170, flexShrink: 0 }}
                            value={salaryDraft.deductions[field.key]}
                            onChange={(value) =>
                              updateDeduction(field.key, value)
                            }
                          />
                        </Flex>
                      ))}
                    </Space>
                  </Card>

                  {employe?.history?.length ? (
                    <Card size="small" title="Salary History">
                      <Space
                        direction="vertical"
                        size={10}
                        style={{ width: '100%' }}
                      >
                        {[...employe.history].reverse().map((salary: any) => (
                          <Flex
                            key={salary._id}
                            justify="space-between"
                            align="center"
                            style={{
                              padding: '10px 12px',
                              border: '1px solid #f0f0f0',
                              borderRadius: 10,
                            }}
                          >
                            <div>
                              <Text strong>
                                {salary.effectiveFrom
                                  ? dayjs(salary.effectiveFrom).format(
                                      'MMM YYYY'
                                    )
                                  : '-'}
                              </Text>
                              <br />
                              <Text type="secondary">
                                Gross ₹{salary.grossSalary || 0} • Net ₹
                                {salary.netSalary || 0}
                              </Text>
                            </div>
                            {salary.isActive ? (
                              <Tag color="green">Active</Tag>
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
