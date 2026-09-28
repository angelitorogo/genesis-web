import {
  allocateGasEnvelopeBudgetV1,
} from './gas-envelope-budget-allocation';

describe(
  'V1 finite gas-envelope budget allocation',
  () => {
    it(
      'preserves the exact historical proportional scaling when no body is runaway-ready',
      () => {
        const result =
          allocateGasEnvelopeBudgetV1(
            [
              {
                targetEnvelopeMassEarth: 20,
                runawayReadiness01: 0,
              },
              {
                targetEnvelopeMassEarth: 10,
                runawayReadiness01: 0,
              },
            ],
            15,
          );

        expect(result[0]).toBeCloseTo(10, 12);
        expect(result[1]).toBeCloseTo(5, 12);
      },
    );

    it(
      'gives a genuinely runaway-ready core a larger share of the same finite budget without creating gas',
      () => {
        const ordinary =
          allocateGasEnvelopeBudgetV1(
            [
              {
                targetEnvelopeMassEarth: 40,
                runawayReadiness01: 0,
              },
              {
                targetEnvelopeMassEarth: 40,
                runawayReadiness01: 0,
              },
            ],
            40,
          );

        const prioritized =
          allocateGasEnvelopeBudgetV1(
            [
              {
                targetEnvelopeMassEarth: 40,
                runawayReadiness01: 0.30,
              },
              {
                targetEnvelopeMassEarth: 40,
                runawayReadiness01: 0,
              },
            ],
            40,
          );

        expect(prioritized[0]).toBeGreaterThan(ordinary[0]);
        expect(prioritized[1]).toBeLessThan(ordinary[1]);

        expect(
          prioritized[0] +
          prioritized[1],
        ).toBeCloseTo(40, 12);
      },
    );

    it(
      'never exceeds a body physical target and redistributes unused budget deterministically',
      () => {
        const result =
          allocateGasEnvelopeBudgetV1(
            [
              {
                targetEnvelopeMassEarth: 5,
                runawayReadiness01: 1,
              },
              {
                targetEnvelopeMassEarth: 100,
                runawayReadiness01: 0,
              },
            ],
            50,
          );

        expect(result[0]).toBeCloseTo(5, 12);
        expect(result[1]).toBeCloseTo(45, 12);
      },
    );

    it(
      'keeps tiny threshold noise from materially privileging marginal readiness',
      () => {
        const baseline =
          allocateGasEnvelopeBudgetV1(
            [
              {
                targetEnvelopeMassEarth: 50,
                runawayReadiness01: 0,
              },
              {
                targetEnvelopeMassEarth: 50,
                runawayReadiness01: 0,
              },
            ],
            40,
          );

        const marginal =
          allocateGasEnvelopeBudgetV1(
            [
              {
                targetEnvelopeMassEarth: 50,
                runawayReadiness01: 0.0008,
              },
              {
                targetEnvelopeMassEarth: 50,
                runawayReadiness01: 0,
              },
            ],
            40,
          );

        expect(marginal[0]).toBeCloseTo(baseline[0], 12);
        expect(marginal[1]).toBeCloseTo(baseline[1], 12);
      },
    );
  },
);
