import { ReactNode } from 'react';
import type { Style } from '@react-pdf/types';
import { TransportType } from '@prisma/client';
import { RP } from '../react-pdf-runtime';
import { OrdrePdfData } from '../mappers/ordre.mapper';
import { color, size, space } from '../theme';
import { DocHeader, DocTitle, Footer, Letterhead } from '../components/chrome';
import {
  Arrow,
  Box,
  Check,
  Field,
  Label,
  Option,
  Row,
  SectionTitle,
  TimeBoxes,
} from '../components/primitives';

const FORM_CODE = 'Annexe01 V.1.1';
const LABEL_W = 132;

const pageStyle: Style = {
  fontFamily: 'Inter',
  color: color.text,
  paddingTop: space.pageTop,
  paddingHorizontal: space.pageX,
  paddingBottom: space.pageBottom,
};

const TRANSPORT_OPTIONS: { value: TransportType; label: string }[] = [
  { value: TransportType.SERVICE_CAR, label: 'Véhicule de service' },
  {
    value: TransportType.TRANSPORT_ENTREPRISE,
    label:
      'Autres moyens de transport dont les dépenses sont prises en charge par l’entreprise.',
  },
  {
    value: TransportType.TRANSPORT_EMPLOYEE,
    label:
      'Moyens de transport dont les dépenses sont prises en charge par le travailleur.',
  },
  {
    value: TransportType.PERSONAL_CAR,
    label:
      'Utilisation exceptionnelle du véhicule Personnel, à la demande de la hiérarchie.',
  },
];

function DateLine(props: {
  label: string;
  hourLabel: string;
  date: string;
  hour: string;
  minute: string;
}) {
  return (
    <Row gap={8} style={{ marginTop: 7 }}>
      <Label width={LABEL_W - 26}>{props.label}</Label>
      <Arrow />
      <Box value={props.date} width={96} align="center" />
      <Label width={92} style={{ marginLeft: 22 }}>
        {props.hourLabel}
      </Label>
      <TimeBoxes hour={props.hour} minute={props.minute} />
    </Row>
  );
}

/* ------------------------------------------------------------------ */
/* Page 1 — Ordre de mission                                           */
/* ------------------------------------------------------------------ */

function ResponsablePanel() {
  return (
    <RP.View
      style={{
        borderWidth: 1.4,
        borderColor: color.ink,
        borderRadius: 4,
        padding: 12,
      }}
    >
      <RP.Text
        style={{ fontSize: size.value, fontWeight: 700, color: color.ink }}
      >
        Le Responsable hiérarchique direct ayant ordonné la mission :
      </RP.Text>
      <Row gap={8} style={{ marginTop: 12 }}>
        <Label>Nom Prénom</Label>
        <Box flex={1} height={22} tinted={false} />
        <Label style={{ marginLeft: 6 }}>Qualité</Label>
        <Box flex={1.2} height={22} tinted={false} />
      </Row>
      <Row gap={6} style={{ marginTop: 14 }}>
        <Label>Fait à</Label>
        <Box width={120} height={20} />
        <Label>le</Label>
        <Box width={96} height={20} />
        <RP.View style={{ flex: 1 }} />
        <Box width={84} height={20} tinted={false} />
        <Box width={84} height={20} tinted={false} />
      </Row>
      <RP.Text
        style={{
          marginTop: 14,
          textAlign: 'center',
          fontSize: size.body,
          fontWeight: 700,
          color: color.ink,
        }}
      >
        Cachet et Signature
      </RP.Text>
      <RP.View style={{ height: 62 }} />
    </RP.View>
  );
}

function OrdrePage({ data }: { data: OrdrePdfData }) {
  return (
    <RP.Page size="A4" style={pageStyle}>
      <Letterhead />
      <DocHeader
        kind="ORDRE DE MISSION"
        numero={data.numero}
        date={data.date}
        qrUrl={data.qrUrl}
      />
      <DocTitle>ORDRE DE MISSION</DocTitle>

      <RP.View style={{ rowGap: 8, marginTop: 2 }}>
        <Field label="Matricule" value={data.matricule} labelWidth={LABEL_W} />
        <Field
          label="Mr. (Nom Prénom)"
          value={data.fullname}
          labelWidth={LABEL_W}
        />
        <Field label="Réf" value={data.grade} labelWidth={LABEL_W} strong />
        <Field
          label="Service d’attache"
          value={data.service}
          labelWidth={LABEL_W}
          strong
        />
        <Field
          label="Destination"
          value={data.destination}
          labelWidth={LABEL_W}
        />
        <Field
          label="Motif de la mission"
          value={data.motif}
          labelWidth={LABEL_W}
        />
      </RP.View>

      <RP.View style={{ marginTop: 8 }}>
        <DateLine
          label="Date de Départ"
          hourLabel="Heure de départ"
          {...data.depart}
        />
        <DateLine
          label="Date de Retour"
          hourLabel="Heure de retour"
          {...data.retour}
        />
      </RP.View>

      <SectionTitle style={{ marginTop: 16, marginBottom: 8 }}>
        Moyen de transport
      </SectionTitle>
      <RP.View style={{ rowGap: 7, paddingLeft: 4 }}>
        {TRANSPORT_OPTIONS.map((o) => (
          <Option
            key={o.value}
            shape="circle"
            checked={data.transport === o.value}
            fontSize={size.value - 0.5}
          >
            {o.label}
          </Option>
        ))}
      </RP.View>

      <RP.View style={{ flex: 1, minHeight: 16 }} />
      <ResponsablePanel />
      <Footer code={FORM_CODE} />
    </RP.Page>
  );
}

