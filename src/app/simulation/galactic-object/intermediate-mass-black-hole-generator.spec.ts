import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { IntermediateMassBlackHole } from '../../domain/galactic-object/intermediate-mass-black-hole';
import { IntermediateMassBlackHolePhysicalProperties } from '../../domain/galactic-object/intermediate-mass-black-hole-physical-properties';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ExplorationSectorResultEngine } from '../exploration/exploration-sector-result-engine';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxySectorGridGenerator } from '../sector/galaxy-sector-grid-generator';
import { GalaxySectorObjectLocationResolver } from '../sector/galaxy-sector-object-location-resolver';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { SupernovaRemnantGenerator } from './supernova-remnant-generator';
import { IntermediateMassBlackHoleGenerator as Imbh } from './intermediate-mass-black-hole-generator';

/** Golden fixtures found in the canonical V1 galaxy's ACTUAL populated sectors. */
describe('27.2 IntermediateMassBlackHoleGenerator — rare non-nuclear Ground Truth', () => {
  const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
  const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
  const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
  const target = new GalacticObjectLocator(0n, -73014444020n, 0n); // sector (-17, 12)
  const other = new GalacticObjectLocator(0n, 47244640281n, 0n); // sector (11, 25)
  const third = new GalacticObjectLocator(0n, 188978561025n, 0n); // sector (44, 1)
  const nucleus = new GalacticObjectLocator(0n, 0n, 0n);

  it('only specializes locators that the existing sector generator actually created', () => {
    const galaxy = GalaxyGenerator.generate(v1, target.galaxyIndex);
    const grid = GalaxySectorGridGenerator.generate(galaxy);
    const sector = GalaxySectorContentGenerator.generate(galaxy, grid.coordinatesFor(target.sectorKey));
    expect(sector.galacticObjectLocators.some(locator => locator.galacticObjectIndex === target.galacticObjectIndex)).toBe(true);
    expect(ExplorationSectorResultEngine.resolveGalacticObjectKind(v1, target))
      .toBe(ExplorationResultKind.EXTREME_OBJECT);
    expect(SupernovaRemnantGenerator.isSupernovaRemnantLocator(v1, target)).toBe(false);
    expect(Imbh.isIntermediateMassBlackHoleLocator(v1, target)).toBe(true);
    // An entropy hit at a nonexistent high ordinal must never spawn an object.
    expect(Imbh.generate(v1, new GalacticObjectLocator(0n, 0n, 5311n))).toBeNull();
    expect(Imbh.generate(v1, new GalacticObjectLocator(0n, target.sectorKey, 5311n))).toBeNull();
  });

  it('regenerates the same identity, location and bounded mass without consuming global PRNG state', () => {
    for (const locator of [target, other, third]) {
      const first = Imbh.generate(v1, locator);
      const second = Imbh.generate(v1, locator);
      expect(first).toBeInstanceOf(IntermediateMassBlackHole);
      expect(first).toEqual(second);
      expect(first!.generationKey).toBe(v1);
      expect(first!.locator).toBe(locator);
      expect(first!.location).toEqual(GalaxySectorObjectLocationResolver.resolve(v1, locator));
      expect(first!.physicalProperties.massSolar).toBeGreaterThanOrEqual(100);
      expect(first!.physicalProperties.massSolar).toBeLessThan(100_000);
      expect(Number.isFinite(first!.physicalProperties.schwarzschildRadiusKm)).toBe(true);
      expect(Object.isFrozen(first)).toBe(true);
    }
    // An immutable reference vector detects accidental changes in domain labels.
    expect(Imbh.generate(v1, target)!.physicalProperties.massSolar)
      .toBeCloseTo(142.5563123458096, 9);
  });

  it('preserves frozen V1 galactic physics but keeps the public V2 generation identity', () => {
    for (const locator of [target, other, third]) {
      const old = Imbh.generate(v1, locator)!;
      const current = Imbh.generate(v2, locator)!;
      expect(Imbh.isIntermediateMassBlackHoleLocator(v2, locator)).toBe(true);
      expect(current.generationKey).toBe(v2);
      expect(current.locator).toBe(locator);
      expect(current.physicalProperties).toEqual(old.physicalProperties);
      expect(current.location).toEqual(old.location);
      expect(current.generationKey.generatorVersion).toBe(GeneratorVersion.V2);
    }
  });

  it('never replaces the reserved nucleus, existing SNRs or other galactic families', () => {
    expect(Imbh.isIntermediateMassBlackHoleLocator(v1, nucleus)).toBe(false);
    expect(Imbh.generate(v1, nucleus)).toBeNull();
    expect(Imbh.generate(v2, nucleus)).toBeNull();

    const galaxy = GalaxyGenerator.generate(v1, 0n);
    const grid = GalaxySectorGridGenerator.generate(galaxy);
    let snr: GalacticObjectLocator | null = null;
    let cluster: GalacticObjectLocator | null = null;
    for (let x = -20; x <= 20 && (!snr || !cluster); x++) {
      for (let y = -20; y <= 20 && (!snr || !cluster); y++) {
        const sector = GalaxySectorContentGenerator.generate(galaxy, grid.coordinatesFor(
          grid.sectorKeyFor({ x, y }),
        ));
        for (const locator of sector.galacticObjectLocators) {
          if (!snr && SupernovaRemnantGenerator.isSupernovaRemnantLocator(v1, locator)) snr = locator;
          if (!cluster && ExplorationSectorResultEngine.resolveGalacticObjectKind(v1, locator)
              === ExplorationResultKind.STAR_CLUSTER) cluster = locator;
        }
      }
    }
    expect(snr).not.toBeNull();
    expect(cluster).not.toBeNull();
    expect(Imbh.generate(v1, snr!)).toBeNull();
    expect(Imbh.generate(v1, cluster!)).toBeNull();
    expect(Imbh.generate(v2, snr!)).toBeNull();
    expect(Imbh.generate(v2, cluster!)).toBeNull();
  });

  it('rejects a malformed locator/version without broadening old scientific classifications', () => {
    expect(() => Imbh.generate(v1, null as never)).toThrow(TypeError);
    const unsupported = new UniverseGenerationKey(seed, {name: 'V1', code: 99} as never);
    expect(() => Imbh.generate(unsupported, target)).toThrow(RangeError);
    const imbh = Imbh.generate(v1, target)!;
    const location = GalaxySectorObjectLocationResolver.resolve(v1, nucleus);
    expect(() => new IntermediateMassBlackHole(v1, nucleus, location, imbh.physicalProperties))
      .toThrow(RangeError);
    expect(() => new IntermediateMassBlackHole(v1, target, imbh.location,
      {} as IntermediateMassBlackHolePhysicalProperties)).toThrow(TypeError);
  });
});
