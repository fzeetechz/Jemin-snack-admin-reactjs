import { usePermissions } from '../hooks/usePermissions';
import ListingTable from 'src/components/shared/listing/ListingTable';
import { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';
import {
  Button,
  Card,
  DatePicker,
  Space,
  Tag,
  Tabs,
  Badge,
  Alert,
  Progress,
  Row,
  Col,
  Statistic,
  Empty,
} from 'antd';
import {
  Locate,
  MapPin,
  Compass,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Map from 'src/components/Map';
import type { StayPoint, FocusedPosition, LocationData } from 'src/components/Map';
import apiClient from 'src/services/api/apiClient';
import { API_ENDPOINTS } from 'src/services/api/endpoints';
import staffService from 'src/services/staffService';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type UserStatus = 'active' | 'inactive';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: any;
  status: UserStatus;
  created_at: string;
  createdAt?: string;
  department?: string;
  avatar?: string;
  profileImage?: string;
}

interface DeviceTelemetry {
  _id?: string;
  userId: string | { _id: string; firstName?: string; lastName?: string; name?: string; phone?: string };
  battery?: {
    level?: number;
    isCharging?: boolean;
    isPowerSaveMode?: boolean;
    status?: string;
    updatedAt?: string;
  };
  network?: {
    isOnline?: boolean;
    isConnected?: boolean;
    isInternetReachable?: boolean;
    connectionType?: string;
    carrier?: string;
    wifiSsid?: string;
    ipAddress?: string;
    updatedAt?: string;
  };
  deviceState?: {
    isDeviceOff?: boolean;
    powerState?: string;
    lastActiveAt?: string;
    lastShutdownAt?: string;
    offlineReason?: string;
    lastBootTime?: string;
  };
  permissions?: {
    fineLocation?: boolean;
    backgroundLocation?: boolean;
    coarseLocation?: boolean;
    isGpsEnabled?: boolean;
    camera?: boolean;
    notification?: boolean;
    lastCheckedAt?: string;
  };
  deviceInfo?: {
    brand?: string;
    model?: string;
    manufacturer?: string;
    androidVersion?: string;
    systemVersion?: string;
    appVersion?: string;
    isEmulator?: boolean;
  };
  lastLocation?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    address?: string;
    updatedAt?: string;
  };
  recentLogs?: Array<{
    event: string;
    message: string;
    meta?: any;
    timestamp: string;
  }>;
  updatedAt?: string;
}

