import { TransportType } from '@prisma/client';
import { computeMontant, emptyCounts } from './montant';

const barem = {
  repas_nord: 100,
  hebergement_nord: 1000,
  repas_sud: 200,
  hebergement_sud: 2000,
  montant_km: 10,
};

const base = {
  transport: TransportType.SERVICE_CAR,
  parcours: 0,
  fees_transport: 0,
};

describe('computeMontant', () => {
  it('Nord: pays every meal and night at the nord rates, pec or not', () => {
    const counts = emptyCounts();
    counts.nord = {
      repas_pec: 0,
      repas_sans_pec: 3,
      hebergement_pec: 0,
      hebergement_sans_pec: 1,
    };
    expect(computeMontant({ ...base, counts }, barem)).toBe(3 * 100 + 1000);
  });

  it('Sud: pays every meal and night at the sud rates, pec or not', () => {
    const counts = emptyCounts();
    counts.sud = {
      repas_pec: 1,
      repas_sans_pec: 2,
      hebergement_pec: 0,
      hebergement_sans_pec: 1,
    };
    // The pec meal is paid like the others, and any pec item keeps 25%.
    expect(computeMontant({ ...base, counts }, barem)).toBe(
      (3 * 200 + 2000) * 0.25,
    );
  });

  it('Nord et Sud: prices each zone at its own rates and adds them', () => {
    const counts = {
      nord: {
        repas_pec: 0,
        repas_sans_pec: 2,
        hebergement_pec: 0,
        hebergement_sans_pec: 1,
      },
      sud: {
        repas_pec: 0,
        repas_sans_pec: 3,
        hebergement_pec: 0,
        hebergement_sans_pec: 2,
      },
    };
    expect(computeMontant({ ...base, counts }, barem)).toBe(
      2 * 100 + 1000 + 3 * 200 + 2 * 2000,
    );
  });

  it('Nord et Sud: a pec item in either zone keeps 25% of the whole total', () => {
    const counts = emptyCounts();
    counts.nord.repas_sans_pec = 2;
    counts.sud.repas_sans_pec = 1;
    counts.sud.hebergement_pec = 1;
    expect(computeMontant({ ...base, counts }, barem)).toBe(
      (2 * 100 + 200 + 2000) * 0.25,
    );
  });

  it('adds parcours * montant_km for a personal car, before the 25% rule', () => {
    const counts = emptyCounts();
    counts.nord.repas_pec = 1;
    expect(
      computeMontant(
        {
          ...base,
          counts,
          transport: TransportType.PERSONAL_CAR,
          parcours: 50,
        },
        barem,
      ),
    ).toBe((100 + 50 * 10) * 0.25);
  });

  it('ignores parcours for any other transport', () => {
    const counts = emptyCounts();
    counts.nord.repas_sans_pec = 1;
    expect(computeMontant({ ...base, counts, parcours: 50 }, barem)).toBe(100);
  });

  it('adds fees_transport after the 25% rule', () => {
    const counts = emptyCounts();
    counts.sud.repas_sans_pec = 1;
    counts.nord.repas_pec = 1;
    expect(computeMontant({ ...base, counts, fees_transport: 30 }, barem)).toBe(
      (100 + 200) * 0.25 + 30,
    );
  });
});