/* ------------------------------------------------------------------ */
/* Page 2 — Compte rendu & prise en charge (filled by hand)            */
/* ------------------------------------------------------------------ */

const S = 7.8; // compact body size for the dense second page
const BH = 15; // compact box height
const CELL = 30;

function Frame({ children, style }: { children: ReactNode; style?: Style }) {
  return (
    <RP.View
      style={[
        { borderWidth: 1.1, borderColor: color.ink, borderRadius: 3 },
        style ?? {},
      ]}
    >
      {children}
    </RP.View>
  );
}

function T({ children, style }: { children: ReactNode; style?: Style }) {
  return (
    <RP.Text style={[{ fontSize: S, color: color.text }, style ?? {}]}>
      {children}
    </RP.Text>
  );
}

function Blank({ width, flex }: { width?: number; flex?: number }) {
  return <Box width={width} flex={flex} height={BH} />;
}

function Radio({ children }: { children: ReactNode }) {
  return (
    <Row gap={4}>
      <Check shape="circle" sizePt={8} />
      <T>{children}</T>
    </Row>
  );
}

function GridRow({ label }: { label: string }) {
  return (
    <Row gap={5} style={{ marginTop: 4 }}>
      <T style={{ width: 82 }}>{label}</T>
      <Blank width={CELL} />
      <Blank width={CELL} />
      <RP.View style={{ width: 8 }} />
      <Blank width={CELL} />
      <Blank width={CELL} />
    </Row>
  );
}

function Heads() {
  const h = (t: string) => (
    <T style={{ width: CELL, textAlign: 'center', fontWeight: 600 }}>{t}</T>
  );
  return (
    <Row gap={5} style={{ marginTop: 3 }}>
      <RP.View style={{ width: 82 }} />
      {h('Nord')}
      {h('Sud')}
      <RP.View style={{ width: 8 }} />
      {h('Nord')}
      {h('Sud')}
    </Row>
  );
}

function EtapeBand({
  first = false,
  last = false,
}: {
  first?: boolean;
  last?: boolean;
}) {
  return (
    <RP.View
      style={{
        flexDirection: 'row',
        borderBottomWidth: last ? 0 : 1.1,
        borderBottomColor: color.ink,
      }}
    >
      {/* left: hébergement / restauration */}
      <RP.View
        style={{
          flex: 1.15,
          paddingHorizontal: 7,
          paddingVertical: 8,
          borderRightWidth: 1.1,
          borderRightColor: color.ink,
        }}
      >
        {first ? (
          <Row gap={6} style={{ marginBottom: 5 }}>
            <T style={{ fontSize: S - 0.5, color: color.muted }}>
              Date d’arrivée sur les lieux de la mission
            </T>
            <Blank width={78} />
          </Row>
        ) : null}
        <T style={{ fontSize: S + 1, fontWeight: 600, color: color.ink }}>
          Hébergement - Restauration
        </T>
        <Row gap={5} style={{ marginTop: 5 }}>
          <RP.View style={{ width: 82 }} />
          <RP.View style={{ width: 2 * CELL + 5, alignItems: 'center' }}>
            <Radio>Oui</Radio>
          </RP.View>
          <RP.View style={{ width: 8 }} />
          <RP.View style={{ width: 2 * CELL + 5, alignItems: 'center' }}>
            <Radio>Non</Radio>
          </RP.View>
        </Row>
        <Heads />
        <GridRow label="Nombre de repas" />
        <GridRow label="Nombre de nuitées" />
        <Row gap={5} style={{ marginTop: 8, alignItems: 'flex-start' }}>
          <Radio>Oui – Transport</Radio>
          <RP.View style={{ marginLeft: 6 }}>
            <Row gap={4}>
              <Radio>Utilisation véhicule personnel</Radio>
              <Blank width={30} />
              <T style={{ fontWeight: 600 }}>KM</T>
            </Row>
            <T style={{ marginTop: 1, marginLeft: 12, color: color.muted }}>
              Distance globale parcourue
            </T>
          </RP.View>
        </Row>
        <Row gap={5} style={{ marginTop: 6 }}>
          <Radio>Non – Frais de transport engagés</Radio>
          <Blank width={62} />
          <T style={{ fontWeight: 600 }}>DA</T>
        </Row>
      </RP.View>

      {/* right: circuit-villes étape */}
      <RP.View style={{ flex: 1, paddingHorizontal: 7, paddingVertical: 8 }}>
        {first ? (
          <Row gap={6} style={{ marginBottom: 5 }}>
            <T style={{ fontSize: S - 0.5, color: color.muted }}>
              Date de retour
            </T>
            <Blank width={78} />
          </Row>
        ) : null}
        <T
          style={{
            fontSize: S + 1,
            fontWeight: 600,
            color: color.ink,
            marginTop: 14,
          }}
        >
          En cas de circuit-villes étape :
        </T>
        <Row gap={5} style={{ marginTop: 18 }}>
          <T>Du</T>
          <Blank flex={1} />
          <T>Au</T>
          <Blank flex={1} />
        </Row>
        <T style={{ marginTop: 14, textAlign: 'center', color: color.muted }}>
          Signature et visa de la structure d’accueil
        </T>
      </RP.View>
    </RP.View>
  );
}

