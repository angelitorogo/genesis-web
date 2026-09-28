import {
  gasEnvelopeAccretionCapacityEarthV1,
  gasEnvelopeDiskCaptureFractionV1,
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
            0.30,
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
            0.30,
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
          8 * 0.30 * (4 + 45 * 0.30),
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
          baseline * 8 + 1e-9,
        );
      },
    );


    it(
      'unlocks a larger but finite disk gas budget only when a critical core is runaway-ready',
      () => {
        const ordinary =
          gasEnvelopeDiskCaptureFractionV1(
            0.75,
            0.30,
            0,
            0.80,
          );

        const runaway =
          gasEnvelopeDiskCaptureFractionV1(
            0.75,
            0.30,
            0.85,
            0.80,
          );

        expect(
          runaway,
        ).toBeGreaterThan(
          ordinary,
        );

        expect(
          ordinary,
        ).toBeLessThan(0.03);

        expect(
          runaway,
        ).toBeLessThanOrEqual(0.10);
      },
    );

    it(
      'preserves the ordinary disk-capture branch exactly when runaway readiness is zero',
      () => {
        const giantPropensity =
          0.7385;

        const meanPotential =
          0.1114;

        const availability =
          0.52;

        const actual =
          gasEnvelopeDiskCaptureFractionV1(
            giantPropensity,
            meanPotential,
            0,
            availability,
          );

        const historicalOrdinary =
          0.0002 +
          0.030 *
            giantPropensity *
            meanPotential *
            availability;

        expect(actual).toBeCloseTo(
          historicalOrdinary,
          14,
        );
      },
    );

    it(
      'does not privilege threshold noise but gives materially runaway-ready cores several-percent disk access',
      () => {
        const ordinary =
          gasEnvelopeDiskCaptureFractionV1(
            0.7385,
            0.1114,
            0,
            0.52,
          );

        const noise =
          gasEnvelopeDiskCaptureFractionV1(
            0.7385,
            0.1114,
            0.0141,
            0.52,
          );

        const moderate =
          gasEnvelopeDiskCaptureFractionV1(
            0.8366,
            0.1447,
            0.1169,
            0.52,
          );

        const strong =
          gasEnvelopeDiskCaptureFractionV1(
            0.7385,
            0.1114,
            0.3909,
            0.52,
          );

        expect(noise).toBeCloseTo(
          ordinary,
          14,
        );

        expect(moderate).toBeGreaterThan(
          noise,
        );

        expect(strong).toBeGreaterThan(
          0.025,
        );

        expect(strong).toBeLessThanOrEqual(
          0.10,
        );
      },
    );

    it(
      'keeps the absolute disk-capture cap at ten percent even for extreme runaway inputs',
      () => {
        const captured =
          gasEnvelopeDiskCaptureFractionV1(
            1,
            1,
            1,
            1,
          );

        expect(captured).toBe(
          0.10,
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
