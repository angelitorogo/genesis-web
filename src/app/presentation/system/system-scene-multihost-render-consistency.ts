import {
  type MultihostFormedPlanetV22,
} from '../../domain/planetary/multihost-formed-planetary-system';
import {
  type MultihostOrbitalHostId,
} from '../../domain/planetary/multihost-planetary-catalog';

export type SystemSceneMultiplicityV221 = 'SINGLE' | 'BINARY' | 'TRIPLE';

export interface SystemSceneMultihostRenderBudgetV221 {
  readonly globalPlanetCap: number;
  readonly perHostPlanetCap: number;
  readonly globalLaboratoryMoonCap: number;
}

export interface SystemSceneMultihostPlanetRenderBindingV221 {
  readonly hostId: MultihostOrbitalHostId;
  readonly orbitalPeriodDays: number;
  readonly motionId: string;
  readonly translationState: 'ACTIVE';
}

const HOST_ORDER: readonly MultihostOrbitalHostId[] = ['A', 'B', 'C', 'AB', 'ABC'];

const BUDGETS: Readonly<Record<SystemSceneMultiplicityV221, SystemSceneMultihostRenderBudgetV221>> =
  Object.freeze({
    SINGLE: Object.freeze({
      globalPlanetCap: 12,
      perHostPlanetCap: 12,
      globalLaboratoryMoonCap: 8,
    }),
    BINARY: Object.freeze({
      globalPlanetCap: 20,
      perHostPlanetCap: 10,
      globalLaboratoryMoonCap: 10,
    }),
    TRIPLE: Object.freeze({
      globalPlanetCap: 20,
      perHostPlanetCap: 5,
      globalLaboratoryMoonCap: 12,
    }),
  });

export function systemSceneMultihostRenderBudgetV221(
  multiplicity: string | null,
): SystemSceneMultihostRenderBudgetV221 {
  if (multiplicity === 'TRIPLE') return BUDGETS.TRIPLE;
  if (multiplicity === 'BINARY') return BUDGETS.BINARY;
  return BUDGETS.SINGLE;
}

/**
 * V2.2.1 presentation selection only. The formed aggregate remains untouched.
 * We render a deterministic, radially spread, round-robin subset so one rich
 * host cannot visually drown every other S/P family in the laboratory.
 */
export function selectMultihostPlanetsForRenderingV221(
  planets: readonly MultihostFormedPlanetV22[],
  multiplicity: string | null,
  familyFilter: 'ALL' | 'S_TYPE' | 'P_TYPE' = 'ALL',
): readonly MultihostFormedPlanetV22[] {
  const budget = systemSceneMultihostRenderBudgetV221(multiplicity);
  const groups = new Map<MultihostOrbitalHostId, readonly MultihostFormedPlanetV22[]>();

  for (const hostId of HOST_ORDER) {
    const candidates = planets
      .filter(planet => planet.hostId === hostId)
      .filter(planet => familyFilter === 'ALL' || planet.family === familyFilter)
      .sort((left, right) => left.semiMajorAxisAu - right.semiMajorAxisAu);
    groups.set(hostId, spreadSample(candidates, budget.perHostPlanetCap));
  }

  const selected: MultihostFormedPlanetV22[] = [];
  let round = 0;
  while (selected.length < budget.globalPlanetCap) {
    let added = false;
    for (const hostId of HOST_ORDER) {
      const group = groups.get(hostId) ?? [];
      const planet = group[round];
      if (planet === undefined) continue;
      selected.push(planet);
      added = true;
      if (selected.length >= budget.globalPlanetCap) break;
    }
    if (!added) break;
    round += 1;
  }

  return Object.freeze(selected);
}

/** Reject incomplete bindings before materializing any Three.js body or guide. */
export function isSystemSceneMultihostPlanetRenderBindingV221(
  binding: SystemSceneMultihostPlanetRenderBindingV221,
  hasOrbit: boolean,
  hasMotion: boolean,
  contributionCount: number,
): boolean {
  return HOST_ORDER.includes(binding.hostId) &&
    Number.isFinite(binding.orbitalPeriodDays) && binding.orbitalPeriodDays > 0 &&
    binding.motionId.length > 0 && binding.translationState === 'ACTIVE' &&
    hasOrbit && hasMotion && contributionCount > 0;
}

export function assertSystemSceneMultihostPlanetRenderBindingV221(
  binding: SystemSceneMultihostPlanetRenderBindingV221,
  hasOrbit: boolean,
  hasMotion: boolean,
  contributionCount: number,
): void {
  if (!isSystemSceneMultihostPlanetRenderBindingV221(
    binding, hasOrbit, hasMotion, contributionCount,
  )) {
    throw new RangeError(
      `V2.2.1 refuses to render an unbound multihost planet (${binding.hostId}).`,
    );
  }
}

function spreadSample<T>(values: readonly T[], cap: number): readonly T[] {
  if (values.length <= cap) return Object.freeze([...values]);
  if (cap <= 1) return Object.freeze([values[Math.floor(values.length / 2)]!]);
  const indices = new Set<number>();
  for (let i = 0; i < cap; i += 1) {
    indices.add(Math.round(i * (values.length - 1) / (cap - 1)));
  }
  return Object.freeze([...indices].sort((a, b) => a - b).map(index => values[index]!));
}

