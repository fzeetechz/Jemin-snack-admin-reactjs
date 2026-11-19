import { Eye as EyeOutlined, RefreshCw as ReloadOutlined } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';
import { CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Drawer,
  Empty,
  Flex,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import apiClient from 'src/services/api/apiClient';
import { API_ENDPOINTS } from 'src/services/api/endpoints';

const { Title, Text } = Typography;

type PayslipEmployee = {
  _id: string;
  name: string;
  email: string;
  phone: string;
};

type PayslipSummary = {
  totalDaysInMonth: number;
  workingDaysPerMonth: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  paidDays: number;
  lateMinutes: number;
  overtimeHours: number;
  daysElapsed?: number;
  holidays?: number;
  weeklyOffs?: number;
  sandwichDays?: number;
};

type PayslipSalary = {
  grossSalary: number;
  perDaySalary: number;
  baseSalary: number;
  overtimePay: number;
  latePenalty: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
};

type DailyPayroll = {
  date: string;
  status: 'present' | 'halfDay' | 'absent' | 'paidLeave' | 'unpaidLeave' | 'holiday' | 'weeklyOff';
  checkIn: string | null;
  checkOut: string | null;
  workMinutes: number | null;
  checkoutEstimated: boolean;
  sandwich: 'eligible' | 'pending' | 'none';
};

type PayslipRecord = {
  _id?: string;
  id?: string;
  payslipId?: string;
  employee: PayslipEmployee;
  period: {
    month: number;
    year: number;
    through?: string;
  };
  dailyBreakdown?: DailyPayroll[];
  comparison?: {
    withoutSandwich: { summary: PayslipSummary; salary: PayslipSalary };
    withSandwich: { summary: PayslipSummary; salary: PayslipSalary };
  };
  summary: PayslipSummary;
  salary: PayslipSalary;
};

type BulkPayslipResponse = {
  period: {
    month: number;
    year: number;
  };
  totalEmployees: number;
  payslips: PayslipRecord[];
};

const currency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const decimal = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);

const dailyStatus: Record<DailyPayroll['status'], string> = {
  present: 'Present', halfDay: 'Half day', absent: 'Absent', paidLeave: 'Paid leave',
  unpaidLeave: 'Unpaid leave', holiday: 'Holiday', weeklyOff: 'Weekly off',
};
const displayTime = (value: string | null) => value
  ? new Date(value).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
  : '—';

