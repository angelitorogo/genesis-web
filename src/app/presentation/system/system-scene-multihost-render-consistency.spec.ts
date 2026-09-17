import {
  assertSystemSceneMultihostPlanetRenderBindingV221,
  selectMultihostPlanetsForRenderingV221,
  systemSceneMultihostRenderBudgetV221,
} from './system-scene-multihost-render-consistency';
import { generateMultihostFormedPlanetarySystemV22 } from '../../simulation/planetary/multihost-formed-planetary-system-generator';
import { generateMultihostPlanetaryCatalog } from '../../simulation/planetary/multihost-planetary-catalog-generator';

const BINARY = Object.freeze({
  seed: '00000000000000000000000000000000',
  massA: 1, massB: 0.8, massC: null,
  radiusAAu: 0.00465, radiusBAu: 0.004, radiusCAu: null,
  innerBinaryAxisAu: 12, innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null, outerBinaryEccentricity: null,
  frozenPAbInnerAu: 36, frozenPAbOuterAu: null,
  samplingOuterAu: 1_000,
});

const TRIPLE = Object.freeze({
  ...BINARY, massC: 0.6, radiusCAu: 0.003,
  outerBinaryAxisAu: 350, outerBinaryEccentricity: 0.12,
  samplingOuterAu: 5_000,
});

describe('V2.2.1 deterministic multihost rendering budget and bindings', () => {
  it('caps visible planets globally without truncating the authoritative formed aggregate', () => {
    for (const [config, name] of [
      [BINARY, 'BINARY'], [TRIPLE, 'TRIPLE'],
    ] as const) {
      const catalog = generateMultihostPlanetaryCatalog(config);
      const formation = generateMultihostFormedPlanetarySystemV22({
        systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
      });
      const originalCount = formation.planets.length;
      const result = selectMultihostPlanetsForRenderingV221(formation.planets, name);
      const budget = systemSceneMultihostRenderBudgetV221(name);
      expect(result.length).toBeLessThanOrEqual(budget.globalPlanetCap);
      expect(formation.planets).toHaveLength(originalCount);
      expect(Object.isFrozen(formation)).toBe(true);
      expect(Object.isFrozen(result)).toBe(true);
      expect(new Set(result.map(planet => planet.id)).size).toBe(result.length);
      for (const hostId of new Set(result.map(planet => planet.hostId))) {
        expect(result.filter(planet => planet.hostId === hostId).length)
          .toBeLessThanOrEqual(budget.perHostPlanetCap);
      }
      if (formation.planets.length > budget.globalPlanetCap) {
        expect(result.length).toBeLessThan(formation.planets.length);
      }
      expect(selectMultihostPlanetsForRenderingV221(formation.planets, name))
        .toEqual(result);
    }
  });

  it('keeps separate S and P host families rather than allocating everything to A', () => {
    const catalog = generateMultihostPlanetaryCatalog(BINARY);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    });
    const rendered = selectMultihostPlanetsForRenderingV221(formed.planets, 'BINARY');
    expect(new Set(rendered.map(planet => planet.hostId)).size).toBeGreaterThan(1);
    expect(selectMultihostPlanetsForRenderingV221(formed.planets, 'BINARY', 'S_TYPE')
      .every(planet => planet.family === 'S_TYPE')).toBe(true);
    expect(selectMultihostPlanetsForRenderingV221(formed.planets, 'BINARY', 'P_TYPE')
      .every(planet => planet.family === 'P_TYPE')).toBe(true);
  });

  it('rejects an incomplete host/orbit/period/translation binding', () => {
    const valid = Object.freeze({
      hostId: 'AB' as const,
      orbitalPeriodDays: 100,
      motionId: 'formed-test-motion',
      translationState: 'ACTIVE' as const,
    });
    expect(() => assertSystemSceneMultihostPlanetRenderBindingV221(valid, true, true, 1))
      .not.toThrow();
    expect(() => assertSystemSceneMultihostPlanetRenderBindingV221(valid, false, true, 1))
      .toThrow(RangeError);
    expect(() => assertSystemSceneMultihostPlanetRenderBindingV221(valid, true, false, 1))
      .toThrow(RangeError);
    expect(() => assertSystemSceneMultihostPlanetRenderBindingV221(valid, true, true, 0))
      .toThrow(RangeError);
    expect(() => assertSystemSceneMultihostPlanetRenderBindingV221(
      {...valid, orbitalPeriodDays: 0}, true, true, 1,
    )).toThrow(RangeError);
    expect(() => assertSystemSceneMultihostPlanetRenderBindingV221(
      {...valid, motionId: ''}, true, true, 1,
    )).toThrow(RangeError);
    expect(() => assertSystemSceneMultihostPlanetRenderBindingV221(
      {...valid, translationState: 'INACTIVE' as 'ACTIVE'}, true, true, 1,
    )).toThrow(RangeError);
  });

  it('assigns the same budgets for all fixtures of each multiplicity', () => {
    expect(systemSceneMultihostRenderBudgetV221('SINGLE').globalPlanetCap).toBe(12);
    expect(systemSceneMultihostRenderBudgetV221('BINARY').globalPlanetCap).toBe(20);
    expect(systemSceneMultihostRenderBudgetV221('TRIPLE').globalPlanetCap).toBe(20);
  });
});
