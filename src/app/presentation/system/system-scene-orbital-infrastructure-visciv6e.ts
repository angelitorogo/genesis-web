import type { Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';
import {
  buildSystemSceneArtificialSatellitePlansV1,
  buildSystemSceneOrbitalRingPlansV1,
  buildSystemSceneOrbitalStationPlansV1,
  supportsSystemSceneArtificialSatellitesV1,
  type SystemSceneArtificialSatellitePlanV1,
  type SystemSceneOrbitalRingPlanV1,
  type SystemSceneOrbitalStationPlanV1,
} from './system-scene-artificial-satellites-visciv2';

/**
 * VISCIV.6e: One read-only, deterministic orbital representation shared by
 * the planet fiche and SystemScene. These are VISUAL proposals for a confirmed
 * civilization tier, NOT observed individual stations or megastructures.
 * The VIDA.7 / VIDA.8 / CT-0 records remain authoritative and unchanged.
 */
export interface SystemSceneOrbitalInfrastructureManifestVISCIV6e {
  readonly tier: Vida7CivilizationTier | null;
  readonly satellites: readonly SystemSceneArtificialSatellitePlanV1[];
  readonly stations: readonly SystemSceneOrbitalStationPlanV1[];
  readonly rings: readonly SystemSceneOrbitalRingPlanV1[];
  readonly satelliteCount: number;
  readonly stationCount: number;
  readonly ringCount: number;
  readonly totalCount: number;
}

export function buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(
  seedUint32: number,
  tier: Vida7CivilizationTier | null | undefined,
  planetRadiusScene: number,
): SystemSceneOrbitalInfrastructureManifestVISCIV6e {
  const supported = supportsSystemSceneArtificialSatellitesV1(tier);
  const satellites = supported
    ? buildSystemSceneArtificialSatellitePlansV1(seedUint32, tier, planetRadiusScene)
    : Object.freeze([] as SystemSceneArtificialSatellitePlanV1[]);
  const stations = supported
    ? buildSystemSceneOrbitalStationPlansV1(seedUint32, tier, planetRadiusScene)
    : Object.freeze([] as SystemSceneOrbitalStationPlanV1[]);
  const rings = supported
    ? buildSystemSceneOrbitalRingPlansV1(seedUint32, tier)
    : Object.freeze([] as SystemSceneOrbitalRingPlanV1[]);
  return Object.freeze({
    tier: tier ?? null,
    satellites,
    stations,
    rings,
    satelliteCount: satellites.length,
    stationCount: stations.length,
    ringCount: rings.length,
    totalCount: satellites.length + stations.length + rings.length,
  });
}
