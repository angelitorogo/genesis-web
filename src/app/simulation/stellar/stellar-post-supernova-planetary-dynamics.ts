import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { type SupernovaCanonicalEvent } from '../../domain/transient/supernova-canonical-event';
import { type SupernovaStellarConsequence } from '../../domain/transient/supernova-stellar-consequence';
import { type GeneratedMultipleHost, type GeneratedPublicPlanet, type GeneratedSingleHost, type MultihostLabel } from './stellar-multihost-formation';
import { multihostPhysicalSourceKey } from './stellar-multihost-physical-source-key';
import { StellarBlackHoleEngine } from './stellar-black-hole-engine';
import { StellarSupernovaCanonicalEventResolver } from '../transient/stellar-supernova-canonical-event-resolver';
import { StellarSupernovaConsequenceResolver } from '../transient/stellar-supernova-consequence-resolver';
import {
  PostSupernovaMassLossRegime,
  PostSupernovaOrbitDisposition,
  classifyPostSupernovaMassLossRegime,
  deriveDeterministicNatalKickKmS,
  orbitalPeriodYears,
  resolveAdiabaticPostStellarMassLoss,
  resolvePostSupernovaImpulse,
  resolvePostSupernovaMoonStability,
  type PostSupernovaKeplerOrbit,
} from './post-supernova-orbital-response';

export type StellarPostSupernovaHierarchyDisposition =
  | 'UNCHANGED'
  | 'BOUND_RECONFIGURED'
  | 'EJECTED'
  | 'HIERARCHY_DISRUPTED';

export interface StellarPostSupernovaHierarchyOrbitState {
  readonly disposition: StellarPostSupernovaHierarchyDisposition;
  readonly sourceEventKeys: readonly string[];
  readonly semiMajorAxisAu: number | null;
  readonly eccentricity: number | null;
  readonly periodYears: number | null;
  readonly periastronAu: number | null;
  readonly apoastronAu: number | null;
  readonly maximumEffectiveKickKmS: number;
}

export interface StellarPostSupernovaHierarchyState {
  readonly hasPostSupernovaEvolution: boolean;
  readonly currentArchitecture:
    | 'BINARY_UNCHANGED'
    | 'BINARY_RECONFIGURED'
    | 'DISRUPTED_PAIR'
    | 'TRIPLE_UNCHANGED'
    | 'TRIPLE_RECONFIGURED'
    | 'BOUND_INNER_BINARY_ESCAPED_TERTIARY'
    | 'DISRUPTED_HIERARCHY';
  readonly currentComponentMassesSolar: Readonly<Record<MultihostLabel, number>>;
  readonly innerOrbit: StellarPostSupernovaHierarchyOrbitState;
  readonly outerOrbit: StellarPostSupernovaHierarchyOrbitState | null;
}

export interface StellarPostSupernovaMoonState {
  readonly moonOrdinal: number;
  readonly survival: 'UNCHANGED' | 'BOUND' | 'LOST_FROM_HILL_SPHERE' | 'BOUND_TO_EJECTED_PLANET' | 'UNRESOLVED_HOST_DISRUPTION';
  readonly survives: boolean | null;
  readonly currentHillSphereRadiusPlanetRadii: number | null;
  readonly progradeStableLimitPlanetRadii: number | null;
}

export interface StellarPostSupernovaPlanetaryState {
  readonly disposition: PostSupernovaOrbitDisposition;
  readonly sourceEventKeys: readonly string[];
  readonly currentHostMassSolar: number | null;
  readonly semiMajorAxisAu: number | null;
  readonly eccentricity: number | null;
  readonly periodYears: number | null;
  readonly periodDays: number | null;
  readonly periastronAu: number | null;
  readonly apoastronAu: number | null;
  readonly inclinationChangeDegrees: number | null;
  readonly massLossRegime: PostSupernovaMassLossRegime;
  readonly maximumEffectiveKickKmS: number;
  readonly moonStates: readonly StellarPostSupernovaMoonState[];
}

