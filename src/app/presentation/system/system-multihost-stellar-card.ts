import { ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemCardModel,
  type ArchiveStellarSystemComponentCardModel,
  type ArchiveStellarSystemFactModel,
  type ArchiveStellarSystemOrbitCardModel,
} from '../genesis-archive/archive-stellar-system-card';
import { stellarVisualRadiusScale } from '../genesis-archive/stellar-visual-radius-scale';
import { type GeneratedMultipleHost, type GeneratedSingleHost } from '../../simulation/stellar/stellar-multihost-formation';
import { type StellarRelativeOrbit } from '../../domain/stellar/stellar-relative-orbit';
import { CircumbinaryRadiativeReferenceRegime, CircumbinaryStellarEvolutionRegime } from '../../domain/habitability/circumbinary-habitability-assessment';

const format = (value: number): string => new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 4,
}).format(value);
const fact = (label: string, value: string): ArchiveStellarSystemFactModel => Object.freeze({label, value});

function componentCard(host: GeneratedSingleHost, parentTitle: string): ArchiveStellarSystemComponentCardModel {
  return Object.freeze({
    componentLabel: host.label,
    // A child key is an internal generation scope: never expose its own
    // stellar designation/procedural code as a second public system.
    designation: `${parentTitle} ${host.label}`,
    proceduralCode: null,
    spectralType: host.spectral.spectralType.designation,
    evolutionStateLabel: host.stellarSystem.primaryStar.evolutionState.name,
    colorHex: host.spectral.color.hex,
    facts: Object.freeze([
      fact('Masa de referencia', `${format(host.physical.initialMassSolar)} M☉`),
      fact('Radio de referencia', `${format(host.physical.radiusSolar)} R☉`),
      fact('Luminosidad de referencia', `${format(host.physical.luminositySolar)} L☉`),
      fact('Temperatura efectiva', `${Math.round(host.physical.effectiveTemperatureKelvin)} K`),
      fact('Edad estelar', `${format(host.lifetime.ageBillionYears)} miles de millones de años`),
      fact('Planetas circumestelares', String(host.planets.length)),
      fact('Lunas relevantes', String(host.moonSystems.reduce((sum, system) => sum + system.relevantMoonCount, 0))),
    ]),
  });
}

function orbitCard(orbit: StellarRelativeOrbit, outer: boolean): ArchiveStellarSystemOrbitCardModel {
  return Object.freeze({
    label: outer ? 'Órbita exterior (A+B)–C' : 'Órbita interior A–B',
    roleLabel: outer ? 'Movimiento relativo de (A+B) y C' : 'Movimiento relativo de A y B',
    facts: Object.freeze([
      fact('Semieje mayor', `${format(orbit.semiMajorAxisAu)} UA`),
      fact('Excentricidad', format(orbit.eccentricity)),
      fact('Periastro', `${format(orbit.periastronAu)} UA`),
      fact('Apoastro', `${format(orbit.apoastronAu)} UA`),
      fact('Período', `${format(orbit.periodYears)} años`),
    ]),
  });
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
    const components = Object.freeze(formation.components.map(host => componentCard(host, legacy.title)));
    const orbits = Object.freeze([
      orbitCard(formation.innerOrbit, false),
      ...(formation.outerOrbit === null ? [] : [orbitCard(formation.outerOrbit, true)]),
    ]);
    const p = formation.circumbinary;
    const habitability = p.habitability;
    const pFacts = Object.freeze([
      fact('Planetas circumbinarios reales (AB)', String(p.planets.length)),
      fact('Estado de generación P', p.status),
      ...(p.stableInnerAu === null ? [] : [fact('Límite interior P calculado', `${format(p.stableInnerAu)} UA`)]),
      ...(p.stableOuterAu === null ? [] : [fact('Límite exterior P calculado', `${format(p.stableOuterAu)} UA`)]),
    ]);
    const zoneIsUsable = confirmed && habitability !== null &&
      habitability.stableHabitableZoneFraction > 0 &&
      habitability.radiativeReferenceRegime === CircumbinaryRadiativeReferenceRegime.APPLICABLE_COMPACT_SOURCE &&
      habitability.stellarEvolutionRegime === CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR;
    const facts = Object.freeze([
      fact('Multiplicidad', formation.multiplicity.name === 'BINARY' ? 'Binario' : 'Triple jerárquico'),
      fact('Componentes', String(formation.components.length)),
      fact('Planetas generados', String(formation.publicPlanets.length)),
      ...formation.components.map(host => fact(`Planetas de ${host.label}`, String(host.planets.length))),
      fact('Planetas de AB', String(p.planets.length)),
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
        fact('Fracción estable de la zona radiativa de referencia', format(habitability.stableHabitableZoneFraction)),
        fact('Validez radiativa', habitability.radiativeReferenceRegime),
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
        stableHabitableZoneFraction: confirmed ? habitability?.stableHabitableZoneFraction ?? null : null,
        hasStableHabitableZone: zoneIsUsable,
      }),
    });
    return card;
  }
}
