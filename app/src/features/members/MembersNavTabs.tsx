import { Link as RouterLink, useLocation } from 'react-router';
import { Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function MembersNavTabs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <Tabs value={pathname} aria-label={t('nav.users')} sx={{ mb: 2 }}>
      <Tab value="/members" label={t('nav.users')} component={RouterLink} to="/members" />
      <Tab value="/members/phone-list" label={t('members.phoneListHeader')} component={RouterLink} to="/members/phone-list" />
      <Tab value="/members/birthday-list" label={t('members.birthdayListHeader')} component={RouterLink} to="/members/birthday-list" />
      <Tab value="/members/council" label={t('members.councilListHeader')} component={RouterLink} to="/members/council" />
    </Tabs>
  );
}
