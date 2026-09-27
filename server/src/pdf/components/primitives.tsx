import { ReactNode } from 'react';
import type { Style } from '@react-pdf/types';
import { RP } from '../react-pdf-runtime';
import { color, size } from '../theme';

type Styles = Style | Style[];

export function Row({
  children,
  style,
  gap = 0,
}: {
  children: ReactNode;
  style?: Styles;
  gap?: number;
}) {
  return (
    <RP.View
      style={[
        { flexDirection: 'row', alignItems: 'center', columnGap: gap },
        ...([] as Style[]).concat(style ?? []),
      ]}
    >
      {children}
    </RP.View>
  );
}

/** Field caption, e.g. "Matricule". */
export function Label({
  children,
  width,
  style,
}: {
  children: ReactNode;
  width?: number;
  style?: Styles;
}) {
  return (
    <RP.Text
      style={[
        { fontSize: size.body, color: color.muted, width },
        ...([] as Style[]).concat(style ?? []),
      ]}
    >
      {children}
    </RP.Text>
  );
}

/** Small unit after a box: "DA", "KM". */
export function Unit({ children }: { children: ReactNode }) {
  return (
    <RP.Text
      style={{ fontSize: size.small, color: color.muted, fontWeight: 500 }}
    >
      {children}
    </RP.Text>
  );
}

/**
 * Label followed by a colon and a value on a hairline baseline.
 * Used for the identity lines (Matricule, Nom Prénom…).
 */
export function Field({
  label,
  value,
  labelWidth = 128,
  strong = false,
}: {
  label: string;
  value: string;
  labelWidth?: number;
  strong?: boolean;
}) {
  return (
    <Row style={{ minHeight: 17 }}>
      <Label width={labelWidth}>{label}</Label>
      <RP.Text style={{ fontSize: size.body, color: color.faint, width: 10 }}>
        :
      </RP.Text>
      <RP.View
        style={{
          flex: 1,
          borderBottomWidth: 0.5,
          borderBottomColor: color.hairline,
          borderBottomStyle: 'dotted',
          paddingBottom: 1.5,
        }}
      >
        <RP.Text
          style={{
            maxLines: 2,
            textOverflow: 'ellipsis',
            fontSize: size.value,
            color: color.ink,
            fontWeight: strong ? 700 : 600,
          }}
        >
          {value || ' '}
        </RP.Text>
      </RP.View>
    </Row>
  );
}

/** A form box: tinted, hairline-bordered, holding a value (or blank for hand filling). */
export function Box({
  value,
  width,
  height = 17,
  align = 'left',
  flex,
  emphasis = false,
  tinted = true,
  maxLines = 2,
  style,
}: {
  value?: string;
  /** Long values wrap, then end with an ellipsis so the page never overflows. */
  maxLines?: number;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
  flex?: number;
  emphasis?: boolean;
  tinted?: boolean;
  style?: Styles;
}) {
  return (
    <RP.View
      style={[
        {
          width,
          flex,
          // Grows with long values instead of clipping them.
          minHeight: height,
          paddingVertical: 1.5,
          borderWidth: 0.75,
          borderColor: emphasis ? color.green : color.rule,
          backgroundColor: tinted ? color.tint : color.white,
          borderRadius: 2,
          paddingHorizontal: 5,
          justifyContent: 'center',
        },
        ...([] as Style[]).concat(style ?? []),
      ]}
    >
      <RP.Text
        style={{
          maxLines,
          textOverflow: 'ellipsis',
          fontSize: emphasis ? size.lead : size.value - 0.5,
          fontWeight: emphasis ? 700 : 600,
          color: emphasis ? color.green : color.ink,
          textAlign: align,
        }}
      >
        {value || ''}
      </RP.Text>
    </RP.View>
  );
}

