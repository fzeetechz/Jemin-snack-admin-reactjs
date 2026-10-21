import { theme } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import GoogleRouteMap from './GoogleRouteMap';
import type { RoutePoint, RouteSegment, StayPoint } from './GoogleRouteMap';

interface LocationData {
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
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const Map = ({ data }: { data: LocationData | null }) => {
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

  const { segments, avgTimePer100m } = useMemo(() => {
    const segs: RouteSegment[] = [];
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 1; i < pointsData.length; i++) {
      const p1 = pointsData[i - 1];
      const p2 = pointsData[i];
      const distance = haversine(p1.lat, p1.lng, p2.lat, p2.lng);
      const timeDiff = (p2.time.getTime() - p1.time.getTime()) / 1000;

      totalDistance += distance;
      totalTime += timeDiff;

      // Color: time taken between 2 points
      let color = 'green';
      if (timeDiff > 120) color = 'red';
      else if (timeDiff > 30) color = 'orange';

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

    const avg = totalDistance > 0 ? (totalTime / totalDistance) * 100 : 0;
    return { segments: segs, avgTimePer100m: Math.round(avg) };
  }, [pointsData]);

  const stays = data?.stays ?? EMPTY_STAYS;
  const summary = data?.summary;

  return (
    <div style={{ fontFamily: token.fontFamily }}>
      {/* Summary Cards */}
      {summary && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          {[
            {
              label: 'Total Distance',
              value: `${(summary.totalDistance / 1000).toFixed(2)} km`,
              icon: '📍',
            },
            {
              label: 'Moving Time',
              value: fmtDuration(Math.round(summary.totalMovingTime)),
              icon: '🚶',
            },
            {
              label: 'Stay Time',
              value: fmtDuration(summary.totalStayTime),
              icon: '🛑',
            },
            { label: 'Avg per 100m', value: `${avgTimePer100m}s`, icon: '⏱️' },
            { label: 'Stops', value: `${stays.length}`, icon: '📌' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                minWidth: 100,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 10,
                padding: '10px 14px',
                textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: token.colorText,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: token.colorTextSecondary,
                  marginTop: 2,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time Filter */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 10,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
          Filter:
        </span>
        <input
          type="datetime-local"
          style={{
            borderRadius: 6,
            border: `1px solid ${token.colorBorder}`,
            color: token.colorText,
            background: token.colorBgContainer,
            padding: '4px 8px',
            fontSize: 13,
          }}
          onChange={(e) =>
            setTimeFilter((p) => ({ ...p, start: e.target.value }))
          }
        />
        <span style={{ color: token.colorTextSecondary }}>→</span>
        <input
          type="datetime-local"
          style={{
            borderRadius: 6,
            border: `1px solid ${token.colorBorder}`,
            color: token.colorText,
            background: token.colorBgContainer,
            padding: '4px 8px',
            fontSize: 13,
          }}
          onChange={(e) =>
            setTimeFilter((p) => ({ ...p, end: e.target.value }))
          }
        />
      </div>

      {/* Legend */}
      <div
        style={{
          marginBottom: 10,
          fontSize: 12,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          color: token.colorTextSecondary,
        }}
      >
        <span>🟢 Fast (&lt;30s)</span>
        <span>🟠 Medium (30–120s)</span>
        <span>🔴 Slow (&gt;120s)</span>
        <span>🔵 Stay Point</span>
      </div>

      <div
        style={{
          height: '65vh',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <GoogleRouteMap
          points={pointsData}
          segments={segments}
          stays={stays}
          formatDuration={fmtDuration}
          formatTime={fmtTime}
        />
      </div>
    </div>
  );
};

export default Map;
