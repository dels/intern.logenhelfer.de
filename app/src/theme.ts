import { createTheme } from '@mui/material/styles';
import { deDE } from '@mui/material/locale';

export const theme = createTheme(
  {
    palette: {
      // "Moderne Variante" palette — approved design mock's cool gray/white
      // look with navy-blue accents, keeping the same gold secondary as before.
      primary: { main: '#1E56B0', dark: '#17408F' },
      secondary: { main: '#C9A44C', dark: '#A9873A' },
      success: { main: '#16A34A' },
      warning: { main: '#B45309' },
      error: { main: '#DC2626' },
      background: { default: '#F7F8FA', paper: '#FFFFFF' },
      text: { primary: '#1C1F26', secondary: '#6B7280' },
      // Cool gray — used by Divider/AppBar/Table borders everywhere they
      // reference `divider` (see App*/List rows).
      divider: '#E3E6EA',
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
      h1: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#122B52' },
      h2: { fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', color: '#122B52' },
      h3: { fontSize: 18, fontWeight: 600 },
      body1: { fontSize: 14.5 },
      overline: { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em' },
    },
    components: {
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          // Shadow-only card treatment (no border) — the mock uses a larger
          // radius for cards than for buttons/inputs.
          root: {
            borderRadius: 14,
            boxShadow: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: { borderColor: '#E3E6EA' },
          root: {
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9CA3AF' },
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
    },
  },
  deDE,
);
