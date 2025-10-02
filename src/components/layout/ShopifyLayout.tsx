import { Frame, Navigation, TopBar } from '@shopify/polaris';
import {
  HomeIcon,
  ChatIcon,
  SettingsIcon,
  ChartLineIcon,
  PhoneIcon,
  StoreIcon,
  CodeIcon,
} from '@shopify/polaris-icons';
import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShopifyLayoutProps {
  children: React.ReactNode;
}

export default function ShopifyLayout({ children }: ShopifyLayoutProps) {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMobileNavigationActive = useCallback(
    () => setMobileNavigationActive((prev) => !prev),
    [],
  );

  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            url: '/',
            label: 'Dashboard',
            icon: HomeIcon,
            selected: location.pathname === '/',
            onClick: () => navigate('/'),
          },
          {
            url: '/shops',
            label: 'Shops & Clients',
            icon: StoreIcon,
            selected: location.pathname === '/shops',
            onClick: () => navigate('/shops'),
          },
          {
            url: '/conversations',
            label: 'Conversations',
            icon: ChatIcon,
            selected: location.pathname === '/conversations',
            onClick: () => navigate('/conversations'),
          },
          {
            url: '/ai-setup',
            label: 'AI Agent Setup',
            icon: PhoneIcon,
            selected: location.pathname === '/ai-setup',
            onClick: () => navigate('/ai-setup'),
          },
          {
            url: '/store-integration',
            label: 'Store Integration',
            icon: CodeIcon,
            selected: location.pathname === '/store-integration',
            onClick: () => navigate('/store-integration'),
          },
          {
            url: '/analytics',
            label: 'Analytics',
            icon: ChartLineIcon,
            selected: location.pathname === '/analytics',
            onClick: () => navigate('/analytics'),
          },
          {
            url: '/settings',
            label: 'Settings',
            icon: SettingsIcon,
            selected: location.pathname === '/settings',
            onClick: () => navigate('/settings'),
          },
        ]}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigationActive}
    />
  );

  return (
    <Frame
      navigation={navigationMarkup}
      topBar={topBarMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigationActive}
    >
      {children}
    </Frame>
  );
}
