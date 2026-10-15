import { AtmosphereGas as Gas } from '../../domain/planetary/atmosphere-gas';
import { auditPlanetSurfaceWaterPersistenceV3 } from '../planet-detail/planet-surface-water-persistence-audit-v3';
import { buildAtmosphereOpticalScienceV1 } from './system-scene-atmosphere-optical-science';
import { buildSystemSceneAtmosphereOpticsV1 } from './system-scene-atmosphere-optics';
import { resolveSystemSceneAtmospherePhotosphereKelvinV4 } from './system-scene-atmosphere-photosphere-v4';

type GasFraction = Readonly<{ gas: Gas; moleFraction01: number }>;
type PlanetSample = Readonly<{
  name: string;
  pressure: number;
  gravity: number;
  temperature: number;
  flux: number;
  fractions: readonly GasFraction[];
  hasLiquid: boolean;
  baseColor: string;
}>;

// These are reproducible *physical* fixture values from scientific fiches.
// Planet names are exclusively labels in this test, never renderer branches.
const samples: readonly PlanetSample[] = Object.freeze([
  {
    name: 'Quaelaen e (dense CO2)', pressure: 938_068.03, gravity: 7.55,
    temperature: 410.77, flux: 1.478, baseColor: '#8B7868', hasLiquid: true,
    fractions: [
      { gas: Gas.CARBON_DIOXIDE, moleFraction01: 0.598 },
      { gas: Gas.NITROGEN, moleFraction01: 0.247 },
      { gas: Gas.ARGON, moleFraction01: 0.086 },
      { gas: Gas.CARBON_MONOXIDE, moleFraction01: 0.029 },
      { gas: Gas.SULFUR_DIOXIDE, moleFraction01: 0.025 },
      { gas: Gas.WATER_VAPOR, moleFraction01: 0.014 },
      { gas: Gas.OXYGEN, moleFraction01: 0.001 },
    ],
  },
  {
    name: 'Krarum e (N2/Ar, icy)', pressure: 208_063.94, gravity: 3.79,
    temperature: 92.76, flux: 0.015, baseColor: '#8E9DAC', hasLiquid: false,
    fractions: [
      { gas: Gas.NITROGEN, moleFraction01: 0.871 },
      { gas: Gas.ARGON, moleFraction01: 0.103 },
      { gas: Gas.CARBON_MONOXIDE, moleFraction01: 0.025 },
      { gas: Gas.OXYGEN, moleFraction01: 0.001 },
    ],
  },
  {
    name: 'Vrusar A-5 (near-vacuum)', pressure: 385.42, gravity: 10.32,
    temperature: 150.07, flux: 0.095, baseColor: '#A78A6C', hasLiquid: false,
    fractions: [
      { gas: Gas.NITROGEN, moleFraction01: 0.558 },
      { gas: Gas.CARBON_DIOXIDE, moleFraction01: 0.304 },
      { gas: Gas.ARGON, moleFraction01: 0.102 },
      { gas: Gas.CARBON_MONOXIDE, moleFraction01: 0.026 },
      { gas: Gas.SULFUR_DIOXIDE, moleFraction01: 0.010 },
    ],
  },
  {
    name: 'Biten B-3 (seas, humid)', pressure: 89_516.64, gravity: 12.13,
    temperature: 327.48, flux: 1.012, baseColor: '#3A6EA6', hasLiquid: true,
    fractions: [
      { gas: Gas.NITROGEN, moleFraction01: 0.512 },
      { gas: Gas.CARBON_DIOXIDE, moleFraction01: 0.258 },
      { gas: Gas.ARGON, moleFraction01: 0.059 },
      { gas: Gas.HYDROGEN, moleFraction01: 0.012 },
      { gas: Gas.HELIUM, moleFraction01: 0.011 },
      { gas: Gas.WATER_VAPOR, moleFraction01: 0.148 },
    ],
  },
]);

const sun = Object.freeze({
  kind: 'star' as const,
  sourceLuminositySolar: 1,
  sourceEffectiveTemperatureKelvin: 5772,
});
const binaryStar = Object.freeze({
  kind: 'star' as const,
  sourceLuminositySolar: 0.8,
  sourceEffectiveTemperatureKelvin: 4900,
});

