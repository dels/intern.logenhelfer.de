import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, CircularProgress, Collapse, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Button, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/GridViewRounded';
import EventIcon from '@mui/icons-material/CalendarMonthRounded';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import PersonSearchIcon from '@mui/icons-material/PersonSearchRounded';
import CategoryIcon from '@mui/icons-material/CategoryRounded';
import FolderIcon from '@mui/icons-material/FolderRounded';
import LodgeIcon from '@mui/icons-material/AccountBalanceRounded';
import AnnouncementIcon from '@mui/icons-material/Campaign';
import BarChartIcon from '@mui/icons-material/BarChartRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import SyncIcon from '@mui/icons-material/Sync';
import AccountCircleIcon from '@mui/icons-material/AccountCircleRounded';
import { useAuth } from '../auth/AuthProvider';
import { apiErrorMessage } from '../api/client';
import { useCategories } from '../features/categories/api';
import { useDirectories } from '../features/directories/api';
import type { CategorySummary } from '../api/types';
import Breadcrumbs from './Breadcrumbs';
import { BreadcrumbProvider } from './BreadcrumbContext';
import TopNav from './TopNav';
import GdprGate from '../components/GdprGate';

const DRAWER_WIDTH = 280;

// Every visible category becomes its own sidebar item (section 3) - see the
// design doc. 100 is the OpenAPI-enforced max page size; a lodge with more
// than 100 visible categories would only see the first 100 in the sidebar.
// ponytail: no real deployment is anywhere near that size; add real
// pagination/search in the sidebar if that ever changes.
const CATEGORY_PAGE_SIZE = 100;

type NavItem = { key: string; to: string; icon: ReactElement };

