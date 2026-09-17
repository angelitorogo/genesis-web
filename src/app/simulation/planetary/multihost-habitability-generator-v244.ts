import { type MultihostPlanetaryCatalog } from '../../domain/planetary/multihost-planetary-catalog';
import { type MultihostFormedPlanetarySystemV22 } from '../../domain/planetary/multihost-formed-planetary-system';
import { type MultihostScientificPlanetCatalogV241 } from '../../domain/planetary/multihost-scientific-planet-v241';
import {
  type MultihostHabitabilityCatalogV244, type MultihostHabitableHostV244,
  type MultihostHabitablePlanetV244,
} from '../../domain/planetary/multihost-habitability-v244';
import { PlanetaryOrbitHabitableZoneRelation as Relation } from '../../domain/planetary/planetary-orbit-habitable-zone-relation';
import { PlanetarySystemHabitableZoneDynamicalRegime as Dynamics } from '../../domain/planetary/planetary-system-habitable-zone-dynamical-regime';
import { PlanetarySystemHabitableZoneEvolutionRegime as Evolution } from '../../domain/planetary/planetary-system-habitable-zone-evolution-regime';
import { type StellarEvolutionStateName } from '../../domain/stellar/stellar-evolution-state';
import { planetaryEquilibriumTemperatureKelvin } from '../../domain/planetary/planet-climate-state';
import { classifyIntervalV1 } from './planetary-system-habitable-zone-classification-generator';
import { generateMultihostCircumstellarHabitableZonesV23 } from './multihost-circumstellar-habitable-zone-generator';
import {
  PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR as INNER_FLUX,
  PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR as OUTER_FLUX,
} from './planetary-system-habitable-zone-generator';

export interface BinaryHabitabilityContextV244 {
  /** Physical A–B relative orbit from the original frozen stellar hierarchy. */
  readonly binarySemiMajorAxisAu: number;
  readonly binaryEccentricity: number;
  /** Original evolutionary states, never inferred from luminosity or color. */
  readonly stellarEvolution: Readonly<Record<'A' | 'B', StellarEvolutionStateName>>;
}

/** Reuses exactly phase-18.6's radiative formula and phase-18.7's full q..Q
 * relation per star A/B. The companion is assessed separately by rigorous
 * triangle-inequality bounds, with no invented instantaneous phase or flux. */
