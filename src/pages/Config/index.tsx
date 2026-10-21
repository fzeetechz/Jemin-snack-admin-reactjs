import ListingTable from 'src/components/shared/listing/ListingTable';
import { usePermissions } from 'src/hooks';
import { useEffect, useState } from 'react';
import {
  Tag,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Divider,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import configService from 'src/services/configService';

const ConfigManager = () => {
  const { getConfig, createConfig, updateConfig, deleteConfig } =
    configService();

  const [configs, setConfigs] = useState<any[]>([]);
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await getConfig();
      setConfigs(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (config = null) => {
    setEditingConfig(config);
    setIsModalOpen(true);

    if (config) {
      form.setFieldsValue(config);
    } else {
      form.resetFields();
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      //   console.log(values)
      //   return

      if (editingConfig) {
        await updateConfig(editingConfig._id, values);
        message.success('Config updated successfully');
      } else {
        await createConfig(values);
        message.success('Config created successfully');
      }

      setIsModalOpen(false);
      fetchConfigs();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteConfig(id);
      message.success('Deleted successfully');
      fetchConfigs();
    } catch (err) {
      console.log(err);
    }
  };


  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h2>⚙️ Config Manager</h2>
        {canCreate('settings') && <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          Add Config
        </Button>}
      </div>

<ListingTable listingTitle="Configuration" fields={[{ key: 'key', label: 'Key' }, { key: 'description', label: 'Description' }, { key: 'value', label: 'Values' }]} dataSource={configs} rowKey="_id" loading={loading} onRefresh={fetchConfigs}
        importConfig={canCreate('settings') && { fields: [{ key: 'key', label: 'Key', required: true, unique: true }, { key: 'description', label: 'Description' }, { key: 'value', label: 'Values JSON', required: true, type: 'json', example: '[{"value":"new","label":"New","color":"blue","order":1}]' }], create: createConfig, onComplete: fetchConfigs, validate: (row) => Array.isArray(row.value) && row.value.every((item) => item && typeof item.value === 'string' && typeof item.label === 'string') ? [] : ['Values must be an array with value and label strings'] }}
        columns={[{ title: 'Key', dataIndex: 'key' }, { title: 'Description', dataIndex: 'description' }, { title: 'Values', render: (_, row) => <Space wrap>{[...(row.value ?? [])].sort((a, b) => a.order - b.order).map((item, index) => <Tag key={index} color={item.color}>{item.label}</Tag>)}</Space> }, { title: 'Actions', render: (_, row) => <Space>{canUpdate('settings') && <Button icon={<EditOutlined />} onClick={() => openModal(row)}>Edit</Button>}{canDelete('settings') && <Popconfirm title="Delete configuration?" onConfirm={() => handleDelete(row._id)} okButtonProps={{ danger: true }}><Button danger icon={<DeleteOutlined />}>Delete</Button></Popconfirm>}</Space> }]} />

      <Modal
        title={editingConfig ? '✏️ Edit Config' : '➕ Create Config'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        width={850}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="key"
                label="Config Key"
                rules={[{ required: true, message: 'Key is required' }]}
              >
                <Input placeholder="e.g. employeDesignation" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="description" label="Description">
                <Input placeholder="Enter description" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Values</Divider>

          <Form.List name="value">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 10, borderRadius: 10 }}
                  >
                    <Row gutter={10} align="middle">
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'label']}
                          label="Label"
                          rules={[{ required: true }]}
                        >
                          <Input placeholder="Display name" />
                        </Form.Item>
                      </Col>

                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'value']}
                          label="Value (No Spaces)"
                          rules={[
                            { required: true },
                            {
                              pattern: /^\S+$/,
                              message: 'Spaces not allowed',
                            },
                          ]}
                        >
                          <Input placeholder="unique_key" />
                        </Form.Item>
                      </Col>

                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'color']}
                          label="Color"
                        >
                          <Input placeholder="#0d6efd" />
                        </Form.Item>
                      </Col>

                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'order']}
                          label="Order"
                        >
                          <Input type="number" />
                        </Form.Item>
                      </Col>

                      <Col span={3}>
                        <Button
                          danger
                          style={{ marginTop: 30 }}
                          onClick={() => remove(name)}
                        >
                          Delete
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Value
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigManager;
