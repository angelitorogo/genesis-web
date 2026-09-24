import {
  gasEnvelopeAccretionCapacityEarthV1,
  gasEnvelopeRunawayReadinessV1,
} from './gas-envelope-accretion-capacity';

describe(
  'V1 gas-envelope core-accretion capacity',
  () => {
    it(
      'keeps ordinary low-mass or low-opportunity cores on the pre-runaway baseline',
      () => {
        const lowMassCore =
          gasEnvelopeAccretionCapacityEarthV1(
            3,
            0.9,
          );

        const lowOpportunityCore =
          gasEnvelopeAccretionCapacityEarthV1(
            8,
            0.4,
          );

        expect(
          gasEnvelopeRunawayReadinessV1(
            3,
            0.9,
          ),
        ).toBe(0);

        expect(
          gasEnvelopeRunawayReadinessV1(
            8,
            0.4,
          ),
        ).toBe(0);

        expect(
          lowMassCore,
        ).toBeCloseTo(
          3 * 0.9 * (4 + 45 * 0.9),
          12,
        );

        expect(
          lowOpportunityCore,
        ).toBeCloseTo(
          8 * 0.4 * (4 + 45 * 0.4),
          12,
        );
      },
    );

    it(
      'adds a smooth bounded runaway preference only when both core mass and gas opportunity are favourable',
      () => {
        const marginal =
          gasEnvelopeRunawayReadinessV1(
            6,
            0.65,
          );

        const favourable =
          gasEnvelopeRunawayReadinessV1(
            9,
            0.82,
          );

        expect(
          marginal,
        ).toBeGreaterThan(0);

        expect(
          marginal,
        ).toBeLessThan(
          favourable,
        );

        expect(
          favourable,
        ).toBeLessThanOrEqual(1);

        const baseline =
          9 * 0.82 * (4 + 45 * 0.82);

        const runawayCapacity =
          gasEnvelopeAccretionCapacityEarthV1(
            9,
            0.82,
          );

        expect(
          runawayCapacity,
        ).toBeGreaterThan(
          baseline,
        );

        expect(
          runawayCapacity,
        ).toBeLessThanOrEqual(
          baseline * 6 + 1e-9,
        );
      },
    );

    it(
      'is monotonic through the runaway transition without a hard threshold jump',
      () => {
        const values = [
          0.54,
          0.55,
          0.56,
          0.65,
          0.75,
          0.85,
          0.86,
        ].map(
          potential =>
            gasEnvelopeAccretionCapacityEarthV1(
              8,
              potential,
            ),
        );

        for (
          let index = 1;
          index < values.length;
          index += 1
        ) {
          expect(
            values[index],
          ).toBeGreaterThan(
            values[index - 1],
          );
        }
      },
    );
  },
);
