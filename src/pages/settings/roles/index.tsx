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
  Checkbox,
  Row,
  Col,
  message,
  Divider,
  Modal,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getModuleConfig,
  PermissionObj,
  getAllGroups,
  getModulesByGroup,
  getModuleActions,
  getModuleScopes,
  PermissionAction,
  PermissionScope,
} from '../../../config/permissions';
import './styles.css';
import roleService from '../../../services/roleService';
import { usePermissions } from '../../../hooks';

type Role = {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  permissions: PermissionObj[];
  users_count: number;
  usersCount?: number;
  created_at: string;
  createdAt?: string;
  isSystem: boolean;
  __v?: number;
};

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [selectedPermissions, setSelectedPermissions] = useState<
    PermissionObj[]
  >([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  const { canCreate, canUpdate, canDelete } = usePermissions();
  const { getRoles, createRoles, deleteRoles, updateRoles } = roleService();

  const allGroups = getAllGroups();

  const normalizeRole = (role: any): Role => ({
    ...role,
    name: role?.name ?? '',
    description: role?.description ?? '',
    permissions: Array.isArray(role?.permissions) ? role.permissions : [],
    users_count: role?.users_count ?? role?.usersCount ?? 0,
    created_at: role?.created_at ?? role?.createdAt ?? '',
    createdAt: role?.createdAt ?? role?.created_at ?? '',
    isSystem: role?.isSystem ?? false,
  });

  const formatCreatedDate = (role: Role) => {
    const rawDate = role.createdAt || role.created_at;
    if (!rawDate) return '-';
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) return rawDate;
    return parsedDate.toLocaleDateString();
  };

  const getAllRoles = async () => {
    getRoles(null)
      .then((fetchedRoles: any) => {
        if (fetchedRoles.success) {
          setRoles((fetchedRoles.data ?? []).map(normalizeRole));
        }
      })
      .catch(() => {
        message.error('Failed to fetch roles');
      });
  };
  useEffect(() => {
    getAllRoles();
  }, []);

  const handleEditRole = (role: Role) => {
    if (role.isSystem) {
      message.error('System roles cannot be edited');
      return;
    }

    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
    });
    setSelectedPermissions(role.permissions || []);
    setIsDrawerOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) {
      message.error('System roles cannot be deleted');
      return;
    }

    Modal.confirm({
      title: 'Delete Role',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        if (!role._id) {
          message.error('Role ID is missing');
          return;
        }
        deleteRoles(role._id).then((res: any) => {
          if (res.success) {
            getAllRoles();
            setRoles(roles.filter((r) => r._id !== role._id));
            message.success(res.message || 'Role deleted successfully');
          } else {
            message.error(res.message || 'Failed to delete role');
          }
        });
      },
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Role) => (
        <Space>
          <Tag color={record.isSystem ? 'red' : 'blue'}>{name}</Tag>
          {record.isSystem && <Tag color="red">System</Tag>}
        </Space>
      ),
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions?: PermissionObj[]) => {
        const safePermissions = Array.isArray(permissions) ? permissions : [];
        if (safePermissions.length === 0) {
          return <Tag>No permissions</Tag>;
        }
        return (
          <Space wrap>
            {safePermissions.slice(0, 2).map((p: PermissionObj) => {
              const config = getModuleConfig(p.module);
              return (
                <Tag key={p.module} color="cyan">
                  {config?.label || p.module}
                </Tag>
              );
            })}
            {safePermissions.length > 2 && (
              <Tag>+{safePermissions.length - 2} more</Tag>
            )}
          </Space>
        );
      },
    },
    // {
    //   title: 'Users',
    //   dataIndex: 'users_count',
    //   key: 'users_count',
    //   render: (count: number) => count ?? 0,
    // },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (_: string, role: Role) => formatCreatedDate(role),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (role: Role) => (
        <Space>
          {canUpdate('settings.roles') && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditRole(role)}
              disabled={role.isSystem}
              title={role.isSystem ? 'System roles cannot be edited' : ''}
            />
          )}
          {canDelete('settings.roles') && (
            <Button
              size="small"
              onClick={() => handleDeleteRole(role)}
              danger
              icon={<DeleteOutlined />}
              disabled={role.isSystem}
              title={role.isSystem ? 'System roles cannot be deleted' : ''}
            />
          )}
        </Space>
      ),
    },
  ];

  const hasDuplicateRoleName = (name: string) => {
    const normalizedName = name.trim().toLowerCase();
    return roles.some((role) => {
      const isEditingCurrentRole =
        editingRole?._id && role._id && role._id === editingRole._id;

      if (isEditingCurrentRole) {
        return false;
      }

      return (role.name ?? '').trim().toLowerCase() === normalizedName;
    });
  };

  const handleSaveRole = async () => {
    form
      .validateFields()
      .then(async (values) => {
        const normalizedRoleName = values.name.trim();

        if (hasDuplicateRoleName(normalizedRoleName)) {
          form.setFields([
            { name: 'name', errors: ['Role name already exists'] },
          ]);
          return;
        }

        form.setFields([{ name: 'name', errors: [] }]);

        if (editingRole) {
          // Update existing role
          const updatedRole: Role = {
            ...editingRole,
            name: normalizedRoleName,
            description: values.description,
            permissions: selectedPermissions,
          };
          const res = (await updateRoles(editingRole._id!, updatedRole)) as any;
          if (res.success) {
            await getAllRoles();
            message.success(res.message || 'Role updated successfully');
          } else {
            if (res?.message && /exist|duplicate|already/i.test(res.message)) {
              form.setFields([{ name: 'name', errors: [res.message] }]);
              return;
            }
            message.error(res.message || 'Failed to update role');
          }
        } else {
          // Create new role
          const newRole: Role = {
            id: `R-${String(roles.length + 1).padStart(3, '0')}`,
            name: normalizedRoleName,
            description: values.description,
            permissions: selectedPermissions,
            users_count: 0,
            created_at: new Date().toISOString().split('T')[0],
            isSystem: false,
          };
          const res = (await createRoles(newRole)) as any;
          if (res.success) {
            await getAllRoles();

            message.success(res.message || 'Role created successfully');
          } else {
            if (res?.message && /exist|duplicate|already/i.test(res.message)) {
              form.setFields([{ name: 'name', errors: [res.message] }]);
              return;
            }
            message.error(res.message || 'Failed to create role');
          }
        }
        setIsDrawerOpen(false);
        form.resetFields();
        setSelectedPermissions([]);
        setEditingRole(null);
      })
      .catch((error: any) => {
        const apiMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to save role';

        if (/exist|duplicate|already/i.test(apiMessage)) {
          form.setFields([{ name: 'name', errors: [apiMessage] }]);
          return;
        }
        message.error(apiMessage);
      });
  };

  const handleModulePermissionChange = (
    module: string,
    actions: PermissionAction[],
    scope: PermissionScope
  ) => {
    const existingIndex = selectedPermissions.findIndex(
      (p) => p.module === module
    );

    if (actions.length === 0) {
      // Remove if no actions selected
      setSelectedPermissions(
        selectedPermissions.filter((p) => p.module !== module)
      );
    } else if (existingIndex >= 0) {
      // Update existing
      const updated = [...selectedPermissions];
      updated[existingIndex] = { module, actions, scope };
      setSelectedPermissions(updated);
    } else {
      // Add new
      setSelectedPermissions([
        ...selectedPermissions,
        { module, actions, scope },
      ]);
    }
  };

  const getSelectedPermission = (module: string) => {
    return selectedPermissions.find((p) => p.module === module);
  };

  const toggleModuleExpanded = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  return (
    <div className="roles-page">
      <Card
        title="Roles & Permissions"
        extra={
          canCreate('settings.roles') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsDrawerOpen(true)}
            >
              Add Role
            </Button>
          )
        }
      >
        <ListingTable listingTitle="Roles" onRefresh={getAllRoles} fields={LISTING_FIELDS.roles} filterKeys={["isSystem"]} importConfig={canCreate('settings.roles') && listingImport('roles', getAllRoles)}
          rowKey={(record) => record._id || record.id || record.name}
          columns={columns}
          dataSource={roles}
          pagination={{ pageSize: 10 }}
          rowHoverable={false}
        />
      </Card>

      <Drawer
        title={editingRole ? 'Edit Role' : 'Add New Role'}
        placement="right"
        width={900}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          form.resetFields();
          setSelectedPermissions([]);
          setEditingRole(null);
          setExpandedModules(new Set());
        }}
        extra={
          <Space>
            <Button
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingRole(null);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" onClick={handleSaveRole}>
              {editingRole ? 'Update Role' : 'Save Role'}
            </Button>
          </Space>
        }
      >
        <Row gutter={24} className="roles-drawer-content">
          <Col xs={24} lg={8} className="roles-form-section">
            <Form form={form} layout="vertical">
              <Form.Item
                name="name"
                label="Role Name"
                rules={[
                  { required: true, message: 'Role name is required' },
                  {
                    validator: (_, value) => {
                      if (!value || !value.trim()) {
                        return Promise.resolve();
                      }

                      if (hasDuplicateRoleName(value)) {
                        return Promise.reject(
                          new Error('Role name already exists')
                        );
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="Enter role name"
                  onChange={() =>
                    form.setFields([{ name: 'name', errors: [] }])
                  }
                />
              </Form.Item>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Description is required' }]}
              >
                <Input.TextArea rows={4} placeholder="Enter role description" />
              </Form.Item>
            </Form>
          </Col>

          <Col xs={24} lg={16} className="roles-permissions-section">
            <div className="permissions-header">
              <div>
                <strong>Module Permissions</strong>
                <div style={{ color: '#666', fontSize: 12 }}>
                  Select modules and configure actions & scope
                </div>
              </div>
            </div>

            <div className="permissions-scroll">
              {allGroups.map((group) => {
                const modules = getModulesByGroup(group);
                return (
                  <div key={group} className="permission-group">
                    <Divider plain style={{ margin: '12px 0 16px' }}>
                      <strong>{group}</strong>
                    </Divider>

                    {modules.map((moduleConfig) => {
                      const selected = getSelectedPermission(moduleConfig.key);
                      const isExpanded = expandedModules.has(moduleConfig.key);
                      const availableActions = getModuleActions(
                        moduleConfig.key
                      );
                      const availableScopes = getModuleScopes(moduleConfig.key);

                      return (
                        <div
                          key={moduleConfig.key}
                          className="module-permission-item"
                        >
                          <div className="module-header">
                            <Checkbox
                              checked={!!selected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleModulePermissionChange(
                                    moduleConfig.key,
                                    availableActions as PermissionAction[],
                                    'all'
                                  );
                                  setExpandedModules(
                                    new Set([
                                      ...expandedModules,
                                      moduleConfig.key,
                                    ])
                                  );
                                } else {
                                  handleModulePermissionChange(
                                    moduleConfig.key,
                                    [],
                                    'all'
                                  );
                                }
                              }}
                            >
                              <span className="module-name">
                                {moduleConfig.label}
                              </span>
                            </Checkbox>
                            {selected && (
                              <Button
                                type="text"
                                size="small"
                                onClick={() =>
                                  toggleModuleExpanded(moduleConfig.key)
                                }
                              >
                                {isExpanded ? '▼' : '▶'}
                              </Button>
                            )}
                          </div>

                          {selected && isExpanded && (
                            <div className="module-details">
                              <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12}>
                                  <div className="detail-section">
                                    <label>Actions</label>
                                    <div className="actions-list">
                                      {availableActions.map((action) => (
                                        <Checkbox
                                          key={action}
                                          checked={selected.actions.includes(
                                            action
                                          )}
                                          onChange={(e) => {
                                            const newActions = e.target.checked
                                              ? [...selected.actions, action]
                                              : selected.actions.filter(
                                                  (a) => a !== action
                                                );
                                            handleModulePermissionChange(
                                              moduleConfig.key,
                                              newActions as PermissionAction[],
                                              selected.scope
                                            );
                                          }}
                                        >
                                          {action.charAt(0).toUpperCase() +
                                            action.slice(1)}
                                        </Checkbox>
                                      ))}
                                    </div>
                                  </div>
                                </Col>

                                <Col xs={24} sm={12}>
                                  <div className="detail-section">
                                    <label>Scope</label>
                                    <Select
                                      value={selected.scope}
                                      onChange={(scope) => {
                                        handleModulePermissionChange(
                                          moduleConfig.key,
                                          selected.actions,
                                          scope
                                        );
                                      }}
                                      options={availableScopes.map((scope) => ({
                                        value: scope,
                                        label:
                                          scope.charAt(0).toUpperCase() +
                                          scope.slice(1),
                                      }))}
                                    />
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>
      </Drawer>
    </div>
  );
};

export default RolesPage;
