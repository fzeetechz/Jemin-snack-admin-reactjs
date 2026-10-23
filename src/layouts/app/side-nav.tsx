import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ConfigProvider, Layout, Menu, MenuProps, SiderProps } from 'antd';
import {
  LayoutDashboard,
  CalendarDays,
  ContactRound,
  Phone,
  Package,
  Receipt,
  MapPin,
  CalendarCheck2,
  Wallet,
  FileCheck2,
  UserRoundSearch,
  Settings2,
  UsersRound,
  ShieldCheck,
  SlidersHorizontal,
  Headphones,
  AudioLines,
  Building2,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { Logo } from '../../components';
import {
  PATH_CRM,
  canViewModule,
  getRouteModule,
  isAdminUser,
} from '../../config/permissions';

import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];
const getItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'
): MenuItem => ({ key, icon, children, label, type }) as MenuItem;

/**
 * ✅ Jemini CRM base menu
 * Keys intentionally match routes for easy selectedKeys handling
 */
const CRM_MENU_ITEMS: MenuProps['items'] = [
  getItem(
    <Link to={PATH_CRM.dashboard}>Dashboard</Link>,
    PATH_CRM.dashboard,
    <LayoutDashboard size={19} strokeWidth={1.8} />
  ),

  getItem('Sales', 'group-sales', null, [], 'group'),

  getItem(
    <Link to={PATH_CRM.leads}>Leads</Link>,
    PATH_CRM.leads,
    <ContactRound size={19} strokeWidth={1.8} />
  ),

  getItem(
    'Activities',
    'submenu-activities',
    <CalendarDays size={19} strokeWidth={1.8} />,
    [
      getItem(
        <Link to={PATH_CRM.activities.leads}>Leads</Link>,
        PATH_CRM.activities.leads,
        <ContactRound size={17} strokeWidth={1.8} />
      ),
      getItem(
        <Link to={PATH_CRM.customers}>Customers</Link>,
        PATH_CRM.customers,
        <UsersRound size={17} strokeWidth={1.8} />
      ),
    ]
  ),

  getItem('Calls', 'submenu-calls', <Phone size={19} strokeWidth={1.8} />, [
    getItem(
      <Link to={PATH_CRM.calls}>Call Logs</Link>,
      PATH_CRM.calls,
      <Phone size={17} strokeWidth={1.8} />
    ),
    getItem(
      <Link to={PATH_CRM.recordings}>Recordings</Link>,
      PATH_CRM.recordings,
      <AudioLines size={17} strokeWidth={1.8} />
    ),
  ]),

  getItem(
    <Link to={PATH_CRM.products}>Products</Link>,
    PATH_CRM.products,
    <Package size={19} strokeWidth={1.8} />
  ),

  getItem(
    <Link to={PATH_CRM.quotations}>Orders</Link>,
    PATH_CRM.quotations,
    <Receipt size={19} strokeWidth={1.8} />
  ),

  getItem(
    <Link to={PATH_CRM.locations}>Location</Link>,
    PATH_CRM.locations,
    <MapPin size={19} strokeWidth={1.8} />
  ),

  getItem('Human Resource', 'group-ops', null, [], 'group'),
  //  getItem(
  //   <Link to={PATH_CRM.customers}>Customers</Link>,
  //   PATH_CRM.customers,
  //   <CalendarCheck2 size={19} strokeWidth={1.8} />
  // ),  //  getItem(
  //   <Link to={PATH_CRM.customers}>Customers</Link>,
  //   PATH_CRM.customers,
  //   <CalendarCheck2 size={19} strokeWidth={1.8} />
  // ),
  getItem(
    <Link to={PATH_CRM.hr.Attendance}>Attendance</Link>,
    PATH_CRM.hr.Attendance,
    <CalendarCheck2 size={19} strokeWidth={1.8} />
  ),
  getItem(
    <Link to={PATH_CRM.hr.leave}>Leaves</Link>,
    PATH_CRM.hr.leave,
    <CalendarDays size={19} strokeWidth={1.8} />
  ),
  getItem(
    <Link to={PATH_CRM.hr.salarySetting}>Salary Setting</Link>,
    PATH_CRM.hr.salarySetting,
    <Wallet size={19} strokeWidth={1.8} />
  ),
  getItem(
    <Link to={PATH_CRM.hr.payslip}>Pay Slip</Link>,
    PATH_CRM.hr.payslip,
    <FileCheck2 size={19} strokeWidth={1.8} />
  ),

  //candidate
  getItem(
    'Candidates',
    'submenu-candidate',
    <UserRoundSearch size={19} strokeWidth={1.8} />,
    [
      getItem(
        <Link to={PATH_CRM.hr.candidate}>Candidates</Link>,
        PATH_CRM.hr.candidate,
        <UserRoundSearch size={17} strokeWidth={1.8} />
      ),
    ]
  ),
  getItem(
    <Link to={PATH_CRM.hr.Settings}>Configuration</Link>,
    PATH_CRM.hr.Settings,
    <Building2 size={19} strokeWidth={1.8} />
  ),

  // getItem('Reports', 'submenu-reports', <UserRoundSearch size={19} strokeWidth={1.8} />, [
  //   getItem(
  //     <Link to={PATH_CRM.reports.overview}>Overview</Link>,
  //     PATH_CRM.reports.overview
  //   ),
  //   getItem(
  //     <Link to={PATH_CRM.reports.sales}>Sales</Link>,
  //     PATH_CRM.reports.sales
  //   ),
  //   getItem(
  //     <Link to={PATH_CRM.reports.team}>Team</Link>,
  //     PATH_CRM.reports.team
  //   ),
  // ]),

  getItem('Admin', 'group-admin', null, [], 'group'),
  getItem(<Link to={PATH_CRM.trash}>Trash</Link>, PATH_CRM.trash, <Trash2 size={19} strokeWidth={1.8} />),

  getItem(
    'Settings',
    'submenu-settings',
    <Settings2 size={19} strokeWidth={1.8} />,
    [
      getItem(
        <Link to={PATH_CRM.settings.users}>Staff</Link>,
        PATH_CRM.settings.users,
        <UsersRound size={19} strokeWidth={1.8} />
      ),
      getItem(
        <Link to={PATH_CRM.settings.roles}>Roles & Permissions</Link>,
        PATH_CRM.settings.roles,
        <ShieldCheck size={19} strokeWidth={1.8} />
      ),
    ]
  ),

  getItem(
    <Link to={PATH_CRM.config}>Configurations</Link>,
    PATH_CRM.config,
    <SlidersHorizontal size={19} strokeWidth={1.8} />
  ),
  getItem(
    <Link to={PATH_CRM.support}>Support</Link>,
    PATH_CRM.support,
    <Headphones size={19} strokeWidth={1.8} />
  ),
];

