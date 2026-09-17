import { PlanetType } from '../../domain/planetary/planet-type';
import { generateMultihostPlanetaryCatalog, type MultihostStellarInput } from './multihost-planetary-catalog-generator';
import { generateMultihostFormedPlanetarySystemV22 } from './multihost-formed-planetary-system-generator';
import { generateMultihostScientificPlanetsV241 } from './multihost-scientific-planet-generator-v241';
import { weightedMaterialProfileV1 } from './planet-internal-composition-generator';
import { buildPlanetSurfaceFromInputsV1 } from './planet-surface-base-generator';
import { BodySeed } from '../../domain/seed/hierarchical-seeds';

const INPUT: MultihostStellarInput = Object.freeze({
  seed: '00000000000000000000000000000001',
  massA: 1, massB: 0.8, massC: null,
  radiusAAu: 0.00465, radiusBAu: 0.004, radiusCAu: null,
  innerBinaryAxisAu: 12, innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null, outerBinaryEccentricity: null,
  frozenPAbInnerAu: 36, frozenPAbOuterAu: null, samplingOuterAu: 1000,
});

describe('V2.4.1 scientific circumstellar planet handoff', () => {
  it('reuses V1 material/surface equations and retains every V2.2 bulk/orbit without V1 IDs', () => {
    const catalogue = generateMultihostPlanetaryCatalog(INPUT);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalogue.sourceSystemSeed, windows: catalogue.windows,
    });
    const before = JSON.stringify(formed);
    const science = generateMultihostScientificPlanetsV241(formed, {A: 1, B: 0.42});
    const again = generateMultihostScientificPlanetsV241(formed, {A: 1, B: 0.42});
    expect(science).toEqual(again);
    expect(JSON.stringify(formed)).toBe(before);
    expect(science.planets.length).toBeGreaterThan(0);
    expect(science.planets.length).toBe(formed.disks.filter(d => d.hostId === 'A' || d.hostId === 'B')
      .reduce((count, disk) => count + disk.planets.length, 0));
    for (const scientific of science.planets) {
      const disk = formed.disks.find(d => d.hostId === scientific.hostId)!;
      const original = disk.planets.find(p => p.id === scientific.id)!;
      expect(scientific.physics.massEarth).toBe(original.massEarth);
      expect(scientific.physics.radiusEarth).toBe(original.radiusEarth);
      expect(scientific.physics.periodDays).toBe(original.periodDays);
      expect(scientific.physics.periapsisAu).toBe(original.periapsisAu);
      expect(scientific.physics.apoapsisAu).toBe(original.apoapsisAu);
      expect(scientific.physics.periapsisAu).toBeGreaterThan(disk.window.innerStableAu);
      expect(scientific.physics.apoapsisAu).toBeLessThan(disk.window.outerStableAu ?? disk.window.referenceOuterAu);
      expect(scientific.formationSeedHex).toBe(original.formationSeedHex);
      const interior = scientific.internalComposition;
      expect(interior.confidence).toBe('V2_4_1_BULK_DERIVED_PRIOR');
      const shared = weightedMaterialProfileV1(
        interior.refractoryRichFraction01, interior.rockyFraction01,
        interior.iceRichFraction01, interior.volatileRichFraction01,
      );
      expect(interior.metallicCoreMassEarth).toBeCloseTo(shared.metallicCoreFraction01 * original.coreMassEarth, 9);
      expect(interior.metallicCoreMassEarth + interior.silicateInteriorMassEarth +
        interior.condensedIceMassEarth + interior.volatileRichInteriorMassEarth +
        interior.gaseousEnvelopeMassEarth).toBeCloseTo(original.massEarth, 8);
      const commonSurface = buildPlanetSurfaceFromInputsV1({
        planetType: scientific.type, bodySeed: new BodySeed(original.formationSeedHex),
        iceBearingFractionOfSolids01: interior.iceBearingFractionOfSolids01,
        referenceMeanInsolationEarth: scientific.referenceMeanInsolationEarth ?? 0,
        tidalHeatingProxy: 0, // Uncalibrated V2.2 tidal proxy cannot assert volcanism.
      });
      expect(scientific.surface.referenceBondAlbedo01).toBe(commonSurface.referenceBondAlbedo01);
      expect(scientific.environment.source).toBe('V2_4_1_ESTIMATED_ENVIRONMENT');
      expect(scientific.environment.referenceOnly).toBe(true);
      expect(scientific.thermal.liquidOceanCoverageFraction01)
        .toBe(scientific.environment.water.surfaceLiquidWaterCoverageFraction01);
      expect(scientific.appearanceConfidence).toBe('REFERENCE_ONLY_NO_ATMOSPHERE_OR_COMPANION');
      expect(Object.values(PlanetType)).toContain(scientific.referenceAppearanceType);
      expect(scientific.thermal.atmosphereSurfacePressurePascal)
        .toBe(scientific.environment.atmosphere.pressurePascal);
      expect(scientific.thermal.companionIrradianceIncluded).toBe(false);
      expect(Object.values(PlanetType)).toContain(scientific.type);
      expect(scientific).not.toHaveProperty('bodyLocator');
      expect(scientific.type).not.toBe(PlanetType.VOLCANIC); // no validated tidal Q or persistent luminosity
    }
  });

  it('does not fabricate luminosity, permanent habitability or invalid stable orbits', () => {
    const catalogue = generateMultihostPlanetaryCatalog(INPUT);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalogue.sourceSystemSeed, windows: catalogue.windows,
    });
    const withoutFlux = generateMultihostScientificPlanetsV241(formed, {A: null, B: null});
    expect(withoutFlux.planets.every(p => p.referenceMeanInsolationEarth === null &&
      p.thermal.equilibriumTemperatureKelvin === null &&
      p.environment.climate.meanSurfaceTemperatureKelvin === null &&
      p.environment.water.surfaceLiquidWaterCoverageFraction01 === null)).toBe(true);
    const a = formed.disks.find(d => d.hostId === 'A')!;
    if (a.planets.length > 0) {
      const invalid = {...formed, disks: formed.disks.map(d => d.hostId === 'A'
        ? {...d, planets: [{...d.planets[0]!, periapsisAu: d.window.innerStableAu / 2}, ...d.planets.slice(1)]}
        : d)};
      expect(() => generateMultihostScientificPlanetsV241(invalid, {A: 1, B: 1})).toThrow(RangeError);
    }
  });


  it('recovers envelope worlds and giant diversity across representative binary families', () => {
    const representativeInputs: MultihostStellarInput[] = [
      INPUT,
      {...INPUT, seed: '00000000000000000000000000000002', innerBinaryAxisAu: 2.8, innerBinaryEccentricity: 0.05},
      {...INPUT, seed: '00000000000000000000000000000003', innerBinaryAxisAu: 3.06, innerBinaryEccentricity: 0.08},
      {...INPUT, seed: '00000000000000000000000000000004', innerBinaryAxisAu: 6.4, innerBinaryEccentricity: 0.10},
      {...INPUT, seed: '00000000000000000000000000000005', innerBinaryAxisAu: 12, innerBinaryEccentricity: 0.12},
      {...INPUT, seed: '00000000000000000000000000000006', innerBinaryAxisAu: 24, innerBinaryEccentricity: 0.14},
      {...INPUT, seed: '00000000000000000000000000000007', innerBinaryAxisAu: 48, innerBinaryEccentricity: 0.10},
      {...INPUT, seed: '00000000000000000000000000000008', innerBinaryAxisAu: 93, innerBinaryEccentricity: 0.10},
    ];

    let envelopeRich = 0;
    let gasGiants = 0;
    let iceGiants = 0;
    let miniNeptunes = 0;
    const envelopeHosts = new Set<string>();
    const systemsWithEnvelopeWorlds = new Set<string>();

    for (const input of representativeInputs) {
      const massB = input.massB;
      if (massB === null) throw new RangeError('BINARY test fixture requires secondary stellar mass.');
      const catalogue = generateMultihostPlanetaryCatalog(input);
      const formed = generateMultihostFormedPlanetarySystemV22({
        systemSeed: catalogue.sourceSystemSeed,
        windows: catalogue.windows,
        hostLuminositiesSolarV241: {A: input.massA ** 3.5, B: massB ** 3.5},
      });
      const science = generateMultihostScientificPlanetsV241(formed, {
        A: input.massA ** 3.5,
        B: massB ** 3.5,
      });
      for (const planet of science.planets) {
        const envelopeFraction = planet.physics.envelopeMassEarth / planet.physics.massEarth;
        if (envelopeFraction >= 0.03) {
          envelopeRich += 1;
          envelopeHosts.add(planet.hostId);
          systemsWithEnvelopeWorlds.add(input.seed);
        }
        if (planet.type === PlanetType.GAS_GIANT) gasGiants += 1;
        if (planet.type === PlanetType.ICE_GIANT) iceGiants += 1;
        if (planet.type === PlanetType.MINI_NEPTUNE) miniNeptunes += 1;
      }
    }

    expect(envelopeRich).toBeGreaterThanOrEqual(5);
    expect(envelopeHosts).toEqual(new Set(['A', 'B']));
    expect(systemsWithEnvelopeWorlds.size).toBeGreaterThanOrEqual(3);
    expect(gasGiants + iceGiants + miniNeptunes).toBeGreaterThanOrEqual(5);
    expect(gasGiants + iceGiants).toBeGreaterThan(0);
  });


  it('requires an identifiable cold stable birth location for any hot gas giant', () => {
    for (let n = 1; n <= 40; n++) {
      const input = {...INPUT,
        seed: n.toString(16).padStart(32, '0').toUpperCase(),
        innerBinaryAxisAu: [3.06, 6.4, 12, 24, 48, 93][n % 6]!,
      };
      const catalog = generateMultihostPlanetaryCatalog(input);
      const formed = generateMultihostFormedPlanetarySystemV22({
        systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
        hostLuminositiesSolarV241: {A: 1, B: 0.8 ** 3.5},
      });
      const science = generateMultihostScientificPlanetsV241(formed, {A: 1, B: 0.8 ** 3.5});
      for (const item of science.planets) {
        const disk = formed.disks.find(d => d.hostId === item.hostId)!;
        expect(item.formationPath.sourceSnowLineAu).not.toBeNull();
        if (item.formationPath.regime === 'MIGRATION_SCENARIO') {
          expect(item.formationPath.estimatedBirthAxisAu!).toBeGreaterThan(item.physics.semiMajorAxisAu);
          expect(item.formationPath.estimatedBirthAxisAu!).toBeGreaterThan(item.formationPath.sourceSnowLineAu!);
          expect(item.formationPath.estimatedBirthAxisAu!).toBeLessThan(disk.window.referenceOuterAu);
        }
        if ((item.type === PlanetType.GAS_GIANT || item.type === PlanetType.ICE_GIANT) &&
            item.physics.semiMajorAxisAu < item.formationPath.sourceSnowLineAu!) {
          expect(item.formationPath.regime).toBe('MIGRATION_SCENARIO');
        }
        expect(item.physics.periapsisAu).toBeGreaterThan(disk.window.innerStableAu);
        expect(item.physics.apoapsisAu).toBeLessThan(disk.window.outerStableAu ?? disk.window.referenceOuterAu);
      }
    }
  });

});
