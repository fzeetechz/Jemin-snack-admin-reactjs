import { useAuth } from '../../hooks';
import { Helmet } from 'react-helmet-async';
import { Typography } from 'antd';
import { ChartNoAxesCombined } from 'lucide-react';
import HrDashBoard from 'src/components/dashboard/HrDashBoard';
import SalesDashBoard from 'src/components/dashboard/SalesDashBoard';
import Administration from 'src/components/dashboard/Administration';
import TelecallerDashboard from 'src/components/dashboard/TelecallerDashboard';

export const DefaultDashboardPage = () => {
  const { user } = useAuth();
  const roleType = (user as any)?.roleType;

  const renderDashboard = () => {
    switch (roleType) {
      case 'hr':
        return <HrDashBoard />;
      case 'admin':
        return <Administration />;
      case 'administration':
        return <Administration />;
      case 'telecaller':
        return <TelecallerDashboard />;
      default:
        return <SalesDashBoard />;
    }
  };

  return (
    <div>
      <Helmet>
        <title>CRM Dashboard | Jemini</title>
      </Helmet>

      <div className="dashboard-intro">
        <div>
          <span className="dashboard-eyebrow">YOUR BUSINESS AT A GLANCE</span>
          <Typography.Title level={2}>Business overview</Typography.Title>
          <p>
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Here is
            what?s happening across your workspace.
          </p>
        </div>
        <span className="dashboard-intro-icon">
          <ChartNoAxesCombined size={25} strokeWidth={1.6} />
        </span>
      </div>

      {renderDashboard()}
    </div>
  );
};
