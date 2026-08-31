import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { CapturedExtrasolarObjectCaptureRegime as Capture } from '../../domain/planetary/captured-extrasolar-object-capture-regime';
import type { PlanetarySystem } from '../../domain/planetary/planetary-system';
import { SystemSeed } from '../../domain/seed/hierarchical-seeds';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CapturedExtrasolarObjectGenerator } from './captured-extrasolar-object-generator';

describe('CapturedExtrasolarObjectGenerator point 22.9 V1',()=>{
  const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),GeneratorVersion.V1);
  const locator=new SystemLocator(6n,113n,9n);

  function fixture(seedHex:string, planets=true, binary=false):PlanetarySystem {
    return {
      generationKey:key,
      locator,
      seed:new SystemSeed(seedHex),
      orbits:planets?[{semiMajorAxisAu:.15},{semiMajorAxisAu:1.2},{semiMajorAxisAu:5.5}]:[],
      hostStellarSystem:{secondaryCompanion:binary?{physicalProperties:{initialMassSolar:.7}}:null},
      orbitalPeriodLayout:{gravitatingMassSolar:1},
      formationBlueprint:{centralMassSolar:1,sourceInnerRadiusAu:.1,sourceOuterRadiusAu:50,residualDustMassEarth:5,sourceCandidateCount:10,sourceMigratedBodyCount:2,sourceCollisionCount:1},
    } as unknown as PlanetarySystem;
  }

  it('should materialize the frozen extremely rare permanently captured extrasolar vector',()=>{
    const system=CapturedExtrasolarObjectGenerator.generate(key,fixture('000000000000000000000000000006FC'));
    expect(system.captureSupportIndex01).toBeCloseTo(.3112156668112006,12);
    expect(system.permanentCaptureProbability01).toBeCloseTo(.0005012627168762408,14);
    expect(system.relevantObjectCount).toBe(1);
    const object=system.relevantObject!;
    expect(object.proceduralId).toBe('379D96AF5AC78E1604E804625272E2CF');
    expect(object.localDesignation).toBe('XCAP-001');
    expect(object.compositionRegime).toBe('MIXED');
    expect(object.captureRegime).toBe(Capture.PLANETARY_SCATTERING);
    expect(object.diameterKilometers).toBeCloseTo(2.1087685031923984,12);
    expect(object.properties.incomingHyperbolicExcessVelocityKmPerSecond).toBeCloseTo(.30669530189493704,12);
    expect(object.orbit.semiMajorAxisAu).toBeCloseTo(47.77429997185507,10);
    expect(object.orbit.eccentricity).toBeCloseTo(.40577142974361774,12);
    expect(object.orbit.periapsisAu).toBeCloseTo(28.388853967274965,10);
    expect(object.orbit.apoapsisAu).toBeCloseTo(67.15974597643518,10);
    expect(object.orbit.inclinationDegrees).toBeCloseTo(115.17320892990037,10);
    expect(object.orbit.periodYears).toBeCloseTo(330.2109709573242,9);
    expect(object.isExtrasolarOrigin).toBe(true);
    expect(object.isBound).toBe(true);
    expect(object.orbit.specificOrbitalEnergyAu2PerYear2).toBeLessThan(0);
    expect('discoveryState' in object).toBe(false);
  });

  it('should remain extremely rare across 2048 deterministic single-star planetary contexts',()=>{
    let captured=0;
    for(let n=1;n<=2048;n++){
      const seed=n.toString(16).toUpperCase().padStart(32,'0');
      captured+=CapturedExtrasolarObjectGenerator.generate(key,fixture(seed)).relevantObjectCount;
    }
    expect(captured).toBe(1);
  });

  it('should forbid permanent capture in a single-star system with no planetary scatterer',()=>{
    const system=CapturedExtrasolarObjectGenerator.generate(key,fixture('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',false,false));
    expect(system.captureSupportIndex01).toBe(0);
    expect(system.permanentCaptureProbability01).toBe(0);
    expect(system.relevantObjectCount).toBe(0);
  });

  it('should allow a binary companion to provide the required third-body channel even without planets',()=>{
    const system=CapturedExtrasolarObjectGenerator.generate(key,fixture('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',false,true));
    expect(system.captureSupportIndex01).toBeGreaterThan(0);
    expect(system.permanentCaptureProbability01).toBeGreaterThan(0);
  });
});
