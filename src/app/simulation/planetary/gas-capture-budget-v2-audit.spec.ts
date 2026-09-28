import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { StellarDesignationGenerator } from '../stellar/stellar-designation-generator';
import {
  StellarMultihostFormation,
  type GeneratedSingleHost,
} from '../stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { ProtoplanetaryFormationSnapshotGenerator } from './protoplanetary-formation-snapshot-generator';
import {
  gasEnvelopeAccretionCapacityEarthV1,
  gasEnvelopeDiskCaptureFractionV1,
  gasEnvelopeRunawayReadinessV1,
} from './gas-envelope-accretion-capacity';

const PUBLIC_V2_KEY = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
  GeneratorVersion.V2,
);

const HOME_FIXTURES = Object.freeze([
  { x: 15, y: 9, name: 'Pulaer' },
  { x: 3, y: 25, name: 'Vathum' },
  { x: 2, y: 17, name: 'Heriia' },
  { x: 22, y: 20, name: 'Triaraia' },
  { x: -22, y: 24, name: 'Chuthoria' },
  { x: 22, y: 12, name: 'Kiraum' },
  { x: 18, y: -30, name: 'Menaar' },
  { x: 40, y: 13, name: 'Phoseria' },
  { x: 0, y: 16, name: 'Stinaion' },
]);

interface HostBudgetTrace {
  readonly systemName: string;
  readonly hostLabel: string;
  readonly sourceGasMassEarth: number;
  readonly maxGasCaptureBudgetEarth: number;
  readonly budgetFractionOfSourceGas01: number;
  readonly meanEnvelopePotential01: number;
  readonly strongestRunawayReadiness01: number;
  readonly giantPlanetFormationPropensity01: number;
  readonly remainingDiskFraction01: number;
  readonly diskAvailability01: number;
  readonly diskCaptureFraction01: number;
  readonly diskLimitedBudgetEarth: number;
  readonly coreLimitedBudgetEarth: number;
  readonly anchorCount: number;
  readonly limiter: 'SOURCE_GAS' | 'DISK_CAPTURE' | 'CORE_CAPACITY';
}

function locatorAt(
  x: number,
  y: number,
  systemName: string,
): SystemLocator {
  const physicalKey = multihostPhysicalSourceKey(PUBLIC_V2_KEY);
  const physicalGalaxy = GalaxyGenerator.generate(physicalKey, 0n);
  const content = GalaxySectorContentGenerator.generate(
    physicalGalaxy,
    new GalaxySectorCoordinates(x, y),
  );

  const locator = content.systemLocators.find(candidate =>
    StellarDesignationGenerator.generate(physicalKey, candidate).name === systemName,
  );

  if (locator === undefined) {
    throw new Error(`Expected ${systemName} in (${x}, ${y}).`);
  }

  return locator;
}

function physicalHostsFor(
  locator: SystemLocator,
): readonly GeneratedSingleHost[] {
  const multiple = StellarMultihostFormation.generateOrNull(
    PUBLIC_V2_KEY,
    locator,
  );

  if (multiple !== null) {
    return multiple.components;
  }

  const single = StellarMultihostFormation.generateV2SingleOrNull(
    PUBLIC_V2_KEY,
    locator,
  );

  if (single === null) {
    throw new Error('Expected SINGLE or multiple physical host.');
  }

  return Object.freeze([single]);
}

