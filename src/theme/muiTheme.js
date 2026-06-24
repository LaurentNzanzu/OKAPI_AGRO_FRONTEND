import { createTheme } from '@mui/material/styles';

export const PETROL = '#0F2A44';
export const PETROL_HOVER = '#1E2A3D';

// Alignés sur tailwind.config.js, constants.js et usages existants (FichePanne, ListeBiens)
export const SUCCESS = '#168A5B';
export const WARNING = '#D97706';
export const DANGER = '#DC2626';
export const INFO = '#2196f3';
export const PURPLE = '#9333ea';
export const PURPLE_DARK = '#7e22ce';
export const PURPLE_LIGHT = '#f3e8ff';
export const BORDER_LIGHT = '#E5E7EB';
export const BORDER_DARK = '#334155';

const semanticPalette = {
  success: {
    main: SUCCESS,
    dark: '#127a4f',
    light: '#dcfce7',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: WARNING,
    dark: '#b45309',
    light: '#fef3c7',
    contrastText: '#FFFFFF',
  },
  error: {
    main: DANGER,
    dark: '#b91c1c',
    light: '#fee2e2',
    contrastText: '#FFFFFF',
  },
  info: {
    main: PETROL,
    dark: PETROL_HOVER,
    light: '#25344D',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: PURPLE,
    dark: PURPLE_DARK,
    light: PURPLE_LIGHT,
    contrastText: '#FFFFFF',
  },
};

const sharedTypography = {
  h4: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
  h6: { fontSize: '1.25rem', fontWeight: 600 },
  body2: { fontSize: '0.875rem' },
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: { textTransform: 'none', borderRadius: 8, fontSize: '0.875rem' },
    },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: '1px solid #E5E7EB',
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          backgroundColor: PETROL,
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      head: {
        backgroundColor: PETROL,
        '& .MuiTableCell-head': {
          color: '#FFFFFF',
          fontWeight: 600,
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: PETROL,
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        '&.Mui-focused': { color: PETROL },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 44,
        borderBottom: `1px solid ${BORDER_LIGHT}`,
      },
      indicator: {
        backgroundColor: PETROL,
        height: 2,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'uppercase',
        fontWeight: 500,
        fontSize: '0.8125rem',
        letterSpacing: '0.02em',
        minHeight: 44,
        color: '#6B7280',
        '&.Mui-selected': {
          color: PETROL,
        },
        '&:hover': {
          color: PETROL_HOVER,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
        backgroundColor: '#E5E7EB',
      },
      bar: {
        borderRadius: 4,
        backgroundColor: PETROL,
      },
    },
  },
};

export const okapiMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: PETROL,
      dark: PETROL_HOVER,
      light: '#25344D',
      contrastText: '#FFFFFF',
    },
    ...semanticPalette,
  },
  typography: sharedTypography,
  shape: { borderRadius: 12 },
  components: sharedComponents,
});

const darkSemanticPalette = {
  success: { ...semanticPalette.success, contrastText: '#cbd5e1' },
  warning: { ...semanticPalette.warning, contrastText: '#cbd5e1' },
  error: { ...semanticPalette.error, contrastText: '#cbd5e1' },
  info: { ...semanticPalette.info, contrastText: '#cbd5e1' },
  secondary: { ...semanticPalette.secondary, contrastText: '#cbd5e1' },
};

export const okapiMuiDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: PETROL,
      dark: '#0B1220',
      light: '#25344D',
      contrastText: '#cbd5e1',
    },
    background: {
      default: '#121a2a',
      paper: '#1f2937',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: BORDER_DARK,
    ...darkSemanticPalette,
  },
  typography: sharedTypography,
  shape: { borderRadius: 12 },
  components: {
    ...sharedComponents,
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderBottom: `1px solid ${BORDER_DARK}`,
        },
        indicator: {
          backgroundColor: PETROL,
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          fontWeight: 500,
          fontSize: '0.8125rem',
          letterSpacing: '0.02em',
          minHeight: 44,
          color: '#64748b',
          '&.Mui-selected': {
            color: '#94a3b8',
          },
          '&:hover': {
            color: '#94a3b8',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: BORDER_DARK,
        },
        bar: {
          borderRadius: 4,
          backgroundColor: '#25344D',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #334155',
          backgroundImage: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#24324a',
            color: '#f1f5f9',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(39, 52, 73, 0.5)',
          },
        },
        head: {
          backgroundColor: '#24324a',
          '& .MuiTableCell-head': {
            color: '#f1f5f9',
            fontWeight: 600,
          },
        },
      },
    },
  },
});