export function generateMultihostHabitabilityV244(
  catalog: MultihostPlanetaryCatalog,
  formed: MultihostFormedPlanetarySystemV22,
  scientific: MultihostScientificPlanetCatalogV241,
  luminosities: Readonly<Partial<Record<'A' | 'B', number | null>>>,
  context: BinaryHabitabilityContextV244 | null = null,
): MultihostHabitabilityCatalogV244 {
  if (formed.sourceSystemSeed !== catalog.sourceSystemSeed.toUpperCase() ||
    scientific.sourceSystemSeed !== formed.sourceSystemSeed) {
    throw new RangeError('V2.4.4 host/formed/scientific seed mismatch.');
  }
  if (context !== null && (!(Number.isFinite(context.binarySemiMajorAxisAu) && context.binarySemiMajorAxisAu > 0) ||
    !(Number.isFinite(context.binaryEccentricity) && context.binaryEccentricity >= 0 && context.binaryEccentricity < 1))) {
    throw new RangeError('V2.4.4 requires valid frozen A–B orbit elements.');
  }
  const zones = generateMultihostCircumstellarHabitableZonesV23(catalog.windows, luminosities);
  const hosts: MultihostHabitableHostV244[] = zones.map(zone => {
    const hasOverlap = zone.dynamicallyHabitableInnerEdgeAu !== null;
    const dynamics = !hasOverlap ? Dynamics.NO_DYNAMICAL_OVERLAP :
      Math.abs(zone.dynamicalOverlapFraction01 - 1) <= 1e-12
        ? Dynamics.FULL_DYNAMICAL_OVERLAP : Dynamics.PARTIAL_DYNAMICAL_OVERLAP;
    const evolution = context?.stellarEvolution[zone.hostId] === 'MAIN_SEQUENCE'
      ? Evolution.MAIN_SEQUENCE_HOST : Evolution.REFERENCE_ONLY;
    return Object.freeze({
      hostId: zone.hostId, source: 'V1_18_6_FLUX_V2_1_S_WINDOW' as const,
      referenceLuminositySolar: zone.referenceLuminositySolar,
      radiativeInnerEdgeAu: zone.radiativeInnerEdgeAu,
      radiativeOuterEdgeAu: zone.radiativeOuterEdgeAu,
      dynamicallyHabitableInnerEdgeAu: zone.dynamicallyHabitableInnerEdgeAu,
      dynamicallyHabitableOuterEdgeAu: zone.dynamicallyHabitableOuterEdgeAu,
      dynamicalOverlapFraction01: zone.dynamicalOverlapFraction01,
      dynamicalRegime: dynamics, stellarEvolutionRegime: evolution,
      persistentReferenceCandidate: hasOverlap && evolution === Evolution.MAIN_SEQUENCE_HOST,
      companionIrradianceAssessment: context === null ? 'INSUFFICIENT_ORBIT_DATA' as const :
        'BOUNDED_PER_PLANET' as const,
    });
  });
  const scientificById = new Map(scientific.planets.map(planet => [planet.id, planet]));
  const expected = formed.disks.filter(disk => disk.family === 'S_TYPE' &&
    (disk.hostId === 'A' || disk.hostId === 'B')).flatMap(disk => disk.planets);
  if (scientificById.size !== expected.length || scientific.planets.length !== expected.length) {
    throw new RangeError('V2.4.4 requires exactly one scientific planet per A/B formed planet.');
  }
  const planets: MultihostHabitablePlanetV244[] = expected.filter(planet =>
    hosts.some(host => host.hostId === planet.hostId)).map(formedPlanet => {
    const planet = scientificById.get(formedPlanet.id);
    if (planet === undefined || planet.hostId !== formedPlanet.hostId ||
      planet.formationSeedHex !== formedPlanet.formationSeedHex ||
      planet.physics.periapsisAu !== formedPlanet.periapsisAu ||
      planet.physics.apoapsisAu !== formedPlanet.apoapsisAu) {
      throw new RangeError(`V2.4.4 planetary identity/orbit mismatch: ${formedPlanet.id}.`);
    }
    const host = hosts.find(item => item.hostId === formedPlanet.hostId);
    if (host === undefined) throw new RangeError(`V2.4.4 missing reference luminosity for ${formedPlanet.hostId}.`);
    const q = formedPlanet.periapsisAu;
    const Q = formedPlanet.apoapsisAu;
    const radiativeRelation = classifyIntervalV1(q, Q,
      host.radiativeInnerEdgeAu, host.radiativeOuterEdgeAu);
    const dynamicallyAvailableRelation = host.dynamicallyHabitableInnerEdgeAu === null ? null :
      classifyIntervalV1(q, Q, host.dynamicallyHabitableInnerEdgeAu,
        host.dynamicallyHabitableOuterEdgeAu!);
    const hostOnlyMinimumSolar = host.referenceLuminositySolar / Q ** 2;
    const hostOnlyMaximumSolar = host.referenceLuminositySolar / q ** 2;
    const companionId = formedPlanet.hostId === 'A' ? 'B' : 'A';
    const companionLuminosity = luminosities[companionId];
    const periBinary = context === null ? null : context.binarySemiMajorAxisAu * (1 - context.binaryEccentricity);
    const apoBinary = context === null ? null : context.binarySemiMajorAxisAu * (1 + context.binaryEccentricity);
    const companionMinimumSolar = apoBinary === null || companionLuminosity == null ||
      !(Number.isFinite(companionLuminosity) && companionLuminosity > 0) ? null :
        companionLuminosity / (apoBinary + Q) ** 2;
    const minimumSeparation = periBinary === null ? null : periBinary - Q;
    const companionMaximumSolar = minimumSeparation === null || minimumSeparation <= 0 ||
      companionLuminosity == null || !(Number.isFinite(companionLuminosity) && companionLuminosity > 0)
        ? null : companionLuminosity / minimumSeparation ** 2;
    const status = context === null || companionMinimumSolar === null ? 'UNKNOWN_BINARY_ORBIT' as const :
      companionMaximumSolar === null ? 'UNBOUNDED_CLOSE_APPROACH' as const : 'BOUNDED' as const;
    const totalMinimumSolar = companionMinimumSolar === null ? null : hostOnlyMinimumSolar + companionMinimumSolar;
    const totalMaximumSolar = companionMaximumSolar === null ? null : hostOnlyMaximumSolar + companionMaximumSolar;
    const albedo = planet.surface.referenceBondAlbedo01;
    const greenhouse = planet.environment.atmosphere.greenhouseAmplificationFactor;
    const minTemperature = totalMinimumSolar === null ? null :
      planetaryEquilibriumTemperatureKelvin(totalMinimumSolar, albedo);
    const maxTemperature = totalMaximumSolar === null ? null :
      planetaryEquilibriumTemperatureKelvin(totalMaximumSolar, albedo);
    const isSolid = planet.environment.atmosphere.regime !== 'DEEP_ENVELOPE';
    const environmentalReference = !isSolid ? 'NO_SURFACE' as const :
      planet.environment.water.regime === 'LIQUID_CANDIDATE' ? 'SOLID_LIQUID_WATER_CANDIDATE' as const :
      planet.environment.water.regime === 'UNKNOWN' ? 'UNKNOWN' as const : 'NO_LIQUID_REFERENCE' as const;
    const binaryFluxReferenceRegime = totalMinimumSolar === null || totalMaximumSolar === null
      ? 'NOT_ASSESSED' as const
      : totalMinimumSolar >= OUTER_FLUX && totalMaximumSolar <= INNER_FLUX
        ? 'WITHIN_V1_FLUX_BOUNDS' as const
        : totalMinimumSolar > INNER_FLUX || totalMaximumSolar < OUTER_FLUX
          ? 'OUTSIDE_V1_FLUX_BOUNDS' as const : 'CROSSES_V1_FLUX_BOUNDS' as const;
    return Object.freeze({
      planetId: planet.id, formationSeedHex: planet.formationSeedHex,
      hostId: host.hostId, designation: planet.designation,
      radiativeRelation, dynamicallyAvailableRelation,
      orbitalReferenceCandidate: host.persistentReferenceCandidate &&
        dynamicallyAvailableRelation === Relation.WHOLLY_WITHIN_ZONE,
      environmentalReference,
      irradiance: Object.freeze({
        source: 'V2_4_4_CONSERVATIVE_BINARY_GEOMETRY' as const,
        hostOnlyMinimumSolar, hostOnlyMaximumSolar,
        companionMinimumSolar, companionMaximumSolar, totalMinimumSolar, totalMaximumSolar,
        status, equilibriumTemperatureMinKelvin: minTemperature,
        equilibriumTemperatureMaxKelvin: maxTemperature,
        estimatedSurfaceTemperatureMinKelvin: isSolid && greenhouse !== null && minTemperature !== null
          ? minTemperature * greenhouse : null,
        estimatedSurfaceTemperatureMaxKelvin: isSolid && greenhouse !== null && maxTemperature !== null
          ? maxTemperature * greenhouse : null,
      }),
      binaryFluxReferenceRegime,
      limitation: 'V1 18.6/18.7: geometría HZ y excursión completa q..Q de anfitriona. Intervalos A+B son cotas geométricas independientes, no evolución temporal ni órbita N-body; ambiente/agua V2 estimados, no habitabilidad confirmada.',
    });
  });
  return Object.freeze({
    version: 'V2_4_4_S_TYPE_HABITABILITY' as const,
    sourceSystemSeed: formed.sourceSystemSeed,
    hosts: Object.freeze(hosts), planets: Object.freeze(planets),
    limitations: Object.freeze([
      'La misma fórmula V1 18.6 y el clasificador puro V1 18.7 se ejecutan para las estrellas A y B por separado; se utiliza la ventana estable S-type V2.1, sin crear planetas ni mutar órbitas.',
      'Las cotas de irradiación de la compañera provienen de geometría conservadora de la órbita estelar real, no de un modelo de insolación variable resuelto por fases; sin órbita conocida se devuelve INDETERMINADO.',
      'El clima y el agua V2.4.1 son aproximaciones de referencia; temperatura superficial de gigantes permanece null. HZ o agua candidata no demuestra habitabilidad ni vida; estabilidad secular N-body, evolución espectral y migración dinámica siguen pendientes.',
      'Solo laboratorio A/B: no modifica física V1, TRIPLE, identidades, persistencia, seeds, contadores ni órbitas del renderer.',
    ]),
  });
}
