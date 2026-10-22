import {
  Navigate,
  createBrowserRouter,
  Outlet,
  useLocation,
} from 'react-router-dom';
import {
  AccountDeactivePage,
  BiddingDashboardPage,
  CorporateAboutPage,
  CorporateContactPage,
  CorporateFaqPage,
  CorporateLicensePage,
  CorporatePricingPage,
  CorporateTeamPage,
  DefaultDashboardPage,
  EcommerceDashboardPage,
  Error400Page,
  Error403Page,
  Error404Page,
  Error500Page,
  Error503Page,
  ErrorPage,
  GalleryPage,
  HomePage,
  MarketingDashboardPage,
  OtpAuthPage,
  PasswordResetPage,
  ProjectsDashboardPage,
  SettingsPage,
  SignInPage,
  SignUpPage,
  SitemapPage,
  SocialDashboardPage,
  UserProfileActionsPage,
  UserProfileActivityPage,
  UserProfileDetailsPage,
  UserProfileFeedbackPage,
  UserProfileHelpPage,
  UserProfileInformationPage,
  UserProfilePreferencesPage,
  UserProfileSecurityPage,
  VerifyEmailPage,
  WelcomePage,
  LearningDashboardPage,
  LogisticsDashboardPage,
} from '../pages';
import {
  CorporateLayout,
  DashboardLayout,
  GuestLayout,
  UserAccountLayout,
} from '../layouts';
import React, { ReactNode, useEffect } from 'react';
import { AboutPage } from '../pages/about.tsx';
import { ProtectedRoute } from '../utils/ProtectedRoute';
import LeadsPage from '../pages/Leads';
import ContractPage from '../pages/Contract/index.tsx';
import CustomerPage from '../pages/customer';
import StaffPage from '../pages/settings/Staff/index.tsx';
import RolesPage from '../pages/settings/roles';
import Tasks from '../pages/activities/Tasks.tsx';
import SingleTask from '../pages/activities/SingleTask.tsx';
import PrivacyPolicy from '../pages/privacypolicy/PrivacyPolicy.tsx';
import DeleteAccount from '../pages/DeleteAccount';
import CallLogs from '../pages/Call/CallLogs.tsx';
import Attendance from '../HumanResource/Attendance.tsx';
import HrSettings from '../HumanResource/HrSettings.tsx';
import SalarySetting from '../HumanResource/SalarySetting.tsx';
import SalarySlip from 'src/HumanResource/SalarySlip.tsx';
import Leave from 'src/HumanResource/Leave.tsx';
import Candidate from 'src/HumanResource/Candidate.tsx';
import SigleCandidate from 'src/HumanResource/SigleCandidate.tsx';
import ConfigPage from 'src/pages/Config/index.tsx';
import TrashPage from '../pages/trash';

import Location from 'src/pages/Location.tsx';
import Products from 'src/pages/Products/Products.tsx';
import QuotationsPage from 'src/pages/Quotations/index.tsx';
// Custom scroll restoration function
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    }); // Scroll to the top when the location changes
  }, [pathname]);

  return null; // This component doesn't render anything
};

type PageProps = {
  children: ReactNode;
};

// Create an HOC to wrap your route components with ScrollToTop
const PageWrapper = ({ children }: PageProps) => {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
};

