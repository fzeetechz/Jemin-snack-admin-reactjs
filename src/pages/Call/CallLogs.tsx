import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Button,
  Slider,
  Tooltip,
} from 'antd';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Play,
  Pause,
  Download,
  TrendingUp,
} from 'lucide-react';
import useCallService from '../../services/useCallService';
import { BASEURL } from '../../services/api/apiClient';
import { useLocation, useSearchParams } from 'react-router-dom';

type Lead = { _id: string; name: string; email: string; phone: string };
type User = { _id: string; firstName: string; lastName: string; email: string };
type Call = {
  _id: string;
  leadId: Lead;
  userId: User;
  from: string;
  to: string;
  direction: 'incoming' | 'outgoing';
  status: string;
  startedAt: string;
  duration: number;
  recordingUrl?: string;
};

type CallStats = {
  totalAll?: number;
  totalFiltered?: number;
  totalOnPage?: number;
  statusStats?: Array<{ status: string; count: number }>;
  directionStats?: Array<{ direction: string; count: number }>;
  recordingStats?: Array<{ recordingStatus: string; count: number }>;
  duration?: {
    totalDuration?: number;
    avgDuration?: number;
    maxDuration?: number;
    minDuration?: number;
  };
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, '0')}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusColor: Record<string, string> = {
  completed: 'success',
  failed: 'error',
  'in-progress': 'warning',
  busy: 'error',
  'no-answer': 'default',
};

const getCountByStatus = (
  statusStats: Array<{ status: string; count: number }> = [],
  status: string
) => statusStats.find((item) => item.status === status)?.count || 0;

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 240 }}
    >
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
      />
      <Button
        type="primary"
        shape="circle"
        size="small"
        icon={playing ? <Pause size={12} /> : <Play size={12} />}
        onClick={toggle}
      />
      <Slider
        min={0}
        max={duration || 1}
        value={currentTime}
        step={0.1}
        onChange={(v) => {
          if (audioRef.current) audioRef.current.currentTime = v;
          setCurrentTime(v);
        }}
        style={{ flex: 1, margin: '0 4px' }}
        tooltip={{ formatter: (v) => fmt(v || 0) }}
      />
      <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
        {fmt(currentTime)} / {fmt(duration)}
      </span>
      <Tooltip title="Download">
        <Button
          size="small"
          shape="circle"
          icon={<Download size={12} />}
          href={url}
          download
          target="_blank"
        />
      </Tooltip>
    </div>
  );
}

