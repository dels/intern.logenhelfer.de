// oxlint-disable react/only-export-components -- this file is the route
// table, not a component module; every React.lazy() binding below reads as a
// component definition to the rule while the file's only real exports are
// `routes`/`router`. Fast-refresh-only concern, and routes.tsx is never
// hot-reloaded as a component anyway.
import { lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import AppShell from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import ImpressumHelpLayout from './layouts/ImpressumHelpLayout';
import LazyRouteBoundary from './layouts/LazyRouteBoundary';
import RequireAuth from './auth/RequireAuth';
import DashboardPage from './pages/DashboardPage';
import LandingResolver from './pages/LandingResolver';
import LoginPage from './pages/LoginPage';

// Route-level code splitting. Everything below the eager block above is
// loaded on demand, so a session that only ever visits the dashboard never
// downloads the @mui/x-data-grid-based list pages, the statistics pages,
// dompurify (Impressum/Hilfe), or any of the forms.
//
// The eager set is deliberately small and fixed - these are on the critical
// first-paint path, and splitting them would only add a network round trip
// where there currently isn't one:
//   AppShell, RequireAuth      - wrap every authenticated route
//   PublicLayout,
//   ImpressumHelpLayout        - thin layout wrappers (ImpressumHelpLayout
//                                itself only picks between the other two)
//   LandingResolver            - the '/' route, i.e. every cold start
//   LoginPage                  - where every anonymous cold start lands
//   DashboardPage              - where every authenticated cold start lands
//
// Each lazy component renders inside a <LazyRouteBoundary/> pathless route
// (Suspense + a chunk-load error boundary, see that file) placed INSIDE its
// layout, so the surrounding chrome stays mounted while the chunk loads.
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PublicCalendarPage = lazy(() => import('./pages/PublicCalendarPage'));
const ImpressumPage = lazy(() => import('./pages/ImpressumPage'));
const DatenschutzPage = lazy(() => import('./pages/DatenschutzPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const EventsListPage = lazy(() => import('./features/events/EventsListPage'));
const EventCreatePage = lazy(() => import('./features/events/EventCreatePage'));
const EventEditPage = lazy(() => import('./features/events/EventEditPage'));
const EventDetailPage = lazy(() => import('./features/events/EventDetailPage'));
const ExternalEventCreatePage = lazy(() => import('./features/externalEvents/ExternalEventCreatePage'));
const ExternalEventEditPage = lazy(() => import('./features/externalEvents/ExternalEventEditPage'));
const ExternalEventDetailPage = lazy(() => import('./features/externalEvents/ExternalEventDetailPage'));
const ExternalEventIcsSourcesPage = lazy(() => import('./features/externalEventIcsSources/ExternalEventIcsSourcesPage'));
const MembersListPage = lazy(() => import('./features/members/MembersListPage'));
const MemberCreatePage = lazy(() => import('./features/members/MemberCreatePage'));
const MemberEditPage = lazy(() => import('./features/members/MemberEditPage'));
const MemberDetailPage = lazy(() => import('./features/members/MemberDetailPage'));
const PhoneListPage = lazy(() => import('./features/members/PhoneListPage'));
const BirthdayListPage = lazy(() => import('./features/members/BirthdayListPage'));
const CouncilListPage = lazy(() => import('./features/members/CouncilListPage'));
const SeekersListPage = lazy(() => import('./features/seekers/SeekersListPage'));
const SeekerCreatePage = lazy(() => import('./features/seekers/SeekerCreatePage'));
const SeekerEditPage = lazy(() => import('./features/seekers/SeekerEditPage'));
const SeekerDetailPage = lazy(() => import('./features/seekers/SeekerDetailPage'));
const SeekerNamesListPage = lazy(() => import('./features/seekers/SeekerNamesListPage'));
const CategoriesListPage = lazy(() => import('./features/categories/CategoriesListPage'));
const CategoryCreatePage = lazy(() => import('./features/categories/CategoryCreatePage'));
const CategoryEditPage = lazy(() => import('./features/categories/CategoryEditPage'));
const CategoryDetailPage = lazy(() => import('./features/categories/CategoryDetailPage'));
const DirectoryCreatePage = lazy(() => import('./features/directories/DirectoryCreatePage'));
const DirectoryEditPage = lazy(() => import('./features/directories/DirectoryEditPage'));
const DirectoryDetailPage = lazy(() => import('./features/directories/DirectoryDetailPage'));
const FileEditPage = lazy(() => import('./features/files/FileEditPage'));
const LodgesListPage = lazy(() => import('./features/lodges/LodgesListPage'));
const LodgeCreatePage = lazy(() => import('./features/lodges/LodgeCreatePage'));
const LodgeEditPage = lazy(() => import('./features/lodges/LodgeEditPage'));
const LodgeDetailPage = lazy(() => import('./features/lodges/LodgeDetailPage'));
const OfficerCreatePage = lazy(() => import('./features/officers/OfficerCreatePage'));
const OfficerEditPage = lazy(() => import('./features/officers/OfficerEditPage'));
const OfficerDetailPage = lazy(() => import('./features/officers/OfficerDetailPage'));
const AnnouncementsListPage = lazy(() => import('./features/announcements/AnnouncementsListPage'));
const AnnouncementCreatePage = lazy(() => import('./features/announcements/AnnouncementCreatePage'));
const AnnouncementEditPage = lazy(() => import('./features/announcements/AnnouncementEditPage'));
const AnnouncementDetailPage = lazy(() => import('./features/announcements/AnnouncementDetailPage'));
const ConfigurationPage = lazy(() => import('./features/configuration/ConfigurationPage'));
const StatisticsIndexPage = lazy(() => import('./features/statistics/StatisticsIndexPage'));
const UserStatsPage = lazy(() => import('./features/statistics/UserStatsPage'));
const DownloadsPage = lazy(() => import('./features/statistics/DownloadsPage'));
const FileStatsPage = lazy(() => import('./features/statistics/FileStatsPage'));
const UserFileStatsPage = lazy(() => import('./features/statistics/UserFileStatsPage'));
const MemStatsPage = lazy(() => import('./features/statistics/MemStatsPage'));
const AccountPage = lazy(() => import('./features/account/AccountPage'));
const MfaSetupPage = lazy(() => import('./features/mfa/MfaSetupPage'));

export const routes: RouteObject[] = [
  { path: '/', element: <LandingResolver /> },
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <LazyRouteBoundary />,
        children: [
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
          { path: '/calendar', element: <PublicCalendarPage /> },
        ],
      },
    ],
  },
  {
    element: <ImpressumHelpLayout />,
    children: [
      {
        element: <LazyRouteBoundary />,
        children: [
          { path: '/impressum', element: <ImpressumPage /> },
          { path: '/datenschutz', element: <DatenschutzPage /> },
          { path: '/help', element: <HelpPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          {
            element: <LazyRouteBoundary />,
            children: [
              { path: '/events', element: <EventsListPage /> },
              { path: '/events/new', element: <EventCreatePage /> },
              { path: '/events/:uuid/edit', element: <EventEditPage /> },
              { path: '/events/:uuid', element: <EventDetailPage /> },
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
    ],
  },
];

export const router = createBrowserRouter(routes);
