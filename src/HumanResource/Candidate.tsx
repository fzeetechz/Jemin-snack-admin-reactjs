import ListingTable from 'src/components/shared/listing/ListingTable';
import {
  LISTING_FIELDS,
  listingImport,
} from 'src/components/shared/listing/listing-presets';
import { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, Tag, Space, Select, Checkbox } from 'antd';
import candidateService from 'src/services/candidateService';
import { Link } from 'react-router-dom';
import configService from 'src/services/configService';
import { usePermissions } from 'src/hooks';

const statusColors = {
  PENDING: 'default',
  OFFER_SENT: 'blue',
  ACCEPTED: 'green',
  DOC_COMPLETED: 'purple',
  JOINED: 'success',
};

const Candidate = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [designations, setDesignations] = useState<any>([]);
  const [form] = Form.useForm();
  const { getCandidates, createCandidates } = candidateService();
  const { getConfig } = configService();

  const { canCreate, canDelete, canRead } = usePermissions();

  const fetchData = async () => {
    const response = (await getCandidates()) as any;
    console.log(response);
    setCandidates(response.data);
  };
  useEffect(() => {
    getConfig('employeDesignation')
      .then((res: any) => {
        setDesignations(res.data.value || []);
      })
      .catch((err) => {
        console.log(err);
      });

    fetchData();
  }, []);

  console.log(designations);
  // Add Candidate
  const handleAdd = async (values: any) => {
    const newCandidate = {
      key: Date.now().toString(),
      ...values,
      status: 'PENDING',
    };
    console.log(newCandidate);
    // return
    const response = (await createCandidates(newCandidate)) as any;
    console.log(response);
    if (response) {
      setCandidates([...candidates, response.data]);
    }
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      render: (_: any, record: any) => (
        <Space>
          {canRead('candidates') && (
            <Button disabled={!record._id} size="small" type="primary">
              <Link to={`/hrms/candidate/${record?._id}`}>View</Link>
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="module-page">
      <h2>Candidate Management</h2>

      {canCreate('candidates') && (
        <Button
          type="primary"
          onClick={() => setIsModalOpen(true)}
          style={{ marginBottom: 16 }}
        >
          + Add Candidate
        </Button>
      )}

      <ListingTable
        trashConfig={{
          canDelete: canDelete('candidates'),
          modelType: 'candidate',
          onComplete: fetchData,
        }}
        listingTitle="Candidates"
        showRecordId={false}
        rowKey="_id"
        onRefresh={fetchData}
        fields={LISTING_FIELDS.candidates}
        filterKeys={['status', 'designation', 'source']}
        importConfig={
          canCreate('candidates') && listingImport('candidates', fetchData)
        }
        rowHoverable={false}
        columns={columns}
        dataSource={candidates}
      />

      {/* Modal */}
      <Modal
        title="Add Candidate"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleAdd}>
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Enter name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Enter email' },
              { type: 'email', message: 'Enter valid email address' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="Mobile"
            rules={[
              { required: true, message: 'Enter mobile number' },
              {
                pattern: /^[6-9]\d{9}$/,
                message: 'Enter valid 10-digit mobile number',
              },
            ]}
          >
            <Input maxLength={10} />
          </Form.Item>

          <Form.Item
            name="designation"
            label="Designation"
            rules={[{ required: true, message: 'Select designation' }]}
          >
            <Select
              placeholder="Select designation"
              options={designations.map((d: any) => ({
                label: d.label,
                value: d.label,
              }))}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="isBDE" label="Is BDE">
            <Checkbox
              onChange={(e) =>
                form.setFields([{ name: 'isBDE', value: e.target.checked }])
              }
              checked={form.getFieldValue('isBDE')}
            >
              Is BDE
            </Checkbox>
          </Form.Item>
          <Form.Item
            name="source"
            label="Source"
            rules={[{ required: false, message: 'Enter source' }]}
          >
            <Input placeholder="e.g. LinkedIn, Referral" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Add Candidate
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Candidate;
