import { Save as SaveOutlined } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Button,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Typography,
  message,
} from 'antd';

import { Card } from '../../components';
import { useOutletContext } from 'react-router-dom';
import type { UserProfileData } from '../../layouts/user-account';
import staffService from '../../services/staffService';

type FieldType = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  role?: string;
  status?: 'active' | 'inactive';
  Id?: string;
};

type OutletContextType = {
  user: UserProfileData | null;
};

const formatValue = (value?: string | null) => (value ? value.trim() : '');

export const UserProfileDetailsPage = () => {
  const [form] = Form.useForm<FieldType>();
  const { user } = useOutletContext<OutletContextType>();
  const [saving, setSaving] = useState(false);
  const { updateStaff } = staffService();

  useEffect(() => {
    form.setFieldsValue({
      Id: user?.Id ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      department: formatValue(user?.department),
      position: formatValue(user?.position),
      role: formatValue(user?.roleId?.name),
      status: user?.status === 'inactive' ? 'inactive' : 'active',
    });
  }, [form, user]);

  const onFinish = async (values: FieldType) => {
    if (!user?._id) return message.error('User not found');
    try {
      setSaving(true);
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        department: values.department,
        position: values.position,
        status: values.status,
      };
      const res: any = await updateStaff(user._id, payload);
      if (res?.success) {
        message.success('Profile updated successfully');
      } else {
        message.error(res?.message || 'Failed to update');
      }
    } catch (e: any) {
      message.error(e?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Form
        form={form}
        name="user-profile-details-form"
        layout="vertical"
        onFinish={onFinish}
        autoComplete="on"
        requiredMark={false}
      >
        <Row gutter={[16, 0]}>
          <Col sm={24} lg={24}>
            <Form.Item<FieldType> label="User ID" name="Id">
              <Input
                readOnly
                suffix={
                  user?.Id ? (
                    <Typography.Paragraph
                      copyable={{ text: user.Id }}
                      style={{ margin: 0 }}
                    />
                  ) : null
                }
              />
            </Form.Item>
          </Col>
          <Col sm={24} lg={12}>
            <Form.Item<FieldType>
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col sm={24} lg={12}>
            <Form.Item<FieldType>
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col sm={24} lg={12}>
            <Form.Item<FieldType>
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col sm={24} lg={12}>
            <Form.Item<FieldType> label="Phone" name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col sm={24} lg={12}>
            <Form.Item<FieldType> label="Role" name="role">
              <Input readOnly />
            </Form.Item>
          </Col>
          <Col sm={24} lg={12}>
            <Form.Item<FieldType> label="Department" name="department">
              <Input />
            </Form.Item>
          </Col>
          <Col sm={24} lg={12}>
            <Form.Item<FieldType> label="Position" name="position">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item<FieldType>
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Status is required' }]}
            >
              <Radio.Group>
                <Radio value="active">Active</Radio>
                <Radio value="inactive">Inactive</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
          >
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
