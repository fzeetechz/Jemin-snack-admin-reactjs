import React, { useEffect, useMemo, useState } from 'react';
import { UserOutlined, BarChartOutlined } from '@ant-design/icons';

import { AnimatePresence, motion } from 'framer-motion';
import { Lead } from '../../types/leads';
import {
  Tabs,
  Tag,
  Flex,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Space,
  Button,
  Modal,
  message,
} from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import ActivityComp from './ActivityComp';
import Tasks from './Tasks';
import useCustomerService from '../../services/useCustomerService';
import { imageUrl } from 'src/utils/convertor';

type TabKey =
  | 'profile'
  | 'proposals'
  | 'tasks'
  | 'attachments'
  | 'reminders'
  | 'notes'
  | 'activity';

interface HeaderTabsProps {
  lead: Lead;
  activeTab?: boolean;
}

const HeaderTabs: React.FC<HeaderTabsProps> = ({ activeTab, lead }) => {
  const { convertLeadToCustomer } = useCustomerService();
  const [converting, setConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(lead.isConverted ?? false);

  const handleConvert = () => {
    Modal.confirm({
      title: 'Convert Lead to Customer',
      content: `Convert "${lead.name}" into a customer? Lead status will be set to Won.`,
      okText: 'Convert',
      onOk: async () => {
        try {
          setConverting(true);
          await convertLeadToCustomer(lead._id);
          message.success(`${lead.name} converted to customer successfully`);
          setIsConverted(true);
        } catch {
          message.error('Failed to convert lead');
        } finally {
          setConverting(false);
        }
      },
    });
  };

  const displayText = (value?: string | number | null) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : '-';
    }
    return value;
  };

  const displayDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  const displayCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const assignedName =
    lead.assignedTo?.name ||
    [lead.assignedTo?.firstName, lead.assignedTo?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

  const items = useMemo(
    () => [
      { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
      // { key: "proposals", label: "Proposals", icon: <FileTextOutlined /> },
      // { key: 'tasks', label: 'Tasks', icon: <CheckCircleOutlined /> },
      // { key: "attachments", label: "Attachments", icon: <PaperClipOutlined /> },
      // { key: "reminders", label: "Reminders", icon: <BellOutlined /> },
      // { key: "notes", label: "Notes", icon: <FileDoneOutlined /> },
      { key: 'activity', label: 'Activity Log', icon: <BarChartOutlined /> },
    ],
    []
  );

  const order = useMemo(() => items.map((i) => i.key), [items]);

  const [activeKey, setActiveKey] = useState<TabKey>('profile');
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (activeTab) {
      setActiveKey('activity');
    }
  }, [activeTab]);
  const onChange = (nextKey: string) => {
    const prevIndex = order.indexOf(activeKey);
    const nextIndex = order.indexOf(nextKey);
    setDirection(nextIndex > prevIndex ? 1 : -1);
    setActiveKey(nextKey as TabKey);
  };

  const renderContent = () => {
    switch (activeKey) {
      case 'profile':
        return (
          <div>
            {/* Top summary row */}
            <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 14 }}>
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={14}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {displayText(lead.name)}
                  </Typography.Title>

                  <Space size={10} style={{ marginTop: 8, flexWrap: 'wrap' }}>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`}>
                        <MailOutlined /> {lead.email}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>
                        <MailOutlined /> -
                      </span>
                    )}

                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`}>
                        <PhoneOutlined /> {lead.phone}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>
                        <PhoneOutlined /> -
                      </span>
                    )}

                    {lead.website ? (
                      <a href={lead.website} target="_blank" rel="noreferrer">
                        <GlobalOutlined /> Website
                      </a>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>
                        <GlobalOutlined /> -
                      </span>
                    )}
                  </Space>
                </Col>

                <Col xs={24} md={10}>
                  <Flex gap={8} justify="flex-end" wrap>
                    <Tag style={{ padding: '4px 10px', borderRadius: 999 }}>
                      {displayText(lead.status)}
                    </Tag>
                    <Tag style={{ padding: '4px 10px', borderRadius: 999 }}>
                      {displayText(lead.source)}
                    </Tag>
                    <Tag
                      color="blue"
                      style={{ padding: '4px 10px', borderRadius: 999 }}
                    >
                      {displayText(assignedName)}
                    </Tag>
                    {isConverted ? (
                      <Tag
                        color="green"
                        style={{ padding: '4px 10px', borderRadius: 999 }}
                      >
                        ✓ Converted
                      </Tag>
                    ) : (
                      <Button
                        size="small"
                        type="primary"
                        icon={<SwapOutlined />}
                        loading={converting}
                        onClick={handleConvert}
                      >
                        Convert to Customer
                      </Button>
                    )}
                  </Flex>
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />

              {/* Quick stats */}
              <Row gutter={[12, 12]}>
                {/* <Col xs={12} md={6}>
                  <Field label="Company" value={displayText(lead.company)} />
                </Col>
                <Col xs={12} md={6}>
                  <Field label="Position" value={displayText(lead.position)} />
                </Col> */}
                <Col xs={12} md={6}>
                  <Field
                    label="Lead Value"
                    value={displayCurrency(lead.leadValue)}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Field label="Score" value={displayText(lead.score)} />
                </Col>
              </Row>
            </Card>
            {lead.attachments && lead.attachments.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                <Col span={24}>
                  <Card
                    title="Attachments"
                    style={{ borderRadius: 12 }}
                    bodyStyle={{ padding: 14 }}
                  >
                    <Row gutter={[12, 12]}>
                      {lead.attachments.map((attachment, index) => (
                        <Col key={index} xs={12} sm={8} md={6} lg={4}>
                          <a
                            href={imageUrl(attachment.uri)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={imageUrl(attachment.uri)}
                              alt={attachment.uri.split('/').pop()}
                              style={{
                                width: '100%',
                                aspectRatio: '1',
                                objectFit: 'cover',
                                borderRadius: 8,
                                border: '1px solid #e2e8f0',
                              }}
                            />
                            {/* <div style={{ fontSize: 11, color: '#475569', marginTop: 4, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {attachment.uri.split('/').pop()}
                            </div> */}
                          </a>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
              </Row>
            )}
            {/* Details grid */}
            <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
              <Col xs={24} md={12}>
                <Card
                  title="Address"
                  style={{ borderRadius: 12 }}
                  bodyStyle={{ padding: 14 }}
                >
                  <Space
                    direction="vertical"
                    size={6}
                    style={{ width: '100%' }}
                  >
                    <Flex gap={8} align="center">
                      <EnvironmentOutlined style={{ color: 'var(--muted)' }} />
                      <Typography.Text strong>
                        {displayText(lead.address)}
                      </Typography.Text>
                    </Flex>

                    <Row gutter={[12, 12]}>
                      <Col span={12}>
                        <Field label="City" value={displayText(lead.city)} />
                      </Col>
                      <Col span={12}>
                        <Field label="State" value={displayText(lead.state)} />
                      </Col>
                      <Col span={12}>
                        <Field
                          label="Country"
                          value={displayText(lead.country)}
                        />
                      </Col>
                      <Col span={12}>
                        <Field label="Zip" value={displayText(lead.zip)} />
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  title="Meta"
                  style={{ borderRadius: 12 }}
                  bodyStyle={{ padding: 14 }}
                >
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Field
                        label="Language"
                        value={displayText(lead.language)}
                      />
                    </Col>
                    <Col span={12}>
                      <Field
                        label="Public"
                        value={lead.isPublic ? 'Yes' : 'No'}
                      />
                    </Col>
                    <Col span={12}>
                      <Field
                        label="Last Contacted"
                        value={displayDate(lead.lastContactedAt)}
                      />
                    </Col>
                    <Col span={12}>
                      <Field
                        label="Created At"
                        value={displayDate(lead.createdAt)}
                      />
                    </Col>
                    <Col span={12}>
                      <Field
                        label="Updated At"
                        value={displayDate(lead.updatedAt)}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card
                  title="Tags & Notes"
                  style={{ borderRadius: 12 }}
                  bodyStyle={{ padding: 14 }}
                >
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        marginBottom: 6,
                      }}
                    >
                      Tags
                    </div>
                    {lead.tags?.length ? (
                      <Flex gap={6} wrap>
                        {lead.tags.map((tag) => (
                          <Tag
                            key={tag}
                            style={{ borderRadius: 999, padding: '2px 10px' }}
                          >
                            {tag}
                          </Tag>
                        ))}
                      </Flex>
                    ) : (
                      <Typography.Text type="secondary">-</Typography.Text>
                    )}
                  </div>

                  <Divider style={{ margin: '10px 0' }} />

                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      marginBottom: 6,
                    }}
                  >
                    Description
                  </div>
                  <Typography.Paragraph
                    style={{ margin: 0, color: 'var(--text)' }}
                  >
                    {displayText(lead.description)}
                  </Typography.Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        );

      case 'proposals':
        return <div style={{ color: 'var(--muted)' }}>No proposals yet.</div>;
      case 'tasks':
        return <Tasks lead={lead} />;
      case 'attachments':
        return <div style={{ color: 'var(--muted)' }}>No attachments yet.</div>;
      case 'reminders':
        return <div style={{ color: 'var(--muted)' }}>No reminders yet.</div>;
      case 'notes':
        return <div style={{ color: 'var(--muted)' }}>No notes yet.</div>;
      case 'activity':
        return <ActivityComp id={lead._id} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="lead-detail-tabs"
      style={{
        background: 'var(--surface-muted)',
        padding: '8px 12px',
        borderRadius: 10,
      }}
    >
      <Tabs
        activeKey={activeKey}
        onChange={onChange}
        tabBarStyle={{ marginBottom: 0 }}
        items={items.map((t) => ({
          key: t.key,
          label: t.label,
          icon: t.icon,
        }))}
      />

      <div style={{ marginTop: 12, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeKey}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              background: 'var(--surface)',
              borderRadius: 10,
              padding: 12,
            }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div style={{ padding: '6px 0' }}>
    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
      {value}
    </div>
  </div>
);

export default HeaderTabs;
