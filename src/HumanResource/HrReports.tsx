import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Col, DatePicker, Empty, Flex, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { CalendarDays, ClipboardList, RefreshCw, Users, Wallet } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import { usePermissions } from 'src/hooks/usePermissions';
import { apiRequest } from 'src/services/api/apiClient';
import { fetchAllListingPages } from 'src/services/listingService';
import './hr-reports.css';

type Employee = { _id?: string; Id?: string; name?: string; firstName?: string; lastName?: string; department?: string };
type AttendanceRow = { _id: string; employeeId?: Employee | string; status: string; isLate?: boolean; isDerived?: boolean; remarks?: string };
type LeaveRow = { _id: string; employeeId?: Employee | string; type: string; fromDate: string; toDate: string; days?: number; status: string };
const employeeName = (employee?: Employee | string) => typeof employee === 'object' && employee ? employee.name || [employee.firstName, employee.lastName].filter(Boolean).join(' ') || '—' : '—';
const employeeCode = (employee?: Employee | string) => typeof employee === 'object' && employee ? employee.Id || '—' : '—';
const displayDate = (date: string) => dayjs(date).isValid() ? dayjs(date).format('DD MMM YYYY') : '—';
const attendanceStatus = (row: AttendanceRow) => row.status === 'present' && row.isLate ? 'late' : row.status;
const statusColor: Record<string, string> = { present: 'green', late: 'orange', absent: 'red', leave: 'blue', half_day: 'purple', PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' };
const statusText: Record<string, string> = { present: 'Present', late: 'Late', absent: 'Absent', leave: 'On leave', half_day: 'Half day' };

export default function HrReports() {
  const { canRead } = usePermissions();
  const attendanceAccess = canRead('attendance');
  const leaveAccess = canRead('leave');
  const payrollAccess = canRead('payroll');
  const [date, setDate] = useState<Dayjs>(dayjs());
  const dateValue = date.format('YYYY-MM-DD');
  const [attendance, setAttendance] = useState<AttendanceRow[] | null>(null);
  const [leaves, setLeaves] = useState<LeaveRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const loadAttendance = useCallback(async () => {
    const params = { startDate: dateValue, endDate: dateValue };
    const [saved, missing, onLeave] = await Promise.all([
      fetchAllListingPages<AttendanceRow>('/attendance', 'items', params),
      apiRequest.get<{ success: boolean; data: AttendanceRow[] }>('/attendance/missing-absences', { params }),
      apiRequest.get<{ success: boolean; data: AttendanceRow[] }>('/attendance/leave-rows', { params }),
    ]);
    if (!missing.success || !onLeave.success || !Array.isArray(missing.data) || !Array.isArray(onLeave.data)) throw new Error('Attendance report unavailable');
    return [...saved, ...missing.data, ...onLeave.data];
  }, [dateValue]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrors([]);
    setAttendance(null);
    setLeaves(null);
    const attendanceRequest = attendanceAccess ? loadAttendance() : Promise.resolve(null);
    const leaveRequest = leaveAccess ? apiRequest.get<{ success: boolean; data: LeaveRow[] }>('/leave/all').then(response => {
      if (!response.success || !Array.isArray(response.data)) throw new Error('Leave report unavailable');
      return response.data;
    }) : Promise.resolve(null);
    Promise.allSettled([attendanceRequest, leaveRequest]).then(([attendanceResult, leaveResult]) => {
      if (!active) return;
      const failures: string[] = [];
      if (attendanceResult.status === 'fulfilled') setAttendance(attendanceResult.value);
      else failures.push('Attendance could not be loaded.');
      if (leaveResult.status === 'fulfilled') setLeaves(leaveResult.value);
      else failures.push('Leave requests could not be loaded.');
      setErrors(failures);
      setLoading(false);
    });
    return () => { active = false; };
  }, [attendanceAccess, leaveAccess, loadAttendance, refresh]);

  const count = (status: string) => attendance?.filter(row => attendanceStatus(row) === status).length ?? 0;
  const pending = leaves?.filter(row => row.status === 'PENDING') ?? [];
  const metrics = [
    attendanceAccess && { label: 'Present', value: count('present'), description: 'On time', color: '#16845b', ready: attendance !== null },
    attendanceAccess && { label: 'Late', value: count('late'), description: 'Checked in late', color: '#c57b10', ready: attendance !== null },
    attendanceAccess && { label: 'Absent', value: count('absent'), description: 'Marked or no check-in', color: '#c4423a', ready: attendance !== null },
    attendanceAccess && { label: 'On leave', value: count('leave'), description: 'Approved or marked leave', color: '#386ccc', ready: attendance !== null },
    attendanceAccess && { label: 'Half day', value: count('half_day'), description: 'Attendance records', color: '#7857c2', ready: attendance !== null },
    leaveAccess && { label: 'Pending requests', value: pending.length, description: 'All dates · awaiting decision', color: '#ac650e', ready: leaves !== null },
  ].filter((item): item is { label: string; value: number; description: string; color: string; ready: boolean } => Boolean(item));

  return (
    <div className="module-page hr-report">
      <div className="hr-report-header">
        <div><div className="hr-report-eyebrow">HUMAN RESOURCES / REPORTS</div><Typography.Title level={2}>HR reports</Typography.Title><Typography.Paragraph type="secondary">A clear view of attendance and leave, with detailed records below.</Typography.Paragraph></div>
        <Space wrap><DatePicker value={date} allowClear={false} disabledDate={value => value.isAfter(dayjs(), 'day')} onChange={value => value && setDate(value)} aria-label="Attendance report date" /><Button icon={<RefreshCw size={15} />} onClick={() => setRefresh(value => value + 1)}>Refresh</Button></Space>
      </div>
      {errors.length > 0 && <Alert type="error" showIcon message={errors.join(' ')} style={{ marginBottom: 16 }} />}
      {!metrics.length && !payrollAccess && <Alert type="info" showIcon message="No HR reports are available for your role." />}
      {metrics.length > 0 && <section className="hr-report-section"><div className="hr-report-section-heading"><div><h3>Summary</h3><p>Attendance for {date.format('DD MMM YYYY')} · leave requests across all dates</p></div><span className="hr-report-badge">REPORT OVERVIEW</span></div><Row gutter={[12, 12]}>{metrics.map(item => <Col xs={12} sm={8} xl={4} key={item.label}><Card className="hr-report-metric" loading={loading}><span className="hr-report-metric-label">{item.label}</span><Statistic value={item.ready ? item.value : '—'} valueStyle={{ color: item.color, fontSize: 27, fontWeight: 700 }} /><span className="hr-report-metric-note">{item.description}</span></Card></Col>)}</Row></section>}
      <Row gutter={[16, 16]} className="hr-report-details">
        {attendanceAccess && <Col xs={24} xl={15}><Card className="hr-report-card" title={<Space><CalendarDays size={18} /> Attendance detail</Space>} extra={<Link to={`/hrms/employeee/attendance?status=all&startDate=${dateValue}&endDate=${dateValue}`}>Open register →</Link>}><Typography.Paragraph type="secondary">Recorded and derived attendance for {date.format('DD MMM YYYY')}. Absences without a check-in are estimates.</Typography.Paragraph><Table<AttendanceRow> rowKey="_id" size="middle" loading={loading} dataSource={attendance ?? []} scroll={{ x: 520 }} pagination={{ pageSize: 8, showSizeChanger: false }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={attendance === null && !loading ? 'Attendance unavailable' : 'No attendance records for this date'} /> }} columns={[{ title: 'Staff ID', render: (_, row) => employeeCode(row.employeeId) }, { title: 'Employee', render: (_, row) => employeeName(row.employeeId) }, { title: 'Department', render: (_, row) => typeof row.employeeId === 'object' ? row.employeeId?.department || '—' : '—' }, { title: 'Status', render: (_, row) => { const status = attendanceStatus(row); return <Tag color={statusColor[status]}>{statusText[status] || status}</Tag>; } }, { title: 'Note', render: (_, row) => row.remarks || (row.isDerived ? 'Derived' : '—') }]} /></Card></Col>}
        {leaveAccess && <Col xs={24} xl={attendanceAccess ? 9 : 24}><Card className="hr-report-card" title={<Space><ClipboardList size={18} /> Pending leave requests</Space>} extra={<Link to="/hrms/employeee/leave">Open leave →</Link>}><Typography.Paragraph type="secondary">Requests awaiting a decision, regardless of leave date.</Typography.Paragraph><Table<LeaveRow> rowKey="_id" size="middle" loading={loading} dataSource={pending} scroll={{ x: 420 }} pagination={{ pageSize: 8, showSizeChanger: false }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={leaves === null && !loading ? 'Leave requests unavailable' : 'No pending leave requests'} /> }} columns={[{ title: 'Employee', render: (_, row) => employeeName(row.employeeId) }, { title: 'Type', dataIndex: 'type' }, { title: 'From', dataIndex: 'fromDate', render: displayDate }, { title: 'To', dataIndex: 'toDate', render: displayDate }]} /></Card></Col>}
        {leaveAccess && <Col span={24}><Card className="hr-report-card" title={<Space><Users size={18} /> Recent leave requests</Space>}><Typography.Paragraph type="secondary">Latest requests across all dates and statuses.</Typography.Paragraph><Table<LeaveRow> rowKey="_id" size="middle" loading={loading} dataSource={leaves ?? []} scroll={{ x: 650 }} pagination={{ pageSize: 8, showSizeChanger: false }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={leaves === null && !loading ? 'Leave requests unavailable' : 'No leave requests found'} /> }} columns={[{ title: 'Staff ID', render: (_, row) => employeeCode(row.employeeId) }, { title: 'Employee', render: (_, row) => employeeName(row.employeeId) }, { title: 'Type', dataIndex: 'type' }, { title: 'From', dataIndex: 'fromDate', render: displayDate }, { title: 'To', dataIndex: 'toDate', render: displayDate }, { title: 'Days', dataIndex: 'days', render: (days: number | undefined) => days ?? '—' }, { title: 'Status', dataIndex: 'status', render: (status: string) => <Tag color={statusColor[status]}>{status}</Tag> }]} /></Card></Col>}
        {payrollAccess && <Col span={24}><Card className="hr-report-card"><Flex align="center" justify="space-between" gap={16} wrap><Space size={14}><span className="hr-report-payroll-icon"><Wallet size={21} /></span><div><Typography.Text strong>Payroll report</Typography.Text><br /><Typography.Text type="secondary">Review monthly payslips and salary calculations.</Typography.Text></div></Space><Link to="/hrms/setting/payslip"><Button>Open payroll report →</Button></Link></Flex></Card></Col>}
      </Row>
    </div>
  );
}