function traceHost(
  systemName: string,
  locator: SystemLocator,
  host: GeneratedSingleHost,
): HostBudgetTrace | null {
  const planetarySystem = host.planetarySystem;

  if (planetarySystem === null) {
    return null;
  }

  const blueprint = planetarySystem.formationBlueprint;

  const reference =
    ProtoplanetaryFormationSnapshotGenerator
      .generateMaturationReferenceOrNull(
        host.internalGenerationKey,
        locator,
      );

  if (reference === null) {
    throw new Error(
      `Expected maturation reference for ${systemName} ${host.label}.`,
    );
  }

  const anchors = blueprint.formationAnchors;

  const meanEnvelopePotential01 =
    anchors.length === 0
      ? 0
      : anchors.reduce(
          (sum, anchor) =>
            sum + anchor.envelopeAcquisitionPotential01,
          0,
        ) / anchors.length;

  const strongestRunawayReadiness01 =
    Math.max(
      0,
      ...anchors.map(anchor =>
        gasEnvelopeRunawayReadinessV1(
          anchor.solidCoreMassEarth,
          anchor.envelopeAcquisitionPotential01,
        ),
      ),
    );

  const remainingDiskFraction01 =
    1 -
    reference.diskProfile.evolutionProgress01;

  const diskAvailability01 =
    0.40 +
    0.60 *
      remainingDiskFraction01;

  const giantPlanetFormationPropensity01 =
    reference
      .planetFormationProfile
      .giantPlanetFormationPropensity;

  const diskCaptureFraction01 =
    gasEnvelopeDiskCaptureFractionV1(
      giantPlanetFormationPropensity01,
      meanEnvelopePotential01,
      strongestRunawayReadiness01,
      diskAvailability01,
    );

  const diskLimitedBudgetEarth =
    blueprint.sourceGasMassEarth *
    diskCaptureFraction01;

  const coreLimitedBudgetEarth =
    anchors.reduce(
      (sum, anchor) =>
        sum +
        gasEnvelopeAccretionCapacityEarthV1(
          anchor.solidCoreMassEarth,
          anchor.envelopeAcquisitionPotential01,
        ),
      0,
    );

  const sourceGasMassEarth =
    blueprint.sourceGasMassEarth;

  const expectedBudget =
    Math.min(
      sourceGasMassEarth,
      diskLimitedBudgetEarth,
      coreLimitedBudgetEarth,
    );

  expect(
    blueprint.maxGasCaptureBudgetEarth,
  ).toBeCloseTo(
    expectedBudget,
    8,
  );

  const minimum =
    Math.min(
      sourceGasMassEarth,
      diskLimitedBudgetEarth,
      coreLimitedBudgetEarth,
    );

  const epsilon =
    Math.max(
      1e-8,
      minimum * 1e-8,
    );

  const limiter:
    HostBudgetTrace['limiter'] =
      Math.abs(
        sourceGasMassEarth - minimum,
      ) <= epsilon
        ? 'SOURCE_GAS'
        : Math.abs(
              diskLimitedBudgetEarth - minimum,
            ) <= epsilon
          ? 'DISK_CAPTURE'
          : 'CORE_CAPACITY';

  return Object.freeze({
    systemName,
    hostLabel: host.label,
    sourceGasMassEarth,
    maxGasCaptureBudgetEarth:
      blueprint.maxGasCaptureBudgetEarth,
    budgetFractionOfSourceGas01:
      sourceGasMassEarth <= 0
        ? 0
        : blueprint.maxGasCaptureBudgetEarth /
          sourceGasMassEarth,
    meanEnvelopePotential01,
    strongestRunawayReadiness01,
    giantPlanetFormationPropensity01,
    remainingDiskFraction01,
    diskAvailability01,
    diskCaptureFraction01,
    diskLimitedBudgetEarth,
    coreLimitedBudgetEarth,
    anchorCount: anchors.length,
    limiter,
  });
}

function round(
  value: number,
  digits = 4,
): number {
  return Number(value.toFixed(digits));
}

function percentile(
  values: readonly number[],
  q: number,
): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted =
    [...values].sort((a, b) => a - b);

  const index =
    Math.min(
      sorted.length - 1,
      Math.max(
        0,
        Math.floor(
          q *
          (sorted.length - 1),
        ),
      ),
    );

  return sorted[index] ?? 0;
}

function compact(
  trace: HostBudgetTrace,
) {
  return {
    system: trace.systemName,
    host: trace.hostLabel,
    anchors: trace.anchorCount,
    sourceGasMearth:
      round(trace.sourceGasMassEarth, 2),
    budgetMearth:
      round(trace.maxGasCaptureBudgetEarth, 3),
    budgetOfSourceGas:
      round(trace.budgetFractionOfSourceGas01, 6),
    meanPotential:
      round(trace.meanEnvelopePotential01),
    strongestReadiness:
      round(trace.strongestRunawayReadiness01),
    giantPropensity:
      round(trace.giantPlanetFormationPropensity01),
    remainingDisk:
      round(trace.remainingDiskFraction01),
    diskAvailability:
      round(trace.diskAvailability01),
    captureFraction:
      round(trace.diskCaptureFraction01, 6),
    diskLimitedMearth:
      round(trace.diskLimitedBudgetEarth, 3),
    coreLimitedMearth:
      round(trace.coreLimitedBudgetEarth, 3),
    limiter: trace.limiter,
  };
}

