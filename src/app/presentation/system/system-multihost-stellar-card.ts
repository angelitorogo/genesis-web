import { ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemCardModel,
  type ArchiveStellarSystemComponentCardModel,
  type ArchiveStellarSystemFactModel,
  type ArchiveStellarSystemOrbitCardModel,
} from '../genesis-archive/archive-stellar-system-card';
import { stellarVisualRadiusScale } from '../genesis-archive/stellar-visual-radius-scale';
import { type GeneratedMultipleHost, type GeneratedSingleHost } from '../../simulation/stellar/stellar-multihost-formation';
import { type StellarRelativeOrbit } from '../../domain/stellar/stellar-relative-orbit';
import {
  StellarPostSupernovaPlanetaryDynamics,
  type StellarPostSupernovaHierarchyOrbitState,
} from '../../simulation/stellar/stellar-post-supernova-planetary-dynamics';
import { CircumbinaryRadiativeReferenceRegime, CircumbinaryStellarEvolutionRegime } from '../../domain/habitability/circumbinary-habitability-assessment';
import { systemSceneClipMultihostPTypeHabitableZone } from './system-scene-multihost-p-type-hz-coherence';
import { systemMultihostPublicStellarComponentDesignation } from './system-multihost-public-stellar-designation';
import { StellarBlackHoleEngine } from '../../simulation/stellar/stellar-black-hole-engine';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { type SupernovaStellarConsequence } from '../../domain/transient/supernova-stellar-consequence';
import {
  StellarSupernovaCanonicalEventResolver,
} from '../../simulation/transient/stellar-supernova-canonical-event-resolver';
import {
  StellarSupernovaConsequenceResolver,
} from '../../simulation/transient/stellar-supernova-consequence-resolver';
import {
  compactObjectScientificVisual,
  type CompactObjectScientificVisual,
} from '../genesis-archive/compact-object-scientific-visual';

const format = (value: number): string => new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 4,
}).format(value);
const fact = (label: string, value: string): ArchiveStellarSystemFactModel => Object.freeze({label, value});

const REMNANT_NEUTRAL_STELLAR_COLOR = '#9DB9C8';

function componentCard(
  host: GeneratedSingleHost,
  parentTitle: string,
  consequence: SupernovaStellarConsequence | null,
): ArchiveStellarSystemComponentCardModel {
  const state = host.stellarSystem.primaryStar.evolutionState.name;
  const isRemnant = isCompactRemnantState(state);
  const remnant = isRemnant ? currentRemnantProjection(host, consequence) : null;

  return Object.freeze({
    componentLabel: host.label,
    // A child key is an internal generation scope: never expose its own
    // stellar designation/procedural code as a second public system.
    designation: systemMultihostPublicStellarComponentDesignation(parentTitle, host.label),
    proceduralCode: null,
    // Point 29.1E-c: the frozen point-15.2 spectrum belongs to the stellar
    // reference/progenitor model. It is not a current O/B/A/F/G/K/M class once
    // the component is a compact remnant.
    spectralType: isRemnant ? null : host.spectral.spectralType.designation,
    evolutionStateLabel: currentEvolutionStateLabel(state),
    colorHex: isRemnant ? REMNANT_NEUTRAL_STELLAR_COLOR : host.spectral.color.hex,
    facts: Object.freeze([
      ...(remnant?.facts ?? [
        fact('Masa de referencia', `${format(host.physical.initialMassSolar)} M☉`),
        fact('Radio de referencia', `${format(host.physical.radiusSolar)} R☉`),
        fact('Luminosidad de referencia', `${format(host.physical.luminositySolar)} L☉`),
        fact('Temperatura efectiva', `${Math.round(host.physical.effectiveTemperatureKelvin)} K`),
        fact('Edad estelar', `${format(host.lifetime.ageBillionYears)} miles de millones de años`),
      ]),
      fact('Planetas circumestelares', String(host.planets.length)),
      fact('Lunas relevantes', String(host.moonSystems.reduce((sum, system) => sum + system.relevantMoonCount, 0))),
    ]),
    compactVisual: remnant?.visual ?? null,
  });
}

function isCompactRemnantState(state: string): boolean {
  return state === 'WHITE_DWARF' || state === 'NEUTRON_STAR' || state === 'STELLAR_BLACK_HOLE';
}

