import { describe, expect, it } from 'vitest';
import {
  PlanetaryPaleoenvironment31Fi4,
  type DatedPaleoModel31Fi4,
  type DatedPaleoSource31Fi4,
} from './planetary-paleoenvironment-31-f-i-4';

const context = (bodyKind: 'PLANET' | 'MOON' = 'PLANET', multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE' = 'SINGLE') => ({
  bodyKind, bodyKey: bodyKind === 'PLANET' ? 'G3/S-17/O8/B0' : 'G3/S-17/O8/B0/M0', multiplicity,
  time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: .000001 },
});
const prov = (name: string, bodyKey = context().bodyKey): DatedPaleoSource31Fi4 => ({
  bodyKey, sourcePhase: 'INDEPENDENT_TEMPORAL_PHYSICAL_TEST_SOURCE',
  sourceModel: 'DATED_CONTINUOUS_MASS_AND_RADIATION_EVOLUTION', sourceRecordKey: name,
  temporalSupport: 'CONTINUOUS_DATED_INDEPENDENT_PHYSICAL_MODEL',
});
const r = (min: number, max = min) => ({min,max});
const mass = (name:string, first = true, bodyKey=context().bodyKey) => ({
  provenance: prov(name, bodyKey),
  ...(first ? {initialMassKilograms:r(1e9)} : {}),
  supplyKilogramsPerYear:r(10), lossKilogramsPerYear:r(20),
});
const env = (overrides: Partial<DatedPaleoModel31Fi4> = {}): DatedPaleoModel31Fi4 => ({
  context:context(), sourceRevision:'paleo-r1',geometry:{radiusMeters:1e3,gravityMetersPerSecondSquared:10},
  epochs:[{startYear:100,endYear:109,atmosphere:mass('atm1'),
    water:{...mass('water1'), initialMassKilograms:r(1e8), supplyKilogramsPerYear:r(5),lossKilogramsPerYear:r(1)},
    radiation:{provenance:prov('rad1'), unshieldedDoseGrayPerYear:r(1,2),
      nonAtmosphericTransmission01:r(.5,1), atmosphericMassAttenuationSquareMetersPerKilogram:r(0)},
  }],...overrides,
});

