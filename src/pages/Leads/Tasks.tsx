import { Plus as PlusOutlined, PencilLine as EditOutlined, Trash2 as DeleteOutlined, Eye as EyeOutlined, Upload as UploadOutlined } from 'lucide-react';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS, listingImport } from 'src/components/shared/listing/listing-presets';
import {
  Card,
  Button,
  Tag,
  Space,
  Dropdown,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Switch,
  InputNumber,
  Upload,
} from 'antd';
import { useState, useEffect } from 'react';
import { useAuth, usePermissions } from '../../hooks/index';
import RelatedToList from '../../assets/jsons/related.json';
import leadServices from '../../services/leadServices';
import configService from '../../services/configService';
import { apiRequest } from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../services/api/endpoints';
import { MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import staffService from '../../services/staffService';
import taskService from '../../services/taskService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface Task {
  _id: string;
  subject: string;
  assignee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  relatedTo: {
    type: string;
    id: string;
  };
  dueDate: string;
  priority: string;
  status: string;
  description?: string;
  createdAt: string;
}

const Tasks = ({ lead }: { lead?: any }) => {
  const { isLoading } = useAuth();
  const { canCreate, canRead, canDelete, canUpdate } = usePermissions();
  const {
    createTask,
    getByLeadId,
    getTasksList,
    deleteTasks,
    updateTask,
    addAttachement,
  } = taskService();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [staff, setStaffs] = useState([]);
  const [relatedType, setRelatedType] = useState<string>('Lead');
  const [leads, setLeads] = useState([]);
  const [searchLeadText, setSearchLeadText] = useState('');
  const navigate = useNavigate();
  const [taskStatus, setTaskStatus] = useState<any>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { getStaff } = staffService();
  const { getLeads } = leadServices();
  const { getConfig } = configService();

  const fetchLeads = async () => {
    try {
      const response = (await getLeads()) as any;
      if (response.success) {
        setLeads(response.data.items || response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = (await getStaff()) as any;
        setStaffs(response.data.items);
        const data = response.data.items;
        if (data.length) {
          setStaffs(
            data.map((item: any) => ({
              value: item._id,
              label: `${item.firstName} ${item.lastName}`,
            }))
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    getConfig('taskStatus').then((res: any) => {
      console.log(res.data);
      setTaskStatus(res.data);
    });
    fetchStaff();

    fetchLeads();
  }, []);
  useEffect(() => {
    fetchTasks();
  }, [lead]);

  const fetchTasks = async () => {
    if (lead) {
      const res: any = await getByLeadId(lead._id);
      if (res.success) setTasks(res.data);
    } else {
      const params: any = {};

      const res: any = await getTasksList(params);
      if (res.success) setTasks(res.data);
    }
  };
  console.log(staff);

  const priorityColors: Record<string, string> = {
    Low: 'blue',
    Medium: 'orange',
    High: 'red',
    Urgent: 'purple',
  };

  console.log(taskStatus);
  const columns: ColumnsType<Task> = [
    {
      title: 'Related To',
      dataIndex: 'relatedTo',
      key: 'relatedTo',
      width: 200,
      render: (relatedTo) => (
        <div>
          <Tag color="cyan" style={{ marginBottom: 4 }}>
            {relatedTo?.type || '-'}
          </Tag>
          {relatedTo?.id && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <div style={{ fontWeight: 500 }}>{relatedTo.id.name}</div>
              {relatedTo.id.email && <div>{relatedTo.id.email}</div>}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      width: 250,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 180,
      render: (assignee) =>
        assignee ? (
          <Tag color="blue" style={{ padding: '4px 10px' }}>
            {assignee.firstName} {assignee.lastName}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => (
        <Tag color={priorityColors[priority]}>{priority}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 150 }}
          onChange={(value) => handleStatusChange(record._id, value)}
          size="small"
          disabled={!canUpdate('tasks')}
        >
          {taskStatus?.value?.map((stat: any) => (
            <Select.Option key={stat.value} value={stat.value}>
              <Tag color={stat.color}>{stat.label}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      // fixed: 'right',
      render: (_, record) => {
        const items = [];

        if (canRead('tasks')) {
          items.push({
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View',
            onClick: () => handleView(record),
          });
        }

        if (canUpdate('tasks')) {
          items.push({
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEdit(record),
          });
        }

        if (canDelete('tasks')) {
          if (items.length > 0) {
            items.push({
              type: 'divider',
            });
          }
          items.push({
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDelete(record._id),
          });
        }

        return (
          <Dropdown
            menu={{ items: items as any }}
            trigger={['click']}
            disabled={items.length === 0}
          >
            <Button icon={<MoreOutlined />} aria-label="Task actions">Actions</Button>
          </Dropdown>
        );
      },
    },
  ];

  const handleView = (record: Task) => {
    navigate(`/crm/activities/tasks/${record._id}`);
  };

  const handleEdit = (record: Task | any) => {
    setEditingTask(record);
    form.setFieldsValue({
      ...record,
      dueDate: record.dueDate ? dayjs(record.dueDate) : null,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      relatedType: record.relatedTo?.type,
      relatedId:
        typeof record.relatedTo?.id === 'object'
          ? record.relatedTo?.id?._id
          : record.relatedTo?.id,
      assignee: record.assignee?._id,
    });
    setRelatedType(record.relatedTo?.type || 'Lead');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: any) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = (await deleteTasks(id)) as any;
          if (res.success) {
            message.success('Task deleted successfully');
            setTasks(tasks.filter((task) => task._id !== id));
          }
        } catch (error) {
          message.error('Failed to delete task');
        }
      },
    });
  };

  const handleLeadSearch = async (value: string) => {
    setSearchLeadText(value);
    if (value.length > 2 || value === '') {
      try {
        const endpoint = value
          ? `${API_ENDPOINTS.LEADS.LIST}?name=${value}`
          : API_ENDPOINTS.LEADS.LIST;
        const response = (await apiRequest.get(endpoint)) as any;
        console.log(response);
        if (response.success) {
          setLeads(response.data.items || response.data);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    form.resetFields();
    if (lead) {
      setRelatedType('Lead');
      form.setFieldsValue({
        assignee: lead?.assignedTo?._id,
        relatedType: 'Lead',
        relatedId: lead._id,
        status: 'inProgress',
      });
    } else {
      form.setFieldsValue({
        relatedType: 'Lead',
        status: 'inProgress',
      });
    }
    setIsModalOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = (await updateTask(taskId, { status: newStatus })) as any;
      if (response.success) {
        message.success('Status updated successfully');
        setTasks(
          tasks.map((task) =>
            task._id === taskId ? { ...task, status: newStatus } : task
          )
        );
      }
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleSubmit = async (values: any) => {
    const attachments = values?.attachments?.fileList || [];
    const payload = {
      ...values,
      relatedTo: {
        type: values.relatedType,
        id: values.relatedId,
      },
    };
    delete payload.relatedType;
    delete payload.relatedId;
    delete payload.attachments;

    try {
      let res;
      if (editingTask) {
        res = (await updateTask(editingTask._id, payload)) as any;
      } else {
        res = (await createTask(payload)) as any;
      }

      if (res.success) {
        const taskId = editingTask?._id || res?.data?._id || res?.data?.id;

        if (taskId && attachments.length > 0) {
          const formData = new FormData();
          attachments.forEach((item: any) => {
            const file = item?.originFileObj || item;
            if (file) {
              formData.append('taskAttachments', file);
            }
          });
          await addAttachement(taskId, formData);
        }

        message.success(
          `Task ${editingTask ? 'updated' : 'created'} successfully`
        );
        setIsModalOpen(false);
        form.resetFields();
        setEditingTask(null);

        const refreshRes = lead
          ? await getByLeadId(lead._id)
          : ((await getTasksList()) as any);

        if (refreshRes.success) {
          setTasks(refreshRes.data);
        }
      }
    } catch (error) {
      message.error(`Failed to ${editingTask ? 'update' : 'create'} task`);
    }
  };

  return (
    <div>
      <Card
        title="Tasks"
        loading={isLoading}
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 14 } }}
        extra={
          <Space>
            {canCreate('tasks') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateTask}
              >
                Create Task
              </Button>
            )}
          </Space>
        }
      >
        <ListingTable listingTitle="Tasks" onRefresh={fetchTasks} fields={LISTING_FIELDS.tasks} filterKeys={["status","priority","assignee"]} importConfig={canCreate('tasks') && listingImport('tasks', fetchTasks)}
          columns={columns}
          dataSource={tasks}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tasks`,
          }}
          rowHoverable={false}
        />
      </Card>

      <Modal
        title={editingTask ? 'Edit Task' : 'Create Task'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingTask(null);
        }}
        onOk={() => form.submit()}
        width="90%"
        style={{ top: 20, maxWidth: 1200 }}
        styles={{
          body: {
            maxHeight: '75vh',
            overflowY: 'auto',
            padding: '24px',
          },
        }}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Please enter subject' }]}
            >
              <Input placeholder="Enter task subject" size="large" />
            </Form.Item>

            <Form.Item
              name="assignee"
              label="Assignee"
              rules={[{ required: true, message: 'Please select assignee' }]}
            >
              <Select
                placeholder="Select assignee"
                size="large"
                onChange={(value) => {
                  console.log(`selected ${value}`);
                }}
                options={staff}
              >
                {/* Add staff options here */}
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select placeholder="Select priority">
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="High">High</Select.Option>
                <Select.Option value="Urgent">Urgent</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                {taskStatus?.value?.map((stat: any) => (
                  <Select.Option key={stat.value} value={stat.value}>
                    <Tag color={stat.color}>{stat.label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true, message: 'Please select due date' }]}
            >
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>

            <Form.Item name="startDate" label="Start Date">
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
          </div>

          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Add tags (press enter to add)" />
          </Form.Item>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <Form.Item
              name="relatedType"
              label="Related Type"
              initialValue="Lead"
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select
                placeholder="Select Type"
                disabled={!!lead}
                onChange={(value) => {
                  setRelatedType(value);
                  form.setFieldsValue({ relatedId: undefined });
                }}
              >
                {RelatedToList.map((item) => (
                  <Select.Option key={item.value} value={item.label}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="relatedId"
              label={`Select ${relatedType}`}
              rules={[
                { required: true, message: `Please select ${relatedType}` },
              ]}
            >
              <Select
                placeholder={`Search and select ${relatedType}`}
                disabled={!!lead}
                showSearch
                onSearch={handleLeadSearch}
                filterOption={false}
                notFoundContent={
                  searchLeadText.length > 0 && searchLeadText.length < 3
                    ? 'Type at least 3 characters'
                    : 'No results found'
                }
              >
                {relatedType === 'Lead' &&
                  leads.map((item: any) => (
                    <Select.Option key={item._id} value={item._id}>
                      {item.name} - {item.email}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: 16,
            }}
          >
            <Form.Item
              name="isPublic"
              label="Public Task"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch />
            </Form.Item>
          </div>

          <Form.Item name="attachments" label="Attachments">
            <Upload beforeUpload={() => false} multiple listType="text">
              <Button icon={<UploadOutlined />}>Upload Files</Button>
            </Upload>
          </Form.Item>

          <div
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              padding: '16px',
              background: '#fafafa',
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <Form.Item
                name={['repeat', 'enabled']}
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Space>
                  <Switch />
                  <span style={{ fontWeight: 500 }}>Enable Repeat Task</span>
                </Space>
              </Form.Item>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
              }}
            >
              <Form.Item
                name={['repeat', 'frequency']}
                label="Frequency"
                style={{ marginBottom: 0 }}
              >
                <Select placeholder="Select">
                  <Select.Option value="Daily">Daily</Select.Option>
                  <Select.Option value="Weekly">Weekly</Select.Option>
                  <Select.Option value="Monthly">Monthly</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name={['repeat', 'every']}
                label="Every"
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  min={1}
                  placeholder="1"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;
