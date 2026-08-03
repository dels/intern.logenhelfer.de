import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import AppShell from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import ImpressumHelpLayout from './layouts/ImpressumHelpLayout';
import RequireAuth from './auth/RequireAuth';
import DashboardPage from './pages/DashboardPage';
import LandingResolver from './pages/LandingResolver';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicCalendarPage from './pages/PublicCalendarPage';
import ImpressumPage from './pages/ImpressumPage';
import HelpPage from './pages/HelpPage';
import EventsListPage from './features/events/EventsListPage';
import EventCreatePage from './features/events/EventCreatePage';
import EventEditPage from './features/events/EventEditPage';
import EventDetailPage from './features/events/EventDetailPage';
import ExternalEventsListPage from './features/externalEvents/ExternalEventsListPage';
import ExternalEventCreatePage from './features/externalEvents/ExternalEventCreatePage';
import ExternalEventEditPage from './features/externalEvents/ExternalEventEditPage';
import ExternalEventDetailPage from './features/externalEvents/ExternalEventDetailPage';
import ExternalEventIcsSourcesPage from './features/externalEventIcsSources/ExternalEventIcsSourcesPage';
import MembersListPage from './features/members/MembersListPage';
import MemberCreatePage from './features/members/MemberCreatePage';
import MemberEditPage from './features/members/MemberEditPage';
import MemberDetailPage from './features/members/MemberDetailPage';
import PhoneListPage from './features/members/PhoneListPage';
import BirthdayListPage from './features/members/BirthdayListPage';
import CouncilListPage from './features/members/CouncilListPage';
import SeekersListPage from './features/seekers/SeekersListPage';
import SeekerCreatePage from './features/seekers/SeekerCreatePage';
import SeekerEditPage from './features/seekers/SeekerEditPage';
import SeekerDetailPage from './features/seekers/SeekerDetailPage';
import SeekerNamesListPage from './features/seekers/SeekerNamesListPage';
import CategoriesListPage from './features/categories/CategoriesListPage';
import CategoryCreatePage from './features/categories/CategoryCreatePage';
import CategoryEditPage from './features/categories/CategoryEditPage';
import CategoryDetailPage from './features/categories/CategoryDetailPage';
import DirectoryCreatePage from './features/directories/DirectoryCreatePage';
import DirectoryEditPage from './features/directories/DirectoryEditPage';
import DirectoryDetailPage from './features/directories/DirectoryDetailPage';
import FileDetailPage from './features/files/FileDetailPage';
import FileEditPage from './features/files/FileEditPage';
import LodgesListPage from './features/lodges/LodgesListPage';
import LodgeCreatePage from './features/lodges/LodgeCreatePage';
import LodgeEditPage from './features/lodges/LodgeEditPage';
import LodgeDetailPage from './features/lodges/LodgeDetailPage';
import OfficerCreatePage from './features/officers/OfficerCreatePage';
import OfficerEditPage from './features/officers/OfficerEditPage';
import OfficerDetailPage from './features/officers/OfficerDetailPage';
import AnnouncementsListPage from './features/announcements/AnnouncementsListPage';
import AnnouncementCreatePage from './features/announcements/AnnouncementCreatePage';
import AnnouncementEditPage from './features/announcements/AnnouncementEditPage';
import AnnouncementDetailPage from './features/announcements/AnnouncementDetailPage';
import ConfigurationPage from './features/configuration/ConfigurationPage';
import StatisticsIndexPage from './features/statistics/StatisticsIndexPage';
import UserStatsPage from './features/statistics/UserStatsPage';
import DownloadsPage from './features/statistics/DownloadsPage';
import FileStatsPage from './features/statistics/FileStatsPage';
import UserFileStatsPage from './features/statistics/UserFileStatsPage';
import MemStatsPage from './features/statistics/MemStatsPage';
import AccountPage from './features/account/AccountPage';
import MfaSetupPage from './features/mfa/MfaSetupPage';

