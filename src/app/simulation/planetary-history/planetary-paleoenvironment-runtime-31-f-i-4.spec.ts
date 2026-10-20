import { describe, expect, it } from 'vitest';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator } from '../../domain/generation/procedural-locator';
import { PlanetScientificTargetResolver } from '../planetary/planet-scientific-target-resolver';
import { PlanetaryHistoricalRuntime31Fi1 } from './planetary-historical-runtime-31-f-i-1';
import type { DatedPaleoModel31Fi4 } from './planetary-paleoenvironment-31-f-i-4';

const source = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);
const locator = new BodyLocator(3n, -17n, 8n, 0n);
const bodyKey='G3/S-17/O8/B0';
const context={bodyKind:'PLANET' as const,bodyKey,multiplicity:'SINGLE' as const,
  time:{kind:'CURRENT_SNAPSHOT' as const, systemAgeBillionYears:4.6}};
const request={
  epoch:{context,provenance:{sourcePhase:'INDEPENDENT_TEST_DATED_AGE',
    sourceModel:'INDEPENDENT_CT0_AGE', sourceRecordKey:'dated-age',
    temporalSupport:'DATED_SYSTEM_AGE_CT0' as const}},
  query:{context,version:{universeKey:'test-universe',physicsModelRevision:'test-revision',
    sourceRevision:'test-physical-episodes-r1'},startYear:100,endYear:149},
};
const sourceRecord=(sourceRecordKey:string)=>({bodyKey,sourcePhase:'INDEPENDENT_TEST_PALAEOMODEL',
  sourceModel:'PHYSICALLY_DATED_INVENTORY_TRANSFER',sourceRecordKey,
  temporalSupport:'CONTINUOUS_DATED_INDEPENDENT_PHYSICAL_MODEL' as const});

describe('31.F.i.4 — V1 materialized runtime isolation and unchanged fiches',()=>{
  it('accepts a dated physical reservoir only with materialized 19.2 geometry and leaves 31.7 UNKNOWN',()=>{
    const target=PlanetScientificTargetResolver.resolveDetailed(source,locator)!;
    const p=target.detail.general;
    // This test uses an independent dated *fixture*, not a claim of a real
    // paleo-atmosphere of this procedural planet.
    const paleo:DatedPaleoModel31Fi4={
      context,sourceRevision:'physical-water-r1',
      geometry:{radiusMeters:p.radiusEarth*6_371_000,
        gravityMetersPerSecondSquared:p.surfaceGravityMetersPerSecondSquared},
      epochs:[{startYear:100,endYear:119,water:{
        provenance:sourceRecord('water-100-119'),initialMassKilograms:{min:1e11,max:1e11},
        supplyKilogramsPerYear:{min:0,max:0},lossKilogramsPerYear:{min:1,max:2},
      }}],
    };
    const before=JSON.stringify(target.detail);
    const result=PlanetaryHistoricalRuntime31Fi1.reconstruct(target,{...request,paleoHistory:paleo});
    expect(result.certification.certifiedContinuousIntervals).toBe(0);
    expect(result.certification.historicalCoverage).toBe('UNKNOWN');
    expect(result.physical.windows.routes[0]!.compatibleWindows).toEqual([]);
    const privateResult=PlanetaryHistoricalRuntime31Fi1.inspectPaleoHistory(target)!;
    expect(privateResult.totalWaterMassKilograms).toHaveLength(1);
    expect(privateResult.unknownIntervals.pressure).toEqual([{startYear:0,endYear:4600000000}]);
    expect(privateResult.waterPhases).toBe('UNKNOWN');
    expect(privateResult.playerVisible).toBe(false);
    expect(JSON.stringify(target.detail)).toBe(before);
    expect(JSON.stringify(target.detail)).not.toContain('water-100-119');
    expect(PlanetaryHistoricalRuntime31Fi1.inspectPaleoHistory({...target})).toBeNull();
  },60_000);

  it('rejects a foreign or altered geometry without changing the fiche or the private cache',()=>{
    const target=PlanetScientificTargetResolver.resolveDetailed(source,locator)!;
    const p=target.detail.general;
    const paleo:DatedPaleoModel31Fi4={context,sourceRevision:'physical-water-r1',
      geometry:{radiusMeters:p.radiusEarth*6_371_000*1.1,
        gravityMetersPerSecondSquared:p.surfaceGravityMetersPerSecondSquared},
      epochs:[]};
    const before=JSON.stringify(target.detail);
    expect(()=>PlanetaryHistoricalRuntime31Fi1.reconstruct(target,{...request,paleoHistory:paleo}))
      .toThrow(/materialized planetary geometry/);
    expect(PlanetaryHistoricalRuntime31Fi1.inspectPaleoHistory(target)).toBeNull();
    expect(JSON.stringify(target.detail)).toBe(before);
  },60_000);
});
