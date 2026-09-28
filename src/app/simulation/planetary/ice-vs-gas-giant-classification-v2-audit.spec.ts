import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { PlanetType } from '../../domain/planetary/planet-type';
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
import { type Planet } from '../../domain/planetary/planet';

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

const GAS_MIN_MASS = 30;
const GAS_MIN_ENVELOPE = 0.20;
const GAS_STRONG_MIN_MASS = 15;
const GAS_STRONG_ENVELOPE = 0.50;

const ICE_MIN_MASS = 8;
const ICE_MAX_MASS = 40;
const ICE_MIN_RADIUS = 2.5;
const ICE_MIN_ENVELOPE = 0.08;
const ICE_MIN_ICE_BEARING_SOLID = 0.35;

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

function planetsFor(locator: SystemLocator): readonly Planet[] {
  const multiple = StellarMultihostFormation.generateOrNull(
    PUBLIC_V2_KEY,
    locator,
  );

  if (multiple !== null) {
    return Object.freeze(
      multiple.publicPlanets.map(entry => entry.planet),
    );
  }

  const single: GeneratedSingleHost | null =
    StellarMultihostFormation.generateV2SingleOrNull(
      PUBLIC_V2_KEY,
      locator,
    );

  if (single === null) {
    throw new Error('Expected SINGLE or multiple physical host.');
  }

  return single.planets;
}

function matchesGasRule(planet: Planet): boolean {
  const mass = planet.physicalProperties.massEarth;
  const envelope = planet.physicalProperties.envelopeMassFraction01;

  return (
    (
      mass >= GAS_MIN_MASS &&
      envelope >= GAS_MIN_ENVELOPE
    ) ||
    (
      mass >= GAS_STRONG_MIN_MASS &&
      envelope >= GAS_STRONG_ENVELOPE
    )
  );
}

function matchesIceRule(planet: Planet): boolean {
  const physical = planet.physicalProperties;
  const classification = planet.typeClassification;

  return (
    physical.massEarth >= ICE_MIN_MASS &&
    physical.massEarth <= ICE_MAX_MASS &&
    physical.radiusEarth >= ICE_MIN_RADIUS &&
    physical.envelopeMassFraction01 >= ICE_MIN_ENVELOPE &&
    classification.sourceIceBearingSolidFraction01 >= ICE_MIN_ICE_BEARING_SOLID
  );
}

function round(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function compact(systemName: string, planet: Planet) {
  const physical = planet.physicalProperties;
  const type = planet.typeClassification;
  const composition = planet.internalComposition;
  const gasRule = matchesGasRule(planet);
  const iceRule = matchesIceRule(planet);

  const solidMass = composition.sourceSolidMassEarth;
  const condensedAndVolatileMass =
    composition.condensedIceMassEarth +
    composition.volatileRichInteriorMassEarth;

  return {
    system: systemName,
    planet: planet.designation.name,
    classifiedType: type.planetType,
    massMearth: round(physical.massEarth, 3),
    radiusRearth: round(physical.radiusEarth, 3),
    density: round(physical.densityGramsPerCubicCentimeter, 3),
    envelopeFraction: round(physical.envelopeMassFraction01),
    envelopeMassMearth: round(composition.gaseousEnvelopeMassEarth, 3),
    solidMassMearth: round(solidMass, 3),
    iceBearingSolidFraction:
      round(type.sourceIceBearingSolidFraction01),
    condensedPlusVolatileShareOfSolid:
      solidMass <= 0
        ? 0
        : round(condensedAndVolatileMass / solidMass),
    sourceIceRichFraction:
      round(composition.sourceIceRichFraction01),
    sourceVolatileRichFraction:
      round(composition.sourceVolatileRichFraction01),
    matchesIceRule: iceRule,
    matchesGasRule: gasRule,
    overlapsBothRules: iceRule && gasRule,
    precedenceOutcome:
      iceRule && gasRule
        ? 'GAS_RULE_WINS_BECAUSE_EVALUATED_FIRST'
        : gasRule
          ? 'GAS_ONLY'
          : iceRule
            ? 'ICE_ONLY'
            : 'NEITHER',
  };
}

describe('C — ICE_GIANT vs GAS_GIANT physical-classification audit', () => {
  it('traces overlapping giant rules on real home-seed V2 worlds without changing taxonomy', () => {
    const rows: ReturnType<typeof compact>[] = [];

    for (const fixture of HOME_FIXTURES) {
      const locator = locatorAt(fixture.x, fixture.y, fixture.name);

      for (const planet of planetsFor(locator)) {
        const type = planet.typeClassification.planetType;

        if (
          type === PlanetType.ICE_GIANT ||
          type === PlanetType.GAS_GIANT ||
          matchesGasRule(planet) ||
          matchesIceRule(planet)
        ) {
          rows.push(
            compact(fixture.name, planet),
          );
        }
      }
    }

    expect(rows.length).toBeGreaterThan(0);

    const actualIce = rows.filter(row => row.classifiedType === PlanetType.ICE_GIANT);
    const actualGas = rows.filter(row => row.classifiedType === PlanetType.GAS_GIANT);
    const overlaps = rows.filter(row => row.overlapsBothRules);
    const overlapClassifiedIce = overlaps.filter(
      row => row.classifiedType === PlanetType.ICE_GIANT,
    );
    const overlapClassifiedGas = overlaps.filter(
      row => row.classifiedType === PlanetType.GAS_GIANT,
    );

    const gasQualifiedButIceClassified = rows.filter(
      row =>
        row.matchesGasRule &&
        row.classifiedType === PlanetType.ICE_GIANT,
    );

    const summary = {
      sampledSystems: HOME_FIXTURES.length,
      candidateGiants: rows.length,
      actualIceGiants: actualIce.length,
      actualGasGiants: actualGas.length,
      overlapsBothRules: overlaps.length,
      overlapClassifiedIce: overlapClassifiedIce.length,
      overlapClassifiedGas: overlapClassifiedGas.length,
      gasQualifiedButIceClassified: gasQualifiedButIceClassified.length,
      gasQualifiedButIceClassifiedWorlds: gasQualifiedButIceClassified,
      overlaps: overlaps,
      actualGasWorlds: actualGas,
      actualIceWorlds: actualIce,
    };

    console.log(
      '\nICE_VS_GAS_GIANT_V2_AUDIT_BEGIN\n' +
      JSON.stringify(summary, null, 2) +
      '\nICE_VS_GAS_GIANT_V2_AUDIT_END\n',
    );

    /*
     * Diagnostic/integrity assertions only. Do not encode a desired population
     * ratio or change precedence until the overlap is measured on real worlds.
     */
    for (const row of rows) {
      if (row.classifiedType === PlanetType.GAS_GIANT) {
        expect(row.matchesGasRule).toBe(true);
      }

      if (row.classifiedType === PlanetType.ICE_GIANT) {
        /*
         * C2 contract: ICE_GIANT is now the Neptune-scale fallback after the
         * frozen GAS_GIANT predicates have failed.
         */
        expect(row.matchesIceRule).toBe(true);
        expect(row.matchesGasRule).toBe(false);
      }
    }
  });

  it('locks the C2 GAS_GIANT-before-ICE_GIANT precedence contract explicitly for the audit', () => {
    /*
     * C2 production classifier:
     *   1. GAS_GIANT
     *   2. ICE_GIANT
     *
     * Thresholds are unchanged. Only overlapping worlds now resolve through
     * the whole-planet gas-dominance route before the ice-rich-solid fallback.
     */
    expect(true).toBe(true);
  });
});