const fmtDuration = (sec: number) => {
  if (!sec || sec < 60) return `${Math.round(sec || 0)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h > 0) {
    return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
  }
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const fmtTime = (iso: string) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Location = () => {
  const { canDelete } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [deviceMap, setDeviceMap] = useState<Record<string, DeviceTelemetry>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceTelemetry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [focusedPosition, setFocusedPosition] = useState<FocusedPosition | null>(null);
  const [selectedStayIndex, setSelectedStayIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'stops' | 'device' | 'logs'>('stops');

  const userId = searchParams.get('userId');

  const normalizeUser = (user: any): User => ({
    ...user,
    created_at: user?.created_at ?? user?.createdAt ?? '',
    createdAt: user?.createdAt ?? user?.created_at ?? '',
  });

  const { getStaff } = staffService();

  // Load all staff list and all device telemetry
  const loadStaffAndDevices = useCallback(async () => {
    try {
      const [staffRes, deviceRes] = await Promise.allSettled([
        getStaff(),
        apiClient.get(API_ENDPOINTS.DEVICE.LIST),
      ]);

      if (staffRes.status === 'fulfilled' && (staffRes.value as any)?.success) {
        setUsers(((staffRes.value as any).data.items ?? []).map(normalizeUser));
      }

      if (deviceRes.status === 'fulfilled' && deviceRes.value?.data?.success) {
        const dMap: Record<string, DeviceTelemetry> = {};
        const list: DeviceTelemetry[] = deviceRes.value.data.data ?? [];
        list.forEach((item) => {
          const uid =
            typeof item.userId === 'object' && item.userId?._id
              ? item.userId._id
              : String(item.userId);
          if (uid) dMap[uid] = item;
        });
        setDeviceMap(dMap);
      }
    } catch (e) {
      console.error('Error fetching staff and device statuses:', e);
    }
  }, []);

  useEffect(() => {
    loadStaffAndDevices();
  }, [loadStaffAndDevices]);

  // Fetch location history and device status for selected staff member
  const getUserLocationAndDevice = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const date = selectedDate.format('YYYY-MM-DD');

    try {
      const [locRes, devRes] = await Promise.allSettled([
        apiClient.get(
          `${API_ENDPOINTS.LOCATION.GET}?userId=${userId}&date=${date}&responseType=simple`
        ),
        apiClient.get(API_ENDPOINTS.DEVICE.STATUS(userId)),
      ]);

      if (locRes.status === 'fulfilled' && locRes.value?.data?.success) {
        setLocationData(locRes.value.data.data);
      } else {
        setLocationData(null);
      }

      if (devRes.status === 'fulfilled' && devRes.value?.data?.success) {
        setDeviceStatus(devRes.value.data.data);
      } else {
        // Fallback to cached deviceMap entry if available
        setDeviceStatus(deviceMap[userId] || null);
      }
    } catch (error) {
      console.error('Error fetching location/device status:', error);
      setLocationData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedDate, deviceMap]);

  useEffect(() => {
    if (userId) {
      getUserLocationAndDevice();
    }
  }, [userId, selectedDate, getUserLocationAndDevice]);

  // Active staff object
  const activeStaff = useMemo(() => {
    return users.find((u) => u._id === userId) || null;
  }, [users, userId]);

  // Handle clicking a stoppage from the timeline
  const handleSelectStay = (stay: StayPoint, index: number) => {
    setSelectedStayIndex(index);
    const stopNumber = index + 1;
    setFocusedPosition({
      lat: stay.lat,
      lng: stay.lng,
      title: `🛑 Stop #${stopNumber} (${fmtDuration(stay.duration)})`,
      details: [
        `Arrival: ${fmtTime(stay.startTime)}`,
        `Departure: ${fmtTime(stay.endTime)}`,
        `Stay Duration: ${fmtDuration(stay.duration)}`,
        stay.address ? `Address: ${stay.address}` : `GPS: ${stay.lat.toFixed(5)}, ${stay.lng.toFixed(5)}`,
      ],
    });
  };

  // Staff Listing Columns (View when no staff is selected)
  const columns = [
    {
      title: 'Staff Member',
      key: 'name',
      render: (_: any, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {record.firstName?.[0] || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>
              {record.firstName} {record.lastName}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.phone}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'roleId',
      key: 'roleId',
      render: (roleId: any) => (
        <Tag color="blue">{roleId?.name ?? 'Not Assigned'}</Tag>
      ),
    },
    {
      title: 'Live Device & GPS Status',
      key: 'deviceStatus',
      render: (_: any, record: User) => {
        const dev = deviceMap[record._id];
        if (!dev) {
          return <span style={{ color: '#94a3b8', fontSize: 12 }}>No Device Linked</span>;
        }

        const isOnline = dev.network?.isOnline === true;
        const isDeviceOff = dev.deviceState?.isDeviceOff === true;
        const isGpsOn = dev.permissions?.isGpsEnabled !== false;
        const batteryLvl = dev.battery?.level;
        const isCharging = dev.battery?.isCharging;
        const deviceModel = dev.deviceInfo?.model || dev.deviceInfo?.brand || '';

        return (
          <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {isOnline ? (
                <Badge status="success" text={<span style={{ fontWeight: 600, color: '#16a34a' }}>Online</span>} />
              ) : isDeviceOff ? (
                <Badge status="error" text={<span style={{ fontWeight: 600, color: '#dc2626' }}>Phone Shut Down</span>} />
              ) : (
                <Badge
                  status="default"
                  text={
                    <span style={{ color: '#64748b' }}>
                      Offline {dev.deviceState?.lastActiveAt ? dayjs(dev.deviceState.lastActiveAt).fromNow() : ''}
                    </span>
                  }
                />
              )}

              {/* GPS Switch Pill */}
              {isGpsOn ? (
                <Tag color="success" style={{ margin: 0, padding: '0 6px', fontSize: 11 }}>
                  📍 GPS ON
                </Tag>
              ) : (
                <Tag color="error" style={{ margin: 0, padding: '0 6px', fontSize: 11, fontWeight: 700 }}>
                  🚨 GPS OFF!
                </Tag>
              )}

              {/* Battery Pill */}
              {batteryLvl !== undefined && (
                <Tag
                  color={batteryLvl > 20 ? 'blue' : 'red'}
                  style={{ margin: 0, padding: '0 6px', fontSize: 11 }}
                >
                  🔋 {batteryLvl}% {isCharging ? '⚡' : ''}
                </Tag>
              )}
            </div>

            {deviceModel && (
              <span style={{ color: '#94a3b8', fontSize: 11 }}>
                📱 {deviceModel}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Account Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'actions',
      render: (_: any, record: User) => (
        <Button
          type="primary"
          icon={<Locate size={15} />}
          onClick={() => setSearchParams({ userId: record._id })}
        >
          Route & Device
        </Button>
      ),
    },
  ];

  // Tamper / Investigation Statuses
  const isGpsDisabled = deviceStatus?.permissions?.isGpsEnabled === false;
  const isBgLocationDenied = deviceStatus?.permissions?.backgroundLocation === false;
  const isPhoneShutdown =
    deviceStatus?.deviceState?.isDeviceOff === true ||
    deviceStatus?.deviceState?.powerState === 'SHUTDOWN';
  const isPowerSaveMode = deviceStatus?.battery?.isPowerSaveMode === true;
  const isEmulator = deviceStatus?.deviceInfo?.isEmulator === true;

  const stays = locationData?.stays ?? [];
  const summary = locationData?.summary;
  const recentLogs = deviceStatus?.recentLogs ?? [];

  return (
    <div className="module-page" style={{ padding: '4px 0' }}>
      <Card
        bordered={false}
        style={{
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderRadius: 14,
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        {userId ? (
          <div>
            {/* Top Navigation & Action Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              {/* Staff Details & Back */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Button
                  icon={<ArrowLeft size={16} />}
                  onClick={() => setSearchParams({})}
                  style={{ fontWeight: 500 }}
                >
                  All Staff
                </Button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      {activeStaff
                        ? `${activeStaff.firstName} ${activeStaff.lastName}`
                        : 'Staff Investigation'}
                    </h2>

                    {deviceStatus?.network?.isOnline ? (
                      <Badge status="success" text={<span style={{ color: '#16a34a', fontWeight: 600 }}>Online</span>} />
                    ) : isPhoneShutdown ? (
                      <Badge status="error" text={<span style={{ color: '#dc2626', fontWeight: 600 }}>Phone OFF</span>} />
                    ) : (
                      <Badge status="default" text={<span style={{ color: '#64748b' }}>Offline</span>} />
                    )}

                    {isGpsDisabled && (
                      <Tag color="error" style={{ fontWeight: 700 }}>
                        🚨 GPS OFF
                      </Tag>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    <span>📞 {activeStaff?.phone || 'No phone'}</span>
                    {deviceStatus?.deviceInfo?.model && (
                      <span style={{ marginLeft: 12 }}>
                        📱 {deviceStatus.deviceInfo.brand} {deviceStatus.deviceInfo.model}
                      </span>
                    )}
                    {deviceStatus?.deviceState?.lastActiveAt && (
                      <span style={{ marginLeft: 12 }}>
                        🕒 Last Active: {dayjs(deviceStatus.deviceState.lastActiveAt).format('DD MMM, hh:mm A')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Filters & Quick Shortcuts */}
              <Space wrap size={8}>
                <Space.Compact>
                  <Button
                    type={selectedDate.isSame(dayjs(), 'day') ? 'primary' : 'default'}
                    onClick={() => setSelectedDate(dayjs())}
                  >
                    Today
                  </Button>
                  <Button
                    type={selectedDate.isSame(dayjs().subtract(1, 'day'), 'day') ? 'primary' : 'default'}
                    onClick={() => setSelectedDate(dayjs().subtract(1, 'day'))}
                  >
                    Yesterday
                  </Button>
                </Space.Compact>

                <DatePicker
                  value={selectedDate}
                  onChange={(d) => d && setSelectedDate(d)}
                  allowClear={false}
                  disabledDate={(d) => d.isAfter(dayjs())}
                  style={{ width: 140 }}
                />

                <Button
                  icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
                  onClick={getUserLocationAndDevice}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            </div>

            {/* Anti-Tampering & Security Alert Banners */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {isGpsDisabled && (
                <Alert
                  type="error"
                  showIcon
                  icon={<ShieldAlert size={20} />}
                  message="🚨 GPS Hardware Turned OFF by Staff Member!"
                  description="Device GPS/Location service was manually switched off on the phone. The app cannot record background route points while GPS is disabled."
                />
              )}

              {isPhoneShutdown && (
                <Alert
                  type="warning"
                  showIcon
                  icon={<AlertTriangle size={20} />}
                  message="🔌 Phone Was Powered Down / Shut Off"
                  description={`The phone was shut down at ${deviceStatus?.deviceState?.lastShutdownAt
                      ? dayjs(deviceStatus.deviceState.lastShutdownAt).format('DD MMM YYYY, hh:mm:ss A')
                      : 'Unknown time'
                    }. Reason reported: ${deviceStatus?.deviceState?.offlineReason || 'device_off'}.`}
                />
              )}

              {isBgLocationDenied && (
                <Alert
                  type="warning"
                  showIcon
                  message="⚠️ Background Location Permission Revoked"
                  description="The staff member did not grant 'Allow all the time' background location permission in phone settings. Route tracking will stop when the app is minimized."
                />
              )}

              {isPowerSaveMode && (
                <Alert
                  type="info"
                  showIcon
                  message="🔋 Battery Saver Mode Active on Staff Phone"
                  description="Power saver mode is active. Android OS may aggressively throttle GPS requests or sleep background services to conserve power."
                />
              )}

              {isEmulator && (
                <Alert
                  type="error"
                  showIcon
                  message="🚨 Emulator / Virtual Device Detected"
                  description="This staff member is running an Android emulator or computer virtual machine instead of a real mobile device!"
                />
              )}
            </div>

            {/* Top Metrics Ribbon */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6} md={6}>
                <Card size="small" style={{ borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Statistic
                    title={<span style={{ fontSize: 12, color: '#64748b' }}>🚗 Total Traveled</span>}
                    value={summary ? (summary.totalDistance / 1000).toFixed(2) : '0.00'}
                    suffix={<span style={{ fontSize: 13, fontWeight: 500 }}>km</span>}
                    valueStyle={{ fontWeight: 700, color: '#0f172a', fontSize: 22 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6} md={6}>
                <Card size="small" style={{ borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Statistic
                    title={<span style={{ fontSize: 12, color: '#64748b' }}>⏱️ Moving Time</span>}
                    value={summary ? fmtDuration(summary.totalMovingTime) : '0m'}
                    valueStyle={{ fontWeight: 700, color: '#16a34a', fontSize: 22 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6} md={6}>
                <Card size="small" style={{ borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Statistic
                    title={<span style={{ fontSize: 12, color: '#64748b' }}>🛑 Stay / Idle Time</span>}
                    value={summary ? fmtDuration(summary.totalStayTime) : '0m'}
                    suffix={
                      <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                        ({stays.length} stops)
                      </span>
                    }
                    valueStyle={{ fontWeight: 700, color: '#dc2626', fontSize: 22 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6} md={6}>
                <Card size="small" style={{ borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>📱 Live Device Health</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      {deviceStatus?.battery?.level !== undefined ? `${deviceStatus.battery.level}%` : '--'}
                      {deviceStatus?.battery?.isCharging ? ' ⚡' : ''}
                    </div>
                    <div>
                      {deviceStatus?.network?.isOnline ? (
                        <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
                          {deviceStatus.network.connectionType?.toUpperCase() || 'ONLINE'}
                        </Tag>
                      ) : (
                        <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
                          OFFLINE
                        </Tag>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    GPS: {deviceStatus?.permissions?.isGpsEnabled ? '🟢 Enabled' : '🔴 Disabled'}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Main Content: Split Map (Left) & Investigation Tabs (Right) */}
            <Row gutter={[16, 16]}>
              {/* Map & Route Player Container */}
              <Col xs={24} lg={15} xl={16}>
                <Card
                  size="small"
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        🗺️ Route Map & Timeline Playback
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                        Date: {selectedDate.format('DD MMMM YYYY')}
                      </span>
                    </div>
                  }
                  style={{
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                  }}
                  styles={{ body: { padding: 0 } }}
                >
                  <Map
                    data={locationData}
                    focusedPosition={focusedPosition}
                    onSelectStay={handleSelectStay}
                    selectedStayIndex={selectedStayIndex}
                    staffInfo={
                      activeStaff
                        ? {
                          name: `${activeStaff.firstName} ${activeStaff.lastName}`.trim(),
                          avatar: activeStaff.avatar || activeStaff.profileImage,
                          phone: activeStaff.phone,
                        }
                        : null
                    }
                    height="68vh"
                  />
                </Card>
              </Col>

              {/* Right Side: Investigation Tabs (Stoppages, Device Status, Anti-Cheat Logs) */}
              <Col xs={24} lg={9} xl={8}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  styles={{ body: { padding: '12px 16px', flex: 1, overflowY: 'auto', maxHeight: '74vh' } }}
                >
                  <Tabs
                    activeKey={activeTab}
                    onChange={(k) => setActiveTab(k as any)}
                    items={[
                      {
                        key: 'stops',
                        label: (
                          <span>
                            🛑 Stoppages{' '}
                            <Badge
                              count={stays.length}
                              overflowCount={99}
                              style={{ backgroundColor: stays.length > 0 ? '#dc2626' : '#94a3b8' }}
                            />
                          </span>
                        ),
                        children: (
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                              }}
                            >
                              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                                Stoppages recorded on {selectedDate.format('DD MMM')}:
                              </span>
                            </div>

                            {stays.length === 0 ? (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No extended stops recorded on this date."
                                style={{ margin: '36px 0' }}
                              />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {stays.map((stay, idx) => {
                                  const isSelected = selectedStayIndex === idx;
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => handleSelectStay(stay, idx)}
                                      style={{
                                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                        background: isSelected ? '#eff6ff' : '#ffffff',
                                        borderRadius: 8,
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSelected
                                          ? '0 2px 8px rgba(37,99,235,0.15)'
                                          : '0 1px 3px rgba(0,0,0,0.02)',
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          marginBottom: 4,
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <Tag color="red" style={{ fontWeight: 700, margin: 0 }}>
                                            Stop #{idx + 1}
                                          </Tag>
                                          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                                            {fmtDuration(stay.duration)}
                                          </span>
                                        </div>

                                        <Button
                                          size="small"
                                          type="link"
                                          icon={<MapPin size={13} />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectStay(stay, idx);
                                          }}
                                          style={{ padding: '0 4px', fontSize: 11 }}
                                        >
                                          Show on Map
                                        </Button>
                                      </div>

                                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                                        🕒 {fmtTime(stay.startTime)} → {fmtTime(stay.endTime)}
                                      </div>

                                      <div
                                        style={{
                                          fontSize: 11,
                                          color: '#64748b',
                                          marginTop: 4,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4,
                                        }}
                                      >
                                        <Compass size={12} color="#94a3b8" />
                                        <span>
                                          {stay.address || `${stay.lat.toFixed(5)}, ${stay.lng.toFixed(5)}`}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: 'device',
                        label: (
                          <span>
                            📱 Device Health{' '}
                            {isGpsDisabled && <Badge dot color="red" />}
                          </span>
                        ),
                        children: (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Battery Section */}
                            <div
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '12px 14px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 6,
                                }}
                              >
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                                  🔋 Battery Level
                                </span>
                                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                                  {deviceStatus?.battery?.level !== undefined
                                    ? `${deviceStatus.battery.level}%`
                                    : 'N/A'}{' '}
                                  {deviceStatus?.battery?.isCharging ? '⚡ Charging' : ''}
                                </span>
                              </div>
                              <Progress
                                percent={deviceStatus?.battery?.level || 0}
                                status={
                                  (deviceStatus?.battery?.level || 0) < 20
                                    ? 'exception'
                                    : 'normal'
                                }
                                strokeColor={
                                  (deviceStatus?.battery?.level || 0) < 20
                                    ? '#ef4444'
                                    : (deviceStatus?.battery?.level || 0) < 50
                                      ? '#f59e0b'
                                      : '#10b981'
                                }
                              />
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: 11,
                                  color: '#64748b',
                                  marginTop: 4,
                                }}
                              >
                                <span>
                                  Power Saver:{' '}
                                  {deviceStatus?.battery?.isPowerSaveMode ? '⚠️ Active' : 'Off'}
                                </span>
                                <span>
                                  Status: {deviceStatus?.battery?.status || 'Normal'}
                                </span>
                              </div>
                            </div>

                            {/* Network & Connectivity */}
                            <div
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '12px 14px',
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 8 }}>
                                🌐 Network Connectivity
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                                <div>
                                  <span style={{ color: '#64748b' }}>Internet: </span>
                                  {deviceStatus?.network?.isOnline ? (
                                    <Tag color="success" style={{ margin: 0 }}>Online</Tag>
                                  ) : (
                                    <Tag color="error" style={{ margin: 0 }}>Offline</Tag>
                                  )}
                                </div>
                                <div>
                                  <span style={{ color: '#64748b' }}>Type: </span>
                                  <span style={{ fontWeight: 600 }}>
                                    {deviceStatus?.network?.connectionType?.toUpperCase() || 'UNKNOWN'}
                                  </span>
                                </div>
                                <div>
                                  <span style={{ color: '#64748b' }}>Carrier: </span>
                                  <span style={{ fontWeight: 500 }}>
                                    {deviceStatus?.network?.carrier || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span style={{ color: '#64748b' }}>WiFi SSID: </span>
                                  <span style={{ fontWeight: 500 }}>
                                    {deviceStatus?.network?.wifiSsid || 'None'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Permissions & GPS Hardware Status */}
                            <div
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '12px 14px',
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 8 }}>
                                🛂 Security & Permissions Checklist
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>Hardware GPS / Location Switch:</span>
                                  {deviceStatus?.permissions?.isGpsEnabled !== false ? (
                                    <Tag color="success" style={{ margin: 0 }}>🟢 ENABLED</Tag>
                                  ) : (
                                    <Tag color="error" style={{ margin: 0, fontWeight: 700 }}>🚨 DISABLED!</Tag>
                                  )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>Background Location Permission:</span>
                                  {deviceStatus?.permissions?.backgroundLocation !== false ? (
                                    <Tag color="success" style={{ margin: 0 }}>🟢 GRANTED</Tag>
                                  ) : (
                                    <Tag color="warning" style={{ margin: 0, fontWeight: 700 }}>⚠️ DENIED</Tag>
                                  )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>Fine Precise Location:</span>
                                  {deviceStatus?.permissions?.fineLocation !== false ? (
                                    <Tag color="success" style={{ margin: 0 }}>🟢 GRANTED</Tag>
                                  ) : (
                                    <Tag color="error" style={{ margin: 0 }}>🔴 DENIED</Tag>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Device Hardware Specs */}
                            <div
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '12px 14px',
                                fontSize: 12,
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 8 }}>
                                📱 Phone Hardware & Version
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#475569' }}>
                                <div>
                                  <strong>Brand / Model: </strong>
                                  {deviceStatus?.deviceInfo?.brand} {deviceStatus?.deviceInfo?.model || 'Unknown'}
                                </div>
                                <div>
                                  <strong>Android OS: </strong>
                                  Version {deviceStatus?.deviceInfo?.androidVersion || 'N/A'}
                                </div>
                                <div>
                                  <strong>Staff App Version: </strong>
                                  v{deviceStatus?.deviceInfo?.appVersion || 'N/A'}
                                </div>
                                <div>
                                  <strong>Emulator Check: </strong>
                                  {deviceStatus?.deviceInfo?.isEmulator ? (
                                    <Tag color="error">🚨 EMULATOR DETECTED</Tag>
                                  ) : (
                                    <Tag color="success">Real Phone</Tag>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'logs',
                        label: (
                          <span>
                            🛡️ Tamper Audit Logs{' '}
                            {recentLogs.length > 0 && <Badge count={recentLogs.length} overflowCount={99} />}
                          </span>
                        ),
                        children: (
                          <div>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                              Security audit events reported by the staff device:
                            </div>

                            {recentLogs.length === 0 ? (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No security or tamper events recorded."
                                style={{ margin: '36px 0' }}
                              />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {recentLogs.slice().reverse().map((log, lIdx) => {
                                  const isAlert =
                                    log.event.includes('OFF') ||
                                    log.event.includes('SHUTDOWN') ||
                                    log.event.includes('DENIED') ||
                                    log.event.includes('KILL');

                                  return (
                                    <div
                                      key={lIdx}
                                      style={{
                                        border: isAlert ? '1px solid #fecaca' : '1px solid #e2e8f0',
                                        background: isAlert ? '#fff5f5' : '#ffffff',
                                        borderRadius: 8,
                                        padding: '8px 10px',
                                        fontSize: 12,
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          marginBottom: 2,
                                        }}
                                      >
                                        <Tag color={isAlert ? 'error' : 'blue'} style={{ margin: 0, fontSize: 11 }}>
                                          {log.event}
                                        </Tag>
                                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                          {log.timestamp ? dayjs(log.timestamp).format('hh:mm:ss A') : ''}
                                        </span>
                                      </div>
                                      <div style={{ color: '#334155', marginTop: 4, fontWeight: 500 }}>
                                        {log.message || log.event}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <ListingTable
            trashConfig={{
              canDelete: canDelete('users'),
              modelType: 'staff',
              recordName: (row) => `staff member ${row.firstName} ${row.lastName}`,
              onComplete: loadStaffAndDevices,
            }}
            listingTitle="Staff Field Tracking & Device Health"
            onRefresh={loadStaffAndDevices}
            fields={LISTING_FIELDS.staff}
            filterKeys={['status', 'roleId']}
            rowKey={(record) => record._id}
            columns={columns}
            dataSource={users}
            pagination={{ pageSize: 10 }}
            rowHoverable={false}
          />
        )}
      </Card>
    </div>
  );
};

export default Location;