interface EvolutionStep {
  readonly component: MultihostLabel;
  readonly ageBillionYears: number;
  readonly sourceEventKey: string;
  readonly kind: 'SUPERNOVA' | 'DIRECT_COLLAPSE';
  readonly preExplosionMassSolar: number | null;
  readonly postMassSolar: number;
  readonly natalKickKmS: number;
  readonly massLossTimescaleDays: number;
}

interface MutableOrbitState {
  orbit: PostSupernovaKeplerOrbit | null;
  bound: boolean;
  changed: boolean;
  sourceEventKeys: string[];
  maximumEffectiveKickKmS: number;
}

/**
 * 29.1E-g — present-day, read-only post-supernova dynamical projection.
 *
 * The frozen phase-18 planets remain immutable historical formation products.
 * This resolver derives whether their current orbit is still bound and, when
 * it is, the reconfigured Keplerian a/e/period. No new planet identity, route,
 * persistence row or replacement Planet entity is created.
 */
export class StellarPostSupernovaPlanetaryDynamics {
  readonly hierarchy: StellarPostSupernovaHierarchyState;

  private readonly steps: readonly EvolutionStep[];
  private readonly finalMasses: Readonly<Record<MultihostLabel, number>>;

  constructor(private readonly formation: GeneratedMultipleHost) {
    this.steps = buildEvolutionSteps(formation);
    this.hierarchy = buildHierarchyState(formation, this.steps);
    this.finalMasses = this.hierarchy.currentComponentMassesSolar;
  }

  resolvePlanet(entry: GeneratedPublicPlanet): StellarPostSupernovaPlanetaryState {
    const relevantSteps = this.steps.filter(step => entry.host === 'AB'
      ? step.component === 'A' || step.component === 'B'
      : step.component === entry.host);

    if (relevantSteps.length === 0) {
      return unchangedPlanetState(entry, currentHostMass(this.finalMasses, entry.host));
    }

    if (entry.host === 'AB' && this.hierarchy.innerOrbit.disposition === 'EJECTED') {
      return hostDisruptedPlanetState(entry, relevantSteps);
    }

    const result = entry.host === 'AB'
      ? this.resolveCircumbinaryPlanet(entry, relevantSteps)
      : this.resolveCircumstellarPlanet(entry, relevantSteps);
    return Object.freeze({
      ...result,
      moonStates: resolveMoonStates(entry, result),
    });
  }

  private resolveCircumstellarPlanet(
    entry: GeneratedPublicPlanet,
    steps: readonly EvolutionStep[],
  ): Omit<StellarPostSupernovaPlanetaryState, 'moonStates'> & { readonly moonStates?: never } {
    const host = this.formation.components.find(component => component.label === entry.host)!;
    let componentMass = host.physical.initialMassSolar;
    let orbit = fromPlanet(entry, componentMass);
    let regime: PostSupernovaMassLossRegime = PostSupernovaMassLossRegime.NONE;
    let maximumKick = 0;
    const eventKeys: string[] = [];

    for (const step of steps) {
      eventKeys.push(step.sourceEventKey);
      if (step.kind === 'DIRECT_COLLAPSE') {
        orbit = resolveAdiabaticPostStellarMassLoss(
          orbit.semiMajorAxisAu, orbit.eccentricity, componentMass, step.postMassSolar,
        );
        componentMass = step.postMassSolar;
        regime = strongerRegime(regime, PostSupernovaMassLossRegime.ADIABATIC);
        continue;
      }

      const preExplosionMass = step.preExplosionMassSolar!;
      if (preExplosionMass < componentMass) {
        orbit = resolveAdiabaticPostStellarMassLoss(
          orbit.semiMajorAxisAu, orbit.eccentricity, componentMass, preExplosionMass,
        );
        componentMass = preExplosionMass;
        regime = strongerRegime(regime, PostSupernovaMassLossRegime.ADIABATIC);
      }

      const eventRegime = classifyPostSupernovaMassLossRegime(
        step.massLossTimescaleDays,
        orbit.periodYears * 365.25,
      );
      regime = strongerRegime(regime, eventRegime);
      maximumKick = Math.max(maximumKick, step.natalKickKmS);
      const impulse = resolvePostSupernovaImpulse({
        semiMajorAxisAu: orbit.semiMajorAxisAu,
        eccentricity: orbit.eccentricity,
        preEventMassSolar: componentMass,
        postEventMassSolar: step.postMassSolar,
        natalKickKmS: step.natalKickKmS,
        deterministicKey: `${entry.planet.seed.normalizedValue}|${step.sourceEventKey}|S`,
      });
      componentMass = step.postMassSolar;
      if (impulse.orbit === null) {
        return Object.freeze({
          disposition: PostSupernovaOrbitDisposition.EJECTED,
          sourceEventKeys: Object.freeze(eventKeys),
          currentHostMassSolar: componentMass,
          semiMajorAxisAu: null,
          eccentricity: null,
          periodYears: null,
          periodDays: null,
          periastronAu: null,
          apoastronAu: null,
          inclinationChangeDegrees: null,
          massLossRegime: regime,
          maximumEffectiveKickKmS: maximumKick,
        });
      }
      orbit = impulse.orbit;
    }

    return boundPlanetState(orbit, componentMass, eventKeys, regime, maximumKick);
  }

