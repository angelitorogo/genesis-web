import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import {
  CapturedExtrasolarObjectCaptureRegime as Capture,
  type CapturedExtrasolarObjectCaptureRegime as CaptureRegime,
} from '../../domain/planetary/captured-extrasolar-object-capture-regime';
import {
  CapturedExtrasolarObjectCompositionRegime as Composition,
  type CapturedExtrasolarObjectCompositionRegime as CompositionRegime,
} from '../../domain/planetary/captured-extrasolar-object-composition-regime';
import { CapturedExtrasolarObjectIdentity } from '../../domain/planetary/captured-extrasolar-object-identity';
import { CapturedExtrasolarObjectOrbit } from '../../domain/planetary/captured-extrasolar-object-orbit';
import { CapturedExtrasolarObjectProperties } from '../../domain/planetary/captured-extrasolar-object-properties';
import { CapturedExtrasolarObjectSystem } from '../../domain/planetary/captured-extrasolar-object-system';
import type { PlanetarySystem } from '../../domain/planetary/planetary-system';
import { RelevantCapturedExtrasolarObject } from '../../domain/planetary/relevant-captured-extrasolar-object';

const ID_DOMAIN = utf8ToBytes('GENESIS-RELEVANT-CAPTURED-EXTRASOLAR-ID-V1');
const PROPERTY_DOMAIN = utf8ToBytes('GENESIS-CAPTURED-EXTRASOLAR-PROPERTIES-V1');
const CAPTURE_DOMAIN = utf8ToBytes('GENESIS-CAPTURED-EXTRASOLAR-CAPTURE-V1');

export class CapturedExtrasolarObjectGenerator {
  private constructor() {}

  static generate(
    generationKey: UniverseGenerationKey,
    planetarySystem: PlanetarySystem,
  ): CapturedExtrasolarObjectSystem {
    if (generationKey.generatorVersion !== GeneratorVersion.V1) {
      throw new RangeError(`Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`);
    }

    if (!generationKey.equals(planetarySystem.generationKey)) {
      throw new RangeError('CapturedExtrasolarObjectGenerator requires the capture PlanetarySystem to share the supplied UniverseGenerationKey.');
    }

    const support = captureSupportV1(planetarySystem);
    const probability = support === 0
      ? 0
      : 0.00005 + 0.00145 * support;

    if (sampleSystem(planetarySystem, 'PRESENCE') >= probability) {
      return new CapturedExtrasolarObjectSystem(
        planetarySystem,
        support,
        probability,
        [],
      );
    }

    return new CapturedExtrasolarObjectSystem(
      planetarySystem,
      support,
      probability,
      [materializeV1(planetarySystem, 1)],
    );
  }
}

function captureSupportV1(planetarySystem: PlanetarySystem): number {
  const planetCount = planetarySystem.orbits.length;
  const companion = planetarySystem.hostStellarSystem.secondaryCompanion;
  const hasCompanion = companion !== null && companion !== undefined;

  if (planetCount === 0 && !hasCompanion) {
    return 0;
  }

  const planetSupport = clamp01(planetCount / 8);
  const companionSupport = hasCompanion
    ? clamp01(companion.physicalProperties.initialMassSolar / 1.5)
    : 0;

  const blueprint = planetarySystem.formationBlueprint;
  const candidateCount = Math.max(1, blueprint.sourceCandidateCount);
  const dynamicalHistorySupport = clamp01(
    (blueprint.sourceMigratedBodyCount + 1.5 * blueprint.sourceCollisionCount) /
      candidateCount,
  );

  const radialRatio = Math.max(
    1,
    blueprint.sourceOuterRadiusAu / Math.max(blueprint.sourceInnerRadiusAu, 1e-6),
  );
  const radialSpanSupport = clamp01(Math.log10(radialRatio) / 3);

  return clamp01(
    0.45 * planetSupport +
    0.30 * companionSupport +
    0.15 * dynamicalHistorySupport +
    0.10 * radialSpanSupport,
  );
}

