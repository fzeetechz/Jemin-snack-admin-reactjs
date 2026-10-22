import {
  Plus as PlusOutlined,
  PencilLine as EditOutlined,
  Eye as EyeOutlined,
} from 'lucide-react';
import { fetchAllListingPages } from 'src/services/listingService';
import ListingTable from 'src/components/shared/listing/ListingTable';
import {
  LISTING_FIELDS,
  listingImport,
} from 'src/components/shared/listing/listing-presets';
import { useState, useEffect } from 'react';
import {
  Card,
  Col,
  Row,
  Tag,
  Button,
  Flex,
  Input,
  Select,
  Typography,
  Drawer,
  Form,
  Space,
  message,
  Upload,
} from 'antd';
import { PhoneOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { UserAvatar } from '../../components';
// import { imageUrl } from '../../utils/convertor';
import leadServices from '../../services/leadServices';
import staffService from '../../services/staffService';
import { timeConverter } from '../../utils/convertor';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../redux/store';

import { LeadSource, LeadFormValues, Lead } from '../../types/leads';
import LeadViewModal from './LeadViewModal';
import { usePermissions } from '../../hooks/usePermissions';
import configService from '../../services/configService';
import stateService from 'src/services/stateService';

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [form] = Form.useForm<LeadFormValues>();
  const [staffs, setStaffs] = useState([]);
  const [searchParams] = useSearchParams();
  const { getConfig } = configService();
  const { getState } = stateService();

  const loc = useLocation().pathname;

  // const navigateWithLink = (id: any) => {
  //   window.location.href = `jeminisnacks://lead/${id}`;
  // };

  const { creatLeads, updateLeads, addAttachements } = leadServices();
  const { getStaff } = staffService();
  const [allStates, setAllStates] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [LEADSTATUS, SETLEADSTATUS] = useState([]);
  const [LEADSOURCE, SETLEADSOURCE] = useState([]);
  const [PRIORITY, SETPRIORITY] = useState([]);
  const [activityPage, setActvityTab] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<UploadFile[]>([]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = (await getState(null)) as any;
        if (res.success && Array.isArray(res.data)) {
          const data = res.data.map((item: any) => ({
            value: item,
            label: item,
          }));
          setAllStates(data);
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, []);
  useEffect(() => {
    fetchLeads();
    getStaff().then((res: any) => {
      if (res.success) {
        console.log(res.data);
        if (res.data.items && res.data.items.length) {
          const options = res.data.items.map((r: any) => {
            return {
              value: r._id,
              label: r.firstName + ' ' + r.lastName,
            };
          }) as any;
          setStaffs(options);
        }
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (loc.includes('activities/leads')) {
      setActvityTab(true);
    } else {
      setActvityTab(false);
    }
  }, [loc]);

  useEffect(() => {
    const leadId = searchParams.get('id');
    if (leadId && leads.length > 0) {
      const lead = leads.find((l) => l._id === leadId);
      if (lead) {
        setViewLead(lead);
      }
    }
  }, [searchParams, leads]);

  useEffect(() => {
    getConfig('leadStatus,leadPriority,leadSource')
      .then((res) => {
        if (res.success) {
          const leadStatus = res.data.find(
            (item: any) => item.key === 'leadStatus'
          );
          console.log(leadStatus);
          SETLEADSTATUS(leadStatus.value);
          const leadSource = res.data.find(
            (item: any) => item.key === 'leadSource'
          );
          SETLEADSOURCE(leadSource.value);

          const leadPriority = res.data.find(
            (item: any) => item.key === 'leadPriority'
          );

          SETPRIORITY(leadPriority.value);

          console.log(res);
          // SETLEADSTATUS(res.data.value)
        }
      })
      .catch((err) => console.log(err));

    // getConfig('leadSource').then((res) => {
    //   if (res.success) {
    //     SETLEADSOURCE(res.data.value)
    //   }
    // }).catch((err) => console.log(err))
  }, []);

  const fetchLeads = async () => {
    try {
      setLeads(await fetchAllListingPages<Lead>('/leads', 'items'));
    } catch {
      message.error('Unable to load leads');
    }
  };

  const handleStateChange = async (stateName: string) => {
    setSelectedState(stateName);
    form.setFieldValue('city', undefined);
    setAllCities([]);

    if (!stateName) return;

    try {
      setLoadingCities(true);
      const res = (await getState(stateName)) as any;
      if (res.success && res.data?.districts) {
        const cityOptions = res.data.districts.map((district: string) => ({
          value: district,
          label: district,
        }));
        setAllCities(cityOptions);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleOpenDrawer = () => {
    setEditingLead(null);
    setSelectedState(null);
    setAllCities([]);
    setIsDrawerOpen(true);
    form.resetFields();
    form.setFieldsValue({
      status: 'New',
      language: 'System Default',
      contacted_today: true,
      is_public: false,
      tags: [],
      country: 'India',
    });
  };

  const handleEdit = async (record: Lead) => {
    setEditingLead(record);
    setSelectedState(record.state || null);

    if (record.state) {
      try {
        setLoadingCities(true);
        const res = (await getState(record.state)) as any;
        if (res.success && res.data?.districts) {
          const cityOptions = res.data.districts.map((district: string) => ({
            value: district,
            label: district,
          }));
          setAllCities(cityOptions);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoadingCities(false);
      }
    }

    form.setFieldsValue({
      status: record.status,
      source: record.source,
      assigned: record.assignedTo?._id,
      name: record.name,
      position: record.position,
      email: record.email,
      website: record.website,
      phone: record.phone,
      lead_value: record.leadValue,
      company: record.company,
      tags: record.tags,
      address: record.address,
      city: record.city,
      state: record.state,
      country: 'India',
      priority: record.priority,
      zip: record.zip,
      language: 'English',
      description: record.description,
      is_public: record.isPublic,
      contacted_today: !!record.lastContactedAt,
    });
    setIsDrawerOpen(true);
  };

  const handleSaveLead = async () => {
    const values = await form.validateFields();

    let attachmentPaths: { uri: string }[] = [];
    if (!editingLead && attachmentFiles.length > 0) {
      const formData = new FormData();
      attachmentFiles.forEach((f) => {
        if (f.originFileObj)
          formData.append('leadAttachments', f.originFileObj);
      });
      const uploadRes = (await addAttachements(formData)) as any;
      if (uploadRes?.file) {
        attachmentPaths = uploadRes.file.map((f: any) => ({ uri: f.path }));
      }
    }

    const payload = {
      status: values.status,
      source: values.source,
      assignedTo: values.assigned,
      name: values.name,
      position: values.position,
      email: values.email,
      website: values.website,
      phone: values.phone,
      leadValue: values.lead_value,
      company: values.company,
      tags: values.tags,
      priority: values.priority,
      address: values.address,
      city: values.city,
      state: values.state,
      country: 'India',
      zip: values.zip,
      language: 'English',
      description: values.description,
      isPublic: values.is_public,
      contacted_today: values.contacted_today,
      ...(attachmentPaths.length > 0 && { attachments: attachmentPaths }),
    };

    let res;
    if (editingLead) {
      res = (await updateLeads(editingLead._id, payload)) as any;
    } else {
      res = (await creatLeads(payload)) as any;
    }

    if (res.success) {
      message.success(
        res.message ||
          (editingLead
            ? 'Lead updated successfully'
            : 'Lead created successfully')
      );
      await fetchLeads();
      setIsDrawerOpen(false);
      form.resetFields();
      setAttachmentFiles([]);
    } else {
      message.error(
        res?.message ||
          (editingLead ? 'Failed to update lead' : 'Failed to create lead')
      );
    }
  };

  const columns = [
    {
      title: 'Name/Company',
      dataIndex: 'first_name',
      key: 'name',
      render: (_: unknown, row: Lead) => (
        <Flex align="center" gap={10} style={{ cursor: 'pointer' }}>
          <div>
            <UserAvatar fullName={row?.name} />
            <Typography.Text style={{ marginLeft: 30 }} type="secondary">
              {row.company}
            </Typography.Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'email',
      key: 'contact',
      render: (_: unknown, row: Lead) => (
        <Flex vertical gap={2}>
          <Link to={`mailto:${row.email}`}>{row.email}</Link>
          <a href={`tel:${row.phone}`}>
            <PhoneOutlined /> {row.phone}
          </a>
        </Flex>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (v: LeadSource) => <Tag>{v}</Tag>,
    },
    {
      title: 'Value',
      dataIndex: 'leadValue',
      key: 'leadValue',
      render: (v: LeadSource) => <Tag>{v}</Tag>,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (v: string[] | undefined) => (
        <Flex gap={2}>
          {(v ?? []).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Flex>
      ),
    },

    {
      title: 'Assigned',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (v: any) => <Tag color="blue">{v?.name}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: any, row: Lead) => (
        <Flex vertical gap={2}>
          <Typography.Text>{timeConverter(v)}</Typography.Text>
          <Tag color="blue">{row.createdBy?.name || '-'}</Tag>
        </Flex>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Lead) => (
        <Space>
          {/* <Button onClick={()=>navigateWithLink(record._id)}>
            App
          </Button> */}
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewLead(record)}
          />
          {!activityPage && (
            <>
              {canUpdate('leads') && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <LeadViewModal
        open={!!viewLead}
        lead={viewLead}
        onClose={() => setViewLead(null)}
        activeTab={activityPage}
      />
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="Leads"
            extra={
              canCreate('leads') && (
                <>
                  {!activityPage && (
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenDrawer}
                      >
                        Add Lead
                      </Button>
                    </Space>
                  )}
                </>
              )
            }
          >
            <ListingTable
              trashConfig={{
                canDelete: canDelete('leads'),
                modelType: 'lead',
                onComplete: fetchLeads,
              }}
              listingTitle="Leads"
              onRefresh={fetchLeads}
              fields={LISTING_FIELDS.leads}
              filterKeys={['status', 'source', 'priority', 'assignedTo']}
              importConfig={
                canCreate('leads') && listingImport('leads', fetchLeads)
              }
              showUpload
              rowKey="_id"
              columns={columns}
              dataSource={leads}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 'max-content' }}
              rowHoverable={false}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title={editingLead ? 'Edit Lead' : 'Add New Lead'}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingLead(null);
          form.resetFields();
        }}
        width={900}
        placement="right"
        extra={
          <Space>
            <Button
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingLead(null);
                form.resetFields();
              }}
            >
              Close
            </Button>
            <Button type="primary" onClick={handleSaveLead}>
              {editingLead ? 'Update' : 'Save'}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 8 }}
          requiredMark={(label, { required }) =>
            required ? (
              <>
                {label} <span style={{ color: '#ff4d4f' }}>*</span>
              </>
            ) : (
              <>
                {label}{' '}
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  (optional)
                </span>
              </>
            )
          }
        >
          {/* Top row: Status, Source, Assigned */}
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Status required' }]}
              >
                <Select placeholder="Nothing selected" options={LEADSTATUS} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="source"
                label="Source"
                rules={[{ required: true, message: 'Source required' }]}
              >
                <Select placeholder="Nothing selected" options={LEADSOURCE} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="assigned"
                label="Assigned"
                rules={[{ required: true }]}
              >
                <Select options={staffs} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true }]}
              >
                <Select options={PRIORITY} />
              </Form.Item>
            </Col>
            {/* Tags */}

            <Col xs={24} md={12}>
              <Form.Item name="tags" label="Tags">
                <Select
                  mode="tags"
                  placeholder="Add tags"
                  tokenSeparators={[',']}
                  options={[
                    { value: 'hot', label: 'hot' },
                    { value: 'followup', label: 'followup' },
                    { value: 'priority', label: 'priority' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Main form 2 columns */}
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Name required' }]}
              >
                <Input placeholder="" />
              </Form.Item>
              {/* 
              <Form.Item name="position" label="Position">
                <Input placeholder="" />
              </Form.Item> */}

              <Form.Item
                name="email"
                label="Email Address"
                rules={[{ type: 'email', message: 'Invalid email' }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="" />
              </Form.Item>

              <Form.Item
                name="website"
                label="Website"
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Phone is required' }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="" />
              </Form.Item>

              <Form.Item
                name="lead_value"
                label="Lead value"
                style={{ marginBottom: 16 }}
              >
                <Input type="number" addonAfter="$" placeholder="" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'State is required' }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  showSearch
                  placeholder="Select state"
                  options={allStates}
                  onChange={handleStateChange}
                />
              </Form.Item>

              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'City is required' }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  showSearch
                  placeholder="Select state first"
                  options={allCities}
                  loading={loadingCities}
                  disabled={!selectedState || loadingCities}
                />
              </Form.Item>

              <Form.Item
                name="zip"
                label="Zip Code"
                rules={[{ required: true, message: 'Zip code is required' }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
                style={{ marginBottom: 16 }}
              >
                <Input.TextArea rows={2} placeholder="" />
              </Form.Item>
            </Col>
          </Row>

          {/* Description */}
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={4} placeholder="" />
              </Form.Item>
            </Col>
          </Row>

          {/* Attachments - only on create */}
          {!editingLead && (
            <Row gutter={[12, 12]}>
              <Col span={24}>
                <Form.Item label="Attachments">
                  <Upload
                    listType="picture-card"
                    fileList={attachmentFiles}
                    beforeUpload={() => false}
                    onChange={({ fileList }) => setAttachmentFiles(fileList)}
                    multiple
                    accept="image/*"
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Bottom checkboxes */}
          {/* <Row gutter={[12, 12]}>
            <Col span={24}>
              <Flex gap={16} align="center">
                <Form.Item
                  name="is_public"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Public</Checkbox>
                </Form.Item>

                <Form.Item
                  name="contacted_today"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Contacted Today</Checkbox>
                </Form.Item>
              </Flex>
            </Col>
          </Row> */}
        </Form>
      </Drawer>
    </div>
  );
};

export default LeadsPage;
