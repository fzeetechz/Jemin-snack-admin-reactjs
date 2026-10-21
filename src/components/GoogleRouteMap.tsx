import { useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';

export interface RoutePoint {
  lat: number;
  lng: number;
  time: Date;
}

export interface RouteSegment {
  positions: [number, number][];
  color: string;
  timeTaken: number;
  distance: number;
  fromTime: string;
  toTime: string;
}

export interface StayPoint {
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  duration: number;
}

interface GoogleRouteMapProps {
  points: RoutePoint[];
  segments: RouteSegment[];
  stays: StayPoint[];
  formatDuration: (seconds: number) => string;
  formatTime: (iso: string) => string;
}

const GoogleRouteMap = ({
  points,
  segments,
  stays,
  formatDuration,
  formatTime,
}: GoogleRouteMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const onAuthError = () =>
      setError(
        'Google Maps authorization failed. Check the API key, billing and allowed website domains.'
      );
    window.addEventListener('staff-location-map-auth-error', onAuthError);

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: 26.83865, lng: 75.78781 },
          zoom: 13,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
          streetViewControl: false,
        });
        setReady(true);
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Unable to load Google Maps.'
          );
      });

    return () => {
      cancelled = true;
      window.removeEventListener('staff-location-map-auth-error', onAuthError);
      if (mapRef.current)
        google.maps.event.clearInstanceListeners(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const info = new google.maps.InfoWindow();
    const lines: google.maps.Polyline[] = [];
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const bounds = new google.maps.LatLngBounds();
    const showInfo = (
      position: google.maps.LatLng | google.maps.LatLngLiteral,
      rows: string[]
    ) => {
      const content = document.createElement('div');
      content.style.cssText = 'font-size:13px;line-height:1.8;color:#1a1a1a';
      rows.forEach((row) => {
        const line = document.createElement('div');
        line.textContent = row;
        content.appendChild(line);
      });
      info.setContent(content);
      info.setPosition(position);
      info.open({ map });
    };

    points.forEach((point) => bounds.extend(point));
    segments.forEach((segment) => {
      const line = new google.maps.Polyline({
        map,
        path: segment.positions.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: segment.color,
        strokeWeight: 5,
        strokeOpacity: 0.85,
      });
      listeners.push(
        line.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng)
            showInfo(event.latLng, [
              `${segment.fromTime} → ${segment.toTime}`,
              `Distance: ${segment.distance}m`,
              `Time taken: ${formatDuration(segment.timeTaken)}`,
            ]);
        })
      );
      lines.push(line);
    });

    const addMarker = (
      position: google.maps.LatLngLiteral,
      title: string,
      color: string,
      rows: string[],
      stay = false
    ) => {
      const content = document.createElement('div');
      content.style.cssText = stay
        ? 'width:20px;height:20px;border:2px solid #1677ff;background:rgba(22,119,255,.3);border-radius:50%;cursor:pointer'
        : `width:24px;height:24px;border:3px solid white;background:${color};border-radius:50%;box-shadow:0 2px 6px #0005;cursor:pointer`;
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        title,
        content,
      });
      listeners.push(
        marker.addListener('click', () => showInfo(position, rows))
      );
      markers.push(marker);
      bounds.extend(position);
    };

    stays.forEach((stay) =>
      addMarker(
        stay,
        'Stay point',
        '#1677ff',
        [
          `${formatTime(stay.startTime)} → ${formatTime(stay.endTime)}`,
          `Duration: ${formatDuration(stay.duration)}`,
        ],
        true
      )
    );
    const start = points[0];
    const end = points[points.length - 1];
    if (start)
      addMarker(start, 'Start', 'green', [
        'Start',
        start.time.toLocaleTimeString(),
      ]);
    if (end && end !== start)
      addMarker(end, 'End', 'red', ['End', end.time.toLocaleTimeString()]);

    if (bounds.isEmpty()) {
      map.setCenter({ lat: 26.83865, lng: 75.78781 });
      map.setZoom(13);
    } else if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setCenter(bounds.getCenter());
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, 48);
    }

    return () => {
      info.close();
      listeners.forEach((listener) => listener.remove());
      lines.forEach((line) => line.setMap(null));
      markers.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [ready, points, segments, stays, formatDuration, formatTime]);

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%' }}
        aria-label="Staff route map"
      />
      {(error || !ready) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(255,255,255,.9)',
          }}
        >
          {error ? (
            <Alert
              type="error"
              title="Google Maps unavailable"
              description={error}
              showIcon
            />
          ) : (
            <Spin tip="Loading Google Maps…">
              <div style={{ width: 180, height: 80 }} />
            </Spin>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleRouteMap;