function currentEvolutionStateLabel(state: string): string {
  switch (state) {
    case 'WHITE_DWARF': return 'Enana blanca';
    case 'NEUTRON_STAR': return 'Estrella de neutrones';
    case 'STELLAR_BLACK_HOLE': return 'Agujero negro estelar';
    default: return state;
  }
}

function currentRemnantProjection(
  host: GeneratedSingleHost,
  consequence: SupernovaStellarConsequence | null,
): Readonly<{
  facts: readonly ArchiveStellarSystemFactModel[];
  visual: CompactObjectScientificVisual | null;
}> {
  const star = host.stellarSystem.primaryStar;
  const state = star.evolutionState.name;
  const base = [
    fact('Masa inicial del progenitor', `${format(host.physical.initialMassSolar)} M☉`),
    fact('Edad actual del objeto', `${format(host.lifetime.ageBillionYears)} miles de millones de años`),
  ];

  if (state === 'STELLAR_BLACK_HOLE') {
    const blackHole = StellarBlackHoleEngine.fromExistingStar(star, host.physical, host.lifetime);
    if (blackHole === null) throw new RangeError('A STELLAR_BLACK_HOLE host requires its canonical 27.1 remnant profile.');
    const directCollapse = blackHole.formationChannel.name === 'DIRECT_COLLAPSE';
    return Object.freeze({
      facts: Object.freeze([
        ...base,
        fact('Remanente compacto', 'Agujero negro estelar'),
        ...(directCollapse ? [
          fact('Masa actual del remanente (estimada)', `${format(blackHole.massSolar)} M☉`),
          fact('Radio de Schwarzschild (referencia)', `${format(blackHole.schwarzschildRadiusKm)} km`),
        ] : [
          fact(
            'Masa actual del remanente',
            consequence === null
              ? 'Determinada por la consecuencia de supernova 29.1D'
              : `${format(consequence.postEventStellarMassSolar)} M☉`,
          ),
        ]),
        fact('Canal de formación', blackHoleFormationChannelLabel(blackHole.formationChannel.name)),
        fact('Edad del remanente (estimada)', `${format(blackHole.ageSinceFormationBillionYears)} miles de millones de años`),
      ]),
      visual: compactObjectScientificVisual('BLACK_HOLE'),
    });
  }

  if (state === 'NEUTRON_STAR') {
    const channel = host.lifetime.evolutionAssessment.neutronStarFormationChannel;
    return Object.freeze({
      facts: Object.freeze([
        ...base,
        fact('Remanente compacto', 'Estrella de neutrones'),
        fact(
          'Masa actual del remanente',
          consequence === null
            ? 'Determinada por la consecuencia de supernova 29.1D'
            : `${format(consequence.postEventStellarMassSolar)} M☉`,
        ),
        ...(channel === null ? [] : [fact('Canal de formación', channel.name)]),
        ...remnantAgeFacts(host),
      ]),
      visual: compactObjectScientificVisual('NEUTRON_STAR'),
    });
  }

  const composition = host.lifetime.evolutionAssessment.whiteDwarfComposition?.name ?? null;
  return Object.freeze({
    facts: Object.freeze([
      ...base,
      fact('Remanente compacto', 'Enana blanca'),
      fact('Masa actual del remanente', 'No modelada por el Ground Truth estelar actual'),
      fact('Composición interna', whiteDwarfCompositionLabel(composition)),
      ...remnantAgeFacts(host),
    ]),
    visual: null,
  });
}

function blackHoleFormationChannelLabel(name: string): string {
  switch (name) {
    case 'DIRECT_COLLAPSE': return 'Colapso directo';
    case 'FALLBACK_CORE_COLLAPSE': return 'Colapso de núcleo con fallback';
    default: return name;
  }
}

function remnantAgeFacts(host: GeneratedSingleHost): readonly ArchiveStellarSystemFactModel[] {
  const formedAt = host.lifetime.terminalAgeBillionYears;
  if (formedAt === null) return Object.freeze([]);
  return Object.freeze([
    fact('Formación del remanente', `${format(formedAt)} Ga de edad estelar`),
    fact('Edad desde formación', `${format(Math.max(0, host.lifetime.ageBillionYears - formedAt))} miles de millones de años`),
  ]);
}

