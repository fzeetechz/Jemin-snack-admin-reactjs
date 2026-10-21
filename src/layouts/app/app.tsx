import './workspace.css';
import {
  Avatar,
  Button,
  Dropdown,
  Flex,
  FloatButton,
  Layout,
  message,
  Tooltip,
} from 'antd';
import {
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  UserRound,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  CSSTransition,
  SwitchTransition,
  TransitionGroup,
} from 'react-transition-group';
import { useMediaQuery } from 'react-responsive';
import SideNav from './side-nav';
import HeaderNav from './header-nav';
import FooterNav from './footer-nav';
import { getPageMeta } from './page-meta';
import { NProgress, LoginModal } from '../../components';
import { PATH_AUTH, PATH_USER_PROFILE } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { imageUrl } from '../../utils/convertor';
import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';

const { Content } = Layout;

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const [collapsed, setCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const nodeRef = useRef(null);
  const floatBtnRef = useRef(null);
  const { logout, user } = useAuth();
  const page = getPageMeta(location.pathname);
  const PageIcon = page.icon;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'My account';
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const sidebarOffset = !collapsed && !isMobile ? 248 : 0;

  const handleLogout = async () => {
    message.open({ type: 'loading', content: 'Signing you out' });
    await logout();
    message.destroy();
    navigate(PATH_AUTH.signin, { replace: true });
  };

  const items: MenuProps['items'] = [
    {
      key: 'user-profile-link',
      label: 'My profile',
      icon: <UserRound size={16} />,
      onClick: () => navigate(PATH_USER_PROFILE.details),
    },
    { type: 'divider' },
    {
      key: 'user-logout-link',
      label: 'Sign out',
      icon: <LogOut size={16} />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  return (
    <>
      <NProgress isAnimating={isLoading} key={location.key} />
      <Layout className="workspace-layout">
        {isMobile && !collapsed && (
          <button
            className="sidebar-backdrop"
            aria-label="Close sidebar"
            onClick={() => setCollapsed(true)}
          />
        )}
        <SideNav
          trigger={null}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
        />
        {isMobile && !collapsed && (
          <Button
            className="sidebar-mobile-close"
            type="text"
            icon={<X size={20} />}
            aria-label="Close sidebar"
            onClick={() => setCollapsed(true)}
          />
        )}
        <Layout
          className="workspace-main"
          style={{ marginLeft: sidebarOffset }}
        >
          <HeaderNav className="workspace-header">
            <Flex align="center" gap={16} className="workspace-header-start">
              <Tooltip title={`${collapsed ? 'Expand' : 'Collapse'} sidebar`}>
                <Button
                  type="text"
                  className="sidebar-toggle"
                  aria-label={`${collapsed ? 'Expand' : 'Collapse'} sidebar`}
                  aria-expanded={!collapsed}
                  icon={
                    collapsed ? (
                      <Menu size={21} />
                    ) : (
                      <PanelLeftClose size={21} />
                    )
                  }
                  onClick={() => setCollapsed(!collapsed)}
                />
              </Tooltip>
              <span className="header-separator" />
              <span className="header-page-icon">
                <PageIcon size={19} strokeWidth={1.8} />
              </span>
              <div className="header-page-label">
                <span>{page.section}</span>
                <strong>{page.title}</strong>
              </div>
            </Flex>
            <Flex align="center" gap={20}>
              <span className="header-date">
                {new Intl.DateTimeFormat('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }).format(new Date())}
              </span>
              <Dropdown
                menu={{ items }}
                trigger={['click']}
                placement="bottomRight"
              >
                <button
                  className="header-profile"
                  aria-label="Open account menu"
                >
                  <Avatar
                    size={37}
                    src={user?.avatar ? imageUrl(user.avatar) : undefined}
                  >
                    {initials}
                  </Avatar>
                  <span className="header-profile-copy">
                    <strong>{fullName}</strong>
                    <span>My account</span>
                  </span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
              </Dropdown>
            </Flex>
          </HeaderNav>
          <Content className="workspace-content">
            <TransitionGroup>
              <SwitchTransition>
                <CSSTransition
                  key={`css-transition-${location.key}`}
                  nodeRef={nodeRef}
                  onEnter={() => setIsLoading(true)}
                  onEntered={() => setIsLoading(false)}
                  timeout={250}
                  classNames="bottom-to-top"
                  unmountOnExit
                >
                  {() => (
                    <div
                      ref={nodeRef}
                      className="workspace-page"
                      data-page={location.pathname}
                    >
                      {children}
                    </div>
                  )}
                </CSSTransition>
              </SwitchTransition>
            </TransitionGroup>
            <div ref={floatBtnRef}>
              <FloatButton.BackTop />
            </div>
          </Content>
          <FooterNav className="workspace-footer" />
        </Layout>
      </Layout>
      <LoginModal />
    </>
  );
};
