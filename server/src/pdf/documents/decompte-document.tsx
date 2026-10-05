import { ReactNode } from 'react';
import { RP } from '../react-pdf-runtime';
import { DecomptePdfData, PecColumn } from '../mappers/decompte.mapper';
import { color, size, space } from '../theme';
import { DocHeader, DocTitle, Footer, Letterhead } from '../components/chrome';
import {
  Arrow,
  Box,
  Field,
  Label,
  Option,
  Row,
  SectionTitle,
  SignaturePanel,
  TimeBoxes,
  Unit,
} from '../components/primitives';

const LABEL_W = 128;

function BoxedField({
  label,
  value,
  width,
  strong,
}: {
  label: string;
  value: string;
  width?: number;
  strong?: boolean;
}) {
  return (
    <Row style={{ marginTop: 5 }}>
      <Label
        width={LABEL_W + 10}
        style={strong ? { color: color.ink, fontWeight: 700 } : undefined}
      >
        {label}
      </Label>
      <Box value={value} width={width} flex={width ? undefined : 1} />
    </Row>
  );
}

function DateLine({
  label,
  date,
  hour,
  minute,
}: {
  label: string;
  date: string;
  hour: string;
  minute: string;
}) {
  return (
    <Row gap={8} style={{ marginTop: 6 }}>
      <Label width={LABEL_W - 26}>{label}</Label>
      <Arrow />
      <Box value={date} width={92} align="center" />
      <Label width={40} style={{ marginLeft: 22 }}>
        Heure
      </Label>
      <TimeBoxes hour={hour} minute={minute} />
    </Row>
  );
}

const COL_W = 46;

function PecCard({ title, data }: { title: string; data: PecColumn }) {
  const head = (t: string) => (
    <RP.Text
      style={{
        width: COL_W,
        textAlign: 'center',
        fontSize: size.small,
        fontWeight: 700,
        color: color.text,
      }}
    >
      {t}
    </RP.Text>
  );
  const line = (label: string, v: { nord: string; sud: string }) => (
    <Row gap={6} style={{ marginTop: 4 }}>
      <Label style={{ flex: 1, fontSize: size.small + 0.5 }}>{label}</Label>
      <Box value={v.nord} width={COL_W} align="center" />
      <Box value={v.sud} width={COL_W} align="center" />
    </Row>
  );
  return (
    <RP.View
      style={{
        flex: 1,
        borderWidth: 0.75,
        borderColor: color.hairline,
        borderRadius: 3,
        backgroundColor: color.panel,
        padding: 7,
      }}
    >
      <Row gap={6}>
        <RP.Text
          style={{
            flex: 1,
            fontSize: size.body,
            fontWeight: 700,
            color: color.navy,
          }}
        >
          {title}
        </RP.Text>
        {head('Nord')}
        {head('Sud')}
      </Row>
      {line('Nombre de repas', data.repas)}
      {line('Nombre de nuitées', data.nuitees)}
    </RP.View>
  );
}

function Signature({ title }: { title: string }): ReactNode {
  return (
    <>
      <RP.Text style={{ color: color.ink, fontWeight: 600 }}>{title}</RP.Text>
      {'\n'}
      <RP.Text style={{ color: color.muted, fontSize: size.tiny }}>
        Date / Cachet et signature
      </RP.Text>
    </>
  );
}

