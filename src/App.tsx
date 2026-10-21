import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';

import { HelmetProvider } from 'react-helmet-async';
import { StylesContext } from './context';
import routes from './routes/routes.tsx';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { useEffect } from 'react';
import { getComponentTheme } from './theme/config';
import './App.css';
import 'leaflet/dist/leaflet.css';

// Legacy COLOR export for backward compatibility
// TODO: Migrate all usages to theme-aware colors from theme/colors.ts
export const COLOR = {
  50: '#e0f1ff',
  100: '#b0d2ff',
  200: '#7fb0ff',
  300: '#4d8bff',
  400: '#1e79fe',
  500: '#076ee5',
  600: '#0062b3',
  700: '#004f81',
  800: '#003650',
  900: '#001620',
  borderColor: '#E7EAF3B2',
};

function App() {
  const { mytheme } = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = mytheme;
    document.documentElement.style.colorScheme =
      mytheme === 'dark' ? 'dark' : 'light';
  }, [mytheme]);

  return (
    <HelmetProvider>
      <ConfigProvider
        theme={{
          ...getComponentTheme(mytheme === 'dark'),
          algorithm:
            mytheme === 'dark'
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
        }}
      >
        <StylesContext.Provider
          value={{
            rowProps: {
              gutter: [
                { xs: 8, sm: 16, md: 24, lg: 32 },
                { xs: 8, sm: 16, md: 24, lg: 32 },
              ],
            },
            carouselProps: {
              autoplay: true,
              dots: true,
              dotPosition: 'bottom',
              infinite: true,
              slidesToShow: 3,
              slidesToScroll: 1,
            },
          }}
        >
          <RouterProvider router={routes} />
        </StylesContext.Provider>
      </ConfigProvider>
    </HelmetProvider>
  );
}

export default App;