/**
 * ✅ Role based access
 */
// type Role = 'admin' | 'manager' | 'sales' | 'support';

function filterMenuByRole(
  items: MenuProps['items'],
  userPermissions: ReturnType<typeof usePermissions>['userPermissions'],
  user: any
): MenuProps['items'] {
  const isAllowedKey = (k?: React.Key) => {
    if (typeof k !== 'string') return false;
    if (k === PATH_CRM.dashboard || isAdminUser(user)) return true;

    if (k === PATH_CRM.trash) return userPermissions.some((permission) => permission.actions.some((action) => ['read', 'view'].includes(action)));
    const module = getRouteModule(k);
    return module ? canViewModule(userPermissions, module) : false;
  };

  const walk = (list: MenuProps['items']): MenuProps['items'] => {
    if (!list) return list;

    return list
      .map((it) => {
        if (!it) return null;

        // group titles: keep only if any children visible later
        if ('type' in it && it.type === 'group') return it;

        const hasChildren =
          'children' in it &&
          Array.isArray(it.children) &&
          it.children.length > 0;
        if (!hasChildren) {
          return isAllowedKey(it?.key) ? it : null;
        }

        const children = walk('children' in it ? it.children : undefined);
        const hasAnyChild = Array.isArray(children) && children.some(Boolean);

        // keep submenu if any child is visible
        return hasAnyChild ? { ...it, children } : null;
      })
      .filter(Boolean);
  };

  // After pruning, remove empty groups
  const pruned = walk(items);

  const removeEmptyGroups = (list: MenuProps['items']) =>
    (list || []).filter((it, idx: number, arr) => {
      if (!it) return false;
      if (!('type' in it) || it.type !== 'group') return true;

      // group is kept only if there is any non-group item after it before next group
      for (let i = idx + 1; i < arr.length; i++) {
        const nextItem = arr[i];
        if (nextItem && 'type' in nextItem && nextItem.type === 'group') break;
        if (nextItem) return true;
      }
      return false;
    });

  return removeEmptyGroups(pruned);
}