describe(
  'B2 — maxGasCaptureBudgetEarth real V2 audit',
  () => {
    it(
      'traces the exact finite-budget formula on real home-seed physical hosts without changing production physics',
      () => {
        const traces: HostBudgetTrace[] =
          [];

        for (
          const fixture
          of HOME_FIXTURES
        ) {
          const locator =
            locatorAt(
              fixture.x,
              fixture.y,
              fixture.name,
            );

          for (
            const host
            of physicalHostsFor(
              locator,
            )
          ) {
            const trace =
              traceHost(
                fixture.name,
                locator,
                host,
              );

            if (trace !== null) {
              traces.push(trace);
            }
          }
        }

        expect(traces.length).toBeGreaterThan(0);

        const runawayHosts =
          traces.filter(
            trace =>
              trace.strongestRunawayReadiness01 >
              0,
          );

        const diskLimited =
          traces.filter(
            trace =>
              trace.limiter ===
              'DISK_CAPTURE',
          );

        const coreLimited =
          traces.filter(
            trace =>
              trace.limiter ===
              'CORE_CAPACITY',
          );

        const sourceLimited =
          traces.filter(
            trace =>
              trace.limiter ===
              'SOURCE_GAS',
          );

        const budgetFractions =
          traces.map(
            trace =>
              trace.budgetFractionOfSourceGas01,
          );

        const captureFractions =
          traces.map(
            trace =>
              trace.diskCaptureFraction01,
          );

        const runawayBudgetFractions =
          runawayHosts.map(
            trace =>
              trace.budgetFractionOfSourceGas01,
          );

        const summary = {
          sampledSystems:
            HOME_FIXTURES.length,
          sampledPhysicalHosts:
            traces.length,
          runawayHosts:
            runawayHosts.length,

          limiterCounts: {
            diskCapture:
              diskLimited.length,
            coreCapacity:
              coreLimited.length,
            sourceGas:
              sourceLimited.length,
          },

          budgetFractionOfSourceGas: {
            p50:
              round(
                percentile(
                  budgetFractions,
                  0.50,
                ),
                6,
              ),
            p90:
              round(
                percentile(
                  budgetFractions,
                  0.90,
                ),
                6,
              ),
            max:
              round(
                Math.max(
                  ...budgetFractions,
                ),
                6,
              ),
          },

          diskCaptureFraction: {
            p50:
              round(
                percentile(
                  captureFractions,
                  0.50,
                ),
                6,
              ),
            p90:
              round(
                percentile(
                  captureFractions,
                  0.90,
                ),
                6,
              ),
            max:
              round(
                Math.max(
                  ...captureFractions,
                ),
                6,
              ),
          },

          runawayBudgetFractionOfSourceGas: {
            p50:
              round(
                percentile(
                  runawayBudgetFractions,
                  0.50,
                ),
                6,
              ),
            max:
              round(
                runawayBudgetFractions.length === 0
                  ? 0
                  : Math.max(
                      ...runawayBudgetFractions,
                    ),
                6,
              ),
          },

          runawayHostsByReadiness:
            [...runawayHosts]
              .sort(
                (a, b) =>
                  b.strongestRunawayReadiness01 -
                  a.strongestRunawayReadiness01,
              )
              .map(compact),

          smallestBudgets:
            [...traces]
              .sort(
                (a, b) =>
                  a.maxGasCaptureBudgetEarth -
                  b.maxGasCaptureBudgetEarth,
              )
              .slice(0, 10)
              .map(compact),

          largestBudgets:
            [...traces]
              .sort(
                (a, b) =>
                  b.maxGasCaptureBudgetEarth -
                  a.maxGasCaptureBudgetEarth,
              )
              .slice(0, 10)
              .map(compact),
        };

        console.log(
          '\nGAS_CAPTURE_BUDGET_V2_AUDIT_BEGIN\n' +
          JSON.stringify(
            summary,
            null,
            2,
          ) +
          '\nGAS_CAPTURE_BUDGET_V2_AUDIT_END\n',
        );

        /*
         * Integrity assertions only. B2 is deliberately diagnostic: do not
         * encode a desired giant-planet rate or modify the finite reservoir
         * until the real limiting term is identified.
         */
        for (const trace of traces) {
          expect(
            trace.maxGasCaptureBudgetEarth,
          ).toBeGreaterThanOrEqual(0);

          expect(
            trace.maxGasCaptureBudgetEarth,
          ).toBeLessThanOrEqual(
            trace.sourceGasMassEarth +
            1e-8,
          );

          expect(
            trace.diskCaptureFraction01,
          ).toBeGreaterThanOrEqual(0);

          expect(
            trace.diskCaptureFraction01,
          ).toBeLessThanOrEqual(0.10);

          expect(
            trace.giantPlanetFormationPropensity01,
          ).toBeGreaterThanOrEqual(0);

          expect(
            trace.giantPlanetFormationPropensity01,
          ).toBeLessThanOrEqual(1);
        }
      },
    );
  },
);