function materializeV1(
  planetarySystem: PlanetarySystem,
  captureOrdinal: number,
): RelevantCapturedExtrasolarObject {
  const identity = identityV1(planetarySystem, captureOrdinal);
  const captureRegime = captureRegimeV1(planetarySystem, identity.proceduralId);
  const compositionRegime = compositionV1(identity.proceduralId);
  const properties = propertiesV1(
    identity.proceduralId,
    captureOrdinal,
    compositionRegime,
    captureRegime,
  );
  const orbit = orbitV1(planetarySystem, identity.proceduralId);

  return new RelevantCapturedExtrasolarObject(identity, properties, orbit);
}

function identityV1(
  planetarySystem: PlanetarySystem,
  captureOrdinal: number,
): CapturedExtrasolarObjectIdentity {
  const digest = sha256
    .create()
    .update(ID_DOMAIN)
    .update(hexToBytes(planetarySystem.seed.normalizedValue))
    .update(u32(captureOrdinal - 1))
    .digest();

  return new CapturedExtrasolarObjectIdentity(
    planetarySystem.locator,
    planetarySystem.seed,
    captureOrdinal,
    bytesToHex(digest.slice(0, 16)).toUpperCase(),
  );
}

function captureRegimeV1(
  planetarySystem: PlanetarySystem,
  proceduralId: string,
): CaptureRegime {
  const hasPlanets = planetarySystem.orbits.length > 0;
  const hasCompanion = planetarySystem.hostStellarSystem.secondaryCompanion != null;

  if (hasPlanets && hasCompanion) {
    const sample = sampleObject(proceduralId, 'CAPTURE_REGIME');
    if (sample < 0.33) return Capture.PLANETARY_SCATTERING;
    if (sample < 0.66) return Capture.BINARY_EXCHANGE;
    return Capture.COMBINED_MULTIBODY;
  }

  return hasCompanion
    ? Capture.BINARY_EXCHANGE
    : Capture.PLANETARY_SCATTERING;
}

function compositionV1(proceduralId: string): CompositionRegime {
  const sample = sampleObject(proceduralId, 'COMPOSITION');
  return sample < 0.38
    ? Composition.ROCK_DOMINATED
    : sample < 0.74
      ? Composition.MIXED
      : Composition.VOLATILE_RICH;
}

function propertiesV1(
  proceduralId: string,
  captureOrdinal: number,
  compositionRegime: CompositionRegime,
  captureRegime: CaptureRegime,
): CapturedExtrasolarObjectProperties {
  const diameterKilometers = logRange(0.08, 80, sampleObject(proceduralId, 'DIAMETER'));
  const volatileFraction01 = compositionRegime === Composition.ROCK_DOMINATED
    ? lerp(0.01, 0.22, sampleObject(proceduralId, 'VOLATILE'))
    : compositionRegime === Composition.MIXED
      ? lerp(0.22, 0.62, sampleObject(proceduralId, 'VOLATILE'))
      : lerp(0.62, 0.93, sampleObject(proceduralId, 'VOLATILE'));
  const porosityIndex01 = lerp(0.05, 0.70, sampleObject(proceduralId, 'POROSITY'));
  const baseDensity = (1 - volatileFraction01) * 3.15 + volatileFraction01 * 0.88;
  const bulkDensity = clamp(baseDensity * (1 - 0.52 * porosityIndex01), 0.35, 3.4);
  const geometricAlbedo = clamp(0.02 + 0.28 * sampleObject(proceduralId, 'ALBEDO'), 0.02, 0.32);
  const incomingVInfinity = logRange(0.3, 12, sampleObject(proceduralId, 'INCOMING_VINF'));
  const captureEnergyRemovalIndex01 = lerp(0.55, 1, sampleObject(proceduralId, 'ENERGY_REMOVAL'));

  return new CapturedExtrasolarObjectProperties(
    captureOrdinal,
    compositionRegime,
    captureRegime,
    diameterKilometers,
    1 - volatileFraction01,
    volatileFraction01,
    porosityIndex01,
    bulkDensity,
    geometricAlbedo,
    incomingVInfinity,
    captureEnergyRemovalIndex01,
  );
}

