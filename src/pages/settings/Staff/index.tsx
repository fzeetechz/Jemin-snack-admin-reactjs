import { Plus as PlusOutlined, PencilLine as EditOutlined } from 'lucide-react';
import { fetchAllListingPages } from 'src/services/listingService';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS, listingImport } from 'src/components/shared/listing/listing-presets';
import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Modal,
} from 'antd';
import { CheckOutlined, StopOutlined } from '@ant-design/icons';
import staffService from '../../../services/staffService';
import roleService from '../../../services/roleService';
import { usePermissions } from '../../../hooks';
import ShiftSelector from 'src/components/ShiftSelector';
import { ProfileWithPlaceholder } from 'src/utils/convertor';
import ImageModal from 'src/components/ImageModal';

type UserStatus = 'active' | 'inactive';

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: any;
  status: UserStatus;
  created_at: string;
  createdAt?: string;
  password?: string;
  shiftId?: any;
};

type Role = {
  _id: string;
  name: string; // display name
  key: string; // slug like 'admin', 'sales_manager'
};

const StaffPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  //  Services
  const { createStaff, updateStaff } = staffService();
  const { getRoles } = roleService();

  // ✅ Dynamic roles (replace with API)
  const [roles, setRoles] = useState<Role[]>([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Image Modal

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const normalizeUser = (user: any): User => ({
    ...user,
    created_at: user?.created_at ?? user?.createdAt ?? '',
    createdAt: user?.createdAt ?? user?.created_at ?? '',
  });

  const formatCreatedDate = (user: User) => {
    const rawDate = user.created_at || user.createdAt;
    if (!rawDate) {
      return '-';
    }
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }
    return parsedDate.toLocaleDateString();
  };

  // Later: API call
  const getStaffs = async () => {
    try { setUsers((await fetchAllListingPages<User>('/staff', 'items')).map(normalizeUser)); } catch { message.error('Unable to load staff'); }
  };
  useEffect(() => {
    const fetchRoles = async () => {
      const res = (await getRoles(null)) as any;
      if (res.success) {
        setRoles(res.data);
      }
    };

    getStaffs();
    fetchRoles();
  }, []);

  // const roleById = useCallback(
  //   (id: any) => {
  //     const sRole = roles.find((r: any) => r._id == id);
  //     return sRole;
  //   },
  //   [roles]
  // );

  const openAddModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' }); // default
    setIsDrawerOpen(true);
  };

  const openEditModal = (record: User) => {
    console.log(record);
    setEditingUser(record);
    form.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      roleId: record.roleId?._id || record.roleId,
      status: record.status,
      shiftId: record?.shiftId?._id,
    });
    setIsDrawerOpen(true);
  };

  const closeModal = () => {
    setIsDrawerOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const normalizePhone = (phone: string) =>
    phone.replace(/\s+/g, '').replace(/^\+/, '');

  const isEmailTaken = (email: string, excludeUserId?: string) => {
    const e = email.trim().toLowerCase();
    return users.some(
      (u: any) => u.email.trim().toLowerCase() === e && u._id !== excludeUserId
    );
  };

  const isPhoneTaken = (phone: string, excludeUserId?: string) => {
    const p = normalizePhone(phone);
    return users.some(
      (u: any) => normalizePhone(u.phone) === p && u._id !== excludeUserId
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Unique checks (client-side)
      const excludeId = editingUser?._id;
      if (isEmailTaken(values.email, excludeId)) {
        form.setFields([{ name: 'email', errors: ['Email already exists'] }]);
        return;
      }
      if (isPhoneTaken(values.phone, excludeId)) {
        form.setFields([{ name: 'phone', errors: ['Phone already exists'] }]);
        return;
      }

      if (editingUser) {
        const updated = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
          status: values.status,
          shiftId: values?.shiftId,
        };
        const res = (await updateStaff(editingUser._id, updated)) as any;
        if (res.success) {
          message.success(res.meassge || 'User updated successfully');
        }
        console.log(res);
        // Call update API here

        closeModal();
      } else {
        const newUser = {
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
          status: values.status ?? 'active',
          shiftId: values?.shiftId,
        };

        const res = (await createStaff(newUser)) as any;
        if (res.success) {
          message.success(res.meassge || 'User added successfully');
          closeModal();
        }
      }
      await getStaffs();
    } catch {
      // validation handled by antd
    }
  };

  const handleToggleStatus = (record: User) => {
    const isActive = record.status === 'active';
    Modal.confirm({
      title: `${isActive ? 'Block' : 'Activate'} user?`,
      content: `Are you sure you want to ${isActive ? 'block' : 'activate'} "${
        record.firstName
      } ${record.lastName}"?`,
      okText: isActive ? 'Block' : 'Activate',
      okType: isActive ? 'danger' : 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        const res = (await updateStaff(record._id, {
          status: isActive ? 'inactive' : 'active',
        })) as any;
        if (res.success) {
          message.success(
            `User ${isActive ? 'blocked' : 'activated'} successfully`
          );
          await getStaffs();
        }
      },
    });
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (_: any, record: any) => {
        console.log(_);
        return (
          <img
            onClick={() => {
              setSelectedStaff(record);
              showModal();
            }}
            style={{ width: 70, height: 70, borderRadius: '50%' }}
            src={ProfileWithPlaceholder(record)}
          ></img>
        );
      },
    },
    {
      title: 'StaffId',
      dataIndex: 'Id',
      key: 'Id',
      render: (_: any) => (
        <p
          className="bold"
          style={{
            fontWeight: '600',
          }}
        >
          {_ ? _ : 'NA'}
        </p>
      ),
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: User) =>
        `${record.firstName} ${record.lastName}`,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Role',
      dataIndex: 'roleId',
      key: 'roleId',
      render: (roleId: any) => {
        return (
          <>
            {roleId ? (
              <Tag color="blue">{roleId?.name ?? 'Unknown'}</Tag>
            ) : (
              <Tag color="red">{roleId?.name ?? 'Not Assigned'}</Tag>
            )}
          </>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (_: string, record: User) => formatCreatedDate(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          {canUpdate('settings.users') && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          )}
          {canDelete('settings.users') && (
            <Button
              size="small"
              danger={record.status === 'active'}
              type={record.status === 'active' ? 'default' : 'primary'}
              icon={
                record.status === 'active' ? (
                  <StopOutlined />
                ) : (
                  <CheckOutlined />
                )
              }
              onClick={() => handleToggleStatus(record)}
              title={record.status === 'active' ? 'Block' : 'Activate'}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="module-page">
      {isModalOpen && (
        <ImageModal
          imageUrl={ProfileWithPlaceholder(selectedStaff)}
          isModalOpen={isModalOpen}
          onClose={handleCancel}
          title={selectedStaff?.firstName + ' ' + selectedStaff?.lastName}
        />
      )}
      <Card
        title="Staff Management"
        extra={
          canCreate('settings.users') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
            >
              Add Staff
            </Button>
          )
        }
      >
        <ListingTable listingTitle="Staff" onRefresh={getStaffs} fields={LISTING_FIELDS.staff} filterKeys={["status","roleId","shiftId"]} importConfig={canCreate('settings.users') && listingImport('staff', getStaffs, (row) => roles.some((role) => role._id === row.roleId) ? [] : ['Role ID does not exist'])}
          rowKey={(record) => record._id}
          columns={columns}
          dataSource={users}
          pagination={{ pageSize: 10 }}
          rowHoverable={false}
        />
      </Card>

      <Drawer
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isDrawerOpen}
        onClose={closeModal}
        width={600}
        placement="right"
        extra={
          <Space>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'First name is required' }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Last name is required' }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: 'Phone is required' },
              {
                validator: async (_, value) => {
                  const v = String(value ?? '').trim();
                  if (!v) return Promise.resolve();
                  const digits = v.replace(/[^\d]/g, '');
                  if (digits.length < 10 || digits.length > 15) {
                    return Promise.reject(
                      new Error('Phone must be 10–15 digits')
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          {!editingUser && (
            <>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/,
                    message:
                      'Password must contain at least one letter and one number',
                  },
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error('Passwords do not match')
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm password" />
              </Form.Item>
            </>
          )}

          {/* ✅ Dynamic roles */}
          <Form.Item
            name="roleId"
            label="Role"
            rules={[{ required: true, message: 'Role is required' }]}
          >
            <Select
              placeholder="Select role"
              options={roles.map((r) => ({ value: r._id, label: r.name }))}
            />
          </Form.Item>

          <ShiftSelector />

          {/* ✅ Optional but useful */}
          <Form.Item name="status" label="Status" initialValue="active">
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default StaffPage;