  private resolveCircumbinaryPlanet(
    entry: GeneratedPublicPlanet,
    steps: readonly EvolutionStep[],
  ): Omit<StellarPostSupernovaPlanetaryState, 'moonStates'> & { readonly moonStates?: never } {
    const a = this.formation.components.find(component => component.label === 'A')!;
    const b = this.formation.components.find(component => component.label === 'B')!;
    const masses: Record<'A' | 'B', number> = {
      A: a.physical.initialMassSolar,
      B: b.physical.initialMassSolar,
    };
    let totalMass = masses.A + masses.B;
    let orbit = fromPlanet(entry, totalMass);
    let regime: PostSupernovaMassLossRegime = PostSupernovaMassLossRegime.NONE;
    let maximumKick = 0;
    const eventKeys: string[] = [];

    for (const step of steps) {
      const label = step.component as 'A' | 'B';
      eventKeys.push(step.sourceEventKey);
      if (step.kind === 'DIRECT_COLLAPSE') {
        const nextTotal = totalMass - masses[label] + step.postMassSolar;
        orbit = resolveAdiabaticPostStellarMassLoss(
          orbit.semiMajorAxisAu, orbit.eccentricity, totalMass, nextTotal,
        );
        masses[label] = step.postMassSolar;
        totalMass = nextTotal;
        regime = strongerRegime(regime, PostSupernovaMassLossRegime.ADIABATIC);
        continue;
      }

      const preExplosionMass = step.preExplosionMassSolar!;
      if (preExplosionMass < masses[label]) {
        const nextTotal = totalMass - masses[label] + preExplosionMass;
        orbit = resolveAdiabaticPostStellarMassLoss(
          orbit.semiMajorAxisAu, orbit.eccentricity, totalMass, nextTotal,
        );
        masses[label] = preExplosionMass;
        totalMass = nextTotal;
        regime = strongerRegime(regime, PostSupernovaMassLossRegime.ADIABATIC);
      }

      const postTotal = totalMass - masses[label] + step.postMassSolar;
      const effectiveKick = step.natalKickKmS * step.postMassSolar / postTotal;
      const eventRegime = classifyPostSupernovaMassLossRegime(
        step.massLossTimescaleDays,
        orbit.periodYears * 365.25,
      );
      regime = strongerRegime(regime, eventRegime);
      maximumKick = Math.max(maximumKick, effectiveKick);
      const impulse = resolvePostSupernovaImpulse({
        semiMajorAxisAu: orbit.semiMajorAxisAu,
        eccentricity: orbit.eccentricity,
        preEventMassSolar: totalMass,
        postEventMassSolar: postTotal,
        natalKickKmS: effectiveKick,
        deterministicKey: `${entry.planet.seed.normalizedValue}|${step.sourceEventKey}|P`,
      });
      masses[label] = step.postMassSolar;
      totalMass = postTotal;
      if (impulse.orbit === null) {
        return Object.freeze({
          disposition: PostSupernovaOrbitDisposition.EJECTED,
          sourceEventKeys: Object.freeze(eventKeys),
          currentHostMassSolar: totalMass,
          semiMajorAxisAu: null,
          eccentricity: null,
          periodYears: null,
          periodDays: null,
          periastronAu: null,
          apoastronAu: null,
          inclinationChangeDegrees: null,
          massLossRegime: regime,
          maximumEffectiveKickKmS: maximumKick,
        });
      }
      orbit = impulse.orbit;
    }

    return boundPlanetState(orbit, totalMass, eventKeys, regime, maximumKick);
  }
}

