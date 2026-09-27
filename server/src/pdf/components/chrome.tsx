import { RP } from '../react-pdf-runtime';
import { COMPANY, DRT_LABEL, color, size, space } from '../theme';
import { AtLogo } from './at-logo';
import { Row } from './primitives';
import { QrCode } from './qr-code';

/** Logo + legal mentions, closed by a green/hairline rule. */
export function Letterhead() {
  return (
    <RP.View style={{ marginBottom: 10 }}>
      <Row style={{ justifyContent: 'space-between', paddingBottom: 6 }}>
        <AtLogo width={82} />
        <RP.View style={{ alignItems: 'flex-end', rowGap: 2 }}>
          <RP.Text style={{ fontSize: size.tiny, color: color.muted }}>
            {COMPANY.legal}{' '}
            <RP.Text style={{ color: color.green, fontWeight: 700 }}>
              {COMPANY.capital}
            </RP.Text>
          </RP.Text>
          <RP.Text style={{ fontSize: size.tiny, color: color.muted }}>
            {COMPANY.rc}
          </RP.Text>
        </RP.View>
      </Row>
      <Row>
        <RP.View
          style={{ width: 82, height: 1.6, backgroundColor: color.green }}
        />
        <RP.View
          style={{ flex: 1, height: 0.6, backgroundColor: color.hairline }}
        />
      </Row>
    </RP.View>
  );
}

function Bracket({ side }: { side: 'left' | 'right' }) {
  const edge = side === 'left' ? 'Left' : 'Right';
  return (
    <RP.View
      style={{
        width: 6,
        borderTopWidth: 1.4,
        borderBottomWidth: 1.4,
        [`border${edge}Width`]: 1.4,
        borderColor: color.greenSoft,
        [`borderTop${edge}Radius`]: 5,
        [`borderBottom${edge}Radius`]: 5,
      }}
    />
  );
}

function DrtLine({ label, value }: { label: string; value: string }) {
  return (
    <Row>
      <RP.Text
        style={{
          fontSize: size.small,
          fontWeight: 700,
          color: color.ink,
          width: 26,
        }}
      >
        {label}
      </RP.Text>
      <RP.Text style={{ fontSize: size.small, fontWeight: 700, color: color.ink }}>
        : {value}
      </RP.Text>
    </Row>
  );
}

/** The bracketed DRT / DOT / DUS block. */
export function DrtBlock() {
  return (
    <RP.View style={{ flexDirection: 'row', width: 190 }}>
      <Bracket side="left" />
      <RP.View
        style={{ flex: 1, paddingVertical: 5, paddingHorizontal: 8, rowGap: 2 }}
      >
        <DrtLine label="DRT" value={DRT_LABEL} />
        <DrtLine label="DOT" value="" />
        <Row>
          <RP.Text
            style={{
              fontSize: size.small,
              fontWeight: 700,
              color: color.ink,
              width: 26,
            }}
          >
            DUS
          </RP.Text>
          <RP.Text style={{ fontSize: size.small, color: color.muted }}>
            : ……………………………
          </RP.Text>
        </Row>
      </RP.View>
      <Bracket side="right" />
    </RP.View>
  );
}

/** "Ordre de mission N° 12 du 26/09/2026" reference card. */
export function DocReference({
  kind,
  numero,
  date,
  caption,
}: {
  kind: string;
  numero: string;
  date: string;
  caption?: string;
}) {
  return (
    <RP.View
      style={{
        borderLeftWidth: 2,
        borderLeftColor: color.navy,
        paddingLeft: 9,
        paddingVertical: 3,
      }}
    >
      <RP.Text
        style={{ fontSize: size.tiny, color: color.muted, letterSpacing: 0.4 }}
      >
        {kind}
      </RP.Text>
      <RP.Text style={{ fontSize: size.lead, color: color.ink, marginTop: 1 }}>
        N° <RP.Text style={{ fontWeight: 700 }}>{numero}</RP.Text>
        <RP.Text style={{ fontSize: size.body, color: color.muted }}> du </RP.Text>
        <RP.Text style={{ fontWeight: 600, fontSize: size.value }}>{date}</RP.Text>
      </RP.Text>
      {caption ? (
        <RP.Text
          style={{ fontSize: size.micro, color: color.faint, marginTop: 2 }}
        >
          {caption}
        </RP.Text>
      ) : null}
    </RP.View>
  );
}

/** DRT block on the left; document reference (and QR, when configured) on the right. */
export function DocHeader({
  qrUrl,
  ...ref
}: {
  kind: string;
  numero: string;
  date: string;
  qrUrl?: string | null;
}) {
  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <DrtBlock />
      <Row gap={12} style={{ alignItems: 'flex-end' }}>
        <DocReference
          {...ref}
          caption={qrUrl ? 'Scannez le QR code pour vérifier →' : undefined}
        />
        {qrUrl ? <QrCode value={qrUrl} width={48} /> : null}
      </Row>
    </Row>
  );
}

export function DocTitle({ children }: { children: string }) {
  return (
    <RP.View style={{ alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
      <RP.Text
        style={{
          fontSize: size.title,
          fontWeight: 700,
          color: color.navy,
          letterSpacing: 0.4,
        }}
      >
        {children}
      </RP.Text>
      <RP.View
        style={{
          width: 38,
          height: 2,
          backgroundColor: color.green,
          marginTop: 5,
        }}
      />
    </RP.View>
  );
}

/** Fixed footer: form code · head-office address · page counter. */
export function Footer({ code }: { code: string }) {
  return (
    <RP.View
      fixed
      style={{
        position: 'absolute',
        left: space.pageX,
        right: space.pageX,
        bottom: 20,
        borderTopWidth: 0.6,
        borderTopColor: color.hairline,
        paddingTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <RP.Text style={{ width: 90, fontSize: size.micro, color: color.faint }}>
        {code}
      </RP.Text>
      <RP.View style={{ flex: 1, alignItems: 'center', rowGap: 1.5 }}>
        <RP.Text
          style={{ fontSize: size.tiny, fontWeight: 700, color: color.text }}
        >
          {COMPANY.address}
        </RP.Text>
        <RP.Text
          style={{ fontSize: size.micro, fontWeight: 600, color: color.muted }}
        >
          {COMPANY.phone}
        </RP.Text>
      </RP.View>
      <RP.Text
        style={{
          width: 90,
          fontSize: size.micro,
          color: color.faint,
          textAlign: 'right',
        }}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </RP.View>
  );
}
