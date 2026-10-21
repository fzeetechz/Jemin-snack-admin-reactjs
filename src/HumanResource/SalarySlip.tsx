import { Eye as EyeOutlined, RefreshCw as ReloadOutlined } from 'lucide-react';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';
import { CalendarOutlined, WalletOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Flex,
  Row,
  Space,
  Statistic,
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

type PayslipRecord = {
  employee: PayslipEmployee;
  period: {
    month: number;
    year: number;
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

const SalarySlip = () => {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BulkPayslipResponse | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(
    null
  );

  const fetchPayslips = async (monthValue: Dayjs = selectedMonth) => {
    setLoading(true);
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.SALARY.GENERATE_ALL_PAYSLIPS,
        {
          month: monthValue.month() + 1,
          year: monthValue.year(),
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
    const payslips = data?.payslips ?? [];

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
  }, [data]);

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
          onClick={() => setSelectedPayslip(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Flex vertical gap={24} className="module-page">
      <Card bordered={false} style={{ borderRadius: 24 }}>
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
            <DatePicker
              picker="month"
              allowClear={false}
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

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
            <Statistic
              title="Employees"
              value={data?.totalEmployees ?? 0}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
            <Statistic
              title="Gross Payout"
              value={totals.gross}
              formatter={() => currency(totals.gross)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
            <Statistic
              title="Total Deductions"
              value={totals.deductions}
              formatter={() => currency(totals.deductions)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
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
        style={{ borderRadius: 24 }}
        title={
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Text strong style={{ fontSize: 16 }}>
              Generated Salary Slips
            </Text>
            <Tag color="blue" style={{ margin: 0 }}>
              {selectedMonth.format('MMMM YYYY')}
            </Tag>
          </Flex>
        }
      >
        {data && data.payslips.length === 0 ? (
          <Empty description="No active salary records found for this month." />
        ) : (
          <ListingTable listingTitle="Payslips" fields={LISTING_FIELDS.payslips} filterKeys={["period.month","period.year"]}
            rowKey={(record) => record.employee._id}
            columns={columns}
            dataSource={data?.payslips ?? []}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1100 }}
            rowHoverable={false}
          />
        )}
      </Card>

      <Drawer
        title={selectedPayslip?.employee.name || 'Salary Slip'}
        placement="right"
        width={560}
        onClose={() => setSelectedPayslip(null)}
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

            <Card bordered={false} title="Attendance Summary">
              <Space size={[8, 8]} wrap>
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