function buildEvolutionSteps(formation: GeneratedMultipleHost): readonly EvolutionStep[] {
  const components = Object.freeze(formation.components.map(host => Object.freeze({
    componentLabel: componentLabel(host.label),
    designation: `${formation.parentLocator.galacticObjectIndex.toString()}-${host.label}`,
    physicalProperties: host.physical,
    lifetimeProfile: host.lifetime,
  })));
  const events = StellarSupernovaCanonicalEventResolver.resolveGroundTruthSystem(
    Object.freeze({
      generationKey: multihostPhysicalSourceKey(formation.parentGenerationKey),
      innerPeriastronAu: formation.innerOrbit.periastronAu,
      outerPeriastronAu: formation.outerOrbit?.periastronAu ?? null,
    }),
    components,
  );
  const eventByComponent = new Map<number, SupernovaCanonicalEvent>(
    events.map(event => [event.componentLabel.code, event] as const),
  );
  const consequenceByComponent = new Map<number, SupernovaStellarConsequence>(
    StellarSupernovaConsequenceResolver.resolveEvents(events)
      .map(consequence => [consequence.componentLabel.code, consequence] as const),
  );
  const result: EvolutionStep[] = [];

  for (const host of formation.components) {
    const label = componentLabel(host.label);
    const consequence = consequenceByComponent.get(label.code) ?? null;
    const event = eventByComponent.get(label.code) ?? null;
    if (event !== null && consequence?.isRealized === true) {
      const remnantKind = consequence.compactRemnantKind;
      if (remnantKind !== 'NEUTRON_STAR' && remnantKind !== 'STELLAR_BLACK_HOLE') {
        continue;
      }
      const kick = deriveDeterministicNatalKickKmS({
        remnantKind,
        ejectaMassSolar: consequence.ejectaMassSolar,
        remnantMassSolar: consequence.postEventStellarMassSolar,
        deterministicKey: `${formation.parentSystemSeedHex}|${event.eventKey}`,
      });
      result.push(Object.freeze({
        component: host.label,
        ageBillionYears: consequence.consequenceStellarAgeBillionYears ?? host.lifetime.ageBillionYears,
        sourceEventKey: event.eventKey,
        kind: 'SUPERNOVA' as const,
        preExplosionMassSolar: event.profile.progenitor.preExplosionMassSolar,
        postMassSolar: consequence.postEventStellarMassSolar,
        natalKickKmS: kick,
        massLossTimescaleDays: supernovaMassLossTimescaleDays(event),
      }));
      continue;
    }

    if (host.stellarSystem.primaryStar.evolutionState.name === 'STELLAR_BLACK_HOLE' &&
        host.stellarSystem.primaryStar.blackHoleFormationChannel?.name === 'DIRECT_COLLAPSE') {
      const blackHole = StellarBlackHoleEngine.fromExistingStar(
        host.stellarSystem.primaryStar,
        host.physical,
        host.lifetime,
      );
      if (blackHole !== null) {
        result.push(Object.freeze({
          component: host.label,
          ageBillionYears: blackHole.formationAgeBillionYears,
          sourceEventKey: `DIRECT_COLLAPSE:${host.label}`,
          kind: 'DIRECT_COLLAPSE' as const,
          preExplosionMassSolar: null,
          postMassSolar: blackHole.massSolar,
          natalKickKmS: 0,
          massLossTimescaleDays: Number.POSITIVE_INFINITY,
        }));
      }
    }
  }

  return Object.freeze(result.sort((left, right) =>
    left.ageBillionYears - right.ageBillionYears ||
    labelOrder(left.component) - labelOrder(right.component)));
}