function buildPresentation(planet: PlanetSample, photosphereKelvin: number | null) {
  const diagnostic = buildAtmosphereOpticalScienceV1({
    columnKind: 'SOLID_SURFACE',
    retainedGasComposition: planet.fractions,
    retainedSurfacePressurePascal: planet.pressure,
    meanSurfaceTemperatureKelvin: planet.temperature,
    surfaceGravityMetersPerSecondSquared: planet.gravity,
    referenceBolometricFluxEarth: planet.flux,
    stellarEffectiveTemperatureKelvin: photosphereKelvin,
  });
  const optical = buildSystemSceneAtmosphereOpticsV1({
    baseColorHex: planet.baseColor,
    surfaceStyle: 'rocky',
    giantAtmosphere: null,
    opticalScience: diagnostic,
    surfaceEnvironment: {
      solidSurfaceAvailable: true,
      retainedSurfacePressurePascal: planet.pressure,
      retainedAtmosphericWaterVaporMoleFraction01:
        planet.fractions.find(item => item.gas === Gas.WATER_VAPOR)?.moleFraction01 ?? 0,
      retainedGasComposition: planet.fractions,
      presentationCloudCoverageFraction01: 0.15,
      surfaceIceCoverageFraction01: 0,
    },
  });
  return { diagnostic, optical };
}

