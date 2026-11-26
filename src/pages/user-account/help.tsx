import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { FileImage, LifeBuoy, Plus, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import apiClient, { apiRequest } from 'src/services/api/apiClient';
import './support.css';

type Ticket = { _id: string; module: string; subject: string; description: string; status: 'open' | 'in_progress' | 'resolved'; hasScreenshot: boolean; createdAt: string; createdBy?: { Id?: string; name?: string; firstName?: string; lastName?: string } };
type TicketResponse = { success: boolean; data: { items: Ticket[]; canManage: boolean; pagination: { total: number } } };
const statuses = [{ value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In progress' }, { value: 'resolved', label: 'Resolved' }];
const statusColors: Record<string, string> = { open: 'blue', in_progress: 'orange', resolved: 'green' };
const guides = [
  { title: 'Leads & pipeline', description: 'Review leads, filter your pipeline and follow up on opportunities.', path: '/crm/leads' },
  { title: 'Customers', description: 'Find customers and review their contact details.', path: '/crm/customers' },
  { title: 'Attendance', description: 'Check attendance by date, status or department.', path: '/hrms/employeee/attendance' },
  { title: 'Leave', description: 'Review leave requests and their approval status.', path: '/hrms/employeee/leave' },
];

export const UserProfileHelpPage = () => {
  const [admin, setAdmin] = useState(false);
  const [form] = Form.useForm();
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [view, setView] = useState('mine');
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [updating, setUpdating] = useState(false);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true); setError('');
    try {
      const response = await apiRequest.get<TicketResponse>('/support', { params: { view, status, page, limit: 10 } });
      if (!response.success || !Array.isArray(response.data?.items)) throw new Error('Invalid support response');
      if (request !== requestId.current) return;
      setTickets(response.data.items); setTotal(response.data.pagination.total); setAdmin(response.data.canManage === true);
      if (page > 1 && response.data.items.length === 0) setPage(page - 1);
    } catch (err: any) {
      if (request !== requestId.current) return;
      setError(err?.response?.data?.message || 'Unable to load support requests. Check your connection and try again.');
    } finally { if (request === requestId.current) setLoading(false); }
  }, [view, status, page]);
  useEffect(() => { void load(); return () => { requestId.current++; }; }, [load]);
  const submit = async () => {
    try {
      const values = await form.validateFields();
      const body = new FormData();
      body.append('module', values.module); body.append('subject', values.subject); body.append('description', values.description);
      if (file) body.append('screenshot', file);
      setSaving(true);
      const result = await apiRequest.post<{ success: boolean; message: string }>('/support', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!result.success) throw new Error(result.message || 'Unable to submit request');
      message.success('Support request submitted'); setDialog(false); setFile(null); form.resetFields();
      if (view !== 'mine' || page !== 1 || status) { setView('mine'); setPage(1); setStatus(undefined); } else await load();
    } catch (err: any) {
      if (!err?.errorFields) message.error(err?.response?.data?.message || err?.message || 'Unable to submit request');
    } finally { setSaving(false); }
  };
  const updateStatus = async (ticket: Ticket, next: string) => {
    setUpdating(true);
    try {
      const result = await apiRequest.patch<{ success: boolean; message: string }>(`/support/${ticket._id}/status`, { status: next });
      if (!result.success) throw new Error(result.message);
      message.success('Status updated'); setSelected(null); await load();
    } catch (err: any) { message.error(err?.response?.data?.message || err?.message || 'Unable to update status'); }
    finally { setUpdating(false); }
  };
  const downloadScreenshot = async (ticket: Ticket) => {
    try {
      const response = await apiClient.get(`/support/${ticket._id}/screenshot`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a');
      link.href = url; link.download = `support-${ticket._id}.${response.data.type === 'image/png' ? 'png' : 'jpg'}`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { message.error('Unable to download screenshot'); }
  };
  return <div className="module-page support-page">
    <div className="support-header"><div><div className="support-eyebrow">HELP CENTRE</div><Typography.Title level={2}>Support</Typography.Title><Typography.Paragraph type="secondary">Find your way around the workspace or report an issue to your administrator.</Typography.Paragraph></div><Button type="primary" icon={<Plus size={16} />} onClick={() => setDialog(true)}>Report an issue</Button></div>
    <Row gutter={[16, 16]}><Col xs={24} xl={16}><Card className="support-card" title={<Space><LifeBuoy size={18} /> Support requests</Space>} extra={<Button icon={<RefreshCw size={15} />} onClick={() => void load()} loading={loading}>Refresh</Button>}>
      <div className="support-toolbar"><Typography.Text type="secondary">Track submitted issues and their current status.</Typography.Text><Space wrap>{admin && <Select aria-label="Request scope" value={view} style={{ width: 150 }} options={[{ value: 'mine', label: 'My requests' }, { value: 'all', label: 'All requests' }]} onChange={value => { setPage(1); setView(value); }} />}<Select aria-label="Filter request status" allowClear placeholder="All statuses" style={{ width: 150 }} value={status} options={statuses} onChange={value => { setPage(1); setStatus(value); }} /></Space></div>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Table<Ticket> rowKey="_id" dataSource={tickets} loading={loading} scroll={{ x: 580 }} size="middle" pagination={{ current: page, pageSize: 10, total, onChange: setPage, showSizeChanger: false }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error ? 'Requests unavailable' : 'No support requests found'} /> }} columns={[
        { title: 'Subject', dataIndex: 'subject', render: (value: string, row) => <Button type="link" style={{ padding: 0, height: 'auto', whiteSpace: 'normal', textAlign: 'left' }} onClick={() => setSelected(row)}>{value}</Button> },
        { title: 'Module', dataIndex: 'module' },
        ...(admin && view === 'all' ? [{ title: 'Reported by', render: (_: unknown, row: Ticket) => row.createdBy?.name || [row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(' ') || '—' }] : []),
        { title: 'Status', dataIndex: 'status', render: (value: string) => <Tag color={statusColors[value]}>{statuses.find(item => item.value === value)?.label || value}</Tag> },
        { title: 'Submitted', dataIndex: 'createdAt', render: (value: string) => dayjs(value).format('DD MMM YYYY') },
      ]} />
    </Card></Col><Col xs={24} xl={8}><Card className="support-card" title="Quick guidance"><Typography.Paragraph type="secondary">Open the relevant section to view and manage your records.</Typography.Paragraph><div className="support-guides">{guides.map(guide => <Link key={guide.title} to={guide.path}><strong>{guide.title} →</strong><span>{guide.description}</span></Link>)}</div><div className="support-contact"><Typography.Text strong>Need more help?</Typography.Text><br /><Typography.Text type="secondary">Submit a request above. An administrator can review and update its status.</Typography.Text></div></Card></Col></Row>
    <Modal title="Report an issue" open={dialog} onCancel={() => { if (!saving) setDialog(false); }} onOk={() => void submit()} okText="Submit request" confirmLoading={saving} maskClosable={!saving}>
      <Form form={form} layout="vertical" requiredMark="optional"><Form.Item name="module" label="Module" rules={[{ required: true, message: 'Select a module' }]}><Select placeholder="Choose a module" options={['Dashboard', 'Leads', 'Customers', 'Attendance', 'Leave', 'Payroll', 'Staff', 'Other'].map(value => ({ value, label: value }))} /></Form.Item><Form.Item name="subject" label="Subject" rules={[{ required: true, whitespace: true, message: 'Enter a subject' }, { max: 160 }]}><Input placeholder="Briefly describe the issue" maxLength={160} /></Form.Item><Form.Item name="description" label="Description" rules={[{ required: true, whitespace: true, message: 'Describe the issue' }, { max: 5000 }]}><Input.TextArea rows={5} maxLength={5000} showCount placeholder="What happened? Include the steps and any error message." /></Form.Item><Form.Item label="Screenshot (optional)" extra="PNG or JPEG, up to 2 MB."><Upload accept="image/png,image/jpeg" maxCount={1} fileList={file ? [{ uid: 'screenshot', name: file.name, status: 'done' } as UploadFile] : []} beforeUpload={selectedFile => { if (!['image/png', 'image/jpeg'].includes(selectedFile.type) || selectedFile.size > 2 * 1024 * 1024) { message.error('Choose a PNG or JPEG up to 2 MB'); return Upload.LIST_IGNORE; } setFile(selectedFile); return false; }} onRemove={() => { setFile(null); }}><Button icon={<FileImage size={15} />}>Choose screenshot</Button></Upload></Form.Item></Form>
    </Modal>
    <Modal title="Support request" open={!!selected} onCancel={() => setSelected(null)} footer={<Button onClick={() => setSelected(null)}>Close</Button>}>{selected && <Space direction="vertical" size={14} style={{ width: '100%' }}><div><Typography.Text type="secondary">Subject</Typography.Text><br /><Typography.Text strong>{selected.subject}</Typography.Text></div><div><Typography.Text type="secondary">Module</Typography.Text><br />{selected.module}</div><div><Typography.Text type="secondary">Description</Typography.Text><div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{selected.description}</div></div><div><Typography.Text type="secondary">Status</Typography.Text><br />{admin ? <Select value={selected.status} options={statuses} loading={updating} disabled={updating} style={{ width: 180 }} onChange={value => void updateStatus(selected, value)} /> : <Tag color={statusColors[selected.status]}>{statuses.find(item => item.value === selected.status)?.label}</Tag>}</div>{selected.hasScreenshot && <Button icon={<FileImage size={15} />} onClick={() => void downloadScreenshot(selected)}>Download screenshot</Button>}</Space>}</Modal>
  </div>;
};
