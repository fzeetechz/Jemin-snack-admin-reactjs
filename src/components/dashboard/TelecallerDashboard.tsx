import MoveToTrashButton from '../shared/trash/MoveToTrashButton';
import { usePermissions } from '../../hooks/usePermissions';
import { useEffect, useState } from 'react';
import { Card } from 'src/components';
import { Col, Row, Typography, Spin, Table, Tag, Flex, Button } from 'antd';
import {
  PhoneOutlined,
  UserOutlined,
  CheckSquareOutlined,
  AudioOutlined,
} from '@ant-design/icons';
import CountUp from 'react-countup';
import { Column } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import dashboaradService from 'src/services/dashboaradService';
import taskService from 'src/services/taskService';
import { useAuth } from 'src/hooks';
import dayjs from 'dayjs';

const { Text } = Typography;

const fmtDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;

const TelecallerDashboard = () => {
  const { canDelete } = usePermissions();
  const navigate = useNavigate();
  const { getDashboardStats } = dashboaradService();
  const { getTasksList } = taskService();
  const { user } = useAuth() as any;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<any[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [statsRes, tasksRes] = await Promise.allSettled([
      getDashboardStats(),
      getTasksList({ assignee: user?._id, status: 'pending' }),
    ]);

    if (statsRes.status === 'fulfilled')
      setStats((statsRes.value as any)?.data);
    if (tasksRes.status === 'fulfilled') {
      const data = (tasksRes.value as any)?.data;
      setMyTasks(Array.isArray(data) ? data.slice(0, 5) : []);
    }

    setLoading(false);
  };
  useEffect(() => {
    void fetchAll();
  }, []);

  const kpiCards = [
    {
      label: 'Total Calls',
      value: stats?.totals?.totalCalls || 0,
      color: '#1677ff',
      icon: <PhoneOutlined />,
      path: '/crm/calls',
    },
    {
      label: 'Today Calls',
      value: stats?.calls?.todayCalls || 0,
      color: '#13c2c2',
      icon: <PhoneOutlined />,
      path: '/crm/calls?today=true',
    },
    {
      label: 'Completed',
      value: stats?.calls?.completed || 0,
      color: '#52c41a',
      icon: <CheckSquareOutlined />,
      path: '/crm/calls?status=completed',
    },
    {
      label: 'Recordings',
      value: stats?.calls?.recordingsAvailable || 0,
      color: '#722ed1',
      icon: <AudioOutlined />,
      path: '/crm/recordings',
    },
    {
      label: 'Total Leads',
      value: stats?.totals?.totalLeads || 0,
      color: '#fa8c16',
      icon: <UserOutlined />,
      path: '/crm/leads',
    },
  ];

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text strong>{v || '-'}</Text>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (v: string) => {
        const colorMap: Record<string, string> = {
          high: 'red',
          medium: 'orange',
          low: 'green',
        };
        return <Tag color={colorMap[v] || 'default'}>{v || '-'}</Tag>;
      },
    },
    {
      title: 'Due',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (v: string) => (v ? dayjs(v).format('DD MMM YYYY') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color="orange">{v || '-'}</Tag>,
    },
  ];

  const recentCallColumns = [
    {
      title: 'Lead',
      key: 'lead',
      render: (_: any, row: any) => (
        <Text strong>{row?.leadId?.name || 'Unknown'}</Text>
      ),
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      render: (v: string) => (
        <Tag color={v === 'outgoing' ? 'blue' : 'green'}>{v}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag
          color={
            v === 'completed' ? 'success' : v === 'failed' ? 'error' : 'default'
          }
        >
          {v}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (v: number) => fmtDuration(v || 0),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Flex vertical gap={16}>
        {/* KPI Cards */}
        <Row gutter={[16, 16]}>
          {kpiCards.map((card) => (
            <Col xs={24} sm={12} md={8} lg={4} key={card.label}>
              <Card
                className="dashboard-kpi-card"
                hoverable
                style={{
                  cursor: 'pointer',
                  borderTop: `3px solid ${card.color}`,
                }}
                onClick={() => navigate(card.path)}
              >
                <Flex justify="space-between" align="center">
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {card.label}
                    </Text>
                    <Typography.Title
                      level={3}
                      style={{ margin: 0, color: card.color }}
                    >
                      <CountUp end={card.value} />
                    </Typography.Title>
                  </div>
                  <span style={{ fontSize: 22, color: card.color }}>
                    {card.icon}
                  </span>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts + Call Summary */}
        <Row gutter={[16, 16]}>
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
                  color: '#ff4d4f',
                },
                {
                  label: 'No Answer',
                  value: stats?.calls?.noAnswer || 0,
                  color: '#8c8c8c',
                },
                {
                  label: 'Busy',
                  value: stats?.calls?.busy || 0,
                  color: '#fa8c16',
                },
                {
                  label: 'Total Duration',
                  value: fmtDuration(stats?.calls?.totalDuration || 0),
                  color: '#1677ff',
                },
                {
                  label: 'Avg Duration',
                  value: fmtDuration(stats?.calls?.avgDuration || 0),
                  color: '#52c41a',
                },
              ].map((row) => (
                <Flex
                  key={row.label}
                  justify="space-between"
                  style={{ marginBottom: 12 }}
                >
                  <Text style={{ color: row.color }}>{row.label}</Text>
                  <Text strong style={{ color: row.color }}>
                    {row.value}
                  </Text>
                </Flex>
              ))}
            </Card>
          </Col>
        </Row>

        {/* My Tasks + Recent Calls */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title="My Pending Tasks"
              extra={
                <Button
                  size="small"
                  type="link"
                  onClick={() => navigate('/crm/activities/tasks')}
                >
                  View All
                </Button>
              }
            >
              <Table
                rowKey="_id"
                columns={[
                  ...taskColumns,
                  ...(canDelete('tasks')
                    ? [
                        {
                          title: 'Trash',
                          key: '__trash',
                          render: (_: unknown, row: { _id?: string }) => (
                            <MoveToTrashButton
                              recordId={row._id}
                              modelType="task"
                              onMoved={fetchAll}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
                dataSource={myTasks}
                pagination={false}
                size="small"
                locale={{ emptyText: 'No pending tasks' }}
              />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="Recent Calls"
              extra={
                <Button
                  size="small"
                  type="link"
                  onClick={() => navigate('/crm/calls')}
                >
                  View All
                </Button>
              }
            >
              <Table
                rowKey="_id"
                columns={[
                  ...recentCallColumns,
                  ...(canDelete('calls')
                    ? [
                        {
                          title: 'Trash',
                          key: '__trash',
                          render: (_: unknown, row: { _id?: string }) => (
                            <MoveToTrashButton
                              recordId={row._id}
                              modelType="call"
                              onMoved={fetchAll}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
                dataSource={stats?.calls?.recentCalls?.slice(0, 5) || []}
                pagination={false}
                size="small"
                locale={{ emptyText: 'No recent calls' }}
              />
            </Card>
          </Col>
        </Row>
      </Flex>
    </Spin>
  );
};

export default TelecallerDashboard;
