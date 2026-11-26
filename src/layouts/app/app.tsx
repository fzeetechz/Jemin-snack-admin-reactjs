import './workspace.css';
import {
  Alert,
  Avatar,
  Button,
  Dropdown,
  Flex,
  FloatButton,
  Layout,
  Modal,
  Select,
  message,
  Tooltip,
} from 'antd';
import {
  ChevronDown,
  LogOut,
  LogIn,
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
import { tokenStorage } from '../../services/auth/tokenStorage';
import { apiRequest } from '../../services/api/apiClient';

const { Content } = Layout;

type SwitchableStaff = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
  isAdmin?: boolean;
  roleId?: { name?: string } | null;
};

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const [collapsed, setCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const nodeRef = useRef(null);
  const floatBtnRef = useRef(null);
  const { logout, user, updateUser } = useAuth();
  const staffSession = tokenStorage.getStaffSession();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [staffList, setStaffList] = useState<SwitchableStaff[]>([]);
  const [staffId, setStaffId] = useState<string>();
  const openStaffSwitcher = async () => {
    setSwitchOpen(true);
    setStaffId(undefined);
    setStaffLoading(true);
    try {
      const staff: SwitchableStaff[] = [];
      let page = 1;
      while (true) {
        const response = await apiRequest.get<any>('/staff', { params: { page, limit: 100, status: 'active' } });
        const batch = response?.data?.items;
        if (!Array.isArray(batch)) throw new Error('Invalid staff list');
        staff.push(...batch);
        const pages = Number(response?.data?.pagination?.pages ?? 1);
        if (!Number.isFinite(pages) || page >= pages) break;
        page += 1;
      }
      setStaffList(staff.filter(person => person.status === 'active' && !person.isAdmin && person.roleId));
    } catch {
      setStaffList([]);
      message.error('Unable to load staff');
    } finally { setStaffLoading(false); }
  };
  const switchToStaff = async () => {
    if (!staffId) return;
    setSwitchLoading(true);
    try {
      const response = await apiRequest.post<any>('/auth/staff-session', { staffId });
      if (!response?.data?.token || !response?.data?.user) throw new Error('Invalid staff session');
      tokenStorage.startStaffSession(response.data.token, response.data.user);
      window.history.replaceState(null, '', '/dashboards/default');
      window.location.reload();
    } catch {
      message.error('Unable to log in as staff');
      setSwitchLoading(false);
    }
  };
  const [endingStaffSession, setEndingStaffSession] = useState(false);
  const endStaffSession = async () => {
    setEndingStaffSession(true);
    try { await apiRequest.post('/auth/staff-session/end'); }
    catch { message.warning('Session could not be ended on the server; it will expire automatically.'); }
    finally {
      tokenStorage.endStaffSession();
      const adminUser = tokenStorage.getUser();
      if (adminUser && tokenStorage.getAccessToken()) {
        updateUser(adminUser);
        setEndingStaffSession(false);
        navigate('/dashboards/default', { replace: true });
      } else {
        window.location.assign(PATH_AUTH.signin);
      }
    }
  };
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
    if (staffSession) { await endStaffSession(); return; }
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
      <NProgress isAnimating={isLoading} key={location.pathname} />
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
              {(user as any)?.isAdmin && !staffSession && (
                <Tooltip title="Log in as a staff member">
                  <Button icon={<LogIn size={16} />} onClick={() => void openStaffSwitcher()} aria-label="Login as Staff">
                    {!isMobile && 'Login as Staff'}
                  </Button>
                </Tooltip>
              )}
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
          {staffSession && (
            <Alert type="warning" showIcon message={`Managing as ${fullName}`} description="Actions use this staff member’s permissions and are attributed to your admin session." action={<Button onClick={() => void endStaffSession()} loading={endingStaffSession}>Return to admin</Button>} />
          )}
          <Content className="workspace-content">
            <TransitionGroup>
              <SwitchTransition>
                <CSSTransition
                  key={`css-transition-${location.pathname}`}
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
      <Modal title="Login as Staff" open={switchOpen} onCancel={() => setSwitchOpen(false)} onOk={() => void switchToStaff()} okText="Continue as Staff" okButtonProps={{ disabled: !staffId, loading: switchLoading }} cancelButtonProps={{ disabled: switchLoading }} destroyOnHidden>
        <p>Select the employee whose account you want to manage.</p>
        <Select
          aria-label="Select staff member"
          showSearch
          optionFilterProp="label"
          placeholder="Search staff by name or email"
          style={{ width: '100%' }}
          loading={staffLoading}
          value={staffId}
          onChange={setStaffId}
          options={staffList.map(person => ({ value: person._id, label: `${[person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unnamed staff'}${person.email ? ` — ${person.email}` : ''}` }))}
          notFoundContent={staffLoading ? 'Loading staff...' : 'No active staff found'}
        />
      </Modal>
      <LoginModal />
    </>
  );
};
