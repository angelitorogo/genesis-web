import { describe, expect, it } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { BodyLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { MoonScientificTargetResolver } from '../../simulation/planetary/moon-scientific-target-resolver';
import { PlanetScientificTargetResolver } from '../../simulation/planetary/planet-scientific-target-resolver';
import { HabitabilityMoonIntegration32F6b } from '../../simulation/habitability/habitability-moon-integration-32-f-6b';
import { MoonScientificSectionsAssembler } from '../moon-detail/moon-scientific-sections';
import { ObservedHabitabilityFiche31Fe } from './observed-habitability-fiche-31-f-e';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1);
const locator = new BodyLocator(3n, -17n, 8n, 6n);
const BODY_KEY = 'G3/S-17/O8/B6/M0';

describe('32.F.6b — integración 31.10, 31.12 y diez secciones de ficha real', () => {
  it('resuelve un único mundo materializado, mantiene diez secciones y evaluación común', () => {
    const host = PlanetScientificTargetResolver.resolveDetailed(key, locator);
    expect(host).not.toBeNull();
    const materialized = host!.detail.moons.relevantMoons;
    expect(materialized.length).toBeGreaterThan(0);
    for(const original of materialized.slice(0,5)) {
      const target = MoonScientificTargetResolver.resolveDetailed(key,locator,BigInt(original.moonIndex));
      expect(target).not.toBeNull();
      const bodyKey = `G3/S-17/O8/B6/M${original.moonIndex}`;
      const bridge = HabitabilityMoonIntegration32F6b.assess({
        bodyKey,multiplicity:'SINGLE',perspective:'SIMULATED_REALITY',
        time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:null},observerAccessibleEvidence:[],
      },target!);
      expect(bridge.usedMoonResolver31_10).toBe(true);
      const fiche = ObservedHabitabilityFiche31Fe.moon(target!,DiscoveryState.CONFIRMED,
        true,bodyKey,'SINGLE');
      expect(fiche).not.toBeNull();
      const ids=MoonScientificSectionsAssembler.build(target!).sections;
      expect(ids).toHaveLength(10);
      expect(ids.map(x=>x.id)).toEqual(['general','orbit','tides','environment',
        'atmosphere','radiation','geochemistry','history','habitability','comparison']);
      expect(target!.detail.environment.oceanReality32F2c)
        .toEqual(original.oceanReality32F2c);
      const oceanCriterion=fiche!.routes.find(x=>x.label==='Agua líquida subsuperficial')!
        .criteria.find(x=>x.label==='Reservorio líquido')!;
      const state=target!.detail.environment.oceanReality32F2c?.state;
      expect(oceanCriterion.status).toBe(state==='PRESENT_IN_SIMULATED_MODEL' ? 'Compatible'
        : state==='ABSENT_IN_SIMULATED_MODEL' ? 'Incompatible':'Desconocido');
      const output=JSON.stringify(fiche);
      expect(output).not.toContain('sourceKey');
      expect(output).not.toContain('SIMULATED_REALITY');
      expect(output).not.toContain('sourceRecordKey');
    }
  }, 60_000);
  it('niega 31.12 antes de CONFIRMED sin siquiera leer la luna', () => {
    const privateTarget = new Proxy({} as never, {
      get() {throw new Error('hidden data read');},
    });
    expect(ObservedHabitabilityFiche31Fe.moon(privateTarget,
      DiscoveryState.CATALOGUED,true,BODY_KEY,'TRIPLE')).toBeNull();
    expect(ObservedHabitabilityFiche31Fe.moon(privateTarget,
      DiscoveryState.CONFIRMED,false,BODY_KEY,'TRIPLE')).toBeNull();
  });
  it('permite a 31.12 los resultados del sistema CONFIRMED en todas las multiplicidades', () => {
    const t=MoonScientificTargetResolver.resolveDetailed(key,locator,0n);
    expect(t).not.toBeNull();
    for(const m of ['SINGLE','BINARY','TRIPLE'] as const) {
      const result=ObservedHabitabilityFiche31Fe.moon(t!,DiscoveryState.CONFIRMED,
        true,BODY_KEY,m);
      expect(result?.routes).toHaveLength(3);
      expect(result?.routes.find(x=>x.label==='Otras rutas químicas')?.status)
        .toBe('Sin evidencia específica autorizada');
    }
  }, 60_000);
  it('mantiene los índices V1 intactos, incluso al evaluar un modelo físico', () => {
    const target=MoonScientificTargetResolver.resolveDetailed(key,locator,0n)!;
    const before=JSON.stringify(target.detail.habitability);
    ObservedHabitabilityFiche31Fe.moon(target,DiscoveryState.CONFIRMED,
      true,BODY_KEY,'SINGLE');
    expect(JSON.stringify(target.detail.habitability)).toBe(before);
  });
});
