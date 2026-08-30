/**
 * Point-21.4 first-order direction of secular tidal orbital evolution.
 *
 * For the prograde relevant moons generated in point 21.3, a moon outside the
 * host corotation radius tends outward when the planet spins prograde; one
 * inside tends inward. Retrograde host spin forces the prograde moon toward the
 * inward branch in this simplified V1 treatment.
 */
export enum MoonTidalMigrationRegime {
  INWARD = 'INWARD',
  NEAR_SYNCHRONOUS = 'NEAR_SYNCHRONOUS',
  OUTWARD = 'OUTWARD',
}
