import { Trash2 as DeleteOutlined, Plus as PlusOutlined } from 'lucide-react';

import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import roleService from '../../services/roleService';
import { useHrSettingsContext } from './context';

const { Text } = Typography;

type RoleOption = {
  _id: string;
  name: string;
};

const LeavePolicySettingsTab = () => {
  const {
    canDeleteSettings,
    deletingSetting,
    form,
    addLeavePolicy,
    updateLeavePolicyField,
    removeLeavePolicy,
  } = useHrSettingsContext();
  const { getRoles } = roleService();
  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = (await getRoles(null)) as any;
        setRoles(response?.data ?? []);
      } catch (error) {
        console.log(error);
      }
    };

    void fetchRoles();
  }, []);

  const roleOptions = roles.map((role) => ({
    label: role.name,
    value: role._id,
  }));

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card bordered={false}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <Text strong style={{ display: 'block', fontSize: 16 }}>
              Role Based Leave Policies
            </Text>
            <Text type="secondary">
              Create multiple leave rules. Apply a policy to all roles or assign
              it only to selected roles.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addLeavePolicy}
          >
            Add Policy Rule
          </Button>
        </Flex>
      </Card>

      {form.leavePolicies.map((policy, index) => (
        <Card
          key={`${policy._id || 'leave-policy'}-${index}`}
          bordered={false}
          title={
            <Flex vertical gap={2}>
              <Text strong>{policy.name || `Leave Policy ${index + 1}`}</Text>
              <Text type="secondary">
                {policy.applyToAllRoles
                  ? 'Applies to all roles'
                  : `${policy.assignedRoleIds.length} roles selected`}
              </Text>
            </Flex>
          }
          extra={
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              disabled={deletingSetting || (!canDeleteSettings && !!policy._id)}
              onClick={() => removeLeavePolicy(index)}
            >
              {policy._id ? 'Move to Trash' : 'Remove draft'}
            </Button>
          }
          style={{ borderRadius: 18, border: '1px solid #f0f0f0' }}
        >
          <Space direction="vertical" size={18} style={{ display: 'flex' }}>
            <Form layout="vertical">
              <Row gutter={[16, 8]}>
                <Col xs={24} lg={10}>
                  <Form.Item label="Policy Name">
                    <Input
                      placeholder="Sales Team Leave Policy"
                      value={policy.name}
                      onChange={(event) =>
                        updateLeavePolicyField(
                          index,
                          'name',
                          event.target.value
                        )
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={14}>
                  <Form.Item label="Assignment Type">
                    <Segmented
                      block
                      options={[
                        { label: 'Apply to All Roles', value: 'all' },
                        { label: 'Custom Role Select', value: 'custom' },
                      ]}
                      value={policy.applyToAllRoles ? 'all' : 'custom'}
                      onChange={(value) =>
                        updateLeavePolicyField(
                          index,
                          'applyToAllRoles',
                          value === 'all'
                        )
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {!policy.applyToAllRoles ? (
                <Form.Item label="Assign Roles">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Select roles"
                    options={roleOptions}
                    value={policy.assignedRoleIds}
                    onChange={(values) =>
                      updateLeavePolicyField(index, 'assignedRoleIds', values)
                    }
                  />
                </Form.Item>
              ) : (
                <Tag color="green" style={{ width: 'fit-content' }}>
                  This policy applies to all roles
                </Tag>
              )}

              <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
                <Col xs={24} md={8}>
                  <Form.Item label="Casual Leaves">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      value={policy.casualLeaves}
                      onChange={(value) =>
                        updateLeavePolicyField(
                          index,
                          'casualLeaves',
                          Number(value || 0)
                        )
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Sick Leaves">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      value={policy.sickLeaves}
                      onChange={(value) =>
                        updateLeavePolicyField(
                          index,
                          'sickLeaves',
                          Number(value || 0)
                        )
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Paid Leaves">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      value={policy.paidLeaves}
                      onChange={(value) =>
                        updateLeavePolicyField(
                          index,
                          'paidLeaves',
                          Number(value || 0)
                        )
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            {!policy.applyToAllRoles && policy.assignedRoleIds.length > 0 ? (
              <Space size={[8, 8]} wrap>
                {policy.assignedRoleIds.map((roleId) => {
                  const role = roles.find((item) => item._id === roleId);
                  return (
                    <Tag key={roleId} color="blue">
                      {role?.name || roleId}
                    </Tag>
                  );
                })}
              </Space>
            ) : null}
          </Space>
        </Card>
      ))}
    </Space>
  );
};

export default LeavePolicySettingsTab;
