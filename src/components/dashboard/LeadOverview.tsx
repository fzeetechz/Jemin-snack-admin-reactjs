import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Flex, Row, Skeleton, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowUpRight, Flame, Target, UserPlus, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { apiRequest } from 'src/services/api/apiClient';
import { API_ENDPOINTS } from 'src/services/api/endpoints';

type Lead = { _id: string; Id?: string; name?: string; company?: string; phone?: string; status?: string; source?: string; priority?: string; createdAt?: string; assignedTo?: { firstName?: string; lastName?: string; name?: string } | null };
type LeadStats = { today: number; open: number; highPriority: number; recent: Lead[]; byStatus: { status: string; count: number }[] };
type Dashboard = { totals: { totalLeads: number }; leads: LeadStats };

export default function LeadOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError(false);
    apiRequest.get<any>(API_ENDPOINTS.DASHBOARD.GET_STATS).then(response => {
      if (!active) return;
      if (!response?.data?.leads || !Array.isArray(response.data.leads.recent)) { setError(true); return; }
      setData(response.data);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [(user as any)?._id, attempt]);
  const counts = data?.leads.byStatus ?? [];
  const won = counts.find(item => item.status === 'Won')?.count ?? 0;
  const lost = counts.find(item => item.status === 'Lost')?.count ?? 0;
  const cards = [
    { label: 'Total leads', value: data?.totals.totalLeads ?? 0, icon: <UsersRound size={18} /> },
    { label: 'Added today', value: data?.leads.today ?? 0, icon: <UserPlus size={18} /> },
    { label: 'Open leads', value: data?.leads.open ?? 0, icon: <Target size={18} /> },
    { label: 'High priority open', value: data?.leads.highPriority ?? 0, icon: <Flame size={18} /> },
  ];
  const columns: ColumnsType<Lead> = [
    { title: 'Lead', key: 'lead', render: (_, row) => <Button type="link" style={{ padding: 0, height: 'auto', textAlign: 'left' }} onClick={() => navigate(`/crm/leads?id=${encodeURIComponent(row._id)}`)}>{row.name || 'Unnamed lead'}</Button> },
    { title: 'Status', dataIndex: 'status', render: value => <Tag>{value || '—'}</Tag> },
    { title: 'Source', dataIndex: 'source', render: value => value || '—' },
    { title: 'Priority', dataIndex: 'priority', render: value => value || '—' },
    { title: 'Assigned to', render: (_, row) => row.assignedTo?.name || [row.assignedTo?.firstName, row.assignedTo?.lastName].filter(Boolean).join(' ') || '—' },
    { title: 'Added', dataIndex: 'createdAt', render: value => value ? new Date(value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
  ];
  return <Card style={{ marginBottom: 20 }} title={<Flex vertical gap={2}><Typography.Text strong>Leads overview</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>Based on your lead access · Today uses India time</Typography.Text></Flex>} extra={<Button type="link" icon={<ArrowUpRight size={16} />} onClick={() => navigate('/crm/leads')}>View leads</Button>}>
    {error ? <Alert type="error" showIcon message="Lead overview could not be loaded" action={<Button onClick={() => setAttempt(value => value + 1)}>Retry</Button>} /> : !data ? <Skeleton active paragraph={{ rows: 4 }} /> : <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Row gutter={[12, 12]}>{cards.map(item => <Col xs={12} lg={6} key={item.label}><Card size="small" style={{ height: '100%' }}><Statistic title={item.label} value={item.value} prefix={item.icon} /></Card></Col>)}</Row>
      <Flex wrap="wrap" align="center" gap={8}><Typography.Text strong>Pipeline</Typography.Text>{['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(status => <Tag key={status}>{status}: {counts.find(item => item.status === status)?.count ?? 0}</Tag>)}<Typography.Text type="secondary">Won / closed: {won + lost ? `${Math.round(won * 100 / (won + lost))}%` : '—'} ({won} won, {lost} lost)</Typography.Text></Flex>
      <div><Typography.Text strong>Recently added leads</Typography.Text><Table<Lead> style={{ marginTop: 8 }} rowKey="_id" size="small" columns={columns} dataSource={data.leads.recent} pagination={false} scroll={{ x: 650 }} locale={{ emptyText: 'No leads available' }} /></div>
    </Space>}
  </Card>;
}
