let mapsPromise: Promise<void> | undefined;

declare global {
  interface Window {
    initStaffLocationMap?: () => void;
    gm_authFailure?: () => void;
  }
}

export const loadGoogleMaps = (): Promise<void> => {
  if (mapsPromise) return mapsPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is not configured.'));
  }

  mapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(
      () => fail('Google Maps took too long to load. Please reload the page.'),
      30000
    );
    const fail = (message: string) => {
      window.clearTimeout(timeout);
      reject(new Error(message));
    };

    window.initStaffLocationMap = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    window.gm_authFailure = () => {
      fail(
        'Google Maps authorization failed. Check the API key, billing and allowed website domains.'
      );
      window.dispatchEvent(new Event('staff-location-map-auth-error'));
    };
    const params = new URLSearchParams({
      key: apiKey,
      loading: 'async',
      callback: 'initStaffLocationMap',
      libraries: 'maps,marker,geometry',
      v: 'weekly',
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () =>
      fail(
        'Unable to load Google Maps. Check your connection and reload the page.'
      );
    document.head.appendChild(script);
  });

  return mapsPromise;
};
