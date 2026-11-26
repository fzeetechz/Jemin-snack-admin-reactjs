import { Helmet } from 'react-helmet-async';
import { Alert, Button } from 'antd';
import { Link } from 'react-router-dom';
import SalesDashBoard from 'src/components/dashboard/SalesDashBoard';
import { usePermissions } from 'src/hooks/usePermissions';

export const DefaultDashboardPage = () => {
  const { canRead } = usePermissions();
  const hasCrmAccess = ['leads', 'tasks', 'calls'].some(canRead);
  const hasHrAccess = ['attendance', 'leave', 'payroll'].some(canRead);
  return <div className="dashboard-page jemini-crm-dashboard">
    <Helmet><title>CRM Dashboard | Jemini</title></Helmet>
    {hasCrmAccess ? <SalesDashBoard /> : <Alert showIcon type="info" message="CRM data is not available for your role" description={hasHrAccess ? <Button type="link"><Link to="/hrms/reports">Open HR reports</Link></Button> : 'Contact your administrator if you need CRM access.'} />}
  </div>;
};
