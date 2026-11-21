import { useEffect, useState } from 'react';
import { Alert, Button, Empty, Space, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import apiClient from 'src/services/api/apiClient';

interface LoginLog {
  _id: string;
  loginTime: string;
  logoutTime?: string | null;
  isLoggedIn: boolean;
  device?: Record<string, any> | string;
  logoutDevice?: Record<string, any> | string;
  location?: Record<string, any>;
  logoutLocation?: Record<string, any>;
  logoutReason?: string;
}

const deviceLabel = (device?: LoginLog['device']) => {
  if (!device) return 'Unavailable';
  if (typeof device === 'string') return device;
  return [device.deviceName || [device.brand, device.model].filter(Boolean).join(' '),
    [device.systemName, device.systemVersion].filter(Boolean).join(' '),
    device.uniqueId ? `ID: ${device.uniqueId}` : ''].filter(Boolean).join(' · ') || 'Unavailable';
};

export const LocationLabel = ({ location }: { location?: LoginLog['location'] }) => {
  if (!location) return <>Unavailable</>;
  const lat = location.latitude ?? location.lat;
  const lng = location.longitude ?? location.lng;
  const hasCoordinates = lat != null && lng != null;
  const label = location.displayAddress || location.address || (hasCoordinates ? `${lat}, ${lng}` : 'Unavailable');
  return hasCoordinates ? <a href={`https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`} target="_blank" rel="noreferrer">{label}</a> : <>{label}</>;
};

const LoginHistory = ({ userId }: { userId: string }) => {
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => { setPage(1); }, [userId]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setLogs([]);
    apiClient.get('/auth/login-logs', { params: { userId, page, limit: 20 } })
      .then(({ data }) => {
        if (!current) return;
        setLogs(data.data.logs);
        setPages(data.data.pagination.pages);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [userId, page]);

  if (loading) return <Spin />;
  if (error) return <Alert type="error" showIcon message="Unable to load login history" />;
  if (!logs.length) return <Empty description="No login history found" />;
  return <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    {logs.map((log) => <div key={log._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, fontSize: 12, overflowWrap: 'anywhere' }}>
      <Space><strong>Login</strong><Tag color={log.isLoggedIn ? 'success' : 'default'}>{log.isLoggedIn ? 'Active' : 'Ended'}</Tag></Space>
      <div>{dayjs(log.loginTime).format('DD MMM YYYY, hh:mm:ss A')}</div>
      <div>Location: <LocationLabel location={log.location} /></div>
      <div>Device: {deviceLabel(log.device)}</div>
      <div style={{ marginTop: 8 }}><strong>Logout</strong></div>
      <div>{log.logoutTime ? dayjs(log.logoutTime).format('DD MMM YYYY, hh:mm:ss A') : 'Not recorded'}</div>
      <div>Location: <LocationLabel location={log.logoutLocation} /></div>
      <div>Device: {deviceLabel(log.logoutDevice)}</div>
      {log.logoutReason && <div>Reason: {log.logoutReason.replace(/_/g, ' ')}</div>}
    </div>)}
    <Space><Button size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pages}</span><Button size="small" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></Space>
  </Space>;
};

export default LoginHistory;
