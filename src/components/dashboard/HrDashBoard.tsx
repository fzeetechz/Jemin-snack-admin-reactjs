import MoveToTrashButton from '../shared/trash/MoveToTrashButton';
import { usePermissions } from '../../hooks/usePermissions';
import { useEffect, useState } from 'react';
import { Col, Row, Tag, Typography, Spin, Table, Flex, Button } from 'antd';
import { Card } from 'src/components';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import CountUp from 'react-countup';
import dayjs from 'dayjs';
import attendanceService from 'src/services/attendanceService';
import leaveService from 'src/services/leaveService';
import candidateService from 'src/services/candidateService';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const HrDashBoard = () => {
  const { canDelete } = usePermissions();
  const navigate = useNavigate();
  const { getAttendanceList } = attendanceService();
  const { getAllLeaves } = leaveService();
  const { getCandidates } = candidateService();

  const [loading, setLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    total: 0,
  });
  const [leaveSummary, setLeaveSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [candidateSummary, setCandidateSummary] = useState({
    total: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
  });
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');

      const [attendanceRes, leavesRes, candidatesRes] =
        await Promise.allSettled([
          getAttendanceList({ startDate: today, endDate: today, limit: '200' }),
          getAllLeaves(),
          getCandidates({ limit: 100 }),
        ]);

      // Attendance
      if (attendanceRes.status === 'fulfilled') {
        const items: any[] = (attendanceRes.value as any)?.data?.items ?? [];
        setAttendanceSummary({
          total: items.length,
          present: items.filter((i) => i.status === 'present').length,
          late: items.filter((i) => i.status === 'late').length,
          absent: items.filter((i) => i.status === 'absent').length,
          onLeave: items.filter(
            (i) => i.status === 'leave' || i.status === 'half_day'
          ).length,
        });
      }

      // Leaves
      if (leavesRes.status === 'fulfilled') {
        const leaves: any[] = (leavesRes.value as any)?.data ?? [];
        setLeaveSummary({
          total: leaves.length,
          pending: leaves.filter((l) => l.status === 'PENDING').length,
          approved: leaves.filter((l) => l.status === 'APPROVED').length,
          rejected: leaves.filter((l) => l.status === 'REJECTED').length,
        });
        setPendingLeaves(
          leaves.filter((l) => l.status === 'PENDING').slice(0, 5)
        );
      }

      // Candidates
      if (candidatesRes.status === 'fulfilled') {
        const candidates: any[] = (candidatesRes.value as any)?.data ?? [];
        setCandidateSummary({
          total: candidates.length,
          shortlisted: candidates.filter((c) => c.status === 'shortlisted')
            .length,
          rejected: candidates.filter((c) => c.status === 'rejected').length,
          hired: candidates.filter((c) => c.status === 'hired').length,
        });
        setRecentCandidates(
          [...candidates]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const kpiCards = [
    {
      label: "Today's Attendance",
      value: attendanceSummary.present + attendanceSummary.late,
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 22 }} />,
      color: '#52c41a',
      path: '/hrms/employeee/attendance',
    },
    {
      label: 'Absent Today',
      value: attendanceSummary.absent,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 22 }} />,
      color: '#ff4d4f',
      path: '/hrms/employeee/attendance',
    },
    {
      label: 'On Leave Today',
      value: attendanceSummary.onLeave,
      icon: <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: 22 }} />,
      color: '#fa8c16',
      path: '/hrms/employeee/leave',
    },
    {
      label: 'Pending Leaves',
      value: leaveSummary.pending,
      icon: <ClockCircleOutlined style={{ color: '#1677ff', fontSize: 22 }} />,
      color: '#1677ff',
      path: '/hrms/employeee/leave',
    },
    {
      label: 'Total Candidates',
      value: candidateSummary.total,
      icon: <UserOutlined style={{ color: '#722ed1', fontSize: 22 }} />,
      color: '#722ed1',
      path: '/hrms/candidate',
    },
    {
      label: 'Hired',
      value: candidateSummary.hired,
      icon: <TeamOutlined style={{ color: '#13c2c2', fontSize: 22 }} />,
      color: '#13c2c2',
      path: '/hrms/candidate',
    },
  ];

  const leaveColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, row: any) => (
        <Text strong>{row.employeeId?.name || '-'}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'From',
      dataIndex: 'fromDate',
      key: 'fromDate',
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      render: (v: number) => <Tag>{v}d</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="orange">PENDING</Tag>,
    },
  ];

  const candidateColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text strong>{v || '-'}</Text>,
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (v: string) => <Text type="secondary">{v || '-'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const colorMap: Record<string, string> = {
          shortlisted: 'blue',
          hired: 'green',
          rejected: 'red',
          applied: 'default',
          interview: 'purple',
        };
        return <Tag color={colorMap[v] || 'default'}>{v || '-'}</Tag>;
      },
    },
    {
      title: 'Applied',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
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
                  {card.icon}
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Attendance Breakdown + Leave Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title="Today's Attendance Breakdown"
              extra={
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={fetchAll}
                />
              }
            >
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
                      minWidth: 100,
                      borderTop: `3px solid ${s.color}`,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {s.label}
                    </Text>
                    <div
                      style={{ fontSize: 22, fontWeight: 700, color: s.color }}
                    >
                      {s.value}
                    </div>
                  </Card>
                ))}
              </Flex>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="Leave Overview"
              extra={
                <Button
                  size="small"
                  type="link"
                  onClick={() => navigate('/hrms/employeee/leave')}
                >
                  View All
                </Button>
              }
            >
              <Flex gap={12} wrap="wrap">
                {[
                  {
                    label: 'Total',
                    value: leaveSummary.total,
                    color: '#1677ff',
                  },
                  {
                    label: 'Pending',
                    value: leaveSummary.pending,
                    color: '#fa8c16',
                  },
                  {
                    label: 'Approved',
                    value: leaveSummary.approved,
                    color: '#52c41a',
                  },
                  {
                    label: 'Rejected',
                    value: leaveSummary.rejected,
                    color: '#ff4d4f',
                  },
                ].map((s) => (
                  <Card
                    key={s.label}
                    size="small"
                    style={{
                      flex: 1,
                      minWidth: 100,
                      borderTop: `3px solid ${s.color}`,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {s.label}
                    </Text>
                    <div
                      style={{ fontSize: 22, fontWeight: 700, color: s.color }}
                    >
                      {s.value}
                    </div>
                  </Card>
                ))}
              </Flex>
            </Card>
          </Col>
        </Row>

        {/* Pending Leaves Table + Recent Candidates */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title="Pending Leave Requests"
              extra={
                <Button
                  size="small"
                  type="link"
                  onClick={() => navigate('/hrms/employeee/leave')}
                >
                  View All
                </Button>
              }
            >
              <Table
                rowKey="_id"
                columns={[
                  ...leaveColumns,
                  ...(canDelete('leave')
                    ? [
                        {
                          title: 'Trash',
                          key: '__trash',
                          render: (_: unknown, row: { _id?: string }) => (
                            <MoveToTrashButton
                              recordId={row._id}
                              modelType="leave"
                              onMoved={fetchAll}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
                dataSource={pendingLeaves}
                pagination={false}
                size="small"
                locale={{ emptyText: 'No pending leaves' }}
              />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="Recent Candidates"
              extra={
                <Button
                  size="small"
                  type="link"
                  onClick={() => navigate('/hrms/candidate')}
                >
                  View All
                </Button>
              }
            >
              <Table
                rowKey="_id"
                columns={[
                  ...candidateColumns,
                  ...(canDelete('candidates')
                    ? [
                        {
                          title: 'Trash',
                          key: '__trash',
                          render: (_: unknown, row: { _id?: string }) => (
                            <MoveToTrashButton
                              recordId={row._id}
                              modelType="candidate"
                              onMoved={fetchAll}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
                dataSource={recentCandidates}
                pagination={false}
                size="small"
                locale={{ emptyText: 'No candidates' }}
              />
            </Card>
          </Col>
        </Row>
      </Flex>
    </Spin>
  );
};

export default HrDashBoard;
