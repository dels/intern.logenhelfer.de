import { useState } from 'react';
import {
  Box, List, ListItemButton, ListItemText, Tabs, Tab,
} from '@mui/material';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';

/**
 * Every individual statistics report, its route, and the i18n key for its
 * link label. Shared between StatisticsIndexPage (the bare "/statistics"
 * hub) and every individual report page (UserStatsPage, DownloadsPage,
 * FileStatsPage, UserFileStatsPage, MemStatsPage - see app/src/routes.tsx's
 * /statistics/* routes), so every page mounts the exact same tab bar.
 */
// oxlint-disable-next-line react/only-export-components -- shared with Task 5's individual report pages, fast-refresh-only concern
export const PAGES = [
  { action: 'user_stats', to: '/statistics/user-stats', labelKey: 'statistics.userStats' },
  { action: 'downloads', to: '/statistics/downloads', labelKey: 'statistics.downloads' },
  { action: 'file_stats', to: '/statistics/file-stats', labelKey: 'statistics.fileStats' },
  { action: 'user_file_stats', to: '/statistics/user-file-stats', labelKey: 'statistics.userFileStats' },
  { action: 'mem_stats', to: '/statistics/mem-stats', labelKey: 'statistics.memStats' },
] as const;

/**
 * Category groupings for the tab bar. `mem_stats` (Speichernutzung/Storage
 * usage) lives in its own "Meta" category, not "Mitglieder" - it's an
 * application/DB-wide figure, not member-specific data.
 */
// oxlint-disable-next-line react/only-export-components -- shared with Task 5's individual report pages, fast-refresh-only concern
export const CATEGORIES = [
  { key: 'members', labelKey: 'statistics.categoryMembers', actions: ['user_stats', 'user_file_stats'] },
  { key: 'files', labelKey: 'statistics.categoryFiles', actions: ['downloads', 'file_stats'] },
  { key: 'meta', labelKey: 'statistics.categoryMeta', actions: ['mem_stats'] },
] as const;

type Page = (typeof PAGES)[number];
type Category = (typeof CATEGORIES)[number] & { pages: Page[] };

function grantedCategories(granted: Page[]): Category[] {
  return CATEGORIES
    .map((category) => ({
      ...category,
      pages: granted.filter((page) => (category.actions as readonly string[]).includes(page.action)),
    }))
    .filter((category) => category.pages.length > 0);
}

function defaultActiveIndex(pathname: string, categories: Category[]): number {
  const currentPage = PAGES.find((p) => p.to === pathname);
  if (currentPage) {
    const idx = categories.findIndex((c) => (c.actions as readonly string[]).includes(currentPage.action));
    if (idx >= 0) return idx;
  }
  return 0;
}

/**
 * The statistics section's persistent category tab bar + per-category link
 * list. Mounted identically at the top of StatisticsIndexPage and every
 * individual report page so it never disappears while a user is browsing
 * between reports - fixes a real bug where navigating into any individual
 * report (e.g. MemStatsPage) used to unmount the entire index page
 * (including this tab bar) with no way to switch reports short of using the
 * browser's back button. Each report is still its own top-level route (see
 * routes.tsx), so this component instance does still get torn down and
 * recreated on every navigation between reports - but it reappears in the
 * exact same place with the exact same content every time, so from the
 * user's perspective the tab bar never disappears.
 *
 * The active tab defaults to whichever category owns the current route, but
 * that default is recomputed on every render rather than captured once via
 * a `useState` initializer: `useAuth()`'s abilities arrive asynchronously
 * (AuthProvider renders children immediately with `abilities: {}` while
 * `/api/v1/me` is in flight), so on first render `categories` is always
 * empty regardless of the route. A one-shot `useState(() => ...)` would
 * freeze the default at index 0 forever once abilities load. Instead only
 * an explicit tab click ("userSelectedTab") overrides the route-derived
 * default; absent a click, the default keeps recomputing off the current
 * `location.pathname` and `categories`, so it lands on the right tab once
 * abilities actually arrive.
 */
export default function StatisticsNavTabs() {
  const { t } = useTranslation();
  const { abilities } = useAuth();
  const location = useLocation();

  const granted = PAGES.filter((p) => abilities.statistic?.includes(p.action));
  const categories = grantedCategories(granted);

  const [userSelectedTab, setUserSelectedTab] = useState<number | null>(null);
  const requestedTab = userSelectedTab ?? defaultActiveIndex(location.pathname, categories);
  const activeTab = Math.min(requestedTab, Math.max(categories.length - 1, 0));
  const activeCategory = categories[activeTab];

  if (!activeCategory) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Tabs value={activeTab} onChange={(_e, value: number) => setUserSelectedTab(value)} sx={{ mb: 2 }}>
        {categories.map((category) => (
          <Tab key={category.key} label={t(category.labelKey)} />
        ))}
      </Tabs>
      <List>
        {activeCategory.pages.map((page) => (
          <ListItemButton key={page.action} component={Link} to={page.to}>
            <ListItemText primary={t(page.labelKey)} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
