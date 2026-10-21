import { ArrowLeft as ArrowLeftOutlined, Plus as PlusOutlined, Upload as UploadOutlined } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Input,
  Progress,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Upload,
} from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationOutlined, MailOutlined, MessageOutlined, FileOutlined, PaperClipOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import taskService from '../../services/taskService';
import activityLogservices from '../../services/activityService';
import { getAttachmentUrl } from '../../utils/convertor';

const { Title, Text, Paragraph } = Typography;

type TabKey = 'overview' | 'activity' | 'followers';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 0, maxWidth: 1400, margin: '0 auto' },
  breadcrumbs: { marginBottom: 10, color: '#64748b', fontSize: 14 },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleWrap: { minWidth: 0 },
  actionWrap: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  chips: {
    marginTop: 14,
    marginBottom: 14,
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },

  tabRow: {
    display: 'flex',
    gap: 28,
    borderBottom: '1px solid #e2e8f0',
    marginBottom: 20,
  },
  activeTab: {
    padding: '10px 0',
    color: '#1d4ed8',
    borderBottom: '2px solid #1d4ed8',
    fontWeight: 700,
    cursor: 'pointer',
  },
  tab: {
    padding: '10px 0',
    color: '#64748b',
    fontWeight: 600,
    cursor: 'pointer',
  },

  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 20,
    alignItems: 'start',
  },
  contentGridMobile: { gridTemplateColumns: '1fr' },
  sectionCard: { borderRadius: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 700 },
  sectionBody: { padding: 20 },

  attachmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  attachmentTile: {
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#fff',
  },
  attachmentPreview: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
    display: 'block',
    background: '#f1f5f9',
  },
  attachmentName: {
    padding: '8px 10px',
    fontSize: 13,
    borderTop: '1px solid #eef2f7',
  },

  rightStack: { display: 'grid', gap: 16 },
  relatedBox: {
    background: '#f8fafc',
    border: '1px solid #eef2f7',
    borderRadius: 10,
    padding: 12,
  },
  timelineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  composerWrap: {
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    background: '#fff',
  },
  composerInput: {
    border: 'none',
    boxShadow: 'none',
    padding: 0,
    fontSize: 14,
  },
  composerFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #eef2f7',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timelineWrap: { position: 'relative', paddingLeft: 2 },
  timelineLine: {
    position: 'absolute',
    left: 13,
    top: 6,
    bottom: 0,
    width: 2,
    background: '#e2e8f0',
  },
  activityItem: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
    zIndex: 1,
  },
  activityContent: { minWidth: 0, width: '100%' },
  activityHeader: { display: 'flex', justifyContent: 'space-between', gap: 10 },
  activityBubble: {
    marginTop: 8,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 12px',
  },
};

const SingleTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { getById, updateTask, addAttachement } = taskService();
  const { getactivityLogs, creatactivityLogs: createActivity } =
    activityLogservices();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = (await getById(taskId)) as any;
        if (res.success) setTask(res.data);

        const actRes = (await getactivityLogs({ taskId })) as any;
        if (actRes.success) setActivity(actRes.data);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddComment = async () => {
    if (!comment.trim() || !taskId) return;

    setSubmitting(true);
    try {
      const res = (await createActivity({
        content: comment,
        taskId,
        leadId: task?.relatedTo?.id?._id,
      })) as any;

      if (res.success) {
        message.success('Comment added');
        setComment('');

        const refreshRes = (await getactivityLogs({ taskId })) as any;
        if (refreshRes.success) setActivity(refreshRes.data);
      }
    } catch (error) {
      message.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      const updatedTags = [...(task.tags || []), newTag.trim()];
      const res = (await updateTask(taskId, { tags: updatedTags })) as any;

      if (res.success) {
        message.success('Tag added');
        setTask({ ...task, tags: updatedTags });
        setNewTag('');
        setTagModalOpen(false);
      }
    } catch (error) {
      message.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const updatedTags = task.tags.filter((t: string) => t !== tagToRemove);
      const res = (await updateTask(taskId, { tags: updatedTags })) as any;

      if (res.success) {
        message.success('Tag removed');
        setTask({ ...task, tags: updatedTags });
      }
    } catch (error) {
      message.error('Failed to remove tag');
    }
  };

  const handleUploadAttachment = async () => {
    if (fileList.length === 0) return;

    try {
      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append('taskAttachments', file.originFileObj);
      });

      const res = await addAttachement(taskId, formData);

      if (res.success) {
        message.success('Attachment uploaded');
        setTask({ ...task, attachments: res.data.attachments });
        setFileList([]);
        setAttachModalOpen(false);
      }
    } catch (error) {
      message.error('Failed to upload attachment');
    }
  };

  const priorityColors: Record<string, string> = {
    Low: 'blue',
    Medium: 'orange',
    High: 'red',
    Urgent: 'magenta',
  };

  const statusColors: Record<string, string> = {
    notStarted: 'default',
    inProgress: 'processing',
    testing: 'warning',
    awaitingFeedback: 'orange',
    completed: 'success',
  };

  const isMobile = window.innerWidth < 992;

  const formatFileSize = (size?: number) => {
    if (!size && size !== 0) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatStatusLabel = (value?: string) => {
    if (!value) return 'Unknown';
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (m) => m.toUpperCase());
  };

  const timelinePercent = useMemo(() => {
    if (!task?.startDate || !task?.dueDate) return 0;
    const start = new Date(task.startDate).getTime();
    const end = new Date(task.dueDate).getTime();
    const now = Date.now();
    if (!start || !end || end <= start) return 0;
    const value = ((now - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, Math.round(value)));
  }, [task?.startDate, task?.dueDate]);

  const getActivityMeta = (item: any) => {
    const content = (item?.content || '').toLowerCase();
    const user = `${item.createdBy?.firstName || 'User'} ${
      item.createdBy?.lastName || ''
    }`.trim();

    if (content.includes('status')) {
      return {
        title: `${user} changed status`,
        color: '#dbeafe',
        iconColor: '#2563eb',
        icon: <ClockCircleOutlined />,
      };
    }

    if (content.includes('priority')) {
      return {
        title: `${user} updated priority`,
        color: '#fee2e2',
        iconColor: '#dc2626',
        icon: <ExclamationOutlined />,
      };
    }

    if (content.includes('attach') || content.includes('file')) {
      return {
        title: `${user} attached a file`,
        color: '#e0f2fe',
        iconColor: '#0284c7',
        icon: <PaperClipOutlined />,
      };
    }

    return {
      title: `${user} commented`,
      color: '#dcfce7',
      iconColor: '#166534',
      icon: <MessageOutlined />,
    };
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: 'Activity' },
    { key: 'followers', label: 'Followers' },
  ];

  const renderOverview = () => (
    <div
      style={{
        ...styles.contentGrid,
        ...(isMobile ? styles.contentGridMobile : {}),
      }}
    >
      <div>
        <Card
          title="Description"
          style={{ ...styles.sectionCard, marginBottom: 16 }}
          headStyle={styles.sectionTitle}
          bodyStyle={styles.sectionBody}
        >
          <Paragraph style={{ margin: 0 }}>
            {task.description || 'No description provided'}
          </Paragraph>
        </Card>

        <Card
          title={`Attachments (${task.attachments?.length || 0})`}
          extra={
            <Button
              type="link"
              icon={<PlusOutlined />}
              style={{ paddingRight: 0 }}
              onClick={() => setAttachModalOpen(true)}
            >
              Add New
            </Button>
          }
          style={{ ...styles.sectionCard, marginBottom: 16 }}
          headStyle={styles.sectionTitle}
          bodyStyle={styles.sectionBody}
        >
          {task.attachments?.length ? (
            <div style={styles.attachmentGrid}>
              {task.attachments.map((file: any, index: number) => {
                const fileUrl = getAttachmentUrl(file?.url);
                const isImage = (file?.mimeType || '').startsWith('image/');
                return (
                  <a
                    key={`${file?.url || file?.name || 'file'}-${index}`}
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={styles.attachmentTile}>
                      {isImage ? (
                        <img
                          src={fileUrl}
                          alt={file?.name || 'attachment'}
                          style={styles.attachmentPreview}
                        />
                      ) : (
                        <div
                          style={{
                            ...styles.attachmentPreview,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FileOutlined
                            style={{ fontSize: 24, color: '#64748b' }}
                          />
                        </div>
                      )}
                      <div style={styles.attachmentName}>
                        <Text
                          ellipsis={{ tooltip: file?.name || 'Attachment' }}
                          style={{ maxWidth: 140, display: 'block' }}
                        >
                          {file?.name || 'Attachment'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatFileSize(file?.size)}
                        </Text>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <Text type="secondary">No attachments found</Text>
          )}
        </Card>

        <Card
          title="Tags"
          style={styles.sectionCard}
          headStyle={styles.sectionTitle}
          bodyStyle={styles.sectionBody}
        >
          <Space wrap>
            {task.tags?.length ? (
              task.tags.map((tag: string, idx: number) => (
                <Tag key={idx} closable onClose={() => handleRemoveTag(tag)}>
                  {tag}
                </Tag>
              ))
            ) : (
              <Text type="secondary">No tags</Text>
            )}
            <Tag
              icon={<PlusOutlined />}
              style={{ borderStyle: 'dashed', cursor: 'pointer' }}
              onClick={() => setTagModalOpen(true)}
            >
              Add Tag
            </Tag>
          </Space>
        </Card>
      </div>

      <div style={styles.rightStack}>
        <Card
          title="Assignee"
          style={styles.sectionCard}
          headStyle={styles.sectionTitle}
          bodyStyle={styles.sectionBody}
        >
          <Space align="start">
            <Avatar icon={<UserOutlined />} style={{ background: '#1d4ed8' }}>
              {task.assignee?.firstName?.[0]}
            </Avatar>
            <div>
              <Text strong>
                {task.assignee?.firstName} {task.assignee?.lastName}
              </Text>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {task.assignee?.email}
                </Text>
              </div>
            </div>
          </Space>
        </Card>

        <Card
          title="Related To"
          style={styles.sectionCard}
          headStyle={styles.sectionTitle}
          bodyStyle={styles.sectionBody}
        >
          <div style={styles.relatedBox}>
            <Space align="start">
              <Avatar
                icon={<UserOutlined />}
                size="small"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}
              />
              <div style={{ minWidth: 0 }}>
                <Text strong>{task.relatedTo?.id?.name || '-'}</Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {task.relatedTo?.id?.position || '—'}
                  </Text>
                </div>
                <div style={{ marginTop: 4 }}>
                  <MailOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {task.relatedTo?.id?.email || '-'}
                  </Text>
                </div>
                <Space size={6} style={{ marginTop: 8 }}>
                  {task.relatedTo?.id?.status && (
                    <Tag color="success">{task.relatedTo.id.status}</Tag>
                  )}
                  {task.relatedTo?.id?.source && (
                    <Tag>{task.relatedTo.id.source}</Tag>
                  )}
                </Space>
              </div>
            </Space>
          </div>
          <Button
            onClick={() =>
              navigate(
                `/crm/leads?lead=${task.relatedTo.id.name}&id=${task.relatedTo.id._id}`
              )
            }
            type="default"
            style={{ marginTop: 12, width: '100%' }}
          >
            View Full Lead Detail
          </Button>
        </Card>

        <Card
          title="Timelines"
          style={styles.sectionCard}
          headStyle={styles.sectionTitle}
          bodyStyle={styles.sectionBody}
        >
          <div style={styles.timelineRow}>
            <Text type="secondary">Start Date</Text>
            <Text strong>
              {task.startDate
                ? new Date(task.startDate).toLocaleDateString()
                : 'Not set'}
            </Text>
          </div>
          <div style={styles.timelineRow}>
            <Text type="secondary">Due Date</Text>
            <Text strong>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : 'Not set'}
            </Text>
          </div>
          <Progress
            percent={timelinePercent}
            showInfo={false}
            strokeColor="#1d4ed8"
          />
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {timelinePercent}% through timeline
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderActivity = () => (
    <Card
      title="Activity Timeline"
      style={styles.sectionCard}
      headStyle={styles.sectionTitle}
      bodyStyle={styles.sectionBody}
    >
      <div style={styles.composerWrap}>
        <Space align="start" style={{ width: '100%' }}>
          <Avatar icon={<UserOutlined />} />
          <div style={{ width: '100%' }}>
            <Input.TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment or update task status..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={styles.composerInput}
              bordered={false}
            />
          </div>
        </Space>
        <div style={styles.composerFooter}>
          <Space size={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              B
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: 12, fontStyle: 'italic' }}
            >
              I
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              @
            </Text>
          </Space>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAddComment}
            loading={submitting}
            disabled={!comment.trim()}
          >
            Post Activity
          </Button>
        </div>
      </div>

      {activity.length === 0 ? (
        <Text type="secondary">No activity yet.</Text>
      ) : (
        <div style={styles.timelineWrap}>
          <div style={styles.timelineLine} />
          {activity.map((item: any, idx: number) => {
            const meta = getActivityMeta(item);
            return (
              <div key={item._id || idx} style={styles.activityItem}>
                <div
                  style={{
                    ...styles.activityDot,
                    background: meta.color,
                    color: meta.iconColor,
                  }}
                >
                  {meta.icon}
                </div>
                <div style={styles.activityContent}>
                  <div style={styles.activityHeader}>
                    <Text strong>{meta.title}</Text>
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </div>
                  <div style={styles.activityBubble}>
                    <Text style={{ color: '#334155' }}>{item.content}</Text>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const renderFollowers = () => {
    const followers = Array.isArray(task?.followers) ? task.followers : [];

    return (
      <Card
        title={`Followers (${followers.length})`}
        style={styles.sectionCard}
        headStyle={styles.sectionTitle}
        bodyStyle={styles.sectionBody}
      >
        {followers.length === 0 ? (
          <Text type="secondary">No followers added.</Text>
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {followers.map((follower: any, index: number) => (
              <div
                key={follower?._id || index}
                style={{ display: 'flex', gap: 12, alignItems: 'center' }}
              >
                <Avatar icon={<UserOutlined />} />
                <div>
                  <Text strong>
                    {follower?.firstName || ''} {follower?.lastName || ''}
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {follower?.email || follower?._id || 'Follower'}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </Space>
        )}
      </Card>
    );
  };

  const markComplete = async () => {
    const res = (await updateTask(taskId, { status: 'completed' })) as any;
    if (res.success) {
      message.success('Task Completed Successfully');
      const res = (await getById(taskId)) as any;
      if (res.success) setTask(res.data);
    } else {
      message.error('Something went wrong');
    }
  };

  return (
    <div style={styles.page}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 12 }}
      >
        Back
      </Button>

      <Modal
        title="Add Tag"
        open={tagModalOpen}
        onOk={handleAddTag}
        onCancel={() => {
          setTagModalOpen(false);
          setNewTag('');
        }}
        okText="Add"
      >
        <Input
          placeholder="Enter tag name"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onPressEnter={handleAddTag}
        />
      </Modal>

      <Modal
        title="Upload Attachment"
        open={attachModalOpen}
        onOk={handleUploadAttachment}
        onCancel={() => {
          setAttachModalOpen(false);
          setFileList([]);
        }}
        okText="Upload"
      >
        <Upload
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          beforeUpload={() => false}
          multiple
        >
          <Button icon={<UploadOutlined />}>Select Files</Button>
        </Upload>
      </Modal>

      <Card loading={loading} bordered={false} style={styles.sectionCard}>
        {!task ? null : (
          <>
            <div style={styles.breadcrumbs}>
              CRM {'>'} Tasks {'>'} Task Detail
            </div>

            <div style={styles.topRow}>
              <div style={styles.titleWrap}>
                <Title
                  level={2}
                  style={{
                    margin: 0,
                    fontSize: 46,
                    lineHeight: 1.08,
                    fontWeight: 800,
                  }}
                >
                  {task.subject}
                </Title>
                <Text type="secondary">Task ID: {task._id}</Text>
              </div>

              <div style={styles.actionWrap}>
                <Button
                  onClick={markComplete}
                  disabled={task.status == 'completed'}
                  type="primary"
                  icon={<CheckCircleOutlined />}
                >
                  Mark Complete
                </Button>
                {/* <Button icon={<EyeOutlined />}>Edit Task</Button> */}
              </div>
            </div>

            <div style={styles.chips}>
              <Tag
                color={statusColors[task.status] ?? 'default'}
                style={{ padding: '6px 12px', borderRadius: 999 }}
              >
                Status: {formatStatusLabel(task.status)}
              </Tag>
              <Tag
                color={priorityColors[task.priority] ?? 'default'}
                style={{ padding: '6px 12px', borderRadius: 999 }}
              >
                Priority: {task.priority}
              </Tag>
              <Tag
                icon={<CalendarOutlined />}
                style={{ padding: '6px 12px', borderRadius: 999 }}
              >
                Due:{' '}
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : 'Not set'}
              </Tag>
            </div>

            <div style={styles.tabRow}>
              {tabs.map((tab) => (
                <span
                  key={tab.key}
                  style={activeTab === tab.key ? styles.activeTab : styles.tab}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </span>
              ))}
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'activity' && renderActivity()}
            {activeTab === 'followers' && renderFollowers()}
          </>
        )}
      </Card>
    </div>
  );
};

export default SingleTask;
