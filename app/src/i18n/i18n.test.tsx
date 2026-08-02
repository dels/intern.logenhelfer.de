import i18n from './index';

test('german is the default language', () => {
  expect(i18n.t('nav.dashboard')).toBe('Übersicht');
  expect(i18n.t('auth.signIn')).toBe('Anmelden');
});