function buildHierarchyState(
  formation: GeneratedMultipleHost,
  steps: readonly EvolutionStep[],
): StellarPostSupernovaHierarchyState {
  const masses: Record<MultihostLabel, number> = {
    A: formation.components.find(host => host.label === 'A')!.physical.initialMassSolar,
    B: formation.components.find(host => host.label === 'B')!.physical.initialMassSolar,
    C: formation.components.find(host => host.label === 'C')?.physical.initialMassSolar ?? 0,
  };
  const inner = mutableOrbit(formation.innerOrbit.semiMajorAxisAu, formation.innerOrbit.eccentricity, masses.A + masses.B);
  const outer = formation.outerOrbit === null ? null : mutableOrbit(
    formation.outerOrbit.semiMajorAxisAu,
    formation.outerOrbit.eccentricity,
    masses.A + masses.B + masses.C,
  );

  for (const step of steps) {
    const beforeComponent = masses[step.component];
    const slowTarget = step.kind === 'SUPERNOVA' ? step.preExplosionMassSolar! : step.postMassSolar;
    if (slowTarget < beforeComponent) {
      applyHierarchyAdiabaticLoss(inner, outer, masses, step.component, slowTarget);
      masses[step.component] = slowTarget;
    }

    if (step.kind === 'DIRECT_COLLAPSE') {
      inner.changed = inner.changed || step.component === 'A' || step.component === 'B';
      if (outer !== null) outer.changed = true;
      inner.sourceEventKeys.push(step.sourceEventKey);
      if (outer !== null) outer.sourceEventKeys.push(step.sourceEventKey);
      continue;
    }

    const preTotalAB = masses.A + masses.B;
    const preTotalABC = preTotalAB + masses.C;
    const postComponent = step.postMassSolar;
    const postTotalAB = preTotalAB - masses[step.component] + postComponent;
    const postTotalABC = preTotalABC - masses[step.component] + postComponent;

    if ((step.component === 'A' || step.component === 'B') && inner.bound && inner.orbit !== null) {
      const impulse = resolvePostSupernovaImpulse({
        semiMajorAxisAu: inner.orbit.semiMajorAxisAu,
        eccentricity: inner.orbit.eccentricity,
        preEventMassSolar: preTotalAB,
        postEventMassSolar: postTotalAB,
        natalKickKmS: step.natalKickKmS,
        deterministicKey: `${formation.parentSystemSeedHex}|${step.sourceEventKey}|INNER`,
      });
      inner.changed = true;
      inner.sourceEventKeys.push(step.sourceEventKey);
      inner.maximumEffectiveKickKmS = Math.max(inner.maximumEffectiveKickKmS, step.natalKickKmS);
      inner.bound = impulse.orbit !== null;
      inner.orbit = impulse.orbit;
    }

    if (outer !== null && outer.bound && outer.orbit !== null) {
      if (!inner.bound && (step.component === 'A' || step.component === 'B')) {
        outer.bound = false;
        outer.orbit = null;
        outer.changed = true;
        outer.sourceEventKeys.push(step.sourceEventKey);
      } else {
        const effectiveKick = step.component === 'C'
          ? step.natalKickKmS
          : step.natalKickKmS * step.postMassSolar / postTotalAB;
        const impulse = resolvePostSupernovaImpulse({
          semiMajorAxisAu: outer.orbit.semiMajorAxisAu,
          eccentricity: outer.orbit.eccentricity,
          preEventMassSolar: preTotalABC,
          postEventMassSolar: postTotalABC,
          natalKickKmS: effectiveKick,
          deterministicKey: `${formation.parentSystemSeedHex}|${step.sourceEventKey}|OUTER`,
        });
        outer.changed = true;
        outer.sourceEventKeys.push(step.sourceEventKey);
        outer.maximumEffectiveKickKmS = Math.max(outer.maximumEffectiveKickKmS, effectiveKick);
        outer.bound = impulse.orbit !== null;
        outer.orbit = impulse.orbit;
      }
    }

    masses[step.component] = postComponent;
  }

  const hasEvolution = steps.length > 0;
  const currentArchitecture = formation.outerOrbit === null
    ? !hasEvolution
      ? 'BINARY_UNCHANGED' as const
      : inner.bound ? 'BINARY_RECONFIGURED' as const : 'DISRUPTED_PAIR' as const
    : !hasEvolution
      ? 'TRIPLE_UNCHANGED' as const
      : !inner.bound
        ? 'DISRUPTED_HIERARCHY' as const
        : outer?.bound === false
          ? 'BOUND_INNER_BINARY_ESCAPED_TERTIARY' as const
          : 'TRIPLE_RECONFIGURED' as const;

  return Object.freeze({
    hasPostSupernovaEvolution: hasEvolution,
    currentArchitecture,
    currentComponentMassesSolar: Object.freeze({ ...masses }),
    innerOrbit: freezeHierarchyOrbit(inner, inner.bound ? 'BOUND_RECONFIGURED' : 'EJECTED'),
    outerOrbit: outer === null ? null : freezeHierarchyOrbit(
      outer,
      !inner.bound ? 'HIERARCHY_DISRUPTED' : outer.bound ? 'BOUND_RECONFIGURED' : 'EJECTED',
    ),
  });
}

