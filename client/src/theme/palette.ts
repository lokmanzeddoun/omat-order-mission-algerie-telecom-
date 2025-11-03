import { PaletteColorOptions, PaletteOptions, PaletteMode } from '@mui/material/styles';
import { gray, darkGray, transparentGray, red, green, blue, yellow, white } from './colors';

declare module '@mui/material/styles' {
  interface PaletteOptions {
    neutral?: PaletteColorOptions;
    transparent?: {
      gray: PaletteColorOptions;
    };
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
    darker?: string;
    state?: string;
  }
  interface Palette {
    neutral: PaletteColor;
    transparent: {
      gray: PaletteColor;
    };
  }
  interface PaletteColor {
    lighter: string;
    darker: string;
    state: string;
  }
}

const getPalette = (mode: PaletteMode): PaletteOptions => ({
  mode,
  neutral: {
    lighter: mode === 'light' ? gray[100] : darkGray[700],
    light: mode === 'light' ? gray[200] : darkGray[600],
    main: mode === 'light' ? gray[500] : gray[300],
    darker: mode === 'light' ? gray[900] : gray[100],
  },
  primary: {
    light: mode === 'light' ? blue[100] : blue[300],
    main: mode === 'light' ? blue[500] : blue[400],
    dark: mode === 'light' ? darkGray[500] : blue[600],
  },
  secondary: {
    light: mode === 'light' ? blue[200] : blue[300],
    main: mode === 'light' ? blue[600] : blue[500],
    dark: mode === 'light' ? darkGray[800] : darkGray[600],
  },
  info: {
    lighter: mode === 'light' ? white[100] : darkGray[600],
    light: mode === 'light' ? white[200] : darkGray[500],
    main: mode === 'light' ? white[300] : darkGray[400],
    dark: mode === 'light' ? white[400] : darkGray[300],
    darker: mode === 'light' ? white[500] : darkGray[200],
  },
  success: {
    light: mode === 'light' ? green[100] : green[300],
    main: mode === 'light' ? green[500] : green[400],
    dark: mode === 'light' ? green[800] : green[700],
  },
  warning: {
    light: mode === 'light' ? yellow[100] : yellow[300],
    main: mode === 'light' ? yellow[500] : yellow[400],
    dark: mode === 'light' ? yellow[800] : yellow[700],
  },
  error: {
    light: mode === 'light' ? red[100] : red[300],
    main: mode === 'light' ? red[500] : red[400],
    dark: mode === 'light' ? red[800] : red[700],
  },
  text: {
    primary: mode === 'light' ? darkGray[500] : gray[100],
    secondary: mode === 'light' ? gray[400] : gray[300],
    disabled: mode === 'light' ? gray[300] : gray[500],
  },
  background: {
    default: mode === 'light' ? white[300] : '#0f1115',
    paper: mode === 'light' ? white[100] : '#1a1d24',
  },
  divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)',
  transparent: {
    gray: {
      main: transparentGray[500],
    },
  },
});

export default getPalette;