function whiteDwarfCompositionLabel(name: string | null): string {
  switch (name) {
    case 'HELIUM_CORE': return 'Núcleo de helio';
    case 'CARBON_OXYGEN_CORE': return 'Núcleo de carbono-oxígeno';
    case 'OXYGEN_NEON_CORE': return 'Núcleo de oxígeno-neón';
    default: return 'Composición no resuelta';
  }
}

function stellarComponentLabel(
  label: 'A' | 'B' | 'C',
): typeof StellarSystemComponentLabel.A |
  typeof StellarSystemComponentLabel.B |
  typeof StellarSystemComponentLabel.C {
  switch (label) {
    case 'A': return StellarSystemComponentLabel.A;
    case 'B': return StellarSystemComponentLabel.B;
    case 'C': return StellarSystemComponentLabel.C;
  }
}

function orbitCard(
  orbit: StellarRelativeOrbit,
  outer: boolean,
  current: StellarPostSupernovaHierarchyOrbitState | null,
): ArchiveStellarSystemOrbitCardModel {
  const reconfigured = current !== null && current.disposition !== 'UNCHANGED';
  const currentBound = current !== null && current.disposition === 'BOUND_RECONFIGURED' &&
    current.semiMajorAxisAu !== null && current.eccentricity !== null &&
    current.periastronAu !== null && current.apoastronAu !== null && current.periodYears !== null;
  return Object.freeze({
    label: outer ? 'Órbita exterior (A+B)–C' : 'Órbita interior A–B',
    roleLabel: outer ? 'Movimiento relativo de (A+B) y C' : 'Movimiento relativo de A y B',
    facts: Object.freeze([
      fact(reconfigured ? 'Semieje mayor de formación' : 'Semieje mayor', `${format(orbit.semiMajorAxisAu)} UA`),
      fact(reconfigured ? 'Excentricidad de formación' : 'Excentricidad', format(orbit.eccentricity)),
      fact(reconfigured ? 'Periastro de formación' : 'Periastro', `${format(orbit.periastronAu)} UA`),
      fact(reconfigured ? 'Apoastro de formación' : 'Apoastro', `${format(orbit.apoastronAu)} UA`),
      fact(reconfigured ? 'Período de formación' : 'Período', `${format(orbit.periodYears)} años`),
      ...(reconfigured ? [
        fact('Estado post-supernova', hierarchyOrbitDispositionLabel(current!.disposition)),
        ...(currentBound ? [
          fact('Semieje mayor actual', `${format(current!.semiMajorAxisAu!)} UA`),
          fact('Excentricidad actual', format(current!.eccentricity!)),
          fact('Periastro actual', `${format(current!.periastronAu!)} UA`),
          fact('Apoastro actual', `${format(current!.apoastronAu!)} UA`),
          fact('Período actual', `${format(current!.periodYears!)} años`),
        ] : []),
        fact('Kick natal efectivo máximo', `${format(current!.maximumEffectiveKickKmS)} km/s`),
      ] : []),
    ]),
  });
}

function hierarchyOrbitDispositionLabel(disposition: StellarPostSupernovaHierarchyOrbitState['disposition']): string {
  switch (disposition) {
    case 'BOUND_RECONFIGURED': return 'Ligada · reconfigurada';
    case 'EJECTED': return 'Disuelta / no ligada';
    case 'HIERARCHY_DISRUPTED': return 'Jerarquía disuelta por la órbita interior';
    case 'UNCHANGED': return 'Sin reconfiguración';
  }
}

function postSupernovaArchitectureLabel(architecture: StellarPostSupernovaPlanetaryDynamics['hierarchy']['currentArchitecture']): string {
  switch (architecture) {
    case 'BINARY_UNCHANGED': return 'Binario sin reconfiguración';
    case 'BINARY_RECONFIGURED': return 'Binario ligado reconfigurado';
    case 'DISRUPTED_PAIR': return 'Par binario disuelto';
    case 'TRIPLE_UNCHANGED': return 'Triple jerárquico sin reconfiguración';
    case 'TRIPLE_RECONFIGURED': return 'Triple jerárquico ligado reconfigurado';
    case 'BOUND_INNER_BINARY_ESCAPED_TERTIARY': return 'Binario interior ligado · terciaria no ligada';
    case 'DISRUPTED_HIERARCHY': return 'Jerarquía triple disuelta';
  }
}