function NavItemRow({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <ListItemButton
      component={NavLink}
      to={item.to}
      onClick={onClick}
      sx={{
        borderRadius: 99,
        mb: 0.5,
        '&[aria-current="page"]': {
          bgcolor: 'background.paper',
          boxShadow: '0 1px 2px rgba(16,24,40,.06)',
          fontWeight: 600,
          '& .MuiListItemIcon-root': { color: 'secondary.main' },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
      <ListItemText primary={t(item.key)} />
    </ListItemButton>
  );
}

function CategoryNavItem({
  category, expanded, onToggle, onNavigate,
}: {
  category: CategorySummary;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const { data: directories, isLoading: directoriesLoading } = useDirectories(category.slug ?? '', { enabled: expanded });

  const handleHeaderClick = () => {
    onToggle();
    onNavigate();
  };

  return (
    <>
      <ListItemButton
        component={NavLink}
        to={`/categories/${category.slug}`}
        onClick={handleHeaderClick}
        sx={{ borderRadius: 99, mb: 0.5 }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}><CategoryIcon /></ListItemIcon>
        <ListItemText primary={category.name} />
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ListItemButton>
      <Collapse in={expanded}>
        {directoriesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={16} /></Box>
        ) : (
          <List disablePadding>
            {(directories?.rows ?? []).map((directory) => (
              <ListItemButton key={directory.slug} component={NavLink} to={`/categories/${category.slug}/directories/${directory.slug}`} onClick={onNavigate} sx={{ borderRadius: 99, mb: 0.5, pl: 5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><FolderIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={directory.name} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Collapse>
    </>
  );
}

export default function AppShell() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const [expandedCategorySlug, setExpandedCategorySlug] = useState<string | null>(null);
  const [stopImpersonatingError, setStopImpersonatingError] = useState<unknown>(null);
  const { user, abilities, impersonating, stopImpersonating } = useAuth();
  const { data: categoryList } = useCategories(0, CATEGORY_PAGE_SIZE);
  const mainRef = useRef<HTMLDivElement>(null);

  // The sidebar (`nav`) and the main content area are independent scroll
  // containers (see the height/overflow split below) so that scrolling the
  // sidebar's category list never moves the page. But that same persistence
  // means the main container's own scroll position survives a route change
  // (AppShell never remounts - only <Outlet/> swaps), so it must be reset
  // explicitly on every navigation. Deliberately not touching the sidebar's
  // scroll position here: it must stay wherever the user left it, e.g. to
  // keep an expanded category visible after following one of its links.
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Security-sensitive per CLAUDE.md: an impersonating admin must still see
  // the app regardless of the impersonated member's gdpr_accepted state -
  // they literally cannot accept GDPR on the member's behalf (api/src/routes
  // /me.ts's gdpr_acceptance handler returns 403 forbidden_while_impersonating
  // while impersonating), so gating their view too would be a dead end, not
  // a real consent enforcement.
  const gdprGateActive = !!user && !user.gdpr_accepted && !impersonating;

  const handleStopImpersonating = () => {
    setStopImpersonatingError(null);
    stopImpersonating()
      .then(() => navigate('/'))
      .catch((error: unknown) => setStopImpersonatingError(error));
  };

  const generalItems: NavItem[] = [
    { key: 'nav.dashboard', to: '/dashboard', icon: <DashboardIcon /> },
    { key: 'nav.announcements', to: '/announcements', icon: <AnnouncementIcon /> },
    { key: 'nav.events', to: '/events', icon: <EventIcon /> },
    { key: 'nav.users', to: '/members', icon: <PeopleIcon /> },
    ...(abilities.seeker?.includes('read') ? [{ key: 'nav.seekers', to: '/seekers', icon: <PersonSearchIcon /> }] : []),
    ...(abilities.statistic?.includes('index') ? [{ key: 'nav.statistics', to: '/statistics', icon: <BarChartIcon /> }] : []),
    { key: 'account.navLabel', to: '/account', icon: <AccountCircleIcon /> },
  ];

  const configItems: NavItem[] = [
    ...(abilities.lodge?.includes('update') ? [{ key: 'nav.lodges', to: '/lodges', icon: <LodgeIcon /> }] : []),
    ...(abilities.category?.includes('create') ? [{ key: 'nav.categories', to: '/categories', icon: <CategoryIcon /> }] : []),
    ...(abilities.app_config?.includes('update') ? [{ key: 'nav.settings', to: '/configuration', icon: <SettingsIcon /> }] : []),
    ...(abilities.external_event?.includes('create') ? [{ key: 'nav.externalEventIcsSources', to: '/external-event-ics-sources', icon: <SyncIcon /> }] : []),
  ];

  const categories = categoryList?.rows ?? [];

  const closeDrawer = () => setOpen(false);

  const nav = (
    <Box sx={{ width: DRAWER_WIDTH, p: 2, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Toolbar />
      <List>
        {generalItems.map((item) => <NavItemRow key={item.to} item={item} onClick={closeDrawer} />)}
      </List>
      {configItems.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="overline" sx={{ px: 1.5, color: 'text.secondary' }}>{t('nav.configurationSection')}</Typography>
          <List>
            {configItems.map((item) => <NavItemRow key={item.to} item={item} onClick={closeDrawer} />)}
          </List>
        </>
      )}
      {categories.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="overline" sx={{ px: 1.5, color: 'text.secondary' }}>{t('nav.filesSection')}</Typography>
          <List>
            {categories.map((category) => (
              <CategoryNavItem
                key={category.slug}
                category={category}
                expanded={expandedCategorySlug === category.slug}
                onToggle={() => setExpandedCategorySlug((current) => (current === category.slug ? null : category.slug ?? null))}
                onNavigate={closeDrawer}
              />
            ))}
          </List>
        </>
      )}
      <Box sx={{ mt: 'auto', px: 1, pt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.firstname} {user?.lastname}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100dvh - var(--demo-banner-height, 0px))', mt: 'var(--demo-banner-height, 0px)', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <TopNav variant="authenticated" onMenuClick={desktop || gdprGateActive ? undefined : () => setOpen(true)} />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!gdprGateActive && (desktop ? (
          <Box component="nav" aria-label="Hauptnavigation" sx={{ height: '100%', overflowY: 'auto' }}>{nav}</Box>
        ) : (
          <Drawer open={open} onClose={() => setOpen(false)}>{nav}</Drawer>
        ))}
        <Box
          component="main"
          ref={mainRef}
          sx={{ flex: 1, height: '100%', overflowY: 'auto', p: 3 }}
        >
          {/* Scroll container itself spans the full flex-remaining width so
              its scrollbar sits at the true edge (next to the sidebar/
              viewport edge) instead of floating inset - only this inner
              wrapper is width-constrained/centered. */}
          <Box sx={{ maxWidth: 1120, mx: 'auto', width: '100%' }}>
            <Toolbar />
            {gdprGateActive ? (
              <GdprGate />
            ) : (
              <BreadcrumbProvider>
                <Breadcrumbs />
                {impersonating && (
                  <Alert
                    severity="warning"
                    sx={{ mb: 2 }}
                    action={
                      <Button color="inherit" size="small" onClick={handleStopImpersonating}>
                        {t('members.stopImpersonating')}
                      </Button>
                    }
                  >
                    {t('members.impersonationBanner', { name: `${user?.firstname} ${user?.lastname}` })}
                  </Alert>
                )}
                {stopImpersonatingError != null && (
                  <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(stopImpersonatingError)}</Alert>
                )}
                <Outlet />
              </BreadcrumbProvider>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