export const routes: RouteObject[] = [
  { path: '/', element: <LandingResolver /> },
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/calendar', element: <PublicCalendarPage /> },
    ],
  },
  {
    element: <ImpressumHelpLayout />,
    children: [
      { path: '/impressum', element: <ImpressumPage /> },
      { path: '/help', element: <HelpPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/events', element: <EventsListPage /> },
          { path: '/events/new', element: <EventCreatePage /> },
          { path: '/events/:uuid/edit', element: <EventEditPage /> },
          { path: '/events/:uuid', element: <EventDetailPage /> },
          { path: '/external-events', element: <ExternalEventsListPage /> },
          { path: '/external-events/new', element: <ExternalEventCreatePage /> },
          { path: '/external-events/:uuid/edit', element: <ExternalEventEditPage /> },
          { path: '/external-events/:uuid', element: <ExternalEventDetailPage /> },
          { path: '/external-event-ics-sources', element: <ExternalEventIcsSourcesPage /> },
          { path: '/members/new', element: <MemberCreatePage /> },
          { path: '/members/phone-list', element: <PhoneListPage /> },
          { path: '/members/birthday-list', element: <BirthdayListPage /> },
          { path: '/members/council', element: <CouncilListPage /> },
          { path: '/members/:uuid/edit', element: <MemberEditPage /> },
          { path: '/members/:uuid', element: <MemberDetailPage /> },
          { path: '/members', element: <MembersListPage /> },
          { path: '/seekers/new', element: <SeekerCreatePage /> },
          { path: '/seekers/names', element: <SeekerNamesListPage /> },
          { path: '/seekers/:uuid/edit', element: <SeekerEditPage /> },
          { path: '/seekers/:uuid', element: <SeekerDetailPage /> },
          { path: '/seekers', element: <SeekersListPage /> },
          { path: '/categories/new', element: <CategoryCreatePage /> },
          { path: '/categories/:slug/edit', element: <CategoryEditPage /> },
          { path: '/categories/:categorySlug/directories/new', element: <DirectoryCreatePage /> },
          { path: '/categories/:categorySlug/directories/:slug/edit', element: <DirectoryEditPage /> },
          { path: '/categories/:categorySlug/directories/:directorySlug/files/:uuid/edit', element: <FileEditPage /> },
          { path: '/categories/:categorySlug/directories/:directorySlug/files/:uuid', element: <FileDetailPage /> },
          { path: '/categories/:slug', element: <CategoryDetailPage /> },
          { path: '/categories', element: <CategoriesListPage /> },
          { path: '/categories/:categorySlug/directories/:slug', element: <DirectoryDetailPage /> },
          { path: '/lodges/new', element: <LodgeCreatePage /> },
          { path: '/lodges/:slug/edit', element: <LodgeEditPage /> },
          { path: '/lodges/:lodgeSlug/officers/new', element: <OfficerCreatePage /> },
          { path: '/officers/:uuid/edit', element: <OfficerEditPage /> },
          { path: '/officers/:uuid', element: <OfficerDetailPage /> },
          { path: '/lodges/:slug', element: <LodgeDetailPage /> },
          { path: '/lodges', element: <LodgesListPage /> },
          { path: '/announcements/new', element: <AnnouncementCreatePage /> },
          { path: '/announcements/:uuid/edit', element: <AnnouncementEditPage /> },
          { path: '/announcements/:uuid', element: <AnnouncementDetailPage /> },
          { path: '/announcements', element: <AnnouncementsListPage /> },
          { path: '/statistics/user-stats', element: <UserStatsPage /> },
          { path: '/statistics/downloads', element: <DownloadsPage /> },
          { path: '/statistics/file-stats', element: <FileStatsPage /> },
          { path: '/statistics/user-file-stats', element: <UserFileStatsPage /> },
          { path: '/statistics/mem-stats', element: <MemStatsPage /> },
          { path: '/statistics', element: <StatisticsIndexPage /> },
          { path: '/configuration', element: <ConfigurationPage /> },
          { path: '/account', element: <AccountPage /> },
          { path: '/mfa/setup', element: <MfaSetupPage /> },
          // MFA management now lives inline on /account (MfaAccountSection) -
          // redirect rather than remove outright, since this URL was
          // previously linked/bookmarked.
          { path: '/account/security', element: <Navigate to="/account" replace /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
