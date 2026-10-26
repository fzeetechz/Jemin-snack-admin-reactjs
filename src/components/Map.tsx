import { theme } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import GoogleRouteMap from './GoogleRouteMap';
import type { RoutePoint, RouteSegment, StayPoint, FocusedPosition, StaffInfo } from './GoogleRouteMap';

export type { RoutePoint, RouteSegment, StayPoint, FocusedPosition, StaffInfo };

export interface LocationData {
  routes?: { points: { lat: number; lng: number; timestamp: string }[] }[];
  stays?: StayPoint[];
  summary?: {
    totalDistance: number;
    totalMovingTime: number;
    totalStayTime: number;
  };
}

const EMPTY_STAYS: StayPoint[] = [];

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtDuration = (sec: number) => {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

interface MapProps {
  data: LocationData | null;
  focusedPosition?: FocusedPosition | null;
  onSelectStay?: (stay: StayPoint, index: number) => void;
  selectedStayIndex?: number | null;
  staffInfo?: StaffInfo | null;
  height?: string | number;
}

const Map = ({
  data,
  focusedPosition,
  onSelectStay,
  selectedStayIndex,
  staffInfo,
  height = '68vh',
}: MapProps) => {
  const { token } = theme.useToken();
  const [pointsData, setPointsData] = useState<RoutePoint[]>([]);
  const [timeFilter, setTimeFilter] = useState({ start: '', end: '' });

  const processPoints = (routes: NonNullable<LocationData['routes']>) => {
    const all: RoutePoint[] = [];
    routes.forEach((r) => {
      r.points.forEach((p) => {
        all.push({ lat: p.lat, lng: p.lng, time: new Date(p.timestamp) });
      });
    });
    return all.sort((a, b) => a.time.getTime() - b.time.getTime());
  };

  useEffect(() => {
    if (data?.routes) {
      let pts = processPoints(data.routes);
      if (timeFilter.start && timeFilter.end) {
        pts = pts.filter(
          (p) =>
            p.time >= new Date(timeFilter.start) &&
            p.time <= new Date(timeFilter.end)
        );
      }
      setPointsData(pts);
    } else {
      setPointsData([]);
    }
  }, [data, timeFilter]);

  const { segments } = useMemo(() => {
    const segs: RouteSegment[] = [];

    for (let i = 1; i < pointsData.length; i++) {
      const p1 = pointsData[i - 1];
      const p2 = pointsData[i];
      const distance = haversine(p1.lat, p1.lng, p2.lat, p2.lng);
      const timeDiff = (p2.time.getTime() - p1.time.getTime()) / 1000;

      // Color coding: green = fast moving, orange = medium, red = traffic / slow
      let color = '#10b981'; // green
      if (timeDiff > 120) color = '#ef4444'; // slow / traffic
      else if (timeDiff > 30) color = '#f59e0b'; // moderate

      segs.push({
        positions: [
          [p1.lat, p1.lng],
          [p2.lat, p2.lng],
        ] as [number, number][],
        color,
        timeTaken: Math.round(timeDiff),
        distance: Math.round(distance),
        fromTime: p1.time.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        toTime: p2.time.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    return { segments: segs };
  }, [pointsData]);

  const stays = data?.stays ?? EMPTY_STAYS;

  return (
    <div style={{ fontFamily: token.fontFamily, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Legend & Quick Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          background: token.colorBgContainer,
          padding: '8px 12px',
          borderRadius: 8,
          border: `1px solid ${token.colorBorderSecondary}`,
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: token.colorText }}>Route Legend:</span>
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Fast (&lt;30s)
          </span>
          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Medium (30–120s)
          </span>
          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> Slow / Jam (&gt;120s)
          </span>
          <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            🛑 Stoppages ({stays.length})
          </span>
        </div>

        {/* Optional Sub-hour DateTime Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: token.colorTextSecondary }}>Filter Range:</span>
          <input
            type="time"
            style={{
              borderRadius: 6,
              border: `1px solid ${token.colorBorder}`,
              color: token.colorText,
              background: token.colorBgContainer,
              padding: '2px 6px',
              fontSize: 12,
            }}
            onChange={(e) => {
              if (!e.target.value) {
                setTimeFilter((p) => ({ ...p, start: '' }));
                return;
              }
              const d = new Date();
              const [h, m] = e.target.value.split(':');
              d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
              setTimeFilter((p) => ({ ...p, start: d.toISOString() }));
            }}
          />
          <span style={{ color: token.colorTextSecondary }}>→</span>
          <input
            type="time"
            style={{
              borderRadius: 6,
              border: `1px solid ${token.colorBorder}`,
              color: token.colorText,
              background: token.colorBgContainer,
              padding: '2px 6px',
              fontSize: 12,
            }}
            onChange={(e) => {
              if (!e.target.value) {
                setTimeFilter((p) => ({ ...p, end: '' }));
                return;
              }
              const d = new Date();
              const [h, m] = e.target.value.split(':');
              d.setHours(parseInt(h, 10), parseInt(m, 10), 59);
              setTimeFilter((p) => ({ ...p, end: d.toISOString() }));
            }}
          />
        </div>
      </div>

      {/* Map Viewport Container */}
      <div
        style={{
          height: height,
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}
      >
        <GoogleRouteMap
          points={pointsData}
          segments={segments}
          stays={stays}
          formatDuration={fmtDuration}
          formatTime={fmtTime}
          focusedPosition={focusedPosition}
          onSelectStay={onSelectStay}
          selectedStayIndex={selectedStayIndex}
          staffInfo={staffInfo}
        />
      </div>
    </div>
  );
};

export default Map;