function DecomptePage({ data }: { data: DecomptePdfData }) {
  return (
    <RP.Page
      size="A4"
      style={{
        fontFamily: 'Inter',
        color: color.text,
        paddingTop: space.pageTop,
        paddingHorizontal: space.pageX,
        paddingBottom: space.pageBottom,
      }}
    >
      <Letterhead />
      <RP.Text
        style={{
          fontSize: size.tiny,
          color: color.muted,
          lineHeight: 1.35,
          marginBottom: 8,
        }}
      >
        <RP.Text style={{ fontWeight: 700, color: color.text }}>
          Annexe05 V.1.1{' '}
        </RP.Text>
        Procédure de remboursement des frais engagés par le personnel en mission
        à l’intérieur du territoire national sur un rayon supérieur à 50
        kilomètre du lieu de travail
      </RP.Text>

      <DocHeader
        kind="DÉCOMPTE"
        numero={data.numero}
        date={data.date}
        qrUrl={data.qrUrl}
      />
      <DocTitle>Décompte De Frais De Mission</DocTitle>

      <RP.View style={{ rowGap: 3 }}>
        <Field label="Matricule" value={data.matricule} labelWidth={LABEL_W} />
        <Field
          label="Mr. (Nom Prénom)"
          value={data.fullname}
          labelWidth={LABEL_W}
        />
        <Field
          label="Post occupé"
          value={data.grade}
          labelWidth={LABEL_W}
          strong
        />
        <Field
          label="Structure d’attache"
          value={data.structure}
          labelWidth={LABEL_W}
          strong
        />
      </RP.View>

      <RP.View style={{ marginTop: 4 }}>
        <BoxedField
          label="Référence Ordre Mission"
          value={data.reference}
          width={120}
          strong
        />
        <BoxedField label="Destination" value={data.destination} />
        <BoxedField label="Motif" value={data.motif} />
      </RP.View>

      <RP.View style={{ marginTop: 4 }}>
        <DateLine
          label="Date de Départ"
          date={data.depart.date}
          hour={data.depart.hour}
          minute={data.depart.minute}
        />
        <DateLine
          label="Date de Retour"
          date={data.retour.date}
          hour={data.retour.hour}
          minute={data.retour.minute}
        />
        <Row style={{ marginTop: 6 }}>
          <Label width={LABEL_W + 10}>Nombre De jours de missions</Label>
          <Box value={data.nbrJours} width={60} align="center" />
        </Row>
      </RP.View>

      <SectionTitle style={{ marginTop: 12 }}>Moyen de transport</SectionTitle>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <Option checked={data.transport.avion}>Avion</Option>
        <Option checked={data.transport.service}>Véhicule de service</Option>
        <Option checked={data.transport.personnel}>Véhicule Personnel</Option>
        <Option checked={data.transport.autres}>Autres</Option>
      </Row>

      <SectionTitle style={{ marginTop: 12 }}>
        Indemnité Kilométrique
      </SectionTitle>
      <Row gap={6}>
        <Label>Distance parcours</Label>
        <Box value={data.distance} width={78} align="right" />
        <Unit>KM</Unit>
        <RP.View style={{ flex: 1 }} />
        <Label>Montant Indemnité Kilométrique</Label>
        <Box value={data.indemnite} width={96} align="right" />
        <Unit>DA</Unit>
      </Row>

      <SectionTitle style={{ marginTop: 12 }}>Prise En Charge</SectionTitle>
      <Row gap={10} style={{ alignItems: 'stretch' }}>
        <PecCard title="Oui" data={data.pec.oui} />
        <PecCard title="Non" data={data.pec.non} />
      </Row>

      <RP.View
        style={{
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <Row gap={6}>
          <Label>Frais de transports Engagés</Label>
          <Box value={data.fraisTransport} width={96} align="right" />
          <Unit>DA</Unit>
        </Row>
        <Row gap={6}>
          <RP.Text
            style={{
              fontSize: size.value,
              fontWeight: 700,
              color: color.ink,
            }}
          >
            Montant Total
          </RP.Text>
          <Box
            value={data.montantTotal}
            width={140}
            height={24}
            align="right"
            emphasis
          />
          <RP.Text
            style={{
              fontSize: size.value,
              fontWeight: 700,
              color: color.green,
            }}
          >
            DA
          </RP.Text>
        </Row>
      </RP.View>

      <RP.View style={{ marginTop: 12 }}>
        <SignaturePanel
          height={86}
          captions={[
            <Signature
              key="paie"
              title="Validation par le Chef de Service Paie et Prestation Sociales"
            />,
            <Signature
              key="rh"
              title="Vérification et prise en charge par le responsable RH"
            />,
            <Signature
              key="entite"
              title="Le Responsable de l’entité Déclare avoir ordonné le paiement de l’indemnité de frais de mission"
            />,
          ]}
        />
      </RP.View>

      <Footer code="Annexe05 V.1.1" />
    </RP.Page>
  );
}

const documentMeta = {
  author: 'Algérie Télécom',
  subject: 'Décompte De Frais De Mission',
  creator: 'OMAT',
  producer: 'OMAT',
  language: 'fr',
};

export function DecompteDocument({ data }: { data: DecomptePdfData }) {
  return (
    <RP.Document
      title={`Décompte de frais de mission N° ${data.numero}`}
      {...documentMeta}
    >
      <DecomptePage data={data} />
    </RP.Document>
  );
}

/** One document holding several décomptes, one page each, in the given order. */
export function DecomptesBatchDocument({
  items,
}: {
  items: DecomptePdfData[];
}) {
  return (
    <RP.Document
      title={`Décomptes de frais de mission N° ${items.map((d) => d.numero).join(', ')}`}
      {...documentMeta}
    >
      {items.map((data) => (
        <DecomptePage key={data.numero} data={data} />
      ))}
    </RP.Document>
  );
}
