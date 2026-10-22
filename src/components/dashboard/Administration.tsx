import MoveToTrashButton from '../shared/trash/MoveToTrashButton';
import { usePermissions } from '../../hooks/usePermissions';
import { useEffect, useState } from 'react';
import { Card } from 'src/components';
import {
  Col,
  Row,
  Typography,
  Spin,
  Table,
  Tag,
  Flex,
  Button,
  Avatar,
} from 'antd';
import {
  TeamOutlined,
  PhoneOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import CountUp from 'react-countup';
import { Column, Pie } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import dashboaradService from 'src/services/dashboaradService';
import staffService from 'src/services/staffService';
import attendanceService from 'src/services/attendanceService';
import dayjs from 'dayjs';

const { Text } = Typography;

const Administration = () => {
  const { canDelete } = usePermissions();
  const navigate = useNavigate();
  const { getDashboardStats } = dashboaradService();
  const { getStaff } = staffService();
  const { getAttendanceList } = attendanceService();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentStaff, setRecentStaff] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
  });

  const fetchAll = async () => {
    setLoading(true);
    const today = dayjs().format('YYYY-MM-DD');

    const [statsRes, staffRes, attendanceRes] = await Promise.allSettled([
      getDashboardStats(),
      getStaff({ limit: 5, sort: '-createdAt' }),
      getAttendanceList({ startDate: today, endDate: today, limit: '200' }),
    ]);

    if (statsRes.status === 'fulfilled')
      setStats((statsRes.value as any)?.data);

    if (staffRes.status === 'fulfilled') {
      const data = (staffRes.value as any)?.data;
      setRecentStaff(
        Array.isArray(data) ? data.slice(0, 5) : data?.items?.slice(0, 5) ?? []
      );
    }

    if (attendanceRes.status === 'fulfilled') {
      const items: any[] = (attendanceRes.value as any)?.data?.items ?? [];
      setAttendanceSummary({
        present: items.filter((i) => i.status === 'present').length,
        late: items.filter((i) => i.status === 'late').length,
        absent: items.filter((i) => i.status === 'absent').length,
        onLeave: items.filter(
          (i) => i.status === 'leave' || i.status === 'half_day'
        ).length,
      });
    }

    setLoading(false);
  };
  useEffect(() => {
    void fetchAll();
  }, []);

  const kpiCards = [
    {
      label: 'Total Users',
      value: stats?.totals?.totalUsers || 0,
      color: '#1677ff',
      icon: <TeamOutlined />,
      path: '/crm/settings/staff',
    },
    {
      label: 'Total Leads',
      value: stats?.totals?.totalLeads || 0,
      color: '#722ed1',
      icon: <UserOutlined />,
      path: '/crm/leads',
    },
    {
      label: 'Total Calls',
      value: stats?.totals?.totalCalls || 0,
      color: '#13c2c2',
      icon: <PhoneOutlined />,
      path: '/crm/calls',
    },
    {
      label: 'Today Calls',
      value: stats?.calls?.todayCalls || 0,
      color: '#fa8c16',
      icon: <PhoneOutlined />,
      path: '/crm/calls',
    },
    {
      label: 'Present Today',
      value: attendanceSummary.present + attendanceSummary.late,
      color: '#52c41a',
      icon: <CheckCircleOutlined />,
      path: '/hrms/employeee/attendance',
    },
    {
      label: 'Absent Today',
      value: attendanceSummary.absent,
      color: '#ff4d4f',
      icon: <CloseCircleOutlined />,
      path: '/hrms/employeee/attendance',
    },
  ];

  const staffColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (_: any, row: any) => (
        <Flex align="center" gap={8}>
          <Avatar size={32} style={{ backgroundColor: '#1677ff' }}>
            {(row.firstName?.[0] || row.name?.[0] || '?').toUpperCase()}
          </Avatar>
          <div>
            <Text strong>
              {row.firstName
                ? `${row.firstName} ${row.lastName || ''}`
                : row.name || '-'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.email}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_: any, row: any) => (
        <Tag color="blue">{row.roleId?.name || '-'}</Tag>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (v: string) => <Text type="secondary">{v || '-'}</Text>,
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

        {/* Charts Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="Today's Attendance">
              <Flex gap={12} wrap="wrap">
                {[
                  {
                    label: 'Present',
                    value: attendanceSummary.present,
                    color: '#52c41a',
                  },
                  {
                    label: 'Late',
                    value: attendanceSummary.late,
                    color: '#fa8c16',
                  },
                  {
                    label: 'Absent',
                    value: attendanceSummary.absent,
                    color: '#ff4d4f',
                  },
                  {
                    label: 'On Leave',
                    value: attendanceSummary.onLeave,
                    color: '#1677ff',
                  },
                ].map((s) => (
                  <Card
                    key={s.label}
                    size="small"
                    style={{
                      flex: 1,
                      minWidth: 90,
                      borderTop: `3px solid ${s.color}`,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {s.label}
                    </Text>
                    <div
                      style={{ fontSize: 20, fontWeight: 700, color: s.color }}
                    >
                      {s.value}
                    </div>
                  </Card>
                ))}
              </Flex>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Leads by Status">
              <Column
                data={stats?.leads?.byStatus || []}
                xField="status"
                yField="count"
                height={180}
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

          <Col xs={24} md={8}>
            <Card title="Calls by Status">
              <Pie
                data={stats?.calls?.byStatus || []}
                angleField="count"
                colorField="status"
                height={180}
                radius={0.8}
                label={{ type: 'outer', content: '{name} {percentage}' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Recent Staff */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title="Recent Staff"
              extra={
                <Button
                  size="small"
                  type="link"
                  onClick={() => navigate('/crm/settings/staff')}
                >
                  View All
                </Button>
              }
            >
              <Table
                rowKey="_id"
                columns={[
                  ...staffColumns,
                  ...(canDelete('users')
                    ? [
                        {
                          title: 'Trash',
                          key: '__trash',
                          render: (_: unknown, row: { _id?: string }) => (
                            <MoveToTrashButton
                              recordId={row._id}
                              modelType="staff"
                              onMoved={fetchAll}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
                dataSource={recentStaff}
                pagination={false}
                rowHoverable={false}
                size="small"
                locale={{ emptyText: 'No staff found' }}
              />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Call Summary">
              {[
                {
                  label: 'Completed',
                  value: stats?.calls?.completed || 0,
                  color: '#52c41a',
                },
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
                  label: 'Recordings',
                  value: stats?.calls?.recordingsAvailable || 0,
                  color: '#722ed1',
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
      </Flex>
    </Spin>
  );
};

export default Administration;