const SalarySlip = () => {
  const { canDelete } = usePermissions();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [sandwich, setSandwich] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BulkPayslipResponse | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const displayedPayslips = useMemo(() => (data?.payslips ?? []).map((slip) => {
    const option = sandwich ? slip.comparison?.withSandwich : slip.comparison?.withoutSandwich;
    return option ? { ...slip, ...option } : slip;
  }), [data, sandwich]);
  const selectedPayslip = displayedPayslips.find((slip) => slip.employee._id === selectedEmployeeId) ?? null;

  const fetchPayslips = async (monthValue: Dayjs = selectedMonth) => {
    setLoading(true);
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.SALARY.GENERATE_ALL_PAYSLIPS,
        {
          month: monthValue.month() + 1,
          year: monthValue.year(),
          sandwich,
        }
      );

      const body = response.data;
      // apiClient returns axios response → body = { success, data: { period, totalEmployees, payslips } }
      setData(body?.data ?? body);
    } catch (error) {
      console.log(error);
      message.error('Unable to load salary slips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayslips(selectedMonth);
  }, []);

  const totals = useMemo(() => {
    const payslips = displayedPayslips;

    return payslips.reduce(
      (accumulator, payslip) => {
        accumulator.gross += payslip.salary.grossSalary || 0;
        accumulator.net += payslip.salary.netSalary || 0;
        accumulator.deductions += payslip.salary.totalDeductions || 0;
        accumulator.overtime += payslip.salary.overtimePay || 0;
        return accumulator;
      },
      { gross: 0, net: 0, deductions: 0, overtime: 0 }
    );
  }, [displayedPayslips]);

  const columns: ColumnsType<PayslipRecord> = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Flex vertical gap={2}>
          <Text strong>{record.employee.name || 'Unnamed Employee'}</Text>
          <Text type="secondary">{record.employee.email || 'No email'}</Text>
        </Flex>
      ),
    },
    {
      title: 'Contact',
      dataIndex: ['employee', 'phone'],
      key: 'phone',
      render: (value: string) => value || 'No phone',
    },
    {
      title: 'Attendance',
      key: 'attendance',
      render: (_, record) => (
        <Space size={[8, 8]} wrap>
          <Tag color="green">Present {record.summary.presentDays}</Tag>
          <Tag color="gold">Paid {decimal(record.summary.paidDays)}</Tag>
          <Tag color="red">Absent {record.summary.absentDays}</Tag>
        </Space>
      ),
    },
    {
      title: 'Gross',
      key: 'grossSalary',
      align: 'right',
      render: (_, record) => currency(record.salary.grossSalary),
    },
    {
      title: 'Deductions',
      key: 'deductions',
      align: 'right',
      render: (_, record) => currency(record.salary.totalDeductions),
    },
    {
      title: 'Without Sandwich',
      key: 'withoutSandwich',
      align: 'right',
      render: (_, record) => record.comparison ? currency(record.comparison.withoutSandwich.salary.netSalary) : '—',
    },
    {
      title: 'With Sandwich',
      key: 'withSandwich',
      align: 'right',
      render: (_, record) => record.comparison ? currency(record.comparison.withSandwich.salary.netSalary) : '—',
    },
    {
      title: 'Net Salary',
      key: 'netSalary',
      align: 'right',
      render: (_, record) => (
        <Text strong>{currency(record.salary.netSalary)}</Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setSelectedEmployeeId(record.employee._id)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Flex vertical gap={18} className="module-page salary-slip-page">
      <Card bordered={false} className="salary-slip-header-card">
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Salary Slip Register
            </Title>
            <Text type="secondary">
              Generate and review salary slips for all staff with active salary
              structures.
            </Text>
          </div>

          <Space wrap>
            <Space><Text>Sandwich rule</Text><Switch checked={sandwich} onChange={setSandwich} aria-label="Apply sandwich rule" disabled={Boolean(data && data.payslips.some((slip) => !slip.comparison))} /></Space>
            <DatePicker
              picker="month"
              allowClear={false}
              disabledDate={(date) => date.isAfter(dayjs(), 'month')}
              value={selectedMonth}
              onChange={(value) => {
                if (value) {
                  setSelectedMonth(value);
                }
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void fetchPayslips(selectedMonth)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={() => void fetchPayslips(selectedMonth)}
              loading={loading}
            >
              Generate
            </Button>
          </Space>
        </Flex>
      </Card>

      <Collapse
        items={[
          {
            key: 'payroll-rules',
            label: (
              <Flex vertical gap={2}>
                <Text strong>How salary is calculated</Text>
                <Text type="secondary">Period, attendance, leave and sandwich rules</Text>
              </Flex>
            ),
            children: (
              <Flex vertical gap={16}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="1. Calculation period" style={{ height: '100%' }}>
                      <Flex vertical gap={8}>
                        <Text>Current month: attendance, holidays and weekly offs count through today, in India time.</Text>
                        <Text type="secondary">Past months use the full month. Future months cannot be generated.</Text>
                      </Flex>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="2. Per-day salary" style={{ height: '100%' }}>
                      <Flex vertical gap={8}>
                        <Text>Monthly gross salary is divided by the full month’s days or working days, based on HR Settings.</Text>
                        <Text type="secondary">The monthly rate stays the same for a partial-month payslip.</Text>
                      </Flex>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="3. Attendance & leave" style={{ height: '100%' }}>
                      <Flex vertical gap={8}>
                        <Text>Approved CL, SL and PL use the annual leave allowance in date order. Leave beyond the allowance is unpaid.</Text>
                        <Text type="secondary">When checkout is missing, work hours use the recorded shift end. No checkout is added to attendance.</Text>
                      </Flex>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="4. Other adjustments" style={{ height: '100%' }}>
                      <Text>Late penalties, overtime and weekly offs follow HR settings and the employee’s assignment.</Text>
                    </Card>
                  </Col>
                </Row>

                <Card size="small" title="Sandwich rule" extra={<Tag color={sandwich ? 'blue' : 'default'}>{sandwich ? 'Selected: on' : 'Selected: off'}</Tag>}>
                  <Flex vertical gap={10}>
                    <Text>Weekly offs or holidays between two days of absence or unpaid leave become unpaid when the rule is on.</Text>
                    <Space size={[8, 8]} wrap>
                      <Tag color="red">Absent / unpaid leave</Tag>
                      <Text type="secondary">→</Text>
                      <Tag color="orange">Weekly off / holiday</Tag>
                      <Text type="secondary">→</Text>
                      <Tag color="red">Absent / unpaid leave</Tag>
                    </Space>
                    <Text type="secondary">Both surrounding days must be known by the payslip date and fall within the same calendar year. The table shows salaries with and without this rule.</Text>
                  </Flex>
                </Card>
              </Flex>
            ),
          },
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="salary-slip-stat-card">
            <Statistic
              title="Employees"
              value={data?.totalEmployees ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="salary-slip-stat-card">
            <Statistic
              title="Gross Payout"
              value={totals.gross}
              formatter={() => currency(totals.gross)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="salary-slip-stat-card">
            <Statistic
              title="Total Deductions"
              value={totals.deductions}
              formatter={() => currency(totals.deductions)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="salary-slip-stat-card">
            <Statistic
              title="Net Payout"
              value={totals.net}
              formatter={() => currency(totals.net)}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        className="salary-slip-table-card"
        title={
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Text strong style={{ fontSize: 16 }}>
              Generated Salary Slips
            </Text>
            <Tag color="blue" style={{ margin: 0 }}>
              {data ? dayjs().year(data.period.year).month(data.period.month - 1).format('MMMM YYYY') : selectedMonth.format('MMMM YYYY')}
            </Tag>
          </Flex>
        }
      >
        {data && data.payslips.length === 0 ? (
          <Empty description="No active salary records found for this month." />
        ) : (
          <ListingTable
            trashConfig={{
              canDelete: canDelete('payroll'),
              modelType: 'payslip',
              getId: (row) => row.payslipId ?? row._id ?? row.id,
              onComplete: () => fetchPayslips(selectedMonth),
            }}
            listingTitle="Payslips"
            fields={LISTING_FIELDS.payslips}
            filterKeys={['period.month', 'period.year']}
            showRecordId={false}
            rowKey={(record) => record.employee._id}
            columns={columns}
            dataSource={displayedPayslips}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            rowHoverable={false}
          />
        )}
      </Card>

      <Drawer
        title={selectedPayslip?.employee.name || 'Salary Slip'}
        placement="right"
        width="min(900px, 100vw)"
        className="salary-slip-drawer"
        onClose={() => setSelectedEmployeeId(null)}
        open={Boolean(selectedPayslip)}
      >
        {selectedPayslip ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Card bordered={false}>
              <Flex vertical gap={4}>
                <Text strong>{selectedPayslip.employee.name}</Text>
                <Text type="secondary">{selectedPayslip.employee.email}</Text>
                <Text type="secondary">{selectedPayslip.employee.phone}</Text>
                <Tag
                  color="purple"
                  style={{ width: 'fit-content', marginTop: 8 }}
                >
                  {dayjs()
                    .month(selectedPayslip.period.month - 1)
                    .year(selectedPayslip.period.year)
                    .format('MMMM YYYY')}
                </Tag>
              </Flex>
            </Card>

            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false}>
                  <Statistic
                    title="Paid Days"
                    value={selectedPayslip.summary.paidDays}
                    precision={1}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false}>
                  <Statistic
                    title="Absent Days"
                    value={selectedPayslip.summary.absentDays}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false}>
                  <Statistic
                    title="Late Minutes"
                    value={decimal(selectedPayslip.summary.lateMinutes)}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false}>
                  <Statistic
                    title="Overtime Hours"
                    value={decimal(selectedPayslip.summary.overtimeHours)}
                  />
                </Card>
              </Col>
            </Row>

            <Card bordered={false} title="Sandwich comparison">
              {selectedPayslip.comparison ? (
                <Space direction="vertical" style={{ display: 'flex' }}>
                  <Flex justify="space-between"><Text>Without sandwich</Text><Text>{currency(selectedPayslip.comparison.withoutSandwich.salary.netSalary)}</Text></Flex>
                  <Flex justify="space-between"><Text>With sandwich ({selectedPayslip.summary.sandwichDays ?? 0} days)</Text><Text>{currency(selectedPayslip.comparison.withSandwich.salary.netSalary)}</Text></Flex>
                  <Text type="secondary">Selected: {sandwich ? 'with sandwich' : 'without sandwich'}</Text>
                </Space>
              ) : <Text type="secondary">Comparison is unavailable from the server.</Text>}
            </Card>

            <Card bordered={false} title="Attendance Summary">
              <Space size={[8, 8]} wrap>
                {selectedPayslip.period.through && <Tag>Through {selectedPayslip.period.through}</Tag>}
                {selectedPayslip.summary.daysElapsed != null && <Tag>Days {selectedPayslip.summary.daysElapsed}</Tag>}
                {selectedPayslip.summary.weeklyOffs != null && <Tag>Weekly Offs {selectedPayslip.summary.weeklyOffs}</Tag>}
                {selectedPayslip.summary.holidays != null && <Tag>Holidays {selectedPayslip.summary.holidays}</Tag>}
                <Tag color="green">
                  Present {selectedPayslip.summary.presentDays}
                </Tag>
                <Tag color="gold">
                  Half Day {selectedPayslip.summary.halfDays}
                </Tag>
                <Tag color="blue">
                  Paid Leaves {selectedPayslip.summary.paidLeaves}
                </Tag>
                <Tag color="red">
                  Unpaid Leaves {selectedPayslip.summary.unpaidLeaves}
                </Tag>
              </Space>
            </Card>

            <Card bordered={false} title="Day-wise attendance">
              <Text type="secondary">Estimated hours use shift end when checkout is missing. Pending sandwich days need the next day’s status.</Text>
              <Table<DailyPayroll>
                rowKey="date"
                dataSource={selectedPayslip.dailyBreakdown ?? []}
                locale={{ emptyText: 'Day-wise details are unavailable. Refresh after updating the server.' }}
                pagination={false}
                scroll={{ x: 740 }}
                size="small"
                columns={[
                  { title: 'Date', dataIndex: 'date', render: (date: string) => dayjs(date).format('DD MMM, ddd') },
                  { title: 'Status', dataIndex: 'status', render: (status: DailyPayroll['status']) => dailyStatus[status] ?? status },
                  { title: 'Check in', dataIndex: 'checkIn', render: displayTime },
                  { title: 'Check out', dataIndex: 'checkOut', render: displayTime },
                  { title: 'Work', key: 'work', render: (_, row) => row.workMinutes == null ? '—' : <>{decimal(row.workMinutes / 60)} hrs {row.checkoutEstimated && <Tag>Estimated</Tag>}</> },
                  { title: 'Sandwich', key: 'sandwich', render: (_, row) => row.sandwich === 'eligible' ? <Tag color={sandwich ? 'red' : 'orange'}>{sandwich ? 'Applied' : 'Eligible'}</Tag> : row.sandwich === 'pending' ? <Tag>Pending</Tag> : '—' },
                ]}
              />
            </Card>

            <Card bordered={false} title="Salary Breakdown">
              <Space direction="vertical" size={12} style={{ display: 'flex' }}>
                <Flex justify="space-between">
                  <Text type="secondary">Gross Salary</Text>
                  <Text strong>
                    {currency(selectedPayslip.salary.grossSalary)}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">Per Day Salary</Text>
                  <Text strong>
                    {currency(selectedPayslip.salary.perDaySalary)}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">Base Salary</Text>
                  <Text strong>
                    {currency(selectedPayslip.salary.baseSalary)}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">Overtime Pay</Text>
                  <Text strong>
                    {currency(selectedPayslip.salary.overtimePay)}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">Late Penalty</Text>
                  <Text strong>
                    {currency(selectedPayslip.salary.latePenalty)}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">Other Deductions</Text>
                  <Text strong>
                    {currency(selectedPayslip.salary.otherDeductions)}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">Total Deductions</Text>
                  <Text strong>
                    {currency(selectedPayslip.salary.totalDeductions)}
                  </Text>
                </Flex>
                <Flex
                  justify="space-between"
                  style={{
                    paddingTop: 12,
                    borderTop: '1px solid #f0f0f0',
                  }}
                >
                  <Text strong>Net Salary</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {currency(selectedPayslip.salary.netSalary)}
                  </Title>
                </Flex>
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </Flex>
  );
};

export default SalarySlip;
