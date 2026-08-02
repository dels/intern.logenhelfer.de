import { theme } from './theme';

test('theme carries the approved modern navy/blue/gold tokens', () => {
  expect(theme.palette.primary.main).toBe('#1E56B0');
  expect(theme.palette.primary.dark).toBe('#17408F');
  expect(theme.palette.secondary.main).toBe('#C9A44C');
  expect(theme.palette.background.default).toBe('#F7F8FA');
  expect(theme.palette.divider).toBe('#E3E6EA');
  expect(theme.shape.borderRadius).toBe(10);
});