/** HH : MM pair of boxes. */
export function TimeBoxes({ hour, minute }: { hour: string; minute: string }) {
  return (
    <Row gap={3}>
      <Box value={hour} width={28} align="center" />
      <RP.Text style={{ fontSize: size.value, color: color.faint }}>:</RP.Text>
      <Box value={minute} width={28} align="center" />
    </Row>
  );
}

/** Outlined "⇨" arrow, as in the Word form, drawn as a vector. */
export function Arrow() {
  return (
    <RP.Svg viewBox="0 0 20 10" style={{ width: 17, height: 8.5 }}>
      <RP.Path
        d="M1 3.2 H12 V0.8 L19 5 L12 9.2 V6.8 H1 Z"
        fill={color.white}
        stroke={color.muted}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
    </RP.Svg>
  );
}

/** Square checkbox (default) or round radio. */
export function Check({
  checked = false,
  shape = 'square',
  sizePt = 8.5,
}: {
  checked?: boolean;
  shape?: 'square' | 'circle';
  sizePt?: number;
}) {
  return (
    <RP.Svg viewBox="0 0 10 10" style={{ width: sizePt, height: sizePt }}>
      {shape === 'circle' ? (
        <RP.Circle
          cx={5}
          cy={5}
          r={4.4}
          fill={checked ? color.green : color.white}
          stroke={checked ? color.green : color.text}
          strokeWidth={0.8}
        />
      ) : (
        <RP.Rect
          x={0.6}
          y={0.6}
          width={8.8}
          height={8.8}
          rx={1.2}
          fill={checked ? color.green : color.white}
          stroke={checked ? color.green : color.text}
          strokeWidth={0.8}
        />
      )}
      {checked ? (
        <RP.Path
          d="M2.6 5.2 L4.3 6.9 L7.5 3.3"
          fill="none"
          stroke={color.white}
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </RP.Svg>
  );
}

/** Option line: checkbox + caption. */
export function Option({
  checked,
  children,
  shape,
  fontSize = size.body,
}: {
  checked: boolean;
  children: ReactNode;
  shape?: 'square' | 'circle';
  fontSize?: number;
}) {
  return (
    <Row gap={5}>
      <Check checked={checked} shape={shape} />
      <RP.Text
        style={{
          fontSize,
          color: checked ? color.ink : color.text,
          fontWeight: checked ? 600 : 400,
        }}
      >
        {children}
      </RP.Text>
    </Row>
  );
}

/** Section heading: green tab, navy caps, hairline running to the margin. */
export function SectionTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: Styles;
}) {
  return (
    <Row
      gap={6}
      style={[{ marginBottom: 5 }, ...([] as Style[]).concat(style ?? [])]}
    >
      <RP.View
        style={{
          width: 3,
          height: 10,
          backgroundColor: color.green,
          borderRadius: 1,
        }}
      />
      <RP.Text
        style={{
          fontSize: size.small,
          fontWeight: 700,
          color: color.navy,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </RP.Text>
      <RP.View
        style={{ flex: 1, height: 0.5, backgroundColor: color.hairline }}
      />
    </Row>
  );
}

/** Row of signature cells sharing borders, each with a caption and blank space. */
export function SignaturePanel({
  captions,
  height = 72,
}: {
  captions: ReactNode[];
  height?: number;
}) {
  return (
    <RP.View
      wrap={false}
      style={{
        flexDirection: 'row',
        borderWidth: 0.9,
        borderColor: color.text,
        borderRadius: 3,
      }}
    >
      {captions.map((c, i) => (
        <RP.View
          key={i}
          style={{
            flex: 1,
            height,
            padding: 7,
            borderLeftWidth: i === 0 ? 0 : 0.75,
            borderLeftColor: color.rule,
          }}
        >
          <RP.Text
            style={{
              fontSize: size.small,
              color: color.text,
              lineHeight: 1.35,
            }}
          >
            {c}
          </RP.Text>
        </RP.View>
      ))}
    </RP.View>
  );
}