function applyHierarchyAdiabaticLoss(
  inner: MutableOrbitState,
  outer: MutableOrbitState | null,
  masses: Readonly<Record<MultihostLabel, number>>,
  label: MultihostLabel,
  nextComponentMass: number,
): void {
  const beforeAB = masses.A + masses.B;
  const beforeABC = beforeAB + masses.C;
  const afterAB = beforeAB - masses[label] + nextComponentMass;
  const afterABC = beforeABC - masses[label] + nextComponentMass;
  if ((label === 'A' || label === 'B') && inner.bound && inner.orbit !== null) {
    inner.orbit = resolveAdiabaticPostStellarMassLoss(
      inner.orbit.semiMajorAxisAu, inner.orbit.eccentricity, beforeAB, afterAB,
    );
    inner.changed = true;
  }
  if (outer !== null && outer.bound && outer.orbit !== null) {
    outer.orbit = resolveAdiabaticPostStellarMassLoss(
      outer.orbit.semiMajorAxisAu, outer.orbit.eccentricity, beforeABC, afterABC,
    );
    outer.changed = true;
  }
}

function mutableOrbit(a: number, e: number, mass: number): MutableOrbitState {
  return {
    orbit: Object.freeze({
      semiMajorAxisAu: a,
      eccentricity: e,
      periodYears: orbitalPeriodYears(a, mass),
      periastronAu: a * (1 - e),
      apoastronAu: a * (1 + e),
      inclinationChangeDegrees: 0,
    }),
    bound: true,
    changed: false,
    sourceEventKeys: [],
    maximumEffectiveKickKmS: 0,
  };
}

function freezeHierarchyOrbit(
  state: MutableOrbitState,
  changedDisposition: Exclude<StellarPostSupernovaHierarchyDisposition, 'UNCHANGED'>,
): StellarPostSupernovaHierarchyOrbitState {
  const orbit = state.orbit;
  return Object.freeze({
    disposition: state.changed ? changedDisposition : 'UNCHANGED',
    sourceEventKeys: Object.freeze([...state.sourceEventKeys]),
    semiMajorAxisAu: orbit?.semiMajorAxisAu ?? null,
    eccentricity: orbit?.eccentricity ?? null,
    periodYears: orbit?.periodYears ?? null,
    periastronAu: orbit?.periastronAu ?? null,
    apoastronAu: orbit?.apoastronAu ?? null,
    maximumEffectiveKickKmS: state.maximumEffectiveKickKmS,
  });
}

