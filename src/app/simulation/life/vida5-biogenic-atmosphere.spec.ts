import { describe, expect, it } from 'vitest';
import { Vida5BiogenicAtmosphere } from './vida5-biogenic-atmosphere';
import { VIDA4_GROUPS, VIDA4_MODEL_REVISION, type Vida4EcologySnapshot } from '../../domain/life/procedural-ecology-vida4';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';

const ecology = (
  level: number,
  habitat: Vida4EcologySnapshot['habitat'] = 'SURFACE_OPEN',
): Vida4EcologySnapshot => {
  const groups = VIDA4_GROUPS.slice(0, level);
  const lifePresent = level > 0;
  const complexLifePresent = level >= 2;
  return {
    revision: VIDA4_MODEL_REVISION,
    identity: {
      universeSeed: '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
      generatorVersionCode: 3,
      kind: 'PLANET',
      galaxyIndex: '0',
      sectorKey: '12',
      galacticObjectIndex: '0',
      bodyIndex: '0',
      moonIndex: null,
    },
    bodyStorageKey: 'vida5:fixture:planet:0',
    microbialRevision: 'VIDA.3/microbial/v3-aquifer-lunar-surface',
    microbialDigest: 'm'.repeat(64),
    biosphereId: lifePresent ? 'vida3:fixture:planet:0' : null,
    habitat,
    lifePresent,
    complexRollSelected: complexLifePresent,
    complexLifePresent,
    maximumGroup: groups.at(-1) ?? null,
    groups,
    capReason: !lifePresent ? 'NO_LIFE'
      : !complexLifePresent ? 'COMPLEX_ROLL_NOT_SELECTED'
        : habitat === 'SUBSURFACE' ? 'NO_OPEN_SURFACE'
          : habitat === 'SURFACE_PROTECTED_SEEP' ? 'MICROBIAL_ONLY_HABITAT'
            : 'OPEN_SURFACE',
    atmosphericFeedbackPending: level >= 3,
    nativeCivilizationEcosystemReady: level === 8 && habitat === 'SURFACE_OPEN',
    nativeCivilizationPresent: false,
    digest: 'd'.repeat(64),
  };
};
function target(p = 101325, oxygen = 0.03, carbon = 0.15) {
  const nitrogen = 1 - oxygen - carbon;
  return ({detail: {
    surface: {hasDefinedSolidSurfaceBase: true},
    atmosphere: {
      retainedSurfacePressurePascal: p, retainedGasComposition: [
        {gas: 'NITROGEN', moleFraction01: nitrogen},
        {gas: 'OXYGEN', moleFraction01: oxygen},
        {gas: 'CARBON_DIOXIDE', moleFraction01: carbon},
      ], retainedMeanMolarMassGramsPerMole: 29,
      retainedReferenceDensityKilogramsPerCubicMeter: 1.1,
      longwaveTrappingFraction01: .45, retainedPressureRegime: 'MODERATE',
      isVacuum:false, isDeepEnvelope:false,
    },
    climate: {
      meanSurfaceTemperatureKelvin: 296,
      greenhouseSurfaceWarmingKelvin: 25,
      minimumSurfaceTemperatureKelvin: 278,
      maximumSurfaceTemperatureKelvin: 319,
    },
  }} as unknown as PlanetScientificResolvedTarget);
}
describe('VIDA.5 — balance atmosférico biótico', () => {
  it('eleva O2 a 12-28 % únicamente con vegetación fotosintética; composición normalizada',()=>{
    const baseline = target();
    const result = Vida5BiogenicAtmosphere.evaluate(ecology(3), baseline);
    expect(result.status).toBe('APPLIED');
    expect(result.oxygenFraction01).toBeGreaterThanOrEqual(.12);
    expect(result.oxygenFraction01).toBeLessThanOrEqual(.28);
    expect(result.gasComposition.reduce((s,g)=>s+g.moleFraction01,0)).toBeCloseTo(1,10);
    expect(result.gasComposition.find(x=>x.gas==='CARBON_DIOXIDE')!.moleFraction01).toBeLessThan(.15);
    expect(result.sourceOxygenFraction01).toBeCloseTo(.03);
    expect(baseline.detail.atmosphere.retainedGasComposition[1].moleFraction01).toBe(.03);
    expect(Vida5BiogenicAtmosphere.evaluate(ecology(3), baseline).digest).toBe(result.digest);
    expect(result.stablePhotosyntheticVegetation).toBe(true);
    expect(result.effectiveGroups).toEqual(VIDA4_GROUPS.slice(0, 3));
  });
  it('la fauna aerobia avanzada exige >=16% O2 y >=16 kPa de presión parcial',()=>{
    for(const level of [5,6,7,8]){
      const r=Vida5BiogenicAtmosphere.evaluate(ecology(level),target());
      expect(r.status).toBe('APPLIED');
      expect(r.aerobicAdvanced).toBe(true);
      expect(r.oxygenFraction01!).toBeGreaterThanOrEqual(.16);
      expect(r.oxygenPartialPressurePascal!).toBeGreaterThanOrEqual(15999.99);
      expect(r.oxygenPartialPressurePascal!).toBeLessThanOrEqual(35000.01);
    }
  });
  it('no altera mundos con microbios, hongos o subsuelo',()=>{
    for(const e of [ecology(0), ecology(1), ecology(2), ecology(2,'SUBSURFACE')]){
      const base=target(); const f=Vida5BiogenicAtmosphere.evaluate(e,base);
      expect(f.status).toBe('NO_PHOTOSYNTHETIC_VEGETATION');
      expect(Vida5BiogenicAtmosphere.applyToTarget(base,f)).toBe(base);
    }
  });
  it('no inventa una atmósfera si presión gaseosa resulta incompatible',()=>{
    const f=Vida5BiogenicAtmosphere.evaluate(ecology(8),target(1200));
    expect(f.status).toBe('UNRESOLVED_PHYSICAL_BUDGET');
    expect(f.pressurePascal).toBe(1200);
    expect(f.pressureBalanceFactor).toBeNull();
    expect(f.stablePhotosyntheticVegetation).toBe(false);
    expect(f.effectiveGroups).toEqual(['MICROORGANISMS', 'FUNGI']);
    expect(f.nativeCivilizationAtmosphereReady).toBe(false);
    expect(() => Vida5BiogenicAtmosphere.assertNativeCivilizationAtmosphereReady(ecology(8), f)).toThrow();
  });
  it('aplica el reajuste de presión, masa molar, densidad y clima sin mutar PRE-33',()=>{
    const physical=target();
    const f=Vida5BiogenicAtmosphere.evaluate(ecology(8),physical);
    const effective=Vida5BiogenicAtmosphere.applyToTarget(physical,f);
    expect(effective).not.toBe(physical);
    expect(effective.detail.atmosphere.retainedSurfacePressurePascal).toBe(f.pressurePascal);
    expect(effective.detail.atmosphere.retainedMeanMolarMassGramsPerMole).toBe(f.meanMolarMassGramsPerMole);
    expect(effective.detail.atmosphere.retainedReferenceDensityKilogramsPerCubicMeter).toBe(f.referenceDensityKilogramsPerCubicMeter);
    expect(effective.detail.climate.meanSurfaceTemperatureKelvin).toBe(f.meanSurfaceTemperatureKelvin);
    expect(physical.detail.climate.meanSurfaceTemperatureKelvin).toBe(296);
    expect(effective.detail.climate.minimumSurfaceTemperatureKelvin).toBeCloseTo(278+f.climateDeltaKelvin);
    expect(f.nativeCivilizationAtmosphereReady).toBe(true);
    expect(() => Vida5BiogenicAtmosphere.assertNativeCivilizationAtmosphereReady(ecology(8), f)).not.toThrow();
  });
});
