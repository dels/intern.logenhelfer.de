import { Link as RouterLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { useBreadcrumbContext } from './BreadcrumbContext';

type SectionEntry = {
  sectionKey: string;
  sectionTo: string;
  createKey?: string;
  editKey?: string;
};

// First path segment -> the nav section it belongs to, plus (where relevant) that
// feature's own create/edit i18n keys. `directories`, `files` and `officers` are separate
// top-level route segments but are managed from within the Categories/Lodges detail pages,
// so they roll up into those sections rather than getting one of their own.
const SECTIONS: Record<string, SectionEntry> = {
  events: { sectionKey: 'nav.events', sectionTo: '/events', createKey: 'events.create', editKey: 'events.edit' },
  members: { sectionKey: 'nav.users', sectionTo: '/members', createKey: 'members.create', editKey: 'members.edit' },
  seekers: { sectionKey: 'nav.seekers', sectionTo: '/seekers', createKey: 'seekers.create', editKey: 'seekers.edit' },
  categories: { sectionKey: 'nav.categories', sectionTo: '/categories', createKey: 'categories.create', editKey: 'categories.edit' },
  directories: { sectionKey: 'nav.categories', sectionTo: '/categories', createKey: 'directories.create', editKey: 'directories.edit' },
  files: { sectionKey: 'nav.categories', sectionTo: '/categories', editKey: 'files.edit' },
  lodges: { sectionKey: 'nav.lodges', sectionTo: '/lodges', createKey: 'lodges.create', editKey: 'lodges.edit' },
  officers: { sectionKey: 'nav.lodges', sectionTo: '/lodges', createKey: 'officers.create', editKey: 'officers.edit' },
  announcements: { sectionKey: 'nav.announcements', sectionTo: '/announcements', createKey: 'announcements.create', editKey: 'announcements.edit' },
  statistics: { sectionKey: 'nav.statistics', sectionTo: '/statistics' },
  configuration: { sectionKey: 'nav.settings', sectionTo: '/configuration' },
  account: { sectionKey: 'account.navLabel', sectionTo: '/account' },
};

// Detail pages (category/directory/file) register their real, loaded entity names via
// BreadcrumbContext (see useSetBreadcrumb) — when a page has done so, that trail is rendered
// as-is below. Every other page (list pages, edit/create pages) never calls useSetBreadcrumb,
// so items stays empty and crumbs fall back to the generic URL-derived SECTIONS logic further
// down, same as before this context existed.
export default function Breadcrumbs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { items } = useBreadcrumbContext();

  if (items.length > 0) {
    return (
      <MuiBreadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
        {items.map((item, i) =>
          item.to ? (
            <Link key={`${item.to}-${i}`} component={RouterLink} to={item.to}>{item.label}</Link>
          ) : (
            <Typography key={`current-${i}`} color="text.primary">{item.label}</Typography>
          ),
        )}
      </MuiBreadcrumbs>
    );
  }

  const segments = pathname.split('/').filter(Boolean);
  const [first] = segments;
  const last = segments[segments.length - 1];

  if (!first || first === 'dashboard') {
    return (
      <MuiBreadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
        <Typography color="text.primary">{t('nav.dashboard')}</Typography>
      </MuiBreadcrumbs>
    );
  }

  const entry = SECTIONS[first];
  if (!entry) {
    return (
      <MuiBreadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
        <Link component={RouterLink} to="/dashboard">{t('nav.dashboard')}</Link>
      </MuiBreadcrumbs>
    );
  }

  const MEMBERS_SUB_ROUTE_KEYS: Record<string, string> = {
    'phone-list': 'members.phoneListHeader',
    'birthday-list': 'members.birthdayListHeader',
    council: 'members.councilListHeader',
  };

  let thirdKey: string | undefined;
  if (last === 'new') {
    // e.g. /categories/:categorySlug/directories/new — the segment right before "new" is the
    // feature actually being created, which may differ from the first URL segment.
    const featureSegment = segments[segments.length - 2] ?? first;
    thirdKey = SECTIONS[featureSegment]?.createKey ?? entry.createKey;
  } else if (last === 'edit') {
    // `entry` is always SECTIONS['categories'] here for nested directory/file
    // edit pages too (e.g. /categories/:slug/directories/:slug/edit), since
    // `first` is the URL's first segment, which is always "categories" for
    // those routes - SECTIONS['directories']/['files'].editKey are never
    // read in this branch. Currently invisible because categories.edit,
    // directories.edit, and files.edit all resolve to the same string in
    // both de.json and en.json; if they ever diverge, this would start
    // showing the wrong label for directory/file edit pages.
    thirdKey = entry.editKey;
  } else if (first === 'members' && last) {
    thirdKey = MEMBERS_SUB_ROUTE_KEYS[last];
  }

  const sectionIsCurrentPage = !thirdKey && pathname === entry.sectionTo;

  if (sectionIsCurrentPage) {
    return (
      <MuiBreadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
        <Typography color="text.primary">{t(entry.sectionKey)}</Typography>
      </MuiBreadcrumbs>
    );
  }

  return (
    <MuiBreadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
      <Link component={RouterLink} to={entry.sectionTo}>{t(entry.sectionKey)}</Link>
      {thirdKey && <Typography color="text.primary">{t(thirdKey)}</Typography>}
    </MuiBreadcrumbs>
  );
}