function orbitV1(
  planetarySystem: PlanetarySystem,
  proceduralId: string,
): CapturedExtrasolarObjectOrbit {
  const gravitatingMassSolar = hostMassV1(planetarySystem);
  const outerPlanetAu = planetarySystem.orbits.reduce(
    (maximum, orbit) => Math.max(maximum, orbit.semiMajorAxisAu),
    0,
  );
  const innerScaleAu = Math.max(0.5, outerPlanetAu * 1.2);
  const outerScaleAu = Math.max(
    innerScaleAu * 1.5,
    20,
    planetarySystem.formationBlueprint.sourceOuterRadiusAu * 6,
  );
  const semiMajorAxisAu = logRange(
    innerScaleAu,
    outerScaleAu,
    sampleObject(proceduralId, 'SEMI_MAJOR_AXIS'),
  );
  const maximumEccentricity = Math.min(0.97, 1 - 0.05 / semiMajorAxisAu);
  const eccentricity = lerp(
    0.35,
    maximumEccentricity,
    sampleObject(proceduralId, 'ECCENTRICITY'),
  );
  const periapsisAu = semiMajorAxisAu * (1 - eccentricity);
  const apoapsisAu = semiMajorAxisAu * (1 + eccentricity);
  const inclinationDegrees = Math.acos(
    1 - 2 * sampleObject(proceduralId, 'INCLINATION'),
  ) * 180 / Math.PI;
  const periodYears = Math.sqrt(semiMajorAxisAu ** 3 / gravitatingMassSolar);

  return new CapturedExtrasolarObjectOrbit(
    gravitatingMassSolar,
    semiMajorAxisAu,
    eccentricity,
    inclinationDegrees,
    360 * sampleObject(proceduralId, 'NODE'),
    360 * sampleObject(proceduralId, 'ARGUMENT'),
    360 * sampleObject(proceduralId, 'MEAN_ANOMALY'),
    periapsisAu,
    apoapsisAu,
    periodYears,
  );
}

function hostMassV1(planetarySystem: PlanetarySystem): number {
  const mass = planetarySystem.orbitalPeriodLayout.gravitatingMassSolar ??
    planetarySystem.formationBlueprint.centralMassSolar;

  if (!Number.isFinite(mass) || mass <= 0) {
    throw new RangeError('Captured extrasolar objects require a positive gravitating host mass.');
  }

  return mass;
}

function sampleSystem(planetarySystem: PlanetarySystem, label: string): number {
  const digest = sha256
    .create()
    .update(CAPTURE_DOMAIN)
    .update(hexToBytes(planetarySystem.seed.normalizedValue))
    .update(utf8ToBytes(label))
    .digest();

  return fraction(digest);
}

function sampleObject(proceduralId: string, label: string): number {
  const digest = sha256
    .create()
    .update(PROPERTY_DOMAIN)
    .update(hexToBytes(proceduralId))
    .update(utf8ToBytes(label))
    .digest();

  return fraction(digest);
}

function fraction(digest: Uint8Array): number {
  return (
    digest[0] * 0x01000000 +
    digest[1] * 0x00010000 +
    digest[2] * 0x00000100 +
    digest[3]
  ) / 0x100000000;
}

function u32(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ]);
}

function clamp01(value: number): number { return clamp(value, 0, 1); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)); }
function lerp(minimum: number, maximum: number, unit: number): number { return minimum + (maximum - minimum) * unit; }
function logRange(minimum: number, maximum: number, unit: number): number { return Math.exp(Math.log(minimum) + (Math.log(maximum) - Math.log(minimum)) * unit); }
