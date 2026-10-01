import { toOrdrePdfData } from './ordre.mapper';
import { toDecomptePdfData } from './decompte.mapper';

const owner = {
  matricule: 1002,
  nom: 'Benali',
  prenom: 'Ahmed',
  grade: 'Chef de Service',
  category: 'CADRE',
  structure: { code: 'DRH', name: 'Direction des Ressources Humaines' },
} as any;

const mission = (over: Record<string, unknown> = {}) =>
  ({
    n_mission: 7,
    createdAt: new Date(2026, 8, 26, 10, 0),
    date_sortie: new Date(2024, 7, 1, 9, 8),
    date_retour: new Date(2024, 7, 3, 19, 18),
    motif: 'Installation équipements réseau',
    destination: 'Oran',
    transport: 'SERVICE_CAR',
    direction: 'NORD',
    user: owner,
    ...over,
  }) as any;

const decompte = (over: Record<string, unknown> = {}, m = mission()) =>
  ({
    n_decompte: 3,
    createdAt: new Date(2026, 8, 26),
    repas_pec_nord: 2,
    repas_pec_sud: 0,
    repas_sans_pec_nord: 1,
    repas_sans_pec_sud: 0,
    hebergement_pec_nord: 2,
    hebergement_pec_sud: 0,
    hebergement_sans_pec_nord: 0,
    hebergement_sans_pec_sud: 0,
    montant: 4500,
    parcours: 850,
    fees_transport: 300,
    mission: m,
    ...over,
  }) as any;

describe('toOrdrePdfData', () => {
  it('prints the mission owner, motif and creation date', () => {
    const d = toOrdrePdfData(mission());
    expect(d).toMatchObject({
      numero: '7',
      date: '26/09/2026',
      matricule: '1002',
      fullname: 'Benali Ahmed',
      grade: 'Chef de Service',
      service: 'Direction des Ressources Humaines',
      motif: 'Installation équipements réseau',
      depart: { date: '01/08/2024', hour: '09', minute: '08' },
      retour: { date: '03/08/2024', hour: '19', minute: '18' },
      transport: 'SERVICE_CAR',
    });
  });

  it('never prints null/undefined', () => {
    const prevUrl = process.env.APP_PUBLIC_URL;
    delete process.env.APP_PUBLIC_URL;
    const d = toOrdrePdfData(
      mission({
        motif: null,
        destination: undefined,
        date_retour: null,
        transport: null,
        user: { ...owner, structure: null },
      }),
    );
    if (prevUrl !== undefined) process.env.APP_PUBLIC_URL = prevUrl;
    expect(d.motif).toBe('');
    expect(d.destination).toBe('');
    expect(d.service).toBe('');
    expect(d.retour).toEqual({ date: '', hour: '', minute: '' });
    const { transport, qrUrl, ...printed } = d;
    expect(transport).toBeNull();
    expect(qrUrl).toBeNull(); // APP_PUBLIC_URL not set in tests
    expect(JSON.stringify(printed)).not.toMatch(/null|undefined/);
  });
});

describe('toDecomptePdfData', () => {
  it('fills only the Nord side for a NORD mission (Oui = PEC, Non = sans PEC)', () => {
    const d = toDecomptePdfData(decompte());
    expect(d.pec).toEqual({
      oui: { repas: { nord: '2', sud: '' }, nuitees: { nord: '2', sud: '' } },
      non: { repas: { nord: '1', sud: '' }, nuitees: { nord: '0', sud: '' } },
    });
  });

  it('fills only the Sud side for a SUD mission', () => {
    const d = toDecomptePdfData(
      decompte(
        { repas_pec_nord: 0, repas_pec_sud: 2 },
        mission({ direction: 'SUD' }),
      ),
    );
    expect(d.pec.oui.repas).toEqual({ nord: '', sud: '2' });
    expect(d.pec.non.nuitees).toEqual({ nord: '', sud: '0' });
  });

  it('fills both sides for a Nord et Sud mission', () => {
    const d = toDecomptePdfData(
      decompte(
        { repas_sans_pec_sud: 3, hebergement_sans_pec_sud: 1 },
        mission({ direction: 'MIXTE' }),
      ),
    );
    expect(d.pec).toEqual({
      oui: { repas: { nord: '2', sud: '0' }, nuitees: { nord: '2', sud: '0' } },
      non: { repas: { nord: '1', sud: '3' }, nuitees: { nord: '0', sud: '1' } },
    });
  });

  it('shows the total amount (not the transport fees) as Montant Total', () => {
    const d = toDecomptePdfData(decompte({ montant: 12345.5 }));
    expect(d.montantTotal).toBe('12 345,50');
    expect(d.fraisTransport).toBe('300,00');
  });

  it.each([
    [
      'SERVICE_CAR',
      { avion: false, service: true, personnel: false, autres: false },
    ],
    [
      'PERSONAL_CAR',
      { avion: false, service: false, personnel: true, autres: false },
    ],
    [
      'TRANSPORT_ENTREPRISE',
      { avion: false, service: false, personnel: false, autres: true },
    ],
    [
      'TRANSPORT_EMPLOYEE',
      { avion: false, service: false, personnel: false, autres: true },
    ],
    [null, { avion: false, service: false, personnel: false, autres: false }],
  ])('ticks the right transport box for %s', (transport, expected) => {
    const d = toDecomptePdfData(decompte({}, mission({ transport })));
    expect(d.transport).toEqual(expected);
  });

  it('computes the km indemnity only for the personal car', () => {
    const km = { montant_km: 12 };
    expect(
      toDecomptePdfData(
        decompte({}, mission({ transport: 'PERSONAL_CAR' })),
        km,
      ).indemnite,
    ).toBe('10 200,00');
    expect(toDecomptePdfData(decompte(), km).indemnite).toBe('0,00');
  });

  it('maps identity, reference and mission days', () => {
    const d = toDecomptePdfData(decompte());
    expect(d).toMatchObject({
      numero: '3',
      reference: '7',
      fullname: 'Benali Ahmed',
      structure: 'Direction des Ressources Humaines',
      nbrJours: '3',
      distance: '850',
    });
  });
});
