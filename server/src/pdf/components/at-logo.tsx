import { RP } from '../react-pdf-runtime';
import { AT_LOGO_PATHS, AT_LOGO_VIEWBOX } from './at-logo.paths';

const RATIO = 235.333 / 497.333;

/** Algérie Télécom logo, drawn as vectors so it stays sharp when printed. */
export function AtLogo({ width = 84 }: { width?: number }) {
  return (
    <RP.Svg viewBox={AT_LOGO_VIEWBOX} style={{ width, height: width * RATIO }}>
      {AT_LOGO_PATHS.map((p, i) => (
        <RP.Path
          key={i}
          d={p.d}
          fill={p.fill}
          fillRule={p.evenOdd ? 'evenodd' : undefined}
        />
      ))}
    </RP.Svg>
  );
}
