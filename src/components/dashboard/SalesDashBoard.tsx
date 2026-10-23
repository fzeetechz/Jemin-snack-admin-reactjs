import MoveToTrashButton from '../shared/trash/MoveToTrashButton';
import { usePermissions } from '../../hooks/usePermissions';
import { useEffect, useState } from 'react';
import { Card } from 'src/components';
import {
  Col, Row, Tag, Typography, Drawer, Flex,
  DatePicker, Slider, Button, Badge, Avatar, Timeline,
} from 'antd';
import CountUp from 'react-countup';
import dashboaradService from 'src/services/dashboaradService';
import { useAuth } from 'src/hooks';
import { Column, Pie, Area, Gauge } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Users, UserPlus, Phone, PhoneCall, Mic, CheckCircle,
  PhoneOff, PhoneMissed, Clock, Timer, TrendingUp, ArrowRight,
  Activity, BarChart3, AlertTriangle, Flame, Star, Zap,
  MessageSquare, CalendarCheck, FileText, Globe,
} from 'lucide-react';

const { Text } = Typography;

const fmtDuration = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

const fmtTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const KPI_CONFIG = [
  { key: 'totalUsers',     label: 'Total Users',   icon: Users,       color: '#6366f1', softColor: '#eef2ff', route: null,                         adminOnly: true  },
  { key: 'totalLeads',     label: 'Total Leads',   icon: UserPlus,    color: '#0ea5e9', softColor: '#e0f2fe', route: '/crm/leads',                  adminOnly: false },
  { key: 'totalCalls',     label: 'Total Calls',   icon: Phone,       color: '#8b5cf6', softColor: '#f5f3ff', route: '/crm/calls',                  adminOnly: false },
  { key: 'todayCalls',     label: "Today's Calls", icon: PhoneCall,   color: '#f59e0b', softColor: '#fffbeb', route: '/crm/calls?today=true',       adminOnly: false },
  { key: 'recordings',    label: 'Recordings',    icon: Mic,         color: '#ef4444', softColor: '#fef2f2', route: '/crm/recordings',             adminOnly: false },
  { key: 'completedCalls',label: 'Completed',     icon: CheckCircle, color: '#10b981', softColor: '#ecfdf5', route: '/crm/calls?status=completed', adminOnly: false },
];

const CALL_SUMMARY_ROWS = (stats: any) => [
  { label: 'Failed',         value: stats?.calls?.failed   || 0,                   icon: PhoneOff,   color: '#ef4444', bg: '#fef2f2' },
  { label: 'No Answer',      value: stats?.calls?.noAnswer || 0,                   icon: PhoneMissed,color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Busy',           value: stats?.calls?.busy     || 0,                   icon: Phone,      color: '#f97316', bg: '#fff7ed' },
  { label: 'Total Duration', value: fmtDuration(stats?.calls?.totalDuration || 0), icon: Clock,      color: '#6366f1', bg: '#eef2ff' },
  { label: 'Avg Duration',   value: fmtDuration(stats?.calls?.avgDuration   || 0), icon: Timer,      color: '#10b981', bg: '#ecfdf5' },
];

const MOCK_TREND = [
  { month: 'Jan', leads: 12, calls: 30 },
  { month: 'Feb', leads: 19, calls: 42 },
  { month: 'Mar', leads: 15, calls: 38 },
  { month: 'Apr', leads: 27, calls: 55 },
  { month: 'May', leads: 22, calls: 48 },
  { month: 'Jun', leads: 34, calls: 70 },
];

const LEAD_STATUS_COLORS: Record<string, string> = {
  New: '#0ea5e9', Contacted: '#10b981', Qualified: '#8b5cf6', Lost: '#ef4444', Converted: '#06b6d4',
};
const CALL_STATUS_COLORS: Record<string, string> = {
  completed: '#10b981', failed: '#ef4444', busy: '#f59e0b', 'no-answer': '#94a3b8',
};
const FUNNEL_COLORS: Record<string, string> = {
  New: '#0ea5e9', Contacted: '#8b5cf6', Qualified: '#f59e0b', Converted: '#10b981', Lost: '#ef4444',
};
const PRIORITY_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  high:   { color: '#ef4444', bg: '#fef2f2', icon: Flame },
  medium: { color: '#f59e0b', bg: '#fffbeb', icon: AlertTriangle },
  low:    { color: '#10b981', bg: '#ecfdf5', icon: Star },
};
const ACTIVITY_ICON: Record<string, { icon: any; color: string }> = {
  call:     { icon: Phone,          color: '#8b5cf6' },
  note:     { icon: FileText,       color: '#0ea5e9' },
  email:    { icon: MessageSquare,  color: '#10b981' },
  meeting:  { icon: CalendarCheck,  color: '#f59e0b' },
  whatsapp: { icon: MessageSquare,  color: '#25d366' },
  visit:    { icon: Globe,          color: '#ef4444' },
  task:     { icon: Zap,            color: '#6366f1' },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};
