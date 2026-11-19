import { useEffect, useState } from 'react';
import { Alert, Button, Card, DatePicker, Form, Input, Select, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import apiClient from 'src/services/api/apiClient';
import axios from 'axios';

const { Title, Text } = Typography;
const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
const time = (value?: string) => value ? new Date(value).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '—';

type Attendance = { _id: string; date: string; status: string; checkIn?: { time?: string }; checkOut?: { time?: string }; totalHours?: number };
type Leave = { _id: string; type: string; fromDate: string; toDate: string; status: string; reason: string };
type Salary = { grossSalary: number; netSalary: number; effectiveFrom: string };
type Slip = { period: { month: number; year: number; through: string }; summary: { presentDays: number; absentDays: number; paidDays: number }; salary: { netSalary: number }; comparison?: { withoutSandwich: { salary: { netSalary: number } }; withSandwich: { salary: { netSalary: number } } } };

export default function MyHR() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [salary, setSalary] = useState<Salary | null>(null);
  const [slip, setSlip] = useState<Slip | null>(null);
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [slipError, setSlipError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [form] = Form.useForm();

  const loadAttendance = async (nextPage: number) => {
    setAttendanceLoading(true);
    try {
      const res = await apiClient.get('/attendance/my/history', { params: { page: nextPage, limit: 20 } });
      setAttendance(res.data.data.items); setTotal(res.data.data.pagination.total); setPage(nextPage);
      setErrors(previous => previous.filter(error => error !== 'Attendance could not be loaded.'));
    } catch { setErrors(previous => [...new Set([...previous, 'Attendance could not be loaded.'])]); }
    finally { setAttendanceLoading(false); }
  };
  const loadLeaves = async () => {
    const res = await apiClient.get('/leave/my');
    setLeaves(res.data.data ?? []);
  };
  const loadSlip = async (selected: Dayjs) => {
    setLoading(true);
    setSlip(null);
    setSlipError('');
    try {
      const res = await apiClient.post('/staff/salary/my/payslip', { month: selected.month() + 1, year: selected.year() });
      setSlip(res.data);
    } catch (error) {
      setSlip(null);
      setSlipError(axios.isAxiosError(error) && error.response?.status === 404 ? 'No salary structure or payroll settings are available. Please contact your admin.' : 'Unable to load the payslip. Please try again.');
    }
    finally { setLoading(false); }
  };
  useEffect(() => {
    void loadAttendance(1);
    void loadLeaves().catch(() => setErrors(previous => [...previous, 'Leave requests could not be loaded.']));
    void apiClient.get('/staff/salary/my').then(res => setSalary(res.data.data?.activeSalary ?? null)).catch(() => setErrors(previous => [...previous, 'Salary could not be loaded.']));
    void loadSlip(dayjs());
  }, []);
  const applyLeave = async (values: { type: string; dates: [Dayjs, Dayjs]; reason: string }) => {
    setApplying(true);
    try {
      await apiClient.post('/leave/apply', { type: values.type, fromDate: values.dates[0].format('YYYY-MM-DD'), toDate: values.dates[1].format('YYYY-MM-DD'), reason: values.reason });
      form.resetFields(); message.success('Leave request submitted');
      try { await loadLeaves(); } catch { setErrors(previous => [...new Set([...previous, 'Leave was submitted, but the list could not be refreshed.'])]); }
    } catch { message.error('Unable to submit leave request'); }
    finally { setApplying(false); }
  };
  return <div className="module-page">
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <div><Title level={3}>My HR</Title><Text type="secondary">Your attendance, leave and salary details</Text></div>
      {errors.length > 0 && <Alert type="warning" showIcon message={errors.join(' ')} />}
      <Tabs items={[
        { key: 'attendance', label: 'My attendance', children: <Card><Table<Attendance> rowKey="_id" dataSource={attendance} loading={attendanceLoading} scroll={{ x: 600 }} pagination={{ current: page, total, pageSize: 20, onChange: next => void loadAttendance(next) }} columns={[
          { title: 'Date', dataIndex: 'date', render: date },
          { title: 'Status', dataIndex: 'status', render: (status: string) => <Tag>{status?.replace('_', ' ')}</Tag> },
          { title: 'Check in', render: (_, row) => time(row.checkIn?.time) },
          { title: 'Check out', render: (_, row) => time(row.checkOut?.time) },
          { title: 'Work hours', dataIndex: 'totalHours', render: (hours: number, row: Attendance) => row.checkOut?.time ? `${hours ?? 0} hrs` : '—' },
        ]} /></Card> },
        { key: 'leave', label: 'My leave', children: <Space direction="vertical" size={16} style={{ display: 'flex' }}><Card title="Apply for leave"><Form form={form} layout="vertical" onFinish={applyLeave}>
          <Form.Item name="type" label="Leave type" rules={[{ required: true }]}><Select options={['CL', 'SL', 'PL'].map(value => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="dates" label="Dates" rules={[{ required: true }]}><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={applying}>Apply</Button>
        </Form></Card><Card title="Leave requests"><Table<Leave> rowKey="_id" dataSource={leaves} scroll={{ x: 600 }} columns={[
          { title: 'Type', dataIndex: 'type' }, { title: 'From', dataIndex: 'fromDate', render: date }, { title: 'To', dataIndex: 'toDate', render: date }, { title: 'Status', dataIndex: 'status', render: (value: string) => <Tag>{value}</Tag> }, { title: 'Reason', dataIndex: 'reason' },
        ]} /></Card></Space> },
        { key: 'salary', label: 'My salary', children: <Space direction="vertical" size={16} style={{ display: 'flex' }}><Card title="Salary structure">{salary ? <Space direction="vertical"><Text>Monthly gross: <Text strong>{money(salary.grossSalary)}</Text></Text><Text>Monthly net: <Text strong>{money(salary.netSalary)}</Text></Text><Text type="secondary">Effective from {date(salary.effectiveFrom)}</Text></Space> : <Text type="secondary">No active salary structure found.</Text>}</Card>
          <Card title="Payslip estimate" extra={<Space><DatePicker picker="month" allowClear={false} value={month} disabledDate={value => value.isAfter(dayjs(), 'month')} onChange={value => { if (value) setMonth(value); }} /><Button loading={loading} onClick={() => void loadSlip(month)}>View</Button></Space>}>
            {slip ? <Space direction="vertical"><Text>{dayjs().year(slip.period.year).month(slip.period.month - 1).format('MMMM YYYY')} · Through {slip.period.through}</Text><Text>Present: {slip.summary.presentDays} · Absent: {slip.summary.absentDays} · Paid days: {slip.summary.paidDays}</Text><Text>Without sandwich: <Text strong>{money(slip.comparison?.withoutSandwich.salary.netSalary ?? slip.salary.netSalary)}</Text></Text>{slip.comparison && <Text>With sandwich: <Text strong>{money(slip.comparison.withSandwich.salary.netSalary)}</Text></Text>}<Text type="secondary">This is a calculation estimate, not a saved payslip.</Text></Space> : <Text type="secondary">{loading ? 'Loading payslip...' : slipError || 'Select a month and choose View.'}</Text>}
          </Card></Space> },
      ]} />
    </Space>
  </div>;
}
