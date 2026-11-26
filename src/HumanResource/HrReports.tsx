import { Card, Tabs, Typography } from 'antd';
import { usePermissions } from 'src/hooks/usePermissions';
import Attendance from './Attendance';
import Leave from './Leave';
import SalarySlip from './SalarySlip';

export default function HrReports() {
  const { canRead } = usePermissions();
  const items = [
    canRead('attendance') && { key: 'attendance', label: 'Attendance', children: <Attendance /> },
    canRead('leave') && { key: 'leave', label: 'Leave', children: <Leave /> },
    canRead('payroll') && { key: 'payroll', label: 'Payroll', children: <SalarySlip /> },
  ].filter((item): item is { key: string; label: string; children: JSX.Element } => Boolean(item));

  return (
    <div className="module-page">
      <Typography.Title level={2}>HR reports</Typography.Title>
      <Typography.Paragraph type="secondary">Review attendance, leave and payroll records using the filters and download options in each report.</Typography.Paragraph>
      <Card><Tabs items={items} destroyOnHidden /></Card>
    </div>
  );
}