function fromPlanet(entry: GeneratedPublicPlanet, mass: number): PostSupernovaKeplerOrbit {
  const orbit = entry.planet.orbit;
  return Object.freeze({
    semiMajorAxisAu: orbit.semiMajorAxisAu,
    eccentricity: orbit.eccentricity,
    periodYears: orbitalPeriodYears(orbit.semiMajorAxisAu, mass),
    periastronAu: orbit.periastronAu,
    apoastronAu: orbit.apoastronAu,
    inclinationChangeDegrees: 0,
  });
}

function boundPlanetState(
  orbit: PostSupernovaKeplerOrbit,
  mass: number,
  eventKeys: readonly string[],
  regime: PostSupernovaMassLossRegime,
  maximumKick: number,
): Omit<StellarPostSupernovaPlanetaryState, 'moonStates'> & { readonly moonStates?: never } {
  return Object.freeze({
    disposition: PostSupernovaOrbitDisposition.BOUND_RECONFIGURED,
    sourceEventKeys: Object.freeze([...eventKeys]),
    currentHostMassSolar: mass,
    semiMajorAxisAu: orbit.semiMajorAxisAu,
    eccentricity: orbit.eccentricity,
    periodYears: orbit.periodYears,
    periodDays: orbit.periodYears * 365.25,
    periastronAu: orbit.periastronAu,
    apoastronAu: orbit.apoastronAu,
    inclinationChangeDegrees: orbit.inclinationChangeDegrees,
    massLossRegime: regime,
    maximumEffectiveKickKmS: maximumKick,
  });
}

function unchangedPlanetState(
  entry: GeneratedPublicPlanet,
  mass: number | null,
): StellarPostSupernovaPlanetaryState {
  return Object.freeze({
    disposition: PostSupernovaOrbitDisposition.UNCHANGED,
    sourceEventKeys: Object.freeze([]),
    currentHostMassSolar: mass,
    semiMajorAxisAu: entry.planet.orbit.semiMajorAxisAu,
    eccentricity: entry.planet.orbit.eccentricity,
    periodYears: entry.planet.orbitalPeriod.periodYears,
    periodDays: entry.planet.orbitalPeriod.periodDays,
    periastronAu: entry.planet.orbit.periastronAu,
    apoastronAu: entry.planet.orbit.apoastronAu,
    inclinationChangeDegrees: 0,
    massLossRegime: PostSupernovaMassLossRegime.NONE,
    maximumEffectiveKickKmS: 0,
    moonStates: Object.freeze(entry.moonSystem.relevantMoons.map(moon => Object.freeze({
      moonOrdinal: moon.moonOrdinal,
      survival: 'UNCHANGED' as const,
      survives: true,
      currentHillSphereRadiusPlanetRadii: moon.orbit.sourceHillSphereRadiusPlanetRadii,
      progradeStableLimitPlanetRadii: null,
    }))),
  });
}

function hostDisruptedPlanetState(
  entry: GeneratedPublicPlanet,
  steps: readonly EvolutionStep[],
): StellarPostSupernovaPlanetaryState {
  return Object.freeze({
    disposition: PostSupernovaOrbitDisposition.HOST_DISRUPTED,
    sourceEventKeys: Object.freeze(steps.map(step => step.sourceEventKey)),
    currentHostMassSolar: null,
    semiMajorAxisAu: null,
    eccentricity: null,
    periodYears: null,
    periodDays: null,
    periastronAu: null,
    apoastronAu: null,
    inclinationChangeDegrees: null,
    massLossRegime: strongestStepRegime(steps, entry.planet.orbitalPeriod.periodDays),
    maximumEffectiveKickKmS: Math.max(0, ...steps.map(step => step.natalKickKmS)),
    moonStates: Object.freeze(entry.moonSystem.relevantMoons.map(moon => Object.freeze({
      moonOrdinal: moon.moonOrdinal,
      survival: 'UNRESOLVED_HOST_DISRUPTION' as const,
      survives: null,
      currentHillSphereRadiusPlanetRadii: null,
      progradeStableLimitPlanetRadii: null,
    }))),
  });
}

