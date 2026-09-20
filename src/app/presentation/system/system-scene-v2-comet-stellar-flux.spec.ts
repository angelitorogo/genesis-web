import {
  buildSystemSceneCometPresentationV1,
  systemSceneCometActivityAtDistanceV1,
} from './system-scene-comet-presentation';
import { v2CometReadableActivity } from './system-scene-v2-comet-tail-presentation';
import {
  v2CometStellarIrradianceAtDay,
  v2StellarLuminosityFromPhotosphere,
} from './system-scene-v2-comet-stellar-flux';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot,
  type SystemSceneOrbitalMotionSnapshot,
} from './system-scene-snapshot';

function orbit(id: string, axis: number): SystemSceneOrbitalMotionSnapshot {
  return {
    id, semiMajorAxisAu: axis, periodDays: 100, eccentricity: 0,
    rotationDegrees: 0, inclinationDegrees: 0, epochMeanAnomalyDegrees: 0,
  };
}
function star(id: string, r: number, t: number, parts: SystemSceneBodySnapshot['motionContributions'] = []): SystemSceneBodySnapshot {
  return { id, sourceLuminositySolar: 1, sourceRadiusSolar: r,
    sourceEffectiveTemperatureKelvin: t, motionContributions: parts } as SystemSceneBodySnapshot;
}
// The irradiance function only needs motionContributions: keep this fixture
// structurally typed rather than asserting that it is a complete minor body.
const comet: Pick<SystemSceneMinorBodySnapshot, 'motionContributions'> = {
  motionContributions: [{ motionId: 'comet', scale: 1, linearScenePerAu: 0.00001,
    postProjectionScale: 500, presentationTimeScale: 1 }],
};

const presentation = buildSystemSceneCometPresentationV1({
  proceduralId:'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', diameterKilometers: 12,
  iceFraction01:0.7,dustFraction01:0.3,porosityIndex01:0.45,
  bulkDensityGramsPerCubicCentimeter:0.7,geometricAlbedo01:0.06,
  volatileRichnessIndex01:0.6,periodRegime:'SHORT_PERIOD',
  referenceLuminositySolar:1,semiMajorAxisAu:4,eccentricity:0.75,
  periapsisAu:1,apoapsisAu:7,orbitalPeriodYears:8,
  epochMeanAnomalyDegrees:0,presentationTimeScale:1,
});

describe('15.3 — irradiation-driven V2 comet tails', () => {
  it('derives physical luminosity from stellar radius and effective temperature', () => {
    expect(v2StellarLuminosityFromPhotosphere(1,5772)).toBe(1);
    expect(v2StellarLuminosityFromPhotosphere(2,5772)).toBe(4);
    expect(v2StellarLuminosityFromPhotosphere(1,11544)).toBe(16);
    expect(() => v2StellarLuminosityFromPhotosphere(0,5772)).toThrow(RangeError);
  });

  it('uses AU orbital elements rather than enlarged Three.js star or orbit radii', () => {
    const single = {stars:[star('a',1,5772)],motions:[orbit('comet',1)]};
    const flux = v2CometStellarIrradianceAtDay(single,comet,0);
    expect(flux).toHaveLength(1);
    expect(flux[0]!.physicalDistanceAu).toBeCloseTo(1,12);
    expect(flux[0]!.fluxEarth).toBeCloseTo(1,12);
    expect(v2CometStellarIrradianceAtDay(single,comet,50)[0]!.physicalDistanceAu)
      .toBeCloseTo(1,12);
  });

  it('adds two or three stars independently and updates real moving separations', () => {
    const starB=star('b',1,5772,[{motionId:'b',scale:1,linearScenePerAu:1e5}]);
    const starC=star('c',2,5772,[{motionId:'c',scale:-1,linearScenePerAu:1e5}]);
    const single={stars:[star('a',1,5772)],motions:[orbit('comet',1),orbit('b',2),orbit('c',3)]};
    const binary={...single,stars:[...single.stars,starB]};
    const triple={...single,stars:[...binary.stars,starC]};
    const one=v2CometStellarIrradianceAtDay(single,comet,0);
    const two=v2CometStellarIrradianceAtDay(binary,comet,0);
    const three=v2CometStellarIrradianceAtDay(triple,comet,0);
    expect(two[1]!.physicalDistanceAu).toBeCloseTo(1,12);
    expect(three[2]!.physicalDistanceAu).toBeCloseTo(4,12);
    expect(two.reduce((sum,entry)=>sum+entry.fluxEarth,0))
      .toBeGreaterThan(one.reduce((sum,entry)=>sum+entry.fluxEarth,0));
    expect(three.reduce((sum,entry)=>sum+entry.fluxEarth,0))
      .toBeGreaterThan(two.reduce((sum,entry)=>sum+entry.fluxEarth,0));
    expect(v2CometStellarIrradianceAtDay(binary,comet,50)[1]!.physicalDistanceAu)
      .toBeCloseTo(1,12);
  });

  it('switches on near hot/large stars and off near faint ones, even at the same periapsis', () => {
    const motion={motions:[orbit('comet',1)]};
    const sunFlux=v2CometStellarIrradianceAtDay({...motion,stars:[star('sun',1,5772)]},comet,0)[0]!.fluxEarth;
    const faintFlux=v2CometStellarIrradianceAtDay({...motion,stars:[star('dwarf',0.25,3000)]},comet,0)[0]!.fluxEarth;
    const brightFlux=v2CometStellarIrradianceAtDay({...motion,stars:[star('bright',2,5772)]},comet,0)[0]!.fluxEarth;
    const physical=systemSceneCometActivityAtDistanceV1(presentation,1,0.007);
    expect(v2CometReadableActivity(presentation,physical,0.007,sunFlux).hasDustTail).toBe(true);
    expect(v2CometReadableActivity(presentation,physical,0.007,faintFlux).hasDustTail).toBe(false);
    expect(v2CometReadableActivity(presentation,physical,0.007,brightFlux).presentationDustTailLengthScene)
      .toBeGreaterThanOrEqual(v2CometReadableActivity(presentation,physical,0.007,sunFlux).presentationDustTailLengthScene);
    expect(physical.incidentFluxEarth).toBe(1);
  });

  it('never invents heat when no star is available and rejects invalid conditions', () => {
    expect(v2CometStellarIrradianceAtDay({stars:[],motions:[orbit('comet',1)]},comet,0)).toEqual([]);
    expect(() => v2CometStellarIrradianceAtDay({stars:[],motions:[]},comet,0)).toThrow(RangeError);
    expect(() => v2CometReadableActivity(presentation,
      systemSceneCometActivityAtDistanceV1(presentation,1,0.007),0.007,NaN)).toThrow(RangeError);
  });
});