const CallLogs = () => {
  const { getCallHistoryApi } = useCallService();
  const [listingSearch, setListingSearch] = useState('');
  const [listingFilters, setListingFilters] = useState<Record<string, string>>({});
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [tableLimit, setTableLimit] = useState(20);
  const [showTotalFiltered, setShowTotalFiltered] = useState(true);
  let [searchParams] = useSearchParams();
  const _loc = useLocation();
  const loc = _loc.pathname;

  const isRecordingPage = loc.includes('recordings');

  useEffect(() => {
    let active = true;
    const query: any = {
      page: tablePage,
      limit: tableLimit,
    };

    if (isRecordingPage) {
      query.onlyRecording = true;
      setShowTotalFiltered(true);
    }
    if (searchParams.get('today')) {
      query.today = searchParams.get('today');
    }
    if (searchParams.get('status')) {
      query.status = searchParams.get('status');
    }
    if (searchParams.get('callSid')) {
      query.callSid = searchParams.get('callSid');
    }

    if (listingSearch) query.callSid = listingSearch.trim();
    if (listingFilters.status) query.status = listingFilters.status;
    setLoading(true);

    getCallHistoryApi(query)
      .then((res: any) => {
        if (active && res?.data?.success) {
          setCalls(res.data.data.calls || []);
          setStats(res.data.data.stats || null);
          setPagination(
            res.data.data.pagination || {
              total: 0,
              page: 1,
              limit: 20,
              pages: 0,
            }
          );
        }
      })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isRecordingPage, tableLimit, tablePage, searchParams, listingSearch, listingFilters]);

  const statsSummary = useMemo(() => {
    const statusStats = stats?.statusStats || [];
    const durationStats = stats?.duration || {};

    return {
      totalCalls: showTotalFiltered
        ? stats?.totalFiltered
        : stats?.totalAll ?? pagination.total ?? calls.length,
      completed: getCountByStatus(statusStats, 'completed'),
      totalDuration:
        durationStats.totalDuration ??
        calls.reduce((a, c) => a + c.duration, 0),
      // agents: new Set(calls.map((c) => c.userId?._id).filter(Boolean)).size,
    };
  }, [stats, pagination.total, calls]);

  const columns = [
    {
      title: 'Lead',
      key: 'lead',
      render: (_: any, r: Call) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.leadId?.name || '—'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{r.to}</div>
        </div>
      ),
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_: any, r: Call) => (
        <div>
          <div>
            {r.userId?.firstName} {r.userId?.lastName}
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>{r.from}</div>
        </div>
      ),
    },
    {
      title: 'Direction',
      key: 'direction',
      render: (_: any, r: Call) => (
        <Tag
          color={r.direction === 'outgoing' ? 'blue' : 'green'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            width: 'fit-content',
          }}
        >
          {r.direction === 'outgoing' ? (
            <PhoneOutgoing size={12} />
          ) : (
            <PhoneIncoming size={12} />
          )}
          {r.direction}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s}</Tag>,
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, r: Call) => (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: '#555',
          }}
        >
          <Clock size={13} /> {fmt(r.duration)}
        </span>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_: any, r: Call) => (
        <span style={{ fontSize: 13, width: '10%' }}>
          {fmtDate(r.startedAt)}
        </span>
      ),
    },
    {
      title: 'Recording',
      key: 'recording',
      render: (_: any, r: Call) =>
        r.recordingUrl ? (
          <AudioPlayer
            url={`${BASEURL}/api/call/recording?url=${encodeURIComponent(
              r.recordingUrl
            )}`}
          />
        ) : (
          <span style={{ color: '#ccc' }}>—</span>
        ),
    },
  ];

  return (
    <div style={{ padding: 5 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            title: 'Total Calls',
            value: statsSummary.totalCalls,
            icon: <Phone size={20} />,
            color: '#1677ff',
          },
          {
            title: 'Completed',
            value: statsSummary.completed,
            icon: <TrendingUp size={20} />,
            color: '#52c41a',
          },
          {
            title: 'Total Duration',
            value: fmt(statsSummary.totalDuration),
            icon: <Clock size={20} />,
            color: '#13c2c2',
          },
          // {
          //   title: 'Agents',
          //   value: statsSummary.agents,
          //   icon: <Users size={20} />,
          //   color: '#faad14',
          // },
        ].map((s, i) => (
          <Col xs={12} md={6} key={i}>
            <Card
              bordered={false}
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    background: `${s.color}18`,
                    color: s.color,
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                  }}
                >
                  {s.icon}
                </div>
                <Statistic
                  title={s.title}
                  value={s.value}
                  valueStyle={{ fontSize: 22, fontWeight: 700 }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        bordered={false}
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
        title={<span style={{ fontWeight: 700 }}>Call Logs</span>}
      >
        <ListingTable listingTitle={isRecordingPage ? 'Recordings' : 'Call Logs'} fields={LISTING_FIELDS.calls} filterKeys={['status']} serverSide searchPlaceholder="Search exact Call SID" onFiltersChange={(search, filters) => { setListingSearch(search); setListingFilters(filters); setTablePage(1); }} loadExportRows={async () => {
          const rows: Call[] = [];
          let page = 1;
          while (true) {
            const query = { ...Object.fromEntries(searchParams), ...(isRecordingPage ? { onlyRecording: true } : {}), ...(listingSearch ? { callSid: listingSearch.trim() } : {}), ...(listingFilters.status ? { status: listingFilters.status } : {}), page, limit: 100 };
            const res = await getCallHistoryApi(query);
            if (!res.data?.success) throw new Error('Unable to load call records for export');
            const batch: Call[] = res.data.data.calls ?? [];
            rows.push(...batch);
            const totalPages = res.data.data.pagination?.pages;
            if ((totalPages != null && page >= totalPages) || !batch.length || (totalPages == null && batch.length < 100)) break;
            page += 1;
          }
          return rows;
        }}
          dataSource={calls}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              setTablePage(page);
              if (pageSize !== tableLimit) {
                setTableLimit(pageSize);
                setTablePage(1);
              }
            },
          }}
          scroll={{ x: 1000 }}
          rowHoverable={false}
        />
      </Card>
    </div>
  );
};

export default CallLogs;