describe('31.F.i.4 — physics-backed dated paleoenvironment', () => {
  it('integrates independent atmospheric and water mass balance and transfer of ionising radiation', () => {
    const data=PlanetaryPaleoenvironment31Fi4.produce(env());
    const pressure=data.surfacePressurePascal[0]!.envelope;
    const pa0=1e9*10/(4*Math.PI*1e6);
    expect(pressure.min).toBeCloseTo((1e9-100)*10/(4*Math.PI*1e6));
    expect(pressure.max).toBeCloseTo(pa0);
    expect(data.totalWaterMassKilograms[0]!.envelope).toEqual({min:1e8,max:1e8+40});
    expect(data.surfaceIonisingDoseGrayPerYear[0]!.envelope).toEqual({min:.5,max:2});
    expect(data.waterPhases).toBe('UNKNOWN');
    expect(data.habitability).toBe('UNKNOWN');
    expect(data.playerVisible).toBe(false);
    expect(data.unknownIntervals.pressure).toEqual([{startYear:0,endYear:99},{startYear:110,endYear:1000}]);
    expect(PlanetaryPaleoenvironment31Fi4.produce(env())).toEqual(data);
  });

  it('admits adjacent intervals that conserve reservoir mass without a second anchor', () => {
    const src=env();
    const epochs=[...src.epochs,{startYear:110,endYear:119,atmosphere:mass('atm2',false),
      water:{...mass('water2',false),supplyKilogramsPerYear:r(0),lossKilogramsPerYear:r(2)}}];
    const out=PlanetaryPaleoenvironment31Fi4.produce({...src,epochs});
    expect(out.surfacePressurePascal).toHaveLength(2);
    expect(out.totalWaterMassKilograms[1]!.envelope.min).toBe(1e8+40-20);
  });

  it('rejects unanchored mass after a gap, but admits dated new independent anchors', () => {
    const src=env();
    const epoch={startYear:120,endYear:129,atmosphere:mass('atm2',false)};
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[...src.epochs,epoch]}))
      .toThrow(/after every gap/);
    const out=PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[...src.epochs,
      {...epoch,atmosphere:mass('atm2')} ]});
    expect(out.unknownIntervals.pressure).toContainEqual({startYear:110,endYear:119});
    expect(out.unknownIntervals.water).toContainEqual({startYear:110,endYear:1000});
  });

  it('does not infer radiation shielding from current atmosphere or magnetosphere', () => {
    const src=env();
    const epochs=[{startYear:10,endYear:20,radiation:{provenance:prov('rad'),
      unshieldedDoseGrayPerYear:r(10),nonAtmosphericTransmission01:r(.1,.2),
      atmosphericMassAttenuationSquareMetersPerKilogram:r(1e-4)}}];
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs}))
      .toThrow(/without dated column/);
    const accepted=PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:epochs.map(e=>({
      ...e,radiation:{...e.radiation, atmosphericMassAttenuationSquareMetersPerKilogram:r(0)},
    }))});
    expect(accepted.surfaceIonisingDoseGrayPerYear[0]!.envelope).toEqual(r(1,2));
    expect(accepted.unknownIntervals.pressure).toEqual([{startYear:0,endYear:1000}]);
  });

  it('keeps conservative radiation attenuation under atmospheric-mass uncertainty', () => {
    const src=env();
    const e=src.epochs[0]!;
    const rad={...e.radiation!, atmosphericMassAttenuationSquareMetersPerKilogram:r(1e-7,2e-7)};
    const out=PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[{...e,radiation:rad}]});
    expect(out.surfaceIonisingDoseGrayPerYear[0]!.envelope.max).toBeLessThan(2);
    expect(out.surfaceIonisingDoseGrayPerYear[0]!.envelope.min).toBeGreaterThanOrEqual(0);
  });

  it('rejects unresolved event intersections instead of smoothing through impacts or transients', () => {
    const src=env();
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,
      unresolvedEvents:[{startYear:105,endYear:105,sourceRecordKey:'event-105'}]}))
      .toThrow(/unresolved physical event/);
    expect(PlanetaryPaleoenvironment31Fi4.produce({...src,
      unresolvedEvents:[{startYear:150,endYear:150,sourceRecordKey:'event-150'}]}).surfacePressurePascal)
      .toHaveLength(1);
  });

  it('never admits current-state indices, foreign body keys or duplicate provenance', () => {
    const src=env();
    const epoch=src.epochs[0]!;
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[{
      ...epoch,water:{...epoch.water!,provenance:{...prov('bad'),'sourceModel':'32.3'}},
    }]})).toThrow(/independently dated/);
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[{
      ...epoch,water:{...epoch.water!,provenance:prov('water1','FOREIGN')},
    }]})).toThrow(/body-specific/);
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[{
      ...epoch,water:{...epoch.water!,provenance:prov('atm1')},
    }]})).toThrow(/unique/);
  });

  it('requires coherent atmosphere/water anchors across adjacent intervals', () => {
    const src=env();
    const epochs=[...src.epochs,{startYear:110,endYear:119,atmosphere:{
      ...mass('atm2'), initialMassKilograms:r(100),
    }}];
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs})).toThrow(/contradicts/);
  });

  it('supports moons and SINGLE/BINARY/TRIPLE as independently keyed physical bodies', () => {
    for (const multiplicity of ['SINGLE','BINARY','TRIPLE'] as const) {
      const ctx=context('MOON', multiplicity);
      const src=env({context:ctx,epochs:[{startYear:10,endYear:19,
        water:{...mass('moonwater',true,ctx.bodyKey), initialMassKilograms:r(1e3),
          supplyKilogramsPerYear:r(0), lossKilogramsPerYear:r(1)}}]});
      const out=PlanetaryPaleoenvironment31Fi4.produce(src);
      expect(out.bodyKind).toBe('MOON');
      expect(out.bodyKey).toBe(ctx.bodyKey);
      expect(out.totalWaterMassKilograms[0]!.envelope.min).toBe(990);
      expect(out.unknownIntervals.pressure).toEqual([{startYear:0,endYear:1000}]);
      expect(out.waterPhases).toBe('UNKNOWN');
    }
  });

  it('rejects invalid dates, geometry, negative rates and non-finite reservoir evolution', () => {
    const src=env();
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,geometry:{radiusMeters:0,gravityMetersPerSecondSquared:10}})).toThrow();
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[{...src.epochs[0]!,endYear:1001}]})).toThrow();
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[{...src.epochs[0]!,
      atmosphere:{...mass('atm'),lossKilogramsPerYear:r(-1)}}]})).toThrow();
    expect(()=>PlanetaryPaleoenvironment31Fi4.produce({...src,epochs:[...src.epochs,{...src.epochs[0]!,startYear:105,endYear:115}]})).toThrow();
  });

  it('never creates a history from an unprovided environmental catalog', () => {
    const out=PlanetaryPaleoenvironment31Fi4.produce(env({epochs:[]}));
    expect(out.surfacePressurePascal).toEqual([]);
    expect(out.totalWaterMassKilograms).toEqual([]);
    expect(out.surfaceIonisingDoseGrayPerYear).toEqual([]);
    expect(out.unknownIntervals.pressure).toEqual([{startYear:0,endYear:1000}]);
    expect(out.habitability).toBe('UNKNOWN');
  });
});