function circumbinaryRadiativeReferenceRegimeLabel(
  regime: CircumbinaryRadiativeReferenceRegime,
): string {
  switch (regime) {
    case CircumbinaryRadiativeReferenceRegime.APPLICABLE_COMPACT_SOURCE:
      return 'Aproximación radiativa A+B aplicable';
    case CircumbinaryRadiativeReferenceRegime.INNER_PAIR_NOT_COMPACT:
      return 'Separación A+B demasiado grande para aproximación puntual';
    case CircumbinaryRadiativeReferenceRegime.TERTIARY_IRRADIATION_SIGNIFICANT:
      return 'Irradiación de la tercera estrella significativa';
  }
}

/**
 * Stage 9: system fiche from the EXACT physical aggregate used by the scene
 * and planet/moon fiches. The old V1 multi-star fiche is a disclosure/identity
 * input only, NEVER a source for B/C masses, colors, orbital elements or P
 * counts. This is opt-in; production routes remain V1 until the coordinated
 * generation-version and persistence cutover exists.
 */
export class SystemMultihostStellarCardAssembler {
  private constructor() {}

  static build(legacy: ArchiveStellarSystemCardModel, formation: GeneratedMultipleHost): ArchiveStellarSystemCardModel {
    if (legacy.render.multiplicity !== formation.multiplicity ||
        legacy.render.components.length !== formation.components.length ||
        (legacy.knowledgeLevel !== ArchiveStellarSystemKnowledgeLevel.CATALOGUED &&
         legacy.knowledgeLevel !== ArchiveStellarSystemKnowledgeLevel.CONFIRMED)) {
      throw new RangeError('The multihost system card needs a catalogued matching stellar identity.');
    }
    const confirmed = legacy.knowledgeLevel === ArchiveStellarSystemKnowledgeLevel.CONFIRMED;

    // 29.1E-c.1: remnant masses in the component fiche are projected through
    // the canonical 29.1C event + 29.1D consequence path. No second mass model.
    const groundTruthComponents = Object.freeze(
      formation.components.map(host => Object.freeze({
        componentLabel: stellarComponentLabel(host.label),
        designation: systemMultihostPublicStellarComponentDesignation(legacy.title, host.label),
        physicalProperties: host.physical,
        lifetimeProfile: host.lifetime,
      })),
    );
    const events = StellarSupernovaCanonicalEventResolver.resolveGroundTruthSystem(
      Object.freeze({
        generationKey: multihostPhysicalSourceKey(formation.parentGenerationKey),
        innerPeriastronAu: formation.innerOrbit.periastronAu,
        outerPeriastronAu: formation.outerOrbit?.periastronAu ?? null,
      }),
      groundTruthComponents,
    );
    const consequenceByComponent = new Map<number, SupernovaStellarConsequence>(
      StellarSupernovaConsequenceResolver.resolveEvents(events)
        .map(current => [current.componentLabel.code, current] as const),
    );

    const postSupernovaDynamics = new StellarPostSupernovaPlanetaryDynamics(formation);
    const hierarchy = postSupernovaDynamics.hierarchy;
    const planetaryDynamics = formation.publicPlanets.map(planet => postSupernovaDynamics.resolvePlanet(planet));
    const components = Object.freeze(formation.components.map(host => componentCard(
      host,
      legacy.title,
      consequenceByComponent.get(stellarComponentLabel(host.label).code) ?? null,
    )));
    const orbits = Object.freeze([
      orbitCard(formation.innerOrbit, false, hierarchy.innerOrbit),
      ...(formation.outerOrbit === null ? [] : [orbitCard(formation.outerOrbit, true, hierarchy.outerOrbit)]),
    ]);
    const p = formation.circumbinary;
    const habitability = p.habitability;
    const effectivePTypeHabitableZone = habitability === null ? null :
      systemSceneClipMultihostPTypeHabitableZone(
        habitability,
        p.stableInnerAu,
        p.stableOuterAu,
      );
    const pFacts = Object.freeze([
      fact('Planetas circumbinarios reales (AB)', String(p.planets.length)),
      fact('Estado de generación P', p.status),
      ...(p.stableInnerAu === null ? [] : [fact('Límite interior de estabilidad P', `${format(p.stableInnerAu)} UA`)]),
      ...(p.stableOuterAu === null ? [] : [fact('Límite exterior de generación P', `${format(p.stableOuterAu)} UA`)]),
    ]);
    const zoneIsUsable = confirmed && habitability !== null && effectivePTypeHabitableZone !== null &&
      effectivePTypeHabitableZone.dynamicalOverlapFraction01 > 0 &&
      habitability.radiativeReferenceRegime === CircumbinaryRadiativeReferenceRegime.APPLICABLE_COMPACT_SOURCE &&
      habitability.stellarEvolutionRegime === CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR;
    const facts = Object.freeze([
      fact('Multiplicidad', formation.multiplicity.name === 'BINARY' ? 'Binario' : 'Triple jerárquico'),
      fact('Componentes', String(formation.components.length)),
      fact('Planetas generados', String(formation.publicPlanets.length)),
      ...formation.components.map(host => fact(`Planetas de ${host.label}`, String(host.planets.length))),
      fact('Planetas de AB', String(p.planets.length)),
      ...(hierarchy.hasPostSupernovaEvolution ? [
        fact('Arquitectura actual post-supernova', postSupernovaArchitectureLabel(hierarchy.currentArchitecture)),
        fact('Planetas ligados reconfigurados', String(planetaryDynamics.filter(current => current.disposition === 'BOUND_RECONFIGURED').length)),
        fact('Planetas expulsados', String(planetaryDynamics.filter(current => current.disposition === 'EJECTED').length)),
        fact('Planetas con host disuelto', String(planetaryDynamics.filter(current => current.disposition === 'HOST_DISRUPTED').length)),
      ] : []),
    ]);
    const card: ArchiveStellarSystemCardModel = Object.freeze({
      knowledgeLevel: legacy.knowledgeLevel,
      knowledgeLevelLabel: legacy.knowledgeLevelLabel,
      title: legacy.title,
      summary: `Sistema ${formation.multiplicity.name === 'BINARY' ? 'binario' : 'triple jerárquico'} con ${formation.components.length} sistemas simples completos y ${p.planets.length} planeta(s) circumbinario(s) generado(s). Las regiones de estabilidad son aproximadas.`,
      nextScientificStep: confirmed
        ? 'Composición física identificada; los límites dinámicos no equivalen a estabilidad N-cuerpos demostrada.'
        : 'Confirmar para mostrar las conclusiones de habitabilidad de referencia.',
      multiplicityLabel: formation.multiplicity.name === 'BINARY' ? 'Binario' : 'Triple',
      componentCount: formation.components.length,
      systemFacts: facts,
      components,
      orbits,
      circumbinaryFacts: pFacts,
      habitabilityFacts: confirmed && habitability !== null ? Object.freeze([
        fact('Fracción estable de la zona radiativa de referencia', format(effectivePTypeHabitableZone?.dynamicalOverlapFraction01 ?? 0)),
        fact('Validez radiativa', circumbinaryRadiativeReferenceRegimeLabel(habitability.radiativeReferenceRegime)),
        fact('Evolución estelar', habitability.stellarEvolutionRegime),
      ]) : Object.freeze([]),
      render: Object.freeze({
        accessibleLabel: `Sistema ${legacy.title} con ${formation.components.length} componentes generados y ${formation.publicPlanets.length} planetas.`,
        knowledgeLevel: legacy.knowledgeLevel,
        multiplicity: formation.multiplicity,
        components: Object.freeze(formation.components.map(host => Object.freeze({
          label: host.label,
          colorHex: host.spectral.color.hex,
          radiusScale: stellarVisualRadiusScale(host.physical.radiusSolar),
          massSolar: host.physical.initialMassSolar,
        }))),
        innerOrbitEccentricity: formation.innerOrbit.eccentricity,
        outerOrbitEccentricity: formation.outerOrbit?.eccentricity ?? null,
        stableHabitableZoneFraction: confirmed && habitability !== null
          ? effectivePTypeHabitableZone?.dynamicalOverlapFraction01 ?? 0
          : null,
        hasStableHabitableZone: zoneIsUsable,
      }),
    });
    return card;
  }
}
