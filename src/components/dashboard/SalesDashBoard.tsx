import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Empty, Row, Select, Skeleton, Table, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardList, Flame, Phone, Target, TrendingUp, UserPlus, UsersRound } from 'lucide-react';
import { useAuth } from 'src/hooks';
import { usePermissions } from 'src/hooks/usePermissions';
import dashboaradService from 'src/services/dashboaradService';
import './crm-dashboard.css';

const { Text } = Typography;
const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);
const money = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? `₹${formatNumber(value)}` : '—';
const chartScale = (max: number, minimum = 1) => {
  if (!Number.isFinite(max) || max <= 0) return minimum * 4;
  const rawStep = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = Math.max(minimum, [1, 2, 5, 10].map(multiplier => multiplier * magnitude).find(value => value >= rawStep) ?? magnitude * 10);
  return Math.max(4, Math.ceil(max / step)) * step;
};
const dateText = (value?: string, time = false) => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', ...(time ? { hour: 'numeric', minute: '2-digit' } : { year: 'numeric' }) }) : '—';
const person = (value: any) => value?.name || [value?.firstName, value?.lastName].filter(Boolean).join(' ') || '—';
const empty = (message: string) => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={message} />;

function RingHitAreas({ segments, total }: { segments: { label: string; value: number }[]; total: number }) {
  const circumference = 2 * Math.PI * 50;
  let offset = 0;
  return <svg className="crm-ring-overlay" viewBox="0 0 120 120" aria-label="Chart segments">
    {segments.map((segment, index) => {
      const length = total > 0 ? circumference * segment.value / total : 0;
      const start = offset;
      offset += length;
      if (length <= 0) return null;
      const label = `${segment.label}: ${formatNumber(segment.value)} leads (${(segment.value / total * 100).toFixed(1)}%)`;
      return <Tooltip key={`${segment.label}-${index}`} title={label} trigger={['hover', 'focus']}><circle cx="60" cy="60" r="50" fill="none" stroke="transparent" strokeWidth="20" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" tabIndex={0} role="img" aria-label={label} style={{ pointerEvents: 'stroke', cursor: 'pointer' }} /></Tooltip>;
    })}
  </svg>;
}