function resolveMoonStates(
  entry: GeneratedPublicPlanet,
  planet: Omit<StellarPostSupernovaPlanetaryState, 'moonStates'>,
): readonly StellarPostSupernovaMoonState[] {
  if (planet.disposition === PostSupernovaOrbitDisposition.EJECTED) {
    return Object.freeze(entry.moonSystem.relevantMoons.map(moon => Object.freeze({
      moonOrdinal: moon.moonOrdinal,
      survival: 'BOUND_TO_EJECTED_PLANET' as const,
      survives: true,
      currentHillSphereRadiusPlanetRadii: null,
      progradeStableLimitPlanetRadii: null,
    })));
  }
  if (planet.disposition !== PostSupernovaOrbitDisposition.BOUND_RECONFIGURED ||
      planet.currentHostMassSolar === null || planet.semiMajorAxisAu === null || planet.eccentricity === null) {
    return Object.freeze([]);
  }
  return Object.freeze(entry.moonSystem.relevantMoons.map(moon => {
    const stability = resolvePostSupernovaMoonStability({
      planetSemiMajorAxisAu: planet.semiMajorAxisAu!,
      planetEccentricity: planet.eccentricity!,
      planetMassEarth: entry.planet.massEarth,
      planetRadiusEarth: entry.planet.radiusEarth,
      currentHostMassSolar: planet.currentHostMassSolar!,
      moonSemiMajorAxisPlanetRadii: moon.orbit.semiMajorAxisPlanetRadii,
      moonEccentricity: moon.orbit.eccentricity,
    });
    return Object.freeze({
      moonOrdinal: moon.moonOrdinal,
      survival: stability.survives ? 'BOUND' as const : 'LOST_FROM_HILL_SPHERE' as const,
      survives: stability.survives,
      currentHillSphereRadiusPlanetRadii: stability.hillSphereRadiusPlanetRadii,
      progradeStableLimitPlanetRadii: stability.progradeStableLimitPlanetRadii,
    });
  }));
}

function currentHostMass(
  masses: Readonly<Record<MultihostLabel, number>>,
  host: GeneratedPublicPlanet['host'],
): number | null {
  return host === 'AB' ? masses.A + masses.B : masses[host];
}

function supernovaMassLossTimescaleDays(_event: SupernovaCanonicalEvent): number {
  // The canonical event does not currently persist an envelope-ejection
  // timescale. For planetary dynamics a realized SN is therefore treated as
  // the impulsive limit, rather than fabricating type-specific durations.
  return 0;
}

function strongerRegime(
  current: PostSupernovaMassLossRegime,
  next: PostSupernovaMassLossRegime,
): PostSupernovaMassLossRegime {
  const rank: Record<PostSupernovaMassLossRegime, number> = {
    NONE: 0,
    ADIABATIC: 1,
    TRANSITIONAL: 2,
    IMPULSIVE: 3,
  };
  return rank[next] > rank[current] ? next : current;
}

function strongestStepRegime(
  steps: readonly EvolutionStep[],
  periodDays: number,
): PostSupernovaMassLossRegime {
  return steps.reduce<PostSupernovaMassLossRegime>((current, step) =>
    strongerRegime(
      current,
      step.kind === 'DIRECT_COLLAPSE'
        ? PostSupernovaMassLossRegime.ADIABATIC
        : classifyPostSupernovaMassLossRegime(step.massLossTimescaleDays, periodDays),
    ), PostSupernovaMassLossRegime.NONE);
}

function componentLabel(label: MultihostLabel): typeof StellarSystemComponentLabel.A |
  typeof StellarSystemComponentLabel.B | typeof StellarSystemComponentLabel.C {
  switch (label) {
    case 'A': return StellarSystemComponentLabel.A;
    case 'B': return StellarSystemComponentLabel.B;
    case 'C': return StellarSystemComponentLabel.C;
  }
}

function labelOrder(label: MultihostLabel): number {
  return label === 'A' ? 0 : label === 'B' ? 1 : 2;
}
