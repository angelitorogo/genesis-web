import {
  matureEnvelopeAcquisitionPotentialV1,
} from './gas-envelope-acquisition-potential';

describe(
  'matureEnvelopeAcquisitionPotentialV1',
  () => {
    it(
      'keeps ordinary small cores on the inherited sub-Neptune opportunity',
      () => {
        const value =
          matureEnvelopeAcquisitionPotentialV1(
            0.15,
            3,
            0.80,
            0.70,
            1,
          );

        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThan(0.20);
      },
    );

    it(
      'promotes a post-merger critical core into the runaway-consumer range when gas survives',
      () => {
        const value =
          matureEnvelopeAcquisitionPotentialV1(
            0.15,
            10,
            0.65,
            0.80,
            1,
          );

        expect(value).toBeGreaterThan(0.55);
        expect(value).toBeLessThanOrEqual(1);
      },
    );

    it(
      'lets a genuinely massive post-merger core reach a meaningful runaway potential in a moderately gas-rich disk',
      () => {
        const value =
          matureEnvelopeAcquisitionPotentialV1(
            0.12,
            13.5,
            0.35,
            0.85,
            1,
          );

        expect(value).toBeGreaterThan(0.50);
        expect(value).toBeLessThanOrEqual(1);
      },
    );

    it(
      'keeps the high-end promotion selective when only modest gas survives',
      () => {
        const marginal =
          matureEnvelopeAcquisitionPotentialV1(
            0.12,
            13.5,
            0.18,
            0.85,
            1,
          );

        const favorable =
          matureEnvelopeAcquisitionPotentialV1(
            0.12,
            13.5,
            0.35,
            0.85,
            1,
          );

        expect(marginal).toBeLessThan(0.35);
        expect(favorable).toBeGreaterThan(0.50);
      },
    );

    it(
      'does not manufacture runaway opportunity after strong gas depletion',
      () => {
        const depleted =
          matureEnvelopeAcquisitionPotentialV1(
            0.15,
            12,
            0.05,
            0.90,
            1,
          );

        expect(depleted).toBeLessThan(0.35);
      },
    );

    it(
      'is monotonic in final core mass and available primordial gas for the same lineage',
      () => {
        const smallCore =
          matureEnvelopeAcquisitionPotentialV1(
            0.12,
            4,
            0.60,
            0.70,
            1,
          );

        const criticalCore =
          matureEnvelopeAcquisitionPotentialV1(
            0.12,
            9,
            0.60,
            0.70,
            1,
          );

        const gasRichCriticalCore =
          matureEnvelopeAcquisitionPotentialV1(
            0.12,
            9,
            0.85,
            0.70,
            1,
          );

        expect(criticalCore).toBeGreaterThan(smallCore);
        expect(gasRichCriticalCore).toBeGreaterThan(criticalCore);
      },
    );

    it(
      'remains deterministic and bounded over a broad synthetic grid',
      () => {
        for (let mass = 0.5; mass <= 20; mass += 0.5) {
          for (let gas = 0; gas <= 1; gas += 0.05) {
            const first =
              matureEnvelopeAcquisitionPotentialV1(
                0.14,
                mass,
                gas,
                0.65,
                1.03,
              );

            const second =
              matureEnvelopeAcquisitionPotentialV1(
                0.14,
                mass,
                gas,
                0.65,
                1.03,
              );

            expect(second).toBe(first);
            expect(first).toBeGreaterThanOrEqual(0);
            expect(first).toBeLessThanOrEqual(1);
          }
        }
      },
    );
  },
);