const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

const SalesDashBoard = () => {
  const { canDelete }         = usePermissions();
  const { getDashboardStats } = dashboaradService();
  const { isAdmin }           = useAuth();
  const navigate              = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [stats, setStats]     = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then((res: any) => setStats(res.data));
  }, []);

  const goto = (link: string) => navigate(link);

  const kpiValues: Record<string, number> = {
    totalUsers:     stats?.totals?.totalUsers         || 0,
    totalLeads:     stats?.totals?.totalLeads         || 0,
    totalCalls:     stats?.totals?.totalCalls         || 0,
    todayCalls:     stats?.calls?.todayCalls          || 0,
    recordings:     stats?.calls?.recordingsAvailable || 0,
    completedCalls: stats?.calls?.completed           || 0,
  };

  const visibleKpis = KPI_CONFIG.filter((k) => !k.adminOnly || isAdmin);

  const trendRaw: any[] = stats?.trend || MOCK_TREND;
  const trendData = trendRaw.flatMap((d: any) => [
    { month: d.month, value: d.leads, type: 'Leads' },
    { month: d.month, value: d.calls, type: 'Calls' },
  ]);

  const funnelOrder = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
  const byStatus: any[] = stats?.leads?.byStatus || [];
  const funnelData = funnelOrder
    .map((s) => ({ status: s, count: byStatus.find((x: any) => x.status === s)?.count || 0 }))
    .filter((d) => d.count > 0);
  const funnelMax = Math.max(...funnelData.map((d) => d.count), 1);

  const totalCalls  = stats?.totals?.totalCalls || 1;
  const completed   = stats?.calls?.completed   || 0;
  const successRate = Math.min(completed / totalCalls, 1);

  const priorityLeads: any[] = stats?.leads?.priorityLeads || stats?.priorityLeads || [];
  const recentActivities: any[] = stats?.recentActivities || [];
  const bySource: any[] = stats?.leads?.bySource || [];

  return (
    <div className="sales-dashboard">

      {/* ── KPI CARDS ── */}
      <motion.div variants={stagger} initial="hidden" animate="show">
        <Row gutter={[16, 16]}>
          {visibleKpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Col key={kpi.key} xs={12} sm={8} md={8} lg={4}>
                <motion.div variants={fadeUp}>
                  <div
                    className="kpi-card"
                    style={{ '--kpi-color': kpi.color, '--kpi-soft': kpi.softColor, cursor: kpi.route ? 'pointer' : 'default' } as React.CSSProperties}
                    onClick={() => kpi.route && goto(kpi.route)}
                    role={kpi.route ? 'button' : undefined}
                    tabIndex={kpi.route ? 0 : undefined}
                  >
                    <div className="kpi-card-icon"><Icon size={20} strokeWidth={1.8} /></div>
                    <div className="kpi-card-body">
                      <span className="kpi-label">{kpi.label}</span>
                      <span className="kpi-value"><CountUp end={kpiValues[kpi.key]} duration={1.4} /></span>
                    </div>
                    {kpi.route && <ArrowRight size={14} className="kpi-arrow" strokeWidth={2} />}
                  </div>
                </motion.div>
              </Col>
            );
          })}
        </Row>
      </motion.div>

      {/* ── ROW 2: Trend + Gauge ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
            <Card
              className="dashboard-chart-card"
              title={
                <Flex align="center" gap={8}>
                  <span className="chart-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                    <Activity size={15} strokeWidth={2} />
                  </span>
                  Lead &amp; Call Trend
                  <Tag color="blue" style={{ marginLeft: 'auto', fontSize: 10 }}>Last 6 months</Tag>
                </Flex>
              }
            >
              <Area
                data={trendData}
                xField="month" yField="value" seriesField="type"
                height={220} smooth
                areaStyle={{ fillOpacity: 0.18 }}
                color={['#0ea5e9', '#8b5cf6']}
                legend={{ position: 'top-right' }}
              />
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} lg={8}>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.22 }}>
            <Card
              className="dashboard-chart-card gauge-card"
              title={
                <Flex align="center" gap={8}>
                  <span className="chart-card-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
                    <CheckCircle size={15} strokeWidth={2} />
                  </span>
                  Call Success Rate
                </Flex>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Gauge
                  percent={successRate} height={200}
                  range={{ color: ['#ef4444', '#f59e0b', '#10b981'] }}
                  indicator={{
                    pointer: { style: { stroke: '#10b981' } },
                    pin:     { style: { stroke: '#10b981' } },
                  }}
                  statistic={{
                    content: {
                      formatter: () => `${Math.round(successRate * 100)}%`,
                      style: { fontSize: '28px', fontWeight: '700', color: '#10b981' },
                    },
                    title: {
                      formatter: () => 'Success',
                      style: { fontSize: '12px', color: '#94a3b8' },
                    },
                  }}
                />
                <Flex gap={16} justify="center">
                  <Flex align="center" gap={5}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    <Text style={{ fontSize: 11 }}>Completed <strong style={{ color: '#10b981' }}>{completed}</strong></Text>
                  </Flex>
                  <Flex align="center" gap={5}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                    <Text style={{ fontSize: 11 }}>Others <strong style={{ color: '#ef4444' }}>{totalCalls - completed}</strong></Text>
                  </Flex>
                </Flex>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* ── ROW 3: bySource Pie + Lead Funnel + Priority Leads ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>

        {/* Leads by Source */}
        <Col xs={24} md={12} lg={8}>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
            <Card
              className="dashboard-chart-card"
              title={
                <Flex align="center" gap={8}>
                  <span className="chart-card-dot" style={{ background: '#8b5cf6' }} />
                  Leads by Source
                </Flex>
              }
            >
              <Pie
                data={bySource}
                angleField="count" colorField="source"
                height={220} radius={0.78} innerRadius={0.55}
                label={false}
                legend={{ position: 'bottom', flipPage: false }}
                statistic={{
                  title: { content: 'Sources', style: { fontSize: '13px' } },
                  content: { content: String(bySource.reduce((a: number, b: any) => a + (b.count || 0), 0)), style: { fontSize: '22px', fontWeight: '700' } },
                }}
              />
            </Card>
          </motion.div>
        </Col>

        {/* Lead Funnel */}
        <Col xs={24} md={12} lg={8}>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }}>
            <Card
              className="dashboard-chart-card"
              title={
                <Flex align="center" gap={8}>
                  <span className="chart-card-icon-wrap" style={{ background: '#fff7ed', color: '#f97316' }}>
                    <BarChart3 size={15} strokeWidth={2} />
                  </span>
                  Lead Funnel
                </Flex>
              }
            >
              <div className="lead-funnel">
                {(funnelData.length > 0 ? funnelData : funnelOrder.map((s) => ({ status: s, count: 0 }))).map((d, i) => (
                  <motion.div
                    key={d.status} className="funnel-row"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
                  >
                    <span className="funnel-label">{d.status}</span>
                    <div className="funnel-bar-wrap">
                      <motion.div
                        className="funnel-bar"
                        style={{ background: FUNNEL_COLORS[d.status] }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${(d.count / funnelMax) * 100}%` }}
                        transition={{ delay: 0.4 + i * 0.07, duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="funnel-count" style={{ color: FUNNEL_COLORS[d.status] }}>{d.count}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </Col>

        {/* Priority Leads */}
        <Col xs={24} lg={8}>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
            <Card
              className="dashboard-chart-card"
              title={
                <Flex align="center" gap={8}>
                  <span className="chart-card-icon-wrap" style={{ background: '#fef2f2', color: '#ef4444' }}>
                    <Flame size={15} strokeWidth={2} />
                  </span>
                  Priority Leads
                  <Badge count={priorityLeads.length} style={{ backgroundColor: '#ef4444', marginLeft: 4 }} />
                </Flex>
              }
              styles={{ body: { padding: '8px 16px' } }}
            >
              <div className="priority-leads-list">
                {priorityLeads.length === 0 && (
                  <div className="recent-calls-empty">
                    <Flame size={26} strokeWidth={1.4} style={{ color: '#fca5a5' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>No priority leads</Text>
                  </div>
                )}
                {priorityLeads.slice(0, 6).map((lead: any, i: number) => {
                  const p = lead.priority?.toLowerCase() || 'low';
                  const cfg = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.low;
                  const PIcon = cfg.icon;
                  return (
                    <motion.div
                      key={lead._id || i}
                      className="priority-lead-item"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05, duration: 0.35, ease: 'easeOut' }}
                      onClick={() => goto('/crm/leads')}
                    >
                      <Flex align="center" gap={10}>
                        <span className="priority-lead-icon" style={{ background: cfg.bg, color: cfg.color }}>
                          <PIcon size={13} strokeWidth={2} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 12, display: 'block' }} ellipsis>{lead.name || 'Unknown'}</Text>
                          <Text type="secondary" style={{ fontSize: 10 }}>{lead.phone || lead.mobile || ''}</Text>
                        </div>
                        <Tag
                          style={{ margin: 0, fontSize: 10, borderRadius: 6, background: cfg.bg, color: cfg.color, border: 'none' }}
                        >
                          {p}
                        </Tag>
                      </Flex>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* ── ROW 4: Charts + Recent Activities ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
                <Card className="dashboard-chart-card"
                  title={<Flex align="center" gap={8}><span className="chart-card-dot" style={{ background: '#0ea5e9' }} />Leads by Status</Flex>}
                >
                  <Column
                    data={stats?.leads?.byStatus || []}
                    xField="status" yField="count" height={200}
                    color={(datum: any) => LEAD_STATUS_COLORS[datum.status as string] || '#0ea5e9'}
                  />
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} md={12}>
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }}>
                <Card className="dashboard-chart-card"
                  title={<Flex align="center" gap={8}><span className="chart-card-dot" style={{ background: '#f59e0b' }} />Calls by Status</Flex>}
                >
                  <Column
                    data={stats?.calls?.byStatus || []}
                    xField="status" yField="count" height={200}
                    color={(datum: any) => CALL_STATUS_COLORS[datum.status as string] || '#0ea5e9'}
                  />
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} md={12}>
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.28 }}>
                <Card className="dashboard-chart-card"
                  title={<Flex align="center" gap={8}><TrendingUp size={15} strokeWidth={2} style={{ color: '#10b981' }} />Call Summary</Flex>}
                >
                  <div className="call-summary-list">
                    {CALL_SUMMARY_ROWS(stats).map((row) => {
                      const Icon = row.icon;
                      return (
                        <div key={row.label} className="call-summary-row">
                          <Flex align="center" gap={10}>
                            <span className="call-summary-icon" style={{ background: row.bg, color: row.color }}>
                              <Icon size={14} strokeWidth={2} />
                            </span>
                            <Text style={{ fontSize: 13 }}>{row.label}</Text>
                          </Flex>
                          <Text strong style={{ color: row.color, fontSize: 13 }}>{row.value}</Text>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} md={12}>
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.33 }}>
                <Card
                  className="dashboard-chart-card recent-calls-card"
                  title={
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap={8}>
                        <span className="chart-card-dot" style={{ background: '#ef4444' }} />
                        Recent Calls
                      </Flex>
                      <Badge count={stats?.calls?.recentCalls?.length || 0} style={{ backgroundColor: '#ef4444' }} />
                    </Flex>
                  }
                  styles={{ body: { padding: '8px 16px' } }}
                >
                  <div className="recent-calls-list" style={{ maxHeight: 260 }}>
                    {(stats?.calls?.recentCalls || []).map((call: any, idx: number) => (
                      <motion.div
                        key={call._id} className="recent-call-item"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + idx * 0.04, duration: 0.35, ease: 'easeOut' }}
                        onClick={() => goto(`/crm/calls?callSid=${call?.callSid}`)}
                      >
                        <Flex justify="space-between" align="flex-start" gap={8}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong style={{ fontSize: 12, display: 'block' }} ellipsis>
                              {call?.leadId?.name || 'Unknown Lead'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {call?.userId?.firstName} {call?.userId?.lastName}
                            </Text>
                          </div>
                          {canDelete('calls') && (
                            <MoveToTrashButton recordId={call._id} modelType="call"
                              onMoved={async () => {
                                const r = await getDashboardStats() as { data: unknown };
                                setStats(r.data);
                              }}
                            />
                          )}
                        </Flex>
                        <Flex gap={4} wrap="wrap" style={{ marginTop: 6 }}>
                          <Tag color={call?.direction === 'outgoing' ? 'blue' : 'green'} style={{ margin: 0, fontSize: 10 }}>{call?.direction}</Tag>
                          <Tag color={call?.status === 'completed' ? 'success' : call?.status === 'failed' ? 'error' : 'default'} style={{ margin: 0, fontSize: 10 }}>{call?.status}</Tag>
                        </Flex>
                      </motion.div>
                    ))}
                    {(!stats?.calls?.recentCalls || stats.calls.recentCalls.length === 0) && (
                      <div className="recent-calls-empty">
                        <Phone size={26} strokeWidth={1.4} style={{ color: '#cbd5e1' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>No recent calls</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={8}>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }} style={{ height: '100%' }}>
            <Card
              className="dashboard-chart-card"
              style={{ height: '100%' }}
              title={
                <Flex align="center" gap={8}>
                  <span className="chart-card-icon-wrap" style={{ background: '#eef2ff', color: '#6366f1' }}>
                    <Zap size={15} strokeWidth={2} />
                  </span>
                  Recent Activities
                  <Badge count={recentActivities.length} style={{ backgroundColor: '#6366f1', marginLeft: 4 }} />
                </Flex>
              }
              styles={{ body: { padding: '12px 16px' } }}
            >
              {recentActivities.length === 0 ? (
                <div className="recent-calls-empty">
                  <Zap size={26} strokeWidth={1.4} style={{ color: '#c7d2fe' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>No recent activities</Text>
                </div>
              ) : (
                <div className="activity-feed">
                  <Timeline
                    items={recentActivities.slice(0, 8).map((act: any, i: number) => {
                      const type = act.type?.toLowerCase() || 'task';
                      const cfg = ACTIVITY_ICON[type] || ACTIVITY_ICON.task;
                      const AIcon = cfg.icon;
                      return {
                        dot: (
                          <span className="activity-dot" style={{ background: cfg.color }}>
                            <AIcon size={11} strokeWidth={2.2} color="#fff" />
                          </span>
                        ),
                        children: (
                          <motion.div
                            className="activity-item"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.05, duration: 0.35, ease: 'easeOut' }}
                          >
                            <Flex justify="space-between" align="flex-start" gap={6}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text strong style={{ fontSize: 12, display: 'block' }} ellipsis>
                                  {act.leadId?.name || act.title || 'Activity'}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {act.note || act.description || act.type || ''}
                                </Text>
                              </div>
                              <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {act.createdAt ? fmtDate(act.createdAt) : ''}
                              </Text>
                            </Flex>
                            <Flex align="center" gap={6} style={{ marginTop: 4 }}>
                              <Avatar size={16} style={{ background: '#e0e7ff', color: '#6366f1', fontSize: 9 }}>
                                {(act.userId?.firstName?.[0] || act.createdBy?.[0] || 'U').toUpperCase()}
                              </Avatar>
                              <Text type="secondary" style={{ fontSize: 10 }}>
                                {act.userId?.firstName || act.createdBy || 'Agent'}
                                {act.createdAt ? ` · ${fmtTime(act.createdAt)}` : ''}
                              </Text>
                            </Flex>
                          </motion.div>
                        ),
                      };
                    })}
                  />
                </div>
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* FILTER DRAWER */}
      <Drawer title="CRM Filters" placement="right" onClose={() => setFilterOpen(false)} open={filterOpen}>
        <Flex vertical gap="large">
          <DatePicker.RangePicker />
          <Slider range defaultValue={[0, 100000]} />
          <Button type="primary" block>Apply</Button>
        </Flex>
      </Drawer>
    </div>
  );
};

export default SalesDashBoard;