type SideNavProps = SiderProps;

const SideNav = ({ ...others }: SideNavProps) => {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const { pathname } = useLocation();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>('');
  const { user } = useAuth() as any;
  const { userPermissions } = usePermissions();

  const { mytheme } = useSelector((state: RootState) => state.theme);

  const items = useMemo(
    () => filterMenuByRole(CRM_MENU_ITEMS, userPermissions, user),
    [user, userPermissions]
  );

  // Only these submenus should be "single open"
  const rootSubmenuKeys = [
    'submenu-activities',
    'submenu-calls',
    'submenu-reports',
    'submenu-candidate',
    'submenu-settings',
  ];

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const latestOpenKey = keys.find(
      (key) => openKeys.indexOf(key as string) === -1
    ) as string | undefined;

    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys as string[]);
      return;
    }
    setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
  };

  useEffect(() => {
    setCurrent(pathname);

    // auto expand based on route
    if (pathname.startsWith('/crm/activities'))
      setOpenKeys(['submenu-activities']);
    else if (
      pathname.startsWith('/crm/calls') ||
      pathname.startsWith('/crm/recordings')
    )
      setOpenKeys(['submenu-calls']);
    else if (pathname.startsWith('/crm/reports'))
      setOpenKeys(['submenu-reports']);
    else if (pathname.startsWith('/crm/settings'))
      setOpenKeys(['submenu-settings']);
    else if (pathname.startsWith('/hrms/candidate'))
      setOpenKeys(['submenu-candidate']);
    else setOpenKeys([]);
  }, [pathname]);

  return (
    <Sider
      ref={nodeRef as React.Ref<HTMLDivElement>}
      breakpoint="lg"
      collapsedWidth="0"
      width={248}
      {...others}
      className={`workspace-sidebar ${others.className ?? ''}`}
      style={{ ...others.style, background: 'linear-gradient(180deg, #0f1623 0%, #131d2e 60%, #0f1623 100%)', border: 'none' }}
    >
      {/* Brand */}
      <div className="sidebar-brand">
        <Logo
          color="#ffffff"
          asLink
          href="/"
          justify="flex-start"
          gap="small"
          imgSize={{ h: 36, w: 36 }}
          style={{ padding: 0 }}
        />
        <span className="sidebar-brand-caption">JEMINI CRM</span>
      </div>

      {/* Workspace pill */}
      <div className="sidebar-workspace">
        <span className="sidebar-workspace-icon">
          <Building2 size={17} />
        </span>
        <div>
          <strong>Jemini Snacks</strong>
          <span>Team workspace</span>
        </div>
        <ChevronRight size={14} aria-hidden="true" />
      </div>

      {/* Navigation */}
      <div className="sidebar-navigation">
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                itemBg: 'transparent',
                subMenuItemBg: 'transparent',
                itemSelectedBg: 'rgba(180,32,20,0.18)',
                itemHoverBg: 'rgba(255,255,255,0.05)',
                itemSelectedColor: '#ff6b5b',
                itemColor: '#8fa3bc',
                itemHoverColor: '#e2eaf4',
                subMenuItemSelectedColor: '#ff6b5b',
                groupTitleColor: '#3d5166',
                groupTitleFontSize: 10,
                itemHeight: 42,
                iconSize: 18,
                fontSize: 13,
                itemMarginBlock: 2,
                itemBorderRadius: 10,
                popupBg: mytheme === 'dark' ? '#131d2e' : '#ffffff',
              },
            },
          }}
        >
          <Menu
            mode="inline"
            items={items}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            selectedKeys={[current]}
            style={{ border: 'none', background: 'transparent' }}
          />
        </ConfigProvider>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="sidebar-footer-icon">
          <ShieldCheck size={16} />
        </span>
        <div>
          <strong>Secured &amp; Connected</strong>
          <span>Jemini Snacks CRM</span>
        </div>
      </div>
    </Sider>
  );
};

export default SideNav;
