import { describe, expect, it } from 'vitest';
import {
  auditSystemSceneBinaryPTypeV225,
  binaryPTypeOrbitWithinApproximateDomainV225,
} from './system-scene-multihost-binary-p-type-audit';
import {
  type MultihostFormedPlanetV22,
  type MultihostFormedPlanetarySystemV22,
} from '../../domain/planetary/multihost-formed-planetary-system';
import {
  type MultihostPlanetaryCatalog,
  type MultihostStableWindow,
} from '../../domain/planetary/multihost-planetary-catalog';
import {
  buildLinearFitSystemScale,
} from './system-scene-scale-projection';
import {
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

const domain: MultihostStableWindow = Object.freeze({
  hostId: 'AB', family: 'P_TYPE', gravitatingMassSolar: 2,
  innerStableAu: 35, outerStableAu: 170, referenceOuterAu: 100,
  usable: true, limitation: 'Ventana empírica del ensayo, no prueba N-body.',
});
const planet: MultihostFormedPlanetV22 = Object.freeze({
  id: 'formed-ab-1', formationSeedHex: 'A'.repeat(32), origin: 'V2_2_FORMED',
  hostId: 'AB', family: 'P_TYPE', ordinal: 1, designation: 'AB · b',
  gravitatingMassSolar: 2, semiMajorAxisAu: 65, eccentricity: 0.1,
  periapsisAu: 58.5, apoapsisAu: 71.5, periodDays: 100_000,
  inclinationDegrees: 0, rotationDegrees: 0, epochMeanAnomalyDegrees: 0,
  coreMassEarth: 1, envelopeMassEarth: 0, massEarth: 1, radiusEarth: 1,
  bulkType: 'ROCKY', rotationPeriodHours: 24,
});

function makeFixture(options: {
  readonly planet?: MultihostFormedPlanetV22;
  readonly domain?: MultihostStableWindow;
  readonly firstScene?: number;
  readonly visible?: boolean;
  readonly frameScene?: number;
} = {}) {
  const world = options.planet ?? planet;
  const window = options.domain ?? domain;
  const visible = options.visible ?? true;
  const radial = Object.freeze({
    firstPeriapsisAu: world.periapsisAu,
    firstPeriapsisScene: options.firstScene ?? 2.5,
    lastApoapsisAu: world.apoapsisAu,
    lastApoapsisScene: (options.firstScene ?? 2.5) + 1.2,
  });
  const orbit = Object.freeze({
    id: 'orbit-ab', motionId: 'motion-ab',
    anchorMotionContributions: Object.freeze([]), hostRadialProjectionV22: radial,
  });
  const rendered = Object.freeze({
    id: world.id, orbitId: orbit.id, radiusScene: 0.07,
    multihostOrbitV221: Object.freeze({
      hostId: 'AB', orbitalPeriodDays: world.periodDays,
      motionId: 'motion-ab', translationState: 'ACTIVE',
    }),
    motionContributions: Object.freeze([Object.freeze({
      motionId: 'motion-ab', scale: 1, hostRadialProjectionV22: radial,
    })]),
  });
  const star = (label: 'A' | 'B', scale: number) => Object.freeze({
    label, kind: 'star', id: `star-${label}`, radiusScene: 0.15,
    opticalRadiusScene: 0.2,
    motionContributions: Object.freeze([Object.freeze({
      motionId: 'stellar-motion', scale, postProjectionScale: 1,
    })]),
  });
  const snapshot = Object.freeze({
    multiplicityName: 'BINARY', scale: buildLinearFitSystemScale(1000, 5),
    stars: Object.freeze([star('A', 0.5), star('B', -0.5)]),
    motions: Object.freeze([Object.freeze({
      id: 'stellar-motion', semiMajorAxisAu: 10, eccentricity: 0.1,
    }), Object.freeze({id: 'motion-ab'})]),
    planets: Object.freeze(visible ? [rendered] : []),
    orbits: Object.freeze(visible ? [orbit] : []),
    multihostLayoutV222: Object.freeze({
      hostEnvelopes: Object.freeze([
        Object.freeze({hostId: 'A', outerEnvelopeScene: 0.6}),
        Object.freeze({hostId: 'B', outerEnvelopeScene: 0.6}),
        Object.freeze({hostId: 'AB', outerEnvelopeScene: 4}),
      ]),
    }),
    laboratoryFrameRadiusSceneV224: options.frameScene ?? 6,
  } as unknown as SystemSceneSnapshot);
  const catalog = Object.freeze({windows: Object.freeze([window])} as unknown as MultihostPlanetaryCatalog);
  const formed = Object.freeze({planets: Object.freeze([world])} as unknown as MultihostFormedPlanetarySystemV22);
  return {snapshot, catalog, formed, window, world};
}

describe('V2.2.5 BINARY P-AB stability and visual separation audit', () => {
  it('checks the whole physical orbit and the maximum stellar excursions separately', () => {
    const data = makeFixture();
    const report = auditSystemSceneBinaryPTypeV225(data.snapshot, data.catalog, data.formed);
    expect(report.version).toBe('V2_2_5_BINARY_P_TYPE_AUDIT_V1');
    expect(report.physicalStatus).toBe('APPROXIMATELY_ADMISSIBLE');
    expect(report.visualStatus).toBe('SEPARATED');
    expect(report.cameraContainsPType).toBe(true);
    expect(report.planets[0]!.physicalVerdict).toBe('WITHIN_APPROXIMATE_DOMAIN');
    expect(report.planets[0]!.hasCompleteRenderBinding).toBe(true);
    expect(report.minimumVisualClearanceScene).toBeGreaterThan(0.2);
    expect(report.innerStableAu).toBe(35);
    expect(report.outerStableAu).toBe(170);
    expect(report.samplingOuterAu).toBe(100);
  });

  it('flags periastron crossing without using a presentation offset to disguise it', () => {
    const crossing = Object.freeze({
      ...planet, semiMajorAxisAu: 35, eccentricity: 0.2,
      periapsisAu: 28, apoapsisAu: 42,
    });
    const data = makeFixture({planet: crossing});
    expect(binaryPTypeOrbitWithinApproximateDomainV225(crossing, domain)).toBe(false);
    const report = auditSystemSceneBinaryPTypeV225(data.snapshot, data.catalog, data.formed);
    expect(report.rejectedByPhysicalDomain).toBe(1);
    expect(report.planets[0]!.physicalVerdict).toBe('INNER_BOUNDARY_CROSSED');
  });

  it('uses the actual outer stability limit, NEVER the sample outer boundary', () => {
    const aboveSample = Object.freeze({
      ...planet, semiMajorAxisAu: 130, eccentricity: 0.1,
      periapsisAu: 117, apoapsisAu: 143,
    });
    const data = makeFixture({planet: aboveSample});
    expect(binaryPTypeOrbitWithinApproximateDomainV225(aboveSample, domain)).toBe(true);
    const outer = Object.freeze({...domain, outerStableAu: 140});
    expect(binaryPTypeOrbitWithinApproximateDomainV225(aboveSample, outer)).toBe(false);
    const unknown = Object.freeze({...domain, outerStableAu: null});
    const unknownData = makeFixture({planet: aboveSample, domain: unknown});
    const report = auditSystemSceneBinaryPTypeV225(
      unknownData.snapshot, unknownData.catalog, unknownData.formed,
    );
    expect(report.outerStableAu).toBeNull();
    expect(report.physicalStatus).toBe('APPROXIMATELY_ADMISSIBLE');
  });

  it('flags a planet that crosses the maximum local envelopes even if its AU orbit is admissible', () => {
    const data = makeFixture({firstScene: 0.65});
    const report = auditSystemSceneBinaryPTypeV225(data.snapshot, data.catalog, data.formed);
    expect(report.physicalStatus).toBe('APPROXIMATELY_ADMISSIBLE');
    expect(report.visualStatus).toBe('OVERLAP_OR_UNBOUND');
    expect(report.planets[0]!.visuallySeparated).toBe(false);
  });

  it('reports undisplayed P-AB as NOT_RENDERED and a cropped camera separately', () => {
    const hidden = makeFixture({visible: false});
    const missing = auditSystemSceneBinaryPTypeV225(hidden.snapshot, hidden.catalog, hidden.formed);
    expect(missing.physicalStatus).toBe('APPROXIMATELY_ADMISSIBLE');
    expect(missing.visualStatus).toBe('NOT_RENDERED');
    expect(missing.planets[0]!.rendered).toBe(false);
    const cropped = makeFixture({frameScene: 2});
    const report = auditSystemSceneBinaryPTypeV225(cropped.snapshot, cropped.catalog, cropped.formed);
    expect(report.cameraContainsPType).toBe(false);
    expect(report.visualStatus).toBe('OVERLAP_OR_UNBOUND');
  });
});