function CompteRenduPage({ data }: { data: OrdrePdfData }) {
  return (
    <RP.Page size="A4" style={pageStyle}>
      <Letterhead />
      <RP.Text
        style={{
          textAlign: 'center',
          fontSize: size.value + 0.5,
          fontWeight: 700,
          color: color.navy,
          marginBottom: 7,
        }}
      >
        Compte rendu du travailleur ayant effectué la mission :
      </RP.Text>

      <Frame style={{ padding: 8, height: 88 }}>
        <T style={{ fontWeight: 700, color: color.ink }}>
          Nature et description de la mission effectuée
        </T>
        <RP.View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <RP.Text
            style={{
              fontSize: size.value,
              fontWeight: 700,
              color: color.ink,
              textAlign: 'center',
            }}
          >
            {data.motif}
          </RP.Text>
        </RP.View>
        <T
          style={{
            textAlign: 'right',
            fontWeight: 700,
            color: color.ink,
            textDecoration: 'underline',
          }}
        >
          Signé le travailleur concerné :
        </T>
      </Frame>

      <Frame style={{ padding: 6, marginTop: 6 }}>
        <Row gap={6}>
          <T style={{ fontSize: S + 0.7 }}>
            Montant de l’avance (si attribution de l’avance) en DA
          </T>
          <Blank width={82} />
          <RP.View style={{ flex: 1 }} />
          <T style={{ fontSize: S + 0.7 }}>Date d’attribution</T>
          <Blank width={82} />
        </Row>
      </Frame>

      <Frame style={{ marginTop: 6 }}>
        <RP.View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            borderBottomWidth: 1.1,
            borderBottomColor: color.ink,
            backgroundColor: color.panel,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          }}
        >
          <RP.Text
            style={{
              fontSize: size.body,
              fontWeight: 700,
              color: color.ink,
              textDecoration: 'underline',
            }}
          >
            Prise en charge (à servir selon le cas par le service d’accueil)
          </RP.Text>
        </RP.View>
        <EtapeBand first />
        <EtapeBand />
        <EtapeBand last />
      </Frame>

      <Frame
        style={{
          marginTop: 6,
          padding: 8,
          minHeight: 58,
          flexDirection: 'row',
        }}
      >
        <RP.View style={{ flex: 1, rowGap: 6 }}>
          <Row gap={6}>
            <T style={{ fontWeight: 700, color: color.ink, width: 150 }}>
              Mission annulée le
            </T>
            <Blank width={80} />
          </Row>
          <Row gap={6}>
            <T style={{ fontWeight: 700, color: color.ink, width: 150 }}>
              Retour avant terme prévu en date du
            </T>
            <Blank width={80} />
          </Row>
        </RP.View>
        <RP.View style={{ flex: 1, alignItems: 'center', rowGap: 3 }}>
          <T style={{ fontWeight: 700, color: color.ink, textAlign: 'center' }}>
            Le premier responsable de la structure/Responsable hiérarchique
          </T>
          <T style={{ fontWeight: 700, color: color.ink }}>
            Cachet date et signature
          </T>
        </RP.View>
      </Frame>

      <Footer code={FORM_CODE} />
    </RP.Page>
  );
}

export function OrdreDocument({ data }: { data: OrdrePdfData }) {
  return (
    <RP.Document
      title={`Ordre de mission N° ${data.numero}`}
      author="Algérie Télécom"
      subject="Ordre de mission"
      creator="OMAT"
      producer="OMAT"
      language="fr"
    >
      <OrdrePage data={data} />
      <CompteRenduPage data={data} />
    </RP.Document>
  );
}
