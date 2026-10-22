import { usePermissions } from '../hooks/usePermissions';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';
import { Button, Card, DatePicker, Space, Tag } from 'antd';
import { Locate } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useSearchParams } from 'react-router-dom';
import Map from 'src/components/Map';
import apiClient from 'src/services/api/apiClient';
import { API_ENDPOINTS } from 'src/services/api/endpoints';
import staffService from 'src/services/staffService';
import dayjs, { Dayjs } from 'dayjs';

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
};

const Location = () => {
  const { canDelete } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [locationData, setLocationData] = useState(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const userId = searchParams.get('userId');
  console.log(userId);
  console.log(locationData);
  const getUserLocation = useCallback(async () => {
    const date = selectedDate.format('YYYY-MM-DD');
    try {
      const res = await apiClient.get(
        `${API_ENDPOINTS.LOCATION.GET}?userId=${userId}&date=${date}&responseType=simple`
      );

      if (res.data.success) {
        setLocationData(res.data.data);
      } else {
        setLocationData(null);
      }
    } catch (error) {
      console.log(error);
      setLocationData(null);
    }
  }, [userId, selectedDate]);

  const normalizeUser = (user: any): User => ({
    ...user,
    created_at: user?.created_at ?? user?.createdAt ?? '',
    createdAt: user?.createdAt ?? user?.created_at ?? '',
  });

  const { getStaff } = staffService();

  const getStaffs = async () => {
    const res = (await getStaff()) as any;
    if (res.success) {
      setUsers((res.data.items ?? []).map(normalizeUser));
    }
  };

  useEffect(() => {
    getStaffs();
  }, []);

  useEffect(() => {
    if (userId) {
      getUserLocation();
    }
  }, [userId, selectedDate]);
  const columns = [
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            onClick={() => {
              setSearchParams({ userId: record._id });
            }}
          >
            <Locate size={16} strokeWidth={1.8} />
            View
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <div>
      <div className="module-page">
        <Card title="Staff Location ">
          {userId ? (
            <div style={{ height: '60%' }}>
              <Space wrap style={{ marginBottom: 18 }}>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => date && setSelectedDate(date)}
                  allowClear={false}
                  disabledDate={(d) => d.isAfter(dayjs())}
                />
                <Button type="primary" onClick={getUserLocation}>
                  Apply
                </Button>
                <Button onClick={() => setSearchParams({})}>← Back</Button>
              </Space>
              <Map data={locationData} />
            </div>
          ) : (
            <ListingTable trashConfig={{ canDelete: canDelete('users'), modelType: 'staff', recordName: (row) => `staff member ${row.firstName} ${row.lastName}`, onComplete: getStaffs }} listingTitle="Staff Locations" onRefresh={getStaffs} fields={LISTING_FIELDS.staff} filterKeys={["status","roleId"]}
              rowKey={(record) => record._id}
              columns={columns}
              dataSource={users}
              pagination={{ pageSize: 10 }}
              rowHoverable={false}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Location;
