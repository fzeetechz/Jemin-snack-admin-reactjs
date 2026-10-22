import MoveToTrashButton from '../shared/trash/MoveToTrashButton';
import { usePermissions } from '../../hooks/usePermissions';
import { useEffect, useState } from 'react';
import { Card } from 'src/components';
import {
  Col,
  Row,
  Tag,
  Typography,
  Drawer,
  Flex,
  DatePicker,
  Slider,
  Button,
} from 'antd';
import CountUp from 'react-countup';
import dashboaradService from 'src/services/dashboaradService';
import { useAuth } from 'src/hooks';
import { Column, Pie } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';

const fmtDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;

const SalesDashBoard = () => {
  const { canDelete } = usePermissions();
  const { getDashboardStats } = dashboaradService();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then((res: any) => setStats(res.data));
  }, []);

  const goto = (link: string) => navigate(link);

  return (
    <>
      {/* KPI SECTION */}
      <Row gutter={[16, 16]}>
        {isAdmin && (
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Typography.Text type="secondary">Total Users</Typography.Text>
              <Typography.Title level={3}>
                <CountUp end={stats?.totals?.totalUsers || 0} />
              </Typography.Title>
            </Card>
          </Col>
        )}

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
            onClick={() => goto('/crm/leads')}
            hoverable
          >
            <Typography.Text type="secondary">Total Leads</Typography.Text>
            <Typography.Title level={3}>
              <CountUp end={stats?.totals?.totalLeads || 0} />
            </Typography.Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
            onClick={() => goto('/crm/calls')}
            hoverable
          >
            <Typography.Text type="secondary">Total Calls</Typography.Text>
            <Typography.Title level={3}>
              <CountUp end={stats?.totals?.totalCalls || 0} />
            </Typography.Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
            onClick={() => goto('/crm/calls?today=true')}
            hoverable
          >
            <Typography.Text type="secondary">Today Calls</Typography.Text>
            <Typography.Title level={3}>
              <CountUp end={stats?.calls?.todayCalls || 0} />
            </Typography.Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
            onClick={() => goto('/crm/recordings')}
            hoverable
          >
            <Typography.Text type="secondary">Recordings</Typography.Text>
            <Typography.Title level={3} style={{ color: '#ff4d4f' }}>
              <CountUp end={stats?.calls?.recordingsAvailable || 0} />
            </Typography.Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
            onClick={() => goto('/crm/calls?status=completed')}
            hoverable
          >
            <Typography.Text type="secondary">Completed Calls</Typography.Text>
            <Typography.Title level={3} style={{ color: '#52c41a' }}>
              <CountUp end={stats?.calls?.completed || 0} />
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      {/* MAIN GRID */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Leads by Status">
                <Column
                  data={stats?.leads?.byStatus || []}
                  xField="status"
                  yField="count"
                  height={200}
                  color={({ status }) => {
                    const colors: any = {
                      New: '#1890ff',
                      Contacted: '#52c41a',
                      Qualified: '#722ed1',
                      Lost: '#ff4d4f',
                      Converted: '#13c2c2',
                    };
                    return colors[status] || '#1890ff';
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Leads by Source">
                <Pie
                  data={stats?.leads?.bySource || []}
                  angleField="count"
                  colorField="source"
                  height={200}
                  radius={0.8}
                  label={{ type: 'outer', content: '{name} {percentage}' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Calls by Status">
                <Column
                  data={stats?.calls?.byStatus || []}
                  xField="status"
                  yField="count"
                  height={200}
                  color={({ status }) => {
                    const colors: any = {
                      completed: '#52c41a',
                      failed: '#ff4d4f',
                      busy: '#fa8c16',
                      'no-answer': '#8c8c8c',
                    };
                    return colors[status] || '#1890ff';
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Call Summary">
                {[
                  {
                    label: 'Failed',
                    value: stats?.calls?.failed || 0,
                    type: undefined,
                  },
                  {
                    label: 'No Answer',
                    value: stats?.calls?.noAnswer || 0,
                    type: 'warning' as const,
                  },
                  {
                    label: 'Busy',
                    value: stats?.calls?.busy || 0,
                    type: 'danger' as const,
                  },
                  {
                    label: 'Total Duration',
                    value: fmtDuration(stats?.calls?.totalDuration || 0),
                    type: undefined,
                  },
                  {
                    label: 'Avg Duration',
                    value: fmtDuration(stats?.calls?.avgDuration || 0),
                    type: 'success' as const,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      marginBottom: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography.Text type={row.type}>
                      {row.label}
                    </Typography.Text>
                    <Typography.Text strong type={row.type}>
                      {row.value}
                    </Typography.Text>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Recent Calls"
            style={{ height: '100%', maxHeight: '600px', overflow: 'hidden' }}
          >
            <div
              style={{
                height: '400px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {stats?.calls?.recentCalls?.map((call: any) => (
                <Card
                  key={call._id}
                  size="small"
                  style={{ marginBottom: '12px', cursor: 'pointer' }}
                  onClick={() => goto(`/crm/calls?callSid=${call?.callSid}`)}
                  hoverable
                >
                  <Flex justify="space-between" wrap gap={8}>
                    <Typography.Text strong>{call?.leadId?.name || 'Unknown Lead'}</Typography.Text>
                    {canDelete('calls') && <MoveToTrashButton recordId={call._id} modelType="call" onMoved={async () => {
                      const response = await getDashboardStats() as { data: unknown };
                      setStats(response.data);
                    }} />}
                  </Flex>
                  <br />
                  <Tag
                    color={call?.direction === 'outgoing' ? 'blue' : 'green'}
                    style={{ marginTop: 8 }}
                  >
                    {call?.direction}
                  </Tag>
                  <Tag
                    color={
                      call?.status === 'completed'
                        ? 'success'
                        : call?.status === 'failed'
                          ? 'error'
                          : 'default'
                    }
                  >
                    {call?.status}
                  </Tag>
                  <Tag color="purple">{call?.callType}</Tag>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Agent: {call?.userId?.firstName} {call?.userId?.lastName}
                  </Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {call?.from} to {call?.to}
                  </Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Duration: {fmtDuration(call?.duration || 0)} | Lead Status:{' '}
                    {call?.leadId?.status || 'N/A'}
                  </Typography.Text>
                </Card>
              )) || []}
            </div>
          </Card>
        </Col>
      </Row>

      {/* FILTER DRAWER */}
      <Drawer
        title="CRM Filters"
        placement="right"
        onClose={() => setFilterOpen(false)}
        open={filterOpen}
      >
        <Flex vertical gap="large">
          <DatePicker.RangePicker />
          <Slider range defaultValue={[0, 100000]} />
          <Button type="primary" block>
            Apply
          </Button>
        </Flex>
      </Drawer>
    </>
  );
};

export default SalesDashBoard;
