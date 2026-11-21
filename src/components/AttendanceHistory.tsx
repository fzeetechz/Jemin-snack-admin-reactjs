import { useEffect, useState } from 'react';
import { Alert, Button, Empty, Space, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import apiClient from 'src/services/api/apiClient';
import { LocationLabel } from './LoginHistory';

interface AttendanceRecord {
  _id: string;
  date: string;
  status?: string;
  checkIn?: { time?: string; location?: { lat?: number; lng?: number; address?: string } };
  checkOut?: { time?: string; location?: { lat?: number; lng?: number; address?: string } };
  checkOutIsAutomatic?: boolean;
  biometricDeviceId?: string;
}

const AttendanceHistory = ({ userId }: { userId: string }) => {
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    apiClient.get('/attendance', { params: { employeeId: userId, page, limit: 20 } })
      .then(({ data }) => {
        if (!current) return;
        setRecords(data.data.items);
        setPages(data.data.pagination.pages);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [userId, page]);

  if (loading) return <Spin />;
  if (error) return <Alert type="error" showIcon message="Unable to load attendance history" />;
  if (!records.length) return <Empty description="No attendance records found" />;
  return <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    {records.map((record) => <div key={record._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, fontSize: 12, overflowWrap: 'anywhere' }}>
      <Space><strong>{dayjs(record.date).format('DD MMM YYYY')}</strong>{record.status && <Tag>{record.status.replace(/_/g, ' ')}</Tag>}</Space>
      <div style={{ marginTop: 8 }}><strong>Clock in</strong></div>
      <div>{record.checkIn?.time ? dayjs(record.checkIn.time).format('DD MMM YYYY, hh:mm:ss A') : 'Not recorded'}</div>
      <div>Location: <LocationLabel location={record.checkIn?.location} /></div>
      <div style={{ marginTop: 8 }}><strong>Clock out</strong> {record.checkOutIsAutomatic && <Tag color="orange">Automatic</Tag>}</div>
      <div>{record.checkOut?.time ? dayjs(record.checkOut.time).format('DD MMM YYYY, hh:mm:ss A') : 'Not recorded'}</div>
      <div>Location: <LocationLabel location={record.checkOut?.location} /></div>
      {record.biometricDeviceId && <div>Biometric device: {record.biometricDeviceId}</div>}
    </div>)}
    <Space><Button size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pages}</span><Button size="small" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></Space>
  </Space>;
};

export default AttendanceHistory;
