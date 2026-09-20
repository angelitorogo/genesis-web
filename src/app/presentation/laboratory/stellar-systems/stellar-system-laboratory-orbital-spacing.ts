import type { SystemSceneSnapshot } from '../../system/system-scene-snapshot';
import type { StellarSystemLaboratoryFamilyId } from './stellar-system-laboratory-fixtures';

/**
 * LAB only. Deterministic spacing of complete, independently generated SINGLE
 * sources. No planetary engine, planet filtering or orbital-period rewrite.
 * These are conservative analytic screening rules, NOT an N-body proof. In
 * particular long-period comets/captured objects can still be perturbed.
 */
export interface LaboratoryOrbitalSpacingProfile {
  readonly label: 'Compacto' | 'Intermedio' | 'Amplio' | 'Muy amplio';
  readonly safetyFactor: number;
  readonly innerDisplayPeriastronScene: number;
  readonly outerDisplayPeriastronScene: number;
}

const PROFILES: Readonly<Record<StellarSystemLaboratoryFamilyId, LaboratoryOrbitalSpacingProfile>> =
  Object.freeze({
    A: Object.freeze({ label: 'Compacto', safetyFactor: 1.12, innerDisplayPeriastronScene: 5.65, outerDisplayPeriastronScene: 11.2 }),
    B: Object.freeze({ label: 'Compacto', safetyFactor: 1.18, innerDisplayPeriastronScene: 5.85, outerDisplayPeriastronScene: 11.5 }),
    C: Object.freeze({ label: 'Intermedio', safetyFactor: 1.43, innerDisplayPeriastronScene: 6.45, outerDisplayPeriastronScene: 12.4 }),
    D: Object.freeze({ label: 'Intermedio', safetyFactor: 1.57, innerDisplayPeriastronScene: 6.8, outerDisplayPeriastronScene: 12.9 }),
    E: Object.freeze({ label: 'Amplio', safetyFactor: 1.92, innerDisplayPeriastronScene: 7.5, outerDisplayPeriastronScene: 14.0 }),
    F: Object.freeze({ label: 'Amplio', safetyFactor: 2.14, innerDisplayPeriastronScene: 8.0, outerDisplayPeriastronScene: 14.8 }),
    G: Object.freeze({ label: 'Muy amplio', safetyFactor: 2.72, innerDisplayPeriastronScene: 9.0, outerDisplayPeriastronScene: 16.3 }),
    H: Object.freeze({ label: 'Muy amplio', safetyFactor: 3.05, innerDisplayPeriastronScene: 9.6, outerDisplayPeriastronScene: 17.3 }),
  });

export function laboratoryOrbitalSpacingProfile(
  familyId: StellarSystemLaboratoryFamilyId,
): LaboratoryOrbitalSpacingProfile {
  return PROFILES[familyId];
}

/**
 * Extent protected when composing complete SINGLE sources into a LAB binary.
 * Preserve real planetary apastra and asteroid-belt edges. A radiative HZ is
 * not an occupied orbit: for a source with neither planets nor belts it must
 * not force an otherwise empty host hundreds of AU away from its companion.
 * Its HZ remains in the source and the composed render; only spacing changes.
 * The 0.2 AU floor is an existing conservative LAB clearance, not a stellar
 * radius estimate or an N-body stability guarantee. Long-period comets remain
 * outside this approximate stability screen, as in V1.
 */
export function laboratoryProtectedSingleExtentAu(source: SystemSceneSnapshot): number {
  const motions = new Map(source.motions.map(motion => [motion.id, motion]));
  const belts = source.asteroidBelts ?? [];
  const hasOccupiedRegion = source.planets.length > 0 || belts.length > 0;
  return Math.max(
    0.2,
    hasOccupiedRegion ? (source.habitableZone?.radiativeOuterEdgeAu ?? 0) : 0,
    ...source.planets.map(planet => {
      const planetMotion = planet.motionContributions.find(part => part.motionId.startsWith('planet-'));
      const motion = planetMotion === undefined ? undefined : motions.get(planetMotion.motionId);
      return motion === undefined ? 0 : motion.semiMajorAxisAu * (1 + motion.eccentricity);
    }),
    ...belts.map(belt => belt.outerEdgeAu),
  );
}

/** Re-export the canonical pure orbital screening under historical laboratory names.
 * The laboratory still resolves its own source-population extents from the
 * presentation snapshot; simulation never imports presentation or Angular. */
export {
  circumstellarCriticalFraction as laboratoryCircumstellarCriticalFraction,
  multipleBinarySemiMajorAxisAu as laboratoryBinarySemiMajorAxisAu,
  multipleTripleOuterSemiMajorAxisAu as laboratoryTripleOuterSemiMajorAxisAu,
} from '../../../simulation/stellar/stellar-multiple-orbital-spacing';