describe('ATM-VIS.4 — integration, global regression and closeout', () => {
  it('selects a photospheric continuum ONLY for a fully resolved SINGLE stellar host', () => {
    const cases = [
      { label: 'SINGLE', hosts: [sun], expected: 5772 },
      { label: 'BINARY', hosts: [sun, binaryStar], expected: null },
      { label: 'TRIPLE', hosts: [sun, binaryStar, sun], expected: null },
      { label: 'compact host', hosts: [{ ...sun, compactHostKind: 'NEUTRON_STAR' }], expected: null },
      { label: 'quiescent', hosts: [{ ...sun, sourceLuminositySolar: 0 }], expected: null },
      { label: 'missing luminosity', hosts: [{ ...sun, sourceLuminositySolar: null }], expected: null },
      { label: 'no stars', hosts: [], expected: null },
    ] as const;
    for (const { label, hosts, expected } of cases) {
      const first = resolveSystemSceneAtmospherePhotosphereKelvinV4(hosts);
      expect(first).toBe(expected);
      expect(resolveSystemSceneAtmospherePhotosphereKelvinV4([...hosts])).toBe(expected);
      const continuum = buildPresentation(samples[0]!, first).diagnostic.stellarContinuumRelativeTo550Nm;
      if (label === 'SINGLE') expect(continuum).not.toBeNull();
      else expect(continuum).toBeNull();
    }
  });

  it('does not change optical physics with a route ID, ordinal or deterministic seed label', () => {
    const hostA = { ...sun, id: 'star-A', proceduralIdentity: 'GEN-V2/G4/S8/O0', seed: 'AAA' };
    const hostB = { ...sun, id: 'star-Q', proceduralIdentity: 'GEN-V2/G8/S4/O7', seed: 'BBB' };
    const a = resolveSystemSceneAtmospherePhotosphereKelvinV4([hostA]);
    const b = resolveSystemSceneAtmospherePhotosphereKelvinV4([hostB]);
    expect(a).toBe(b);
    expect(buildPresentation(samples[0]!, a)).toEqual(buildPresentation(samples[0]!, b));
  });

  it('never accepts a non-stellar body or invalid temperature/luminosity as a photosphere', () => {
    for (const candidate of [
      { ...sun, kind: 'planet' as const },
      { ...sun, sourceEffectiveTemperatureKelvin: Number.NaN },
      { ...sun, sourceEffectiveTemperatureKelvin: 0 },
      { ...sun, sourceEffectiveTemperatureKelvin: Number.POSITIVE_INFINITY },
      { ...sun, sourceEffectiveTemperatureKelvin: undefined },
      { ...sun, sourceLuminositySolar: Number.POSITIVE_INFINITY },
    ]) {
      expect(resolveSystemSceneAtmospherePhotosphereKelvinV4([candidate])).toBeNull();
    }
  });

  it('keeps Scene and fiche atmospheric outputs identical for SINGLE, BINARY and TRIPLE', () => {
    for (const hosts of [[sun], [sun, binaryStar], [sun, binaryStar, sun]]) {
      const fromScene = resolveSystemSceneAtmospherePhotosphereKelvinV4(hosts);
      const fromFiche = resolveSystemSceneAtmospherePhotosphereKelvinV4(hosts.map(s => ({ ...s })));
      expect(fromScene).toBe(fromFiche);
      for (const planet of samples) {
        const renderedScene = buildPresentation(planet, fromScene);
        const renderedFiche = buildPresentation(planet, fromFiche);
        expect(renderedFiche).toEqual(renderedScene);
        expect(renderedScene.diagnostic.columnStatus).toBe('EVALUABLE');
        expect(renderedScene.diagnostic.visibleAbsorptionResolved).toBe(false);
        expect(renderedScene.diagnostic.cloudAndAerosolOpacityResolved).toBe(false);
        expect(renderedScene.optical.deepEnvelope).toBe(false);
      }
    }
  });

  it('preserves frozen D.4d shell geometry when only the optical science changes', () => {
    for (const planet of samples) {
      const warm = buildPresentation(planet, 5772).optical;
      const noSpectrum = buildPresentation(planet, null).optical;
      expect(warm.presentationShellScale).toBe(noSpectrum.presentationShellScale);
      expect(warm.presentationRimStrength01).toBe(noSpectrum.presentationRimStrength01);
      expect(warm.presentationFrontHaze01).toBe(noSpectrum.presentationFrontHaze01);
      expect(warm.presentationTerminatorSoftness01).toBe(noSpectrum.presentationTerminatorSoftness01);
      expect(warm.atmospherePresent).toBe(true);
    }
  });

  it('retains four global physical cases and does not mutate hydrology or optical inputs', () => {
    for (const planet of samples) {
      const before = JSON.stringify(planet);
      const { diagnostic, optical } = buildPresentation(planet, null);
      const water = auditPlanetSurfaceWaterPersistenceV3({
        hasDefinedSolidSurfaceBase: true,
        hasPersistentSurfaceLiquidWater: planet.hasLiquid,
        retainedSurfacePressurePascal: planet.pressure,
        meanSurfaceTemperatureKelvin: planet.temperature,
        retainedGasComposition: planet.fractions,
      });
      expect(JSON.stringify(planet)).toBe(before);
      expect(Object.isFrozen(diagnostic)).toBe(true);
      expect(Object.isFrozen(optical)).toBe(true);
      expect(Object.isFrozen(water)).toBe(true);
      if (!planet.hasLiquid) expect(water.status).toBe('NOT_APPLICABLE');
      if (planet.name.startsWith('Quaelaen'))
        expect(water.status).toBe('EVAPORATION_REPLENISHMENT_UNRESOLVED');
      if (planet.name.startsWith('Biten'))
        expect(water.status).toBe('THERMALLY_ADMISSIBLE_UNCONFIRMED');
    }
    expect(buildPresentation(samples[2]!, null).optical.presentationRimStrength01)
      .toBeLessThan(buildPresentation(samples[1]!, null).optical.presentationRimStrength01);
  });

  it('has a bounded optical hot path without scene rebuilds or seed-dependent caches', () => {
    const hosts = [sun];
    const start = performance.now();
    let first: ReturnType<typeof buildPresentation> | null = null;
    let last: ReturnType<typeof buildPresentation> | null = null;
    for (let i = 0; i < 512; i++) {
      const sample = samples[i % samples.length]!;
      const result = buildPresentation(
        sample, resolveSystemSceneAtmospherePhotosphereKelvinV4(hosts),
      );
      if (i === 0) first = result;
      if (i === 508) last = result; // same first physical sample
    }
    expect(last).toEqual(first);
    // Deliberately generous non-flaky guard against accidental heavy scene
    // reconstruction/async generation in this synchronous optical hot path.
    expect(performance.now() - start).toBeLessThan(5_000);
  });

  it('keeps a gas giant envelope independent from a nonexistent hydrostatic surface column', () => {
    const giant = buildSystemSceneAtmosphereOpticsV1({
      baseColorHex: '#BDA679', surfaceStyle: 'gaseous', surfaceEnvironment: null,
      giantAtmosphere: {
        methaneMoleFraction01: 0.009, waterVaporMoleFraction01: 0.005,
        presentationMethaneBlueing01: 0.12, presentationWarmChromophore01: 0.4,
        presentationPolarHaze01: 0.2, presentationUpperHaze01: 0.4,
      },
      opticalScience: buildAtmosphereOpticalScienceV1({
        columnKind: 'DEEP_ENVELOPE', retainedGasComposition: null,
        retainedSurfacePressurePascal: null, meanSurfaceTemperatureKelvin: null,
        surfaceGravityMetersPerSecondSquared: null, referenceBolometricFluxEarth: 0.017,
        stellarEffectiveTemperatureKelvin: null,
      }),
    });
    expect(giant.deepEnvelope).toBe(true);
    expect(giant.atmospherePresent).toBe(true);
    expect(giant.presentationShellScale).toBeGreaterThan(1.05);
  });
});