export default function SalesDashBoard() {
  const { user } = useAuth();
  const { canRead } = usePermissions();
  const { getDashboardStats } = dashboaradService();
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [period, setPeriod] = useState('all');
  const [customRange, setCustomRange] = useState<[string, string] | null>(null);
  const indiaToday = dayjs(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  const range = period === 'today' ? [indiaToday.format('YYYY-MM-DD'), indiaToday.format('YYYY-MM-DD')] : period === 'week' ? [indiaToday.startOf('week').format('YYYY-MM-DD'), indiaToday.format('YYYY-MM-DD')] : period === 'month' ? [indiaToday.startOf('month').format('YYYY-MM-DD'), indiaToday.format('YYYY-MM-DD')] : period === 'custom' ? customRange : null;
  const startDate = range?.[0], endDate = range?.[1];
  useEffect(() => {
    let active = true;
    setStats(null); setError('');
    if (period === 'custom' && !customRange) return () => { active = false; };
    getDashboardStats('crm', startDate && endDate ? { leadStartDate: startDate, leadEndDate: endDate } : undefined).then((res: any) => {
      if (!res?.success || !res.data) throw new Error('Invalid dashboard response');
      if (startDate && endDate && (res.data.leadDateRange?.start !== startDate || res.data.leadDateRange?.end !== endDate)) throw new Error('Lead date filter unavailable on the connected API');
      if (active) setStats(res.data);
    }).catch((reason) => { if (active) setError(reason instanceof Error && reason.message === 'Lead date filter unavailable on the connected API' ? 'The connected backend does not support this date filter yet. Update the backend and retry.' : 'Please check your connection and try again.'); });
    return () => { active = false; };
  }, [(user as any)?._id, attempt, period, startDate, endDate]);
  const canLeads = canRead('leads'), canCalls = canRead('calls');
  const counts: any[] = stats?.leads?.byStatus || [];
  const sources: any[] = stats?.leads?.bySource || [];
  const findStage = (stage: string) => counts.find(row => row.status === stage);
  const won = findStage('Won')?.count || 0, lost = findStage('Lost')?.count || 0;
  const activeValueAvailable = ['New', 'Contacted', 'Qualified', 'Proposal'].every(stage => !findStage(stage) || typeof findStage(stage).value === 'number');
  const activeValue = ['New', 'Contacted', 'Qualified', 'Proposal'].reduce((sum, stage) => sum + (findStage(stage)?.value || 0), 0);
  const sourceTotal = sources.reduce((sum, source) => sum + (source.count || 0), 0);
  let sourceOffset = 0;
  const sourceColors = ['#c44917', '#6489cb', '#71a999', '#e5ad70', '#9a83ba', '#bcc6d6'];
  const sourceGradient = sources.map((source, index) => { const start = sourceOffset; sourceOffset += sourceTotal ? source.count / sourceTotal * 100 : 0; return `${sourceColors[index % sourceColors.length]} ${start}% ${sourceOffset}%`; }).join(', ');
  const stageValuesAvailable = counts.every(item => typeof item.value === 'number' && Number.isFinite(item.value));
  const maxStageCount = chartScale(Math.max(0, ...counts.map(item => Number(item.count) || 0)));
  const maxStageValue = chartScale(Math.max(0, ...counts.map(item => Number(item.value) || 0)));
  const axisFractions = [1, 0.75, 0.5, 0.25, 0];
  const monthly: any[] | null = Array.isArray(stats?.leads?.monthly) ? stats.leads.monthly : null;
  const maxWonValue = Math.max(1, ...(monthly || []).map(item => Number(item.wonValue) || 0));
  const trendScale = chartScale(Math.max(0, ...(monthly || []).map(item => Number(item.created) || 0)));
  const trendX = (index: number) => monthly?.length === 1 ? 310 : 50 + index * (520 / Math.max((monthly?.length || 1) - 1, 1));
  const trendY = (value: number) => 170 - (Math.max(0, value) / trendScale) * 140;
  const trendPath = (field: 'created' | 'open' | 'won') => (monthly || []).map((item, index) => `${index ? 'L' : 'M'} ${trendX(index)} ${trendY(Number(item[field]) || 0)}`).join(' ');
  const kpis = [
    { title: 'Total leads', value: stats?.totals?.totalLeads ?? 0, note: period === 'all' ? 'All accessible leads' : 'Created in selected period', icon: UsersRound, className: 'orange' },
    { title: 'Added today', value: stats?.leads?.today ?? 0, note: 'Within selected period · India time', icon: UserPlus, className: 'blue' },
    { title: 'Open leads', value: stats?.leads?.open ?? 0, note: 'Active in pipeline', icon: Target, className: 'purple' },
    { title: 'High-priority open', value: stats?.leads?.highPriority ?? 0, note: 'High and urgent leads', icon: Flame, className: 'red' },
  ];
  return <div className="crm-home">
    <header className="crm-home-header"><div><div className="crm-home-eyebrow">SALES WORKSPACE</div><h1>CRM Dashboard</h1><p>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Here’s your sales pipeline and team priorities.</p></div><div className="crm-header-actions">{canLeads && <Select aria-label="Lead creation period" value={period} onChange={setPeriod} style={{ minWidth: 150 }} options={[{ value: 'all', label: 'All leads' }, { value: 'month', label: 'This month' }, { value: 'week', label: 'This week' }, { value: 'today', label: 'Today' }, { value: 'custom', label: 'Custom range' }]} />}{canLeads && period === 'custom' && <DatePicker.RangePicker aria-label="Lead creation date range" value={customRange ? [dayjs(customRange[0]), dayjs(customRange[1])] : null} onChange={dates => setCustomRange(dates?.[0] && dates?.[1] ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')] : null)} />}<span className="crm-home-period"><span /> Lead creation period · India time</span><Button onClick={() => setAttempt(value => value + 1)}>Refresh data</Button></div></header>
    {error ? <Alert type="error" showIcon message="Dashboard data could not be loaded" description={error} action={<Button onClick={() => setAttempt(value => value + 1)}>Retry</Button>} /> : period === 'custom' && !customRange ? <Alert type="info" showIcon message="Choose a start and end date to filter leads." /> : !stats ? <Card><Skeleton active paragraph={{ rows: 8 }} /></Card> : <>
      {canLeads && <>
        <Row gutter={[16, 16]} className="crm-kpi-row">{kpis.map(({ title, value, note, icon: Icon, className }) => <Col xs={24} sm={12} xl={6} key={title}><Card className="crm-kpi"><div className="crm-kpi-heading"><span>{title}</span><span className={`crm-icon ${className}`}><Icon size={19} /></span></div><strong>{formatNumber(value)}</strong><small>{note}</small></Card></Col>)}</Row>
        <Card className="crm-panel crm-pipeline" title={<div><span>Lead pipeline</span><small> Current active value: {activeValueAvailable ? money(activeValue) : '—'}</small></div>} extra={<span className="crm-conversion"><CheckCircle2 size={15} /> Won / closed: {won + lost ? `${Math.round(won * 100 / (won + lost))}%` : '—'}</span>}>
          <div className="crm-stage-strip">{stages.map((stage, i) => { const count = findStage(stage)?.count || 0; const total = counts.reduce((sum, item) => sum + (item.count || 0), 0); return count > 0 ? <span className={`strip-${i}`} key={stage} style={{ width: `${count / total * 100}%` }} title={`${stage}: ${count}`} /> : null; })}</div><div className="crm-stages">{stages.map((stage, i) => { const row = findStage(stage); return <div className={`crm-stage stage-${i}`} key={stage}><span>{i + 1}. {stage}</span><strong>{formatNumber(row?.count || 0)} <small>leads</small></strong><small>{row ? money(row.value) : '₹0'} value</small></div>; })}</div>
        </Card>
        <Card className="crm-panel crm-analytics" title={<><TrendingUp size={17} /> Pipeline &amp; lead flow analytics</>} extra={<Text type="secondary">{period === 'all' ? 'All accessible leads' : 'Created in selected period'}</Text>}><div className="crm-analytics-grid"><div className="crm-analytics-box"><div className="crm-analytics-title">Pipeline by stage</div>
          {counts.length ? <><div className="crm-chart-legend"><span><i className="crm-legend-value" /> Lead value (₹, left)</span><span><i className="crm-legend-count" /> Lead count (right)</span><small>Each measure uses its own scale</small></div>{!stageValuesAvailable && <Alert type="info" showIcon message="Lead values are not available from the connected backend yet." />}<div className="crm-chart-scroll"><div className="crm-pipeline-plot"><div className="crm-chart-y-axis" aria-label="Lead value scale in rupees">{axisFractions.map(fraction => <span key={fraction}>{stageValuesAvailable ? money(maxStageValue * fraction) : '—'}</span>)}</div><div className="crm-chart-plot-area"><div className="crm-chart-gridlines" aria-hidden="true">{axisFractions.map(fraction => <span key={fraction} />)}</div><div className="crm-vertical-chart">{stages.map(stage => { const row = findStage(stage), count = row?.count || 0, value = typeof row?.value === 'number' ? row.value : 0; const valueLabel = row ? money(row.value) : '₹0'; return <div className="crm-chart-stage" key={stage}><div className="crm-chart-bars"><Tooltip title={`${stage} · Lead value: ${valueLabel}`} trigger={['hover', 'focus']}><div className="crm-chart-hit" tabIndex={0} role="img" aria-label={`${stage} lead value: ${valueLabel}`}><div className="crm-chart-bar crm-value-bar" style={{ height: `${value / maxStageValue * 100}%` }} /></div></Tooltip><Tooltip title={`${stage} · ${formatNumber(count)} leads`} trigger={['hover', 'focus']}><div className="crm-chart-hit" tabIndex={0} role="img" aria-label={`${stage}: ${formatNumber(count)} leads`}><div className="crm-chart-bar crm-count-bar" style={{ height: `${count / maxStageCount * 100}%` }} /></div></Tooltip></div><strong>{formatNumber(count)} leads</strong><span>{stage}</span><small>{valueLabel}</small></div>; })}</div></div><div className="crm-chart-y-axis crm-chart-count-axis" aria-label="Lead count scale">{axisFractions.map(fraction => <span key={fraction}>{formatNumber(maxStageCount * fraction)}</span>)}</div></div></div></> : empty('No leads in the pipeline yet')}
        </div><div className="crm-analytics-box crm-source"><div className="crm-analytics-title">Lead source mix <span>By lead count</span></div>
          {sourceTotal > 0 ? <div className="crm-source-layout"><div className="crm-source-donut" style={{ background: `conic-gradient(${sourceGradient})` }}><div><strong>{formatNumber(sourceTotal)}</strong><small>Leads</small></div><RingHitAreas total={sourceTotal} segments={sources.map(source => ({ label: source.source || 'Unspecified', value: Number(source.count) || 0 }))} /></div><div className="crm-source-list">{sources.map((source, index) => <div className="crm-source-row" key={source.source || index}><i style={{ background: sourceColors[index % sourceColors.length] }} /><span>{source.source || 'Unspecified'}</span><strong>{formatNumber(source.count)}</strong></div>)}</div></div> : empty('No lead sources to show')}
        </div></div></Card>
        <Card className="crm-panel crm-outcome-card" title="Closed leads at a glance" extra={<Text type="secondary">Current status · selected lead period</Text>}>
          {won + lost > 0 ? <div className="crm-outcome-layout"><div className="crm-outcome-ring" role="group" aria-label={`${Math.round(won * 100 / (won + lost))}% won among closed leads`} style={{ background: `conic-gradient(#25a27a 0 ${(won / (won + lost)) * 100}%, #ef8c78 ${(won / (won + lost)) * 100}% 100%)` }}><div><strong>{Math.round(won * 100 / (won + lost))}%</strong><small>won / closed</small></div><RingHitAreas total={won + lost} segments={[{ label: 'Won', value: won }, { label: 'Lost', value: lost }]} /></div><div className="crm-outcome-details"><div><span className="crm-outcome-dot won" /><span>Won</span><strong>{formatNumber(won)}</strong></div><div><span className="crm-outcome-dot lost" /><span>Lost</span><strong>{formatNumber(lost)}</strong></div><p>Won ÷ (Won + Lost). This reflects lead status, including manually marked Won leads.</p></div></div> : empty('No won or lost leads in this period')}
        </Card>
        <Card className="crm-panel crm-monthly" title={<><TrendingUp size={17} /> Monthly lead comparison</>} extra={<Text type="secondary">Lead creation month · India time</Text>}>
          <p className="crm-chart-explainer">Up to six months ending in the selected period. Counts follow the selected creation dates and show each lead’s current status. Pending means New, Contacted, Qualified or Proposal. Won includes leads marked Won; converted customers are marked Won by the conversion flow.</p>
          {!monthly ? <Alert type="info" showIcon message="Monthly data is not available from the connected backend yet." /> : !monthly.some(item => item.created > 0) ? empty('No leads created in these months') : <div className="crm-monthly-grid">
            <div className="crm-analytics-box crm-trend-box">
              <div className="crm-analytics-title">Lead journey <span>Created, pending and won by creation month</span></div>
              <div className="crm-chart-legend"><span><i className="crm-month-created" /> Created</span><span><i className="crm-month-open" /> Pending</span><span><i className="crm-month-won" /> Won</span></div>
              <div className="crm-trend-scroll"><svg className="crm-trend-chart" viewBox="0 0 600 205" role="img" aria-label="Monthly leads created, pending and won. Values are listed below the chart.">
                <defs><linearGradient id="crmTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#677ce5" stopOpacity="0.28" /><stop offset="100%" stopColor="#677ce5" stopOpacity="0.02" /></linearGradient></defs>
                {[1, 0.75, 0.5, 0.25, 0].map(fraction => <g key={fraction}><line x1="50" x2="570" y1={trendY(trendScale * fraction)} y2={trendY(trendScale * fraction)} stroke="#d9e2f3" strokeDasharray="4 5" /><text x="42" y={trendY(trendScale * fraction) + 4} textAnchor="end" className="crm-trend-axis">{formatNumber(trendScale * fraction)}</text></g>)}
                {monthly.length > 1 && <path d={`${trendPath('created')} L ${trendX(monthly.length - 1)} 170 L ${trendX(0)} 170 Z`} fill="url(#crmTrendFill)" />}
                {([['created', '#6579dc'], ['open', '#ed9b34'], ['won', '#24a276']] as const).map(([field, color]) => <g key={field}><path d={trendPath(field)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{monthly.map((item, index) => <circle key={item.month} cx={trendX(index)} cy={trendY(Number(item[field]) || 0)} r="4.5" fill="#fff" stroke={color} strokeWidth="3"><title>{`${item.month} ${field}: ${formatNumber(item[field] || 0)}`}</title></circle>)}</g>)}
                {monthly.map((item, index) => { const left = index === 0 ? 35 : (trendX(index - 1) + trendX(index)) / 2; const right = index === monthly.length - 1 ? 585 : (trendX(index) + trendX(index + 1)) / 2; const label = `${dayjs(`${item.month}-01`).format('MMM YYYY')}: ${formatNumber(item.created)} created, ${formatNumber(item.open)} pending, ${formatNumber(item.won)} won`; return <Tooltip key={`hover-${item.month}`} title={label} trigger={['hover', 'focus']}><rect x={left} y="20" width={right - left} height="155" fill="transparent" tabIndex={0} role="img" aria-label={label} style={{ cursor: 'crosshair' }} /></Tooltip>; })}
                {monthly.map((item, index) => <text key={item.month} x={trendX(index)} y="195" textAnchor="middle" className="crm-trend-axis">{dayjs(`${item.month}-01`).format('MMM YY')}</text>)}
              </svg></div>
              <div className="crm-trend-values">{monthly.map(item => <div key={item.month}><strong>{dayjs(`${item.month}-01`).format('MMM YY')}</strong><span>{formatNumber(item.created)} created · {formatNumber(item.open)} pending · {formatNumber(item.won)} won</span></div>)}</div>
              <small className="crm-chart-footnote">Lost leads are included in created, but not in pending or won.</small>
            </div>
            <div className="crm-analytics-box"><div className="crm-analytics-title">Won lead value <span>Estimated lead value, not collected revenue</span></div><div className="crm-month-chart crm-month-values" style={{ gridTemplateColumns: `repeat(${monthly.length}, minmax(0, 1fr))` }}>{monthly.map(item => <div className="crm-month-group" key={item.month}><div className="crm-month-bars"><Tooltip title={`${dayjs(`${item.month}-01`).format('MMM YYYY')} · Won lead value: ${money(item.wonValue)}`} trigger={['hover', 'focus']}><div className="crm-month-hit" tabIndex={0} role="img" aria-label={`${item.month} won lead value: ${money(item.wonValue)}`}><div className="crm-month-bar crm-month-value" style={{ height: `${(Number(item.wonValue) || 0) / maxWonValue * 100}%` }} /></div></Tooltip></div><strong>{money(item.wonValue)}</strong><span>{dayjs(`${item.month}-01`).format('MMM YY')}</span></div>)}</div></div>
          </div>}
        </Card>
      </>}
      {canLeads && <div className="crm-work-grid"><div className="crm-work-main"><Card className="crm-panel" title="Recently added leads" extra={<Link className="crm-link" to="/crm/leads">View all leads <ArrowRight size={15} /></Link>}>
          <Table size="middle" rowKey="_id" pagination={false} scroll={{ x: 700 }} dataSource={stats.leads?.recent || []} locale={{ emptyText: empty('No leads added yet') }} columns={[
            { title: 'LEAD / ACCOUNT', render: (_: unknown, row: any) => <div><Link className="crm-lead-name" to={`/crm/leads?id=${encodeURIComponent(row._id)}`}>{row.name || 'Unnamed lead'}</Link><small className="crm-muted-line">{row.company || row.Id || '—'}</small></div> },
            { title: 'STATUS', dataIndex: 'status', render: (value: string) => <Tag className="crm-status">{value || '—'}</Tag> },
            { title: 'SOURCE', dataIndex: 'source', render: (value: string) => value || '—' },
            { title: 'PRIORITY', dataIndex: 'priority', render: (value: string) => value || '—' },
            { title: 'ASSIGNED TO', dataIndex: 'assignedTo', render: person },
            { title: 'ADDED', dataIndex: 'createdAt', render: (value: string) => dateText(value) },
          ]} />
        </Card>
{canLeads && <div><Card className="crm-panel" title={<><Flame size={17} /> High-priority leads</>} extra={<Link className="crm-link" to="/crm/leads">View leads <ArrowRight size={15} /></Link>}>
        {(stats.priorityLeads || []).length ? <div className="crm-priority-list">{stats.priorityLeads.map((lead: any) => <Link className="crm-priority-item" key={lead._id} to={`/crm/leads?id=${encodeURIComponent(lead._id)}`}><span className="crm-icon orange"><Flame size={17} /></span><span><strong>{lead.name || 'Unnamed lead'}</strong><small>{lead.status || '—'} · {person(lead.assignedTo)} · {money(lead.leadValue)}</small></span><Tag>{lead.priority || '—'}</Tag></Link>)}</div> : empty('No high-priority open leads')}
      </Card></div>}</div><div className="crm-work-side">
{canLeads && <Card className="crm-panel" title="Recent activity"><div className="crm-activity-feed">{(stats.recentActivities || []).length ? stats.recentActivities.map((row: any) => <div className="crm-activity-row" key={row._id}><span className="crm-activity-icon"><ClipboardList size={14} /></span><div><div><strong>{person(row.createdBy)}</strong>{row.leadId?.name && <> · <Link to={`/crm/leads?id=${encodeURIComponent(row.leadId._id)}`}>{row.leadId.name}</Link></>}</div><p>{row.content || 'Activity recorded'}</p><small>{dateText(row.createdAt, true)}</small></div></div>) : empty('No recent activity yet')}</div></Card>}</div></div>}
      {canCalls && <section className="crm-calls"><div className="crm-section-heading"><div><h2><Phone size={18} /> Communications &amp; call logs</h2><p>Recent call activity</p></div><Link className="crm-link" to="/crm/calls">View call logs <ArrowRight size={15} /></Link></div><Row gutter={[16, 16]}>{[{ title: 'Total calls', value: stats.totals?.totalCalls }, { title: 'Calls today', value: stats.calls?.todayCalls }, { title: 'Completed calls', value: stats.calls?.completed }].map(item => <Col xs={24} sm={8} key={item.title}><Card className="crm-call-metric"><small>{item.title}</small><strong>{formatNumber(item.value ?? 0)}</strong></Card></Col>)}</Row><Card className="crm-panel"><Table size="middle" rowKey="_id" pagination={false} scroll={{ x: 520 }} dataSource={stats.calls?.recentCalls || []} locale={{ emptyText: empty('No recent calls logged') }} columns={[
        { title: 'LEAD', render: (_: unknown, row: any) => row.leadId?.name || '—' }, { title: 'REP', dataIndex: 'userId', render: person }, { title: 'STATUS', dataIndex: 'status', render: (value: string) => value || '—' }, { title: 'TIME', render: (_: unknown, row: any) => dateText(row.startedAt || row.createdAt, true) },
      ]} /></Card></section>}
      {!canLeads && !canCalls && <Alert type="info" showIcon message="Lead and call reports are not available for your role." />}
    </>}
  </div>;
}