// Create the router
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute requireAuth={false}>
        <PageWrapper children={<GuestLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/dashboards',
    element: (
      <ProtectedRoute>
        <PageWrapper children={<DashboardLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      // {
      //   path: 'default',
      //   element: <Map />,
      // },
      {
        path: 'default',
        element: <DefaultDashboardPage />,
      },
      {
        path: 'projects',
        element: <ProjectsDashboardPage />,
      },
      {
        path: 'ecommerce',
        element: <EcommerceDashboardPage />,
      },
      {
        path: 'marketing',
        element: <MarketingDashboardPage />,
      },
      {
        path: 'social',
        element: <SocialDashboardPage />,
      },
      {
        path: 'bidding',
        element: <BiddingDashboardPage />,
      },
      {
        path: 'learning',
        element: <LearningDashboardPage />,
      },
      {
        path: 'logistics',
        element: <LogisticsDashboardPage />,
      },
    ],
  },
  {
    path: '/sitemap',
    element: (
      <ProtectedRoute>
        <PageWrapper children={<DashboardLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <SitemapPage />,
      },
    ],
  },
  {
    path: '/crm',
    element: (
      <ProtectedRoute>
        <PageWrapper children={<DashboardLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'leads',
        element: <LeadsPage />,
      },
      {
        path: 'contacts',
        element: <ContractPage />,
      },
      {
        path: 'customers',
        element: <CustomerPage />,
      },
      {
        path: 'settings/staff',
        element: <StaffPage />,
      },
      {
        path: 'settings/roles',
        element: <RolesPage />,
      },
      {
        path: 'activities/tasks',
        element: <Tasks />,
      },
      {
        path: 'activities/leads',
        element: <LeadsPage />,
      },
      {
        path: 'activities/tasks/:taskId',
        element: <SingleTask />,
      },
      {
        path: 'calls',
        element: <CallLogs />,
      },
      {
        path: 'recordings',
        element: <CallLogs />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'quotations',
        element: <QuotationsPage />,
      },

      {
        path: 'trash',
        element: <TrashPage />,
      },
      {
        path: 'config',
        element: <ConfigPage />,
      },
      {
        path: 'support',
        element: <UserProfileHelpPage />,
      },
      {
        path: 'location',
        element: <Location />,
      },
    ],
  },

  {
    path: '/hrms',
    element: (
      <ProtectedRoute>
        <PageWrapper children={<DashboardLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'employeee/attendance',
        element: <Attendance />,
      },
      {
        path: 'employeee/leave',
        element: <Leave />,
      },
      {
        path: 'employeee/salarySetting',
        element: <SalarySetting />,
      },
      {
        path: 'candidate',
        element: <Candidate />,
      },
      {
        path: 'candidate/:candidateId',
        element: <SigleCandidate />,
      },
      {
        path: 'setting',
        element: <HrSettings />,
      },

      {
        path: 'setting/configuration',
        element: <Navigate to="/hrms/setting" replace />,
      },
      {
        path: 'setting/payslip',
        element: <SalarySlip />,
      },
      {
        path: 'setting/configuration/:tabKey',
        element: <Navigate to="/hrms/setting" replace />,
      },
    ],
  },

  {
    path: '/corporate',
    element: <PageWrapper children={<CorporateLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'about',
        element: <CorporateAboutPage />,
      },
      {
        path: 'team',
        element: <CorporateTeamPage />,
      },
      {
        path: 'faqs',
        element: <CorporateFaqPage />,
      },
      {
        path: 'contact',
        element: <CorporateContactPage />,
      },
      {
        path: 'pricing',
        element: <CorporatePricingPage />,
      },
      {
        path: 'license',
        element: <CorporateLicensePage />,
      },
    ],
  },
  {
    path: '/user-profile',
    element: (
      <ProtectedRoute>
        <PageWrapper children={<UserAccountLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'details',
        element: <UserProfileDetailsPage />,
      },
      {
        path: 'preferences',
        element: <UserProfilePreferencesPage />,
      },
      {
        path: 'information',
        element: <UserProfileInformationPage />,
      },
      {
        path: 'security',
        element: <UserProfileSecurityPage />,
      },
      {
        path: 'activity',
        element: <UserProfileActivityPage />,
      },
      {
        path: 'actions',
        element: <UserProfileActionsPage />,
      },
      {
        path: 'help',
        element: <UserProfileHelpPage />,
      },
      {
        path: 'feedback',
        element: <UserProfileFeedbackPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <Outlet />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'signup',
        element: (
          <ProtectedRoute requireAuth={false}>
            <SignUpPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'signin',
        element: (
          <ProtectedRoute requireAuth={false}>
            <SignInPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'welcome',
        element: <WelcomePage />,
      },
      {
        path: 'verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: 'password-reset',
        element: <PasswordResetPage />,
      },
      {
        path: 'otp-auth',
        element: <OtpAuthPage />,
      },
      {
        path: 'account-delete',
        element: <AccountDeactivePage />,
      },
    ],
  },

  {
    path: 'errors',
    element: <Outlet />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '400',
        element: <Error400Page />,
      },
      {
        path: '403',
        element: <Error403Page />,
      },
      {
        path: '404',
        element: <Error404Page />,
      },
      {
        path: '500',
        element: <Error500Page />,
      },
      {
        path: '503',
        element: <Error503Page />,
      },
    ],
  },
  {
    path: '/about',
    element: <PageWrapper children={<DashboardLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <AboutPage />,
      },
      {
        path: 'privacy-policy',
        element: <PrivacyPolicy />,
      },
    ],
  },
  {
    path: '/gallery',
    element: <PageWrapper children={<DashboardLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <GalleryPage />,
      },
    ],
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />,
  },
  {
    path: 'delete-account',
    element: <DeleteAccount />,
  },
]);

// eslint-disable-next-line react-refresh/only-export-components
export default router;
