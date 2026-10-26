import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Spin, Button, Slider, Space, Tooltip, Tag, Segmented } from 'antd';
import { Play, Pause, RotateCcw, Crosshair, Clock } from 'lucide-react';
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
  address?: string;
}

export interface FocusedPosition {
  lat: number;
  lng: number;
  title?: string;
  details?: string[];
}

export interface StaffInfo {
  name: string;
  avatar?: string;
  phone?: string;
}

interface GoogleRouteMapProps {
  points: RoutePoint[];
  segments: RouteSegment[];
  stays: StayPoint[];
  formatDuration: (seconds: number) => string;
  formatTime: (iso: string) => string;
  focusedPosition?: FocusedPosition | null;
  onSelectStay?: (stay: StayPoint, index: number) => void;
  selectedStayIndex?: number | null;
  staffInfo?: StaffInfo | null;
}

// Compute bearing angle between two lat/lng points
const computeBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const toDeg = (x: number) => (x * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const GoogleRouteMap = ({
  points,
  segments,
  stays,
  formatDuration,
  formatTime,
  focusedPosition,
  onSelectStay,
  selectedStayIndex,
  staffInfo,
}: GoogleRouteMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const addressCache = useRef<Map<string, string>>(new Map());
  const playbackMarkerRef = useRef<any>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Route display mode: 'road' (Google Directions snapped) | 'trail' (GPS Breadcrumbs) | 'both'
  const [routeMode, setRouteMode] = useState<'road' | 'trail' | 'both'>('both');

  // Route Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x

  // Reset playback if points change
  useEffect(() => {
    setPlaybackIndex(0);
    setIsPlaying(false);
  }, [points.length]);

  // Initialize Google Maps instance
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
        const defaultCenter = { lat: 26.83865, lng: 75.78781 };
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        infoWindowRef.current = new google.maps.InfoWindow();
        geocoderRef.current = new google.maps.Geocoder();
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
      if (infoWindowRef.current) infoWindowRef.current.close();
      if (playbackMarkerRef.current) playbackMarkerRef.current.map = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mapRef.current) google.maps.event.clearInstanceListeners(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  // Reverse Geocoding with In-Memory Cache
  const fetchAddress = useCallback((lat: number, lng: number): Promise<string> => {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (addressCache.current.has(key)) {
      return Promise.resolve(addressCache.current.get(key)!);
    }

    if (!geocoderRef.current && window.google?.maps?.Geocoder) {
      geocoderRef.current = new google.maps.Geocoder();
    }

    if (!geocoderRef.current) {
      return Promise.resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }

    return new Promise((resolve) => {
      geocoderRef.current!.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const formatted = results[0].formatted_address;
            addressCache.current.set(key, formatted);
            resolve(formatted);
          } else {
            resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        }
      );
    });
  }, []);

  // Helper to display rich InfoWindow with dynamic reverse geocoding
  const showInfoWithGeocode = useCallback(
    async (
      position: google.maps.LatLngLiteral,
      title: string,
      initialRows: string[],
      skipGeocode = false
    ) => {
      const map = mapRef.current;
      const info = infoWindowRef.current;
      if (!map || !info) return;

      const renderContent = (addrText?: string) => {
        const content = document.createElement('div');
        content.style.cssText =
          'padding: 8px 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-width: 220px; max-width: 320px;';

        const titleEl = document.createElement('div');
        titleEl.style.cssText =
          'font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; align-items: center; justify-content: space-between;';
        titleEl.innerHTML = `<span>${title}</span>`;
        content.appendChild(titleEl);

        initialRows.forEach((row) => {
          const line = document.createElement('div');
          line.style.cssText = 'font-size: 12px; line-height: 1.5; color: #475569; margin-bottom: 3px;';
          line.textContent = row;
          content.appendChild(line);
        });

        // Physical Address Section
        const addrBox = document.createElement('div');
        addrBox.style.cssText =
          'margin-top: 6px; padding: 6px 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px; color: #1e293b; line-height: 1.4;';
        addrBox.innerHTML = `<strong style="color: #2563eb;">📍 Google Physical Address:</strong><br/>${addrText || '<span style="color: #94a3b8;">Fetching address from Google…</span>'
          }`;
        content.appendChild(addrBox);

        // Google Maps Link
        const link = document.createElement('a');
        link.href = `https://www.google.com/maps?q=${position.lat},${position.lng}`;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.style.cssText =
          'display: inline-block; margin-top: 6px; font-size: 11px; color: #2563eb; text-decoration: underline; font-weight: 500;';
        link.textContent = '↗ Open in Google Maps';
        content.appendChild(link);

        return content;
      };

      info.setContent(renderContent());
      info.setPosition(position);
      info.open({ map });

      if (!skipGeocode) {
        const physicalAddr = await fetchAddress(position.lat, position.lng);
        info.setContent(renderContent(physicalAddr));
      }
    },
    [fetchAddress]
  );

  // Render Routes, Directions Road Snapping, Stoppages, & Map Click Listener
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const lines: google.maps.Polyline[] = [];
    const markers: any[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const bounds = new google.maps.LatLngBounds();

    // 1. Extend bounds for points
    points.forEach((point) => bounds.extend(point));

    // 2. Click anywhere on the map to reverse-geocode physical address!
    listeners.push(
      map.addListener('click', async (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        const clickedPos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        showInfoWithGeocode(
          clickedPos,
          '📍 Clicked Location',
          [`Coordinates: ${clickedPos.lat.toFixed(5)}, ${clickedPos.lng.toFixed(5)}`]
        );
      })
    );

    // 3. ROAD SNAPPING VIA GOOGLE DIRECTIONS SERVICE (if routeMode is 'road' or 'both')
    if ((routeMode === 'road' || routeMode === 'both') && points.length >= 2) {
      const directionsService = new google.maps.DirectionsService();
      const origin = points[0];
      const destination = points[points.length - 1];

      // Sample key waypoints (max 23 allowed by Google Directions API)
      const waypoints: google.maps.DirectionsWaypoint[] = [];
      const intermediatePoints: RoutePoint[] = [];

      // Prioritize actual stoppages as waypoints
      stays.slice(0, 15).forEach((stay) => {
        intermediatePoints.push({ lat: stay.lat, lng: stay.lng, time: new Date(stay.startTime) });
      });

      // If few stays, sample evenly spaced points along the path
      if (intermediatePoints.length < 5 && points.length > 5) {
        const step = Math.max(1, Math.floor(points.length / 8));
        for (let i = step; i < points.length - 1; i += step) {
          intermediatePoints.push(points[i]);
        }
      }

      intermediatePoints.slice(0, 20).forEach((wp) => {
        waypoints.push({
          location: new google.maps.LatLng(wp.lat, wp.lng),
          stopover: false,
        });
      });

      directionsService.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints,
          optimizeWaypoints: false,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result && result.routes[0]?.overview_path) {
            const roadPolyline = new google.maps.Polyline({
              map,
              path: result.routes[0].overview_path,
              strokeColor: '#2563eb', // Beautiful vivid blue road route
              strokeWeight: 6,
              strokeOpacity: 0.9,
              zIndex: 10,
            });

            listeners.push(
              roadPolyline.addListener('click', (ev: google.maps.MapMouseEvent) => {
                if (ev.latLng) {
                  showInfoWithGeocode(
                    { lat: ev.latLng.lat(), lng: ev.latLng.lng() },
                    '🛣️ Road Route (Google Directions)',
                    [
                      'Snapped along real city streets & roads',
                      `Total Distance: ${result.routes[0].legs.reduce((acc, l) => acc + (l.distance?.value || 0), 0) / 1000} km`,
                    ]
                  );
                }
              })
            );

            lines.push(roadPolyline);
          }
        }
      );
    }

    // 4. GPS BREADCRUMBS & SPEED SEGMENTS (if routeMode is 'trail' or 'both')
    if (routeMode === 'trail' || routeMode === 'both') {
      segments.forEach((segment) => {
        // Skip artificial connections across large gaps (> 15 mins or > 3 km)
        if (segment.timeTaken > 900 && segment.distance > 3000) {
          return;
        }

        const isTrailOnly = routeMode === 'trail';
        const line = new google.maps.Polyline({
          map,
          path: segment.positions.map(([lat, lng]) => ({ lat, lng })),
          strokeColor: segment.color,
          strokeWeight: isTrailOnly ? 5 : 3,
          strokeOpacity: isTrailOnly ? 0.85 : 0.65,
          zIndex: isTrailOnly ? 5 : 1,
          icons: isTrailOnly
            ? [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 2.5,
                  strokeColor: segment.color,
                  fillColor: segment.color,
                  fillOpacity: 1,
                },
                offset: '50%',
                repeat: '120px',
              },
            ]
            : undefined,
        });

        listeners.push(
          line.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const pos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
              showInfoWithGeocode(pos, '🚗 GPS Route Segment', [
                `Time: ${segment.fromTime} → ${segment.toTime}`,
                `Distance: ${(segment.distance / 1000).toFixed(2)} km (${segment.distance}m)`,
                `Time taken: ${formatDuration(segment.timeTaken)}`,
              ]);
            }
          })
        );
        lines.push(line);
      });
    }

    // 5. Stoppages (Numbered Stop Badges)
    stays.forEach((stay, index) => {
      const isSelected = selectedStayIndex === index;
      const stopNumber = index + 1;
      const stayDurationText = formatDuration(stay.duration);

      const content = document.createElement('div');
      content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        background: ${isSelected ? '#e11d48' : '#dc2626'};
        color: white;
        padding: 4px 8px;
        border-radius: 14px;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 3px 8px rgba(220, 38, 38, 0.4);
        border: 2px solid white;
        cursor: pointer;
        transform: translate(-50%, -50%);
        transition: transform 0.2s ease;
      `;
      content.innerHTML = `<span>🛑 #${stopNumber}</span><span style="opacity:0.9;font-weight:500;">(${stayDurationText})</span>`;

      let marker: any;
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: stay.lat, lng: stay.lng },
          title: `Stop #${stopNumber} (${stayDurationText})`,
          content,
        });
      } else {
        marker = new google.maps.Marker({
          map,
          position: { lat: stay.lat, lng: stay.lng },
          title: `Stop #${stopNumber} (${stayDurationText})`,
          label: {
            text: `#${stopNumber}`,
            color: '#ffffff',
            fontWeight: 'bold',
          },
        });
      }

      listeners.push(
        marker.addListener('click', () => {
          showInfoWithGeocode(
            { lat: stay.lat, lng: stay.lng },
            `🛑 Stop #${stopNumber} (${stayDurationText})`,
            [
              `Arrival: ${formatTime(stay.startTime)}`,
              `Departure: ${formatTime(stay.endTime)}`,
              `Stay Duration: ${stayDurationText}`,
            ]
          );
          if (onSelectStay) onSelectStay(stay, index);
        })
      );

      markers.push(marker);
      bounds.extend({ lat: stay.lat, lng: stay.lng });
    });

    // 6. Start Pin (Green flag)
    const start = points[0];
    if (start) {
      const startEl = document.createElement('div');
      startEl.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        background: #16a34a;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 3px 8px rgba(22, 163, 74, 0.4);
        border: 2px solid white;
        cursor: pointer;
        transform: translate(-50%, -50%);
      `;
      startEl.innerHTML = `<span>🚩 Start</span><span style="opacity:0.9;font-weight:500;">(${start.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>`;

      let startMarker: any;
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        startMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: start,
          title: 'Journey Start',
          content: startEl,
        });
      } else {
        startMarker = new google.maps.Marker({
          map,
          position: start,
          title: 'Journey Start',
        });
      }

      listeners.push(
        startMarker.addListener('click', () =>
          showInfoWithGeocode(start, '🚩 Journey Started', [
            `Time: ${start.time.toLocaleTimeString()}`,
            `Coordinates: ${start.lat.toFixed(5)}, ${start.lng.toFixed(5)}`,
          ])
        )
      );
      markers.push(startMarker);
    }

    // 7. End Pin (Last known location)
    const end = points[points.length - 1];
    if (end && (end.lat !== start?.lat || end.lng !== start?.lng)) {
      const endEl = document.createElement('div');
      endEl.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        background: #2563eb;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 3px 8px rgba(37, 99, 235, 0.4);
        border: 2px solid white;
        cursor: pointer;
        transform: translate(-50%, -50%);
      `;
      endEl.innerHTML = `<span>🏁 End</span><span style="opacity:0.9;font-weight:500;">(${end.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>`;

      let endMarker: any;
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        endMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: end,
          title: 'Last Recorded Location',
          content: endEl,
        });
      } else {
        endMarker = new google.maps.Marker({
          map,
          position: end,
          title: 'Last Recorded Location',
        });
      }

      listeners.push(
        endMarker.addListener('click', () =>
          showInfoWithGeocode(end, '🏁 Last Recorded Location', [
            `Time: ${end.time.toLocaleTimeString()}`,
            `Coordinates: ${end.lat.toFixed(5)}, ${end.lng.toFixed(5)}`,
          ])
        )
      );
      markers.push(endMarker);
    }

    boundsRef.current = bounds;

    // Center and fit bounds
    if (bounds.isEmpty()) {
      map.setCenter({ lat: 26.83865, lng: 75.78781 });
      map.setZoom(13);
    } else if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setCenter(bounds.getCenter());
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, 50);
    }

    return () => {
      listeners.forEach((listener) => listener.remove());
      lines.forEach((line) => line.setMap(null));
      markers.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [
    ready,
    points,
    segments,
    stays,
    routeMode,
    selectedStayIndex,
    formatDuration,
    formatTime,
    onSelectStay,
    showInfoWithGeocode,
  ]);

  // Handle Focused Position (e.g. when Stoppage is clicked from the side panel)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focusedPosition) return;

    map.panTo({ lat: focusedPosition.lat, lng: focusedPosition.lng });
    map.setZoom(16);

    showInfoWithGeocode(
      { lat: focusedPosition.lat, lng: focusedPosition.lng },
      focusedPosition.title || 'Location Details',
      focusedPosition.details || [
        `Lat: ${focusedPosition.lat.toFixed(5)}`,
        `Lng: ${focusedPosition.lng.toFixed(5)}`,
      ]
    );
  }, [ready, focusedPosition, showInfoWithGeocode]);

  // Handle Smooth Playback Interpolation Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && points.length > 1) {
      const intervalMs = Math.max(50, 600 / playbackSpeed);
      timer = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= points.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, points.length, playbackSpeed]);

  // Render & Smoothly Animate Playback Marker (Staff Photo Avatar or Bicycle Badge)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || points.length === 0) return;

    const safeIndex = Math.min(playbackIndex, points.length - 1);
    const currentPoint = points[safeIndex];
    if (!currentPoint) return;

    // Calculate heading / bearing towards next point if available
    let bearing = 0;
    if (safeIndex < points.length - 1) {
      const nextPoint = points[safeIndex + 1];
      bearing = Math.round(computeBearing(currentPoint.lat, currentPoint.lng, nextPoint.lat, nextPoint.lng));
    }

    const staffName = staffInfo?.name || 'Staff Member';
    const staffAvatar = staffInfo?.avatar;
    const timeFormatted = currentPoint.time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!playbackMarkerRef.current) {
      const riderContainer = document.createElement('div');
      riderContainer.id = 'staff-playback-marker';
      riderContainer.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: translate(-50%, -50%);
        z-index: 9999;
      `;

      // Top Floating Badge (Staff Name & Time)
      const topBadge = document.createElement('div');
      topBadge.id = 'rider-top-badge';
      topBadge.style.cssText = `
        background: rgba(15, 23, 42, 0.9);
        color: #38bdf8;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        margin-bottom: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 1px solid rgba(56, 189, 248, 0.4);
      `;
      topBadge.textContent = `${staffName} • ${timeFormatted}`;
      riderContainer.appendChild(topBadge);

      // Avatar or Bicycle Disc
      const avatarBox = document.createElement('div');
      avatarBox.id = 'rider-avatar-box';
      avatarBox.style.cssText = `
        position: relative;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(37, 99, 235, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      `;

      if (staffAvatar) {
        avatarBox.innerHTML = `
          <img
            src="${staffAvatar}"
            alt="${staffName}"
            style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #2563eb;"
            onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\"width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#2563eb,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:24px;border:3px solid white;\">🏍️</div>';"
          />
          <span style="position: absolute; bottom: -2px; right: -2px; background: #2563eb; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; border: 1.5px solid white;">🏍️</span>
        `;
      } else {
        avatarBox.innerHTML = `
          <div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 24px; border: 3px solid white;">
            dfds
          </div>
        `;
      }

      riderContainer.appendChild(avatarBox);

      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        playbackMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: currentPoint,
          title: `${staffName} Live Position`,
          content: riderContainer,
          zIndex: 9999,
        });
      } else {
        playbackMarkerRef.current = new google.maps.Marker({
          map,
          position: currentPoint,
          title: `${staffName} Live Position`,
          zIndex: 9999,
        });
      }
    } else {
      playbackMarkerRef.current.position = currentPoint;

      // Update text and heading in top badge
      const topBadge = document.getElementById('rider-top-badge');
      if (topBadge) {
        topBadge.innerHTML = `<span>${staffName} • ${timeFormatted}</span> <span style="display:inline-block;transform:rotate(${bearing}deg);color:#38bdf8;font-size:10px;">▲</span>`;
      }
    }

    if (isPlaying) {
      // Pan map smoothly if marker gets close to viewport boundary
      const mapBounds = map.getBounds();
      if (mapBounds && !mapBounds.contains(currentPoint)) {
        map.panTo(currentPoint);
      }
    }
  }, [ready, playbackIndex, points, isPlaying, staffInfo]);

  const fitAllBounds = () => {
    const map = mapRef.current;
    if (map && boundsRef.current && !boundsRef.current.isEmpty()) {
      map.fitBounds(boundsRef.current, 50);
    }
  };

  const safeIndex = Math.min(playbackIndex, Math.max(0, points.length - 1));
  const currentPlaybackPoint = points[safeIndex];

  return (
    <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Map Viewport */}
      <div
        ref={containerRef}
        style={{ flex: 1, width: '100%', minHeight: 460 }}
        aria-label="Staff route map"
      />

      {/* Floating Header HUD: Route Mode & Fit Bounds */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Route Snapping Mode Selector */}
        <Segmented
          size="small"
          value={routeMode}
          onChange={(val) => setRouteMode(val as any)}
          options={[
            { label: '🛣️ Road Route', value: 'road' },
            { label: '📍 GPS Trail', value: 'trail' },
            { label: '🔀 Both', value: 'both' },
          ]}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontWeight: 500,
          }}
        />

        <Button
          size="small"
          type="default"
          icon={<Crosshair size={14} />}
          onClick={fitAllBounds}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            fontWeight: 500,
          }}
        >
          Fit Route
        </Button>
      </div>

      {/* Playback & Scrubbing Controller Bar */}
      {points.length > 1 && (
        <div
          style={{
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {/* Play/Pause & Reset */}
            <Space size={8}>
              <Button
                type={isPlaying ? 'default' : 'primary'}
                shape="circle"
                size="middle"
                icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
                onClick={() => {
                  if (!isPlaying && playbackIndex >= points.length - 1) {
                    setPlaybackIndex(0);
                  }
                  setIsPlaying(!isPlaying);
                }}
              />
              <Tooltip title="Reset to Start">
                <Button
                  shape="circle"
                  size="middle"
                  icon={<RotateCcw size={15} />}
                  onClick={() => {
                    setIsPlaying(false);
                    setPlaybackIndex(0);
                  }}
                />
              </Tooltip>

              {/* Speed Buttons */}
              <Space.Compact size="small">
                {[1, 2, 5, 10].map((s) => (
                  <Button
                    key={s}
                    type={playbackSpeed === s ? 'primary' : 'default'}
                    onClick={() => setPlaybackSpeed(s)}
                    style={{ fontSize: 12, padding: '0 8px' }}
                  >
                    {s}x
                  </Button>
                ))}
              </Space.Compact>
            </Space>

            {/* Current Scrubbed Time & Accurate Progress Indicator */}
            {currentPlaybackPoint && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '4px 10px',
                }}
              >
                <Clock size={14} color="#64748b" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                  {currentPlaybackPoint.time.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <Tag color="blue" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                  Pt {safeIndex + 1} / {points.length}
                </Tag>
              </div>
            )}
          </div>

          {/* Scrub Slider */}
          <Slider
            min={0}
            max={Math.max(1, points.length - 1)}
            value={safeIndex}
            onChange={(val) => {
              setPlaybackIndex(val);
            }}
            tooltip={{
              formatter: (val) => {
                const pt = points[val ?? 0];
                return pt ? pt.time.toLocaleTimeString() : '';
              },
            }}
            style={{ margin: '6px 4px 2px 4px' }}
          />
        </div>
      )}

      {/* Loading or Auth Error Overlay */}
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
            zIndex: 100,
          }}
        >
          {error ? (
            <Alert
              type="error"
              message="Google Maps unavailable"
              description={error}
              showIcon
            />
          ) : (
            <Spin tip="Loading Google Maps route visualization…">
              <div style={{ width: 180, height: 80 }} />
            </Spin>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleRouteMap;
