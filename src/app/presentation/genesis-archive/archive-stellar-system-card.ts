import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  CircumbinaryPlanetCompatibilityRegime,
} from '../../domain/planetary/circumbinary-planet-compatibility';

import {
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

import {
  StellarComponentDesignation,
} from '../../domain/stellar/stellar-component-designation';

import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';

import {
  type StellarDesignation,
} from '../../domain/stellar/stellar-designation';

import {
  type StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  type StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  type StellarRelativeOrbit,
} from '../../domain/stellar/stellar-relative-orbit';

import {
  type StellarSpectralAppearance,
} from '../../domain/stellar/stellar-spectral-appearance';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  type StellarSystemMultiplicity,
  StellarSystemMultiplicity as StellarSystemMultiplicities,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from '../../simulation/sector/galaxy-sector-stellar-density-generator';

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../../simulation/sector/galaxy-sector-stellar-population-properties-generator';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  StellarDesignationGenerator,
} from '../../simulation/stellar/stellar-designation-generator';

import {
  StellarGenerator,
} from '../../simulation/stellar/stellar-generator';

import {
  StellarPopulationProfileGenerator,
} from '../../simulation/stellar/stellar-population-profile-generator';

import {
  StellarSystemGenerator,
} from '../../simulation/stellar/stellar-system-generator';

import {
  StellarSystemMultiplicitySelector,
} from '../../simulation/stellar/stellar-system-multiplicity-selector';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

export enum ArchiveStellarSystemKnowledgeLevel {
  DETECTED =
    'DETECTED',

  IDENTIFIED =
    'IDENTIFIED',

  CATALOGUED =
    'CATALOGUED',

  CONFIRMED =
    'CONFIRMED',
}

export interface ArchiveStellarSystemFactModel {
  readonly label:
    string;

  readonly value:
    string;
}

export interface ArchiveStellarSystemComponentCardModel {
  readonly componentLabel:
    'A' | 'B' | 'C';

  readonly designation:
    string;

  readonly proceduralCode:
    string | null;

  readonly spectralType:
    string | null;

  readonly evolutionStateLabel:
    string | null;

  readonly colorHex:
    string;

  readonly facts:
    readonly ArchiveStellarSystemFactModel[];
}

export interface ArchiveStellarSystemOrbitCardModel {
  readonly label:
    string;

  readonly roleLabel:
    string;

  readonly facts:
    readonly ArchiveStellarSystemFactModel[];
}

export interface ArchiveStellarSystemRenderComponentDescriptor {
  readonly label:
    'A' | 'B' | 'C';

  readonly colorHex:
    string;

  readonly radiusScale:
    number;

  readonly massSolar:
    number | null;
}

export interface ArchiveStellarSystemRenderDescriptor {
  readonly accessibleLabel:
    string;

  readonly knowledgeLevel:
    ArchiveStellarSystemKnowledgeLevel;

  readonly multiplicity:
    StellarSystemMultiplicity | null;

  readonly components:
    readonly ArchiveStellarSystemRenderComponentDescriptor[];

  readonly innerOrbitEccentricity:
    number | null;

  readonly outerOrbitEccentricity:
    number | null;

  readonly stableHabitableZoneFraction:
    number | null;

  readonly hasStableHabitableZone:
    boolean;
}

export interface ArchiveStellarSystemCardModel {
  readonly knowledgeLevel:
    ArchiveStellarSystemKnowledgeLevel;

  readonly knowledgeLevelLabel:
    string;

  readonly title:
    string;

  readonly summary:
    string;

  readonly nextScientificStep:
    string;

  readonly multiplicityLabel:
    string | null;

  readonly componentCount:
    number | null;

  readonly systemFacts:
    readonly ArchiveStellarSystemFactModel[];

  readonly components:
    readonly ArchiveStellarSystemComponentCardModel[];

  readonly orbits:
    readonly ArchiveStellarSystemOrbitCardModel[];

  readonly circumbinaryFacts:
    readonly ArchiveStellarSystemFactModel[];

  readonly habitabilityFacts:
    readonly ArchiveStellarSystemFactModel[];

  readonly render:
    ArchiveStellarSystemRenderDescriptor;
}

const NEUTRAL_STELLAR_COLOR =
  '#9DB9C8';

const UNRESOLVED_STELLAR_COLOR =
  '#68808D';

/**
 * Point 16.7 presentation-only system card assembler.
 *
 * The assembler never persists regenerated Ground Truth. DETECTED does not
 * resolve SystemSeed, multiplicity or stellar physics at all. IDENTIFIED only
 * resolves the already-frozen point-15.6 designation plus point-16.3
 * multiplicity. Physical/orbital values are materialized only from CATALOGUED,
 * while point-16.6 habitability is shown only after CONFIRMED.
 */
export class ArchiveStellarSystemCardAssembler {

  private constructor() {}

  static build(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    discoveryState:
      DiscoveryStateValue,
  ): ArchiveStellarSystemCardModel {

    const state =
      DiscoveryState.fromCode(
        discoveryState.code,
      );

    if (
      state.code <
      DiscoveryState.DISCOVERED.code
    ) {
      return detectedCard();
    }

    const systemSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        ) as SystemSeed;

    const designation =
      StellarDesignationGenerator
        .generate(
          generationKey,
          locator,
        );

    const multiplicity =
      StellarSystemMultiplicitySelector
        .select(
          generationKey,
          systemSeed,
        );

    if (
      state.code <
      DiscoveryState.CATALOGUED.code
    ) {
      return identifiedCard(
        designation,
        multiplicity,
      );
    }

    const materialized =
      materializeSystem(
        generationKey,
        locator,
      );

    return physicalCard(
      materialized,
      state.code >=
        DiscoveryState.CONFIRMED.code,
    );
  }
}

interface MaterializedArchiveStellarSystem {
  readonly system:
    StellarSystem;

  readonly primaryPhysicalProperties:
    StellarPhysicalProperties;

  readonly primarySpectralAppearance:
    StellarSpectralAppearance;

  readonly primaryLifetimeProfile:
    StellarLifetimeProfile;
}

function materializeSystem(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,
): MaterializedArchiveStellarSystem {

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      locator.galaxyIndex,
    );

  const grid =
    GalaxySectorGridGenerator
      .generate(
        galaxy,
      );

  const coordinates =
    GalaxySectorKeyCodec
      .decode(
        locator.sectorKey,
      );

  const stellarDensity =
    GalaxySectorStellarDensityGenerator
      .generate(
        galaxy,
        grid,
        coordinates,
      );

  const sectorStellarPopulation =
    GalaxySectorStellarPopulationPropertiesGenerator
      .generate(
        galaxy,
        stellarDensity,
      );

  const stellarPopulationProfile =
    StellarPopulationProfileGenerator
      .generate(
        generationKey,
        galaxy.physicalProperties,
        sectorStellarPopulation,
      );

  const system =
    StellarSystemGenerator
      .generate(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

  const primaryPhysicalProperties =
    StellarGenerator
      .generatePhysicalProperties(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

  const primarySpectralAppearance =
    StellarGenerator
      .generateSpectralAppearance(
        generationKey,
        primaryPhysicalProperties,
        sectorStellarPopulation,
      );

  const primaryLifetimeProfile =
    StellarGenerator
      .generateLifetimeProfile(
        generationKey,
        locator,
        primaryPhysicalProperties,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

  return {
    system,
    primaryPhysicalProperties,
    primarySpectralAppearance,
    primaryLifetimeProfile,
  };
}

function detectedCard():
  ArchiveStellarSystemCardModel {

  return Object.freeze({
    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel.DETECTED,

    knowledgeLevelLabel:
      'Señal estelar detectada',

    title:
      'Sistema estelar sin resolver',

    summary:
      'Existe una fuente estelar persistente en estas coordenadas, pero el estado Detectado no revela todavía su multiplicidad, designación ni arquitectura física.',

    nextScientificStep:
      'Descubrir el sistema para resolver su identidad y multiplicidad.',

    multiplicityLabel:
      null,

    componentCount:
      null,

    systemFacts:
      Object.freeze([]),

    components:
      Object.freeze([]),

    orbits:
      Object.freeze([]),

    circumbinaryFacts:
      Object.freeze([]),

    habitabilityFacts:
      Object.freeze([]),

    render:
      Object.freeze({
        accessibleLabel:
          'Representación procedural de una señal de sistema estelar todavía no resuelta',
        knowledgeLevel:
          ArchiveStellarSystemKnowledgeLevel.DETECTED,
        multiplicity:
          null,
        components:
          Object.freeze([
            Object.freeze({
              label:
                'A' as const,
              colorHex:
                UNRESOLVED_STELLAR_COLOR,
              radiusScale:
                1,
              massSolar:
                null,
            }),
          ]),
        innerOrbitEccentricity:
          null,
        outerOrbitEccentricity:
          null,
        stableHabitableZoneFraction:
          null,
        hasStableHabitableZone:
          false,
      }),
  });
}

function identifiedCard(
  designation:
    StellarDesignation,

  multiplicity:
    StellarSystemMultiplicity,
): ArchiveStellarSystemCardModel {

  const componentLabels =
    labelsForMultiplicity(
      multiplicity,
    );

  const components =
    componentLabels.map(
      label => {
        const componentDesignation =
          new StellarComponentDesignation(
            designation,
            label,
          );

        return Object.freeze({
          componentLabel:
            label.name,
          designation:
            componentDesignation.name,
          proceduralCode:
            null,
          spectralType:
            null,
          evolutionStateLabel:
            null,
          colorHex:
            NEUTRAL_STELLAR_COLOR,
          facts:
            Object.freeze([]),
        });
      },
    );

  return Object.freeze({
    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,

    knowledgeLevelLabel:
      'Arquitectura identificada',

    title:
      designation.name,

    summary:
      `El sistema está identificado como ${multiplicityLabel(multiplicity).toLowerCase()} de ${multiplicity.stellarComponentCount} componente${multiplicity.stellarComponentCount === 1 ? '' : 's'} estelar${multiplicity.stellarComponentCount === 1 ? '' : 'es'}. Las magnitudes físicas y orbitales permanecen restringidas hasta Catalogado.`,

    nextScientificStep:
      'Catalogar el sistema para resolver propiedades estelares y geometría orbital.',

    multiplicityLabel:
      multiplicityLabel(
        multiplicity,
      ),

    componentCount:
      multiplicity
        .stellarComponentCount,

    systemFacts:
      Object.freeze([
        fact(
          'Designación procedural',
          designation.proceduralCode,
        ),
        fact(
          'Multiplicidad',
          multiplicityLabel(
            multiplicity,
          ),
        ),
      ]),

    components:
      Object.freeze(
        components,
      ),

    orbits:
      Object.freeze([]),

    circumbinaryFacts:
      Object.freeze([]),

    habitabilityFacts:
      Object.freeze([]),

    render:
      Object.freeze({
        accessibleLabel:
          `Esquema procedural identificado del sistema ${designation.name}, ${multiplicityLabel(multiplicity).toLowerCase()}`,
        knowledgeLevel:
          ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
        multiplicity,
        components:
          Object.freeze(
            componentLabels.map(
              label =>
                Object.freeze({
                  label:
                    label.name,
                  colorHex:
                    NEUTRAL_STELLAR_COLOR,
                  radiusScale:
                    1,
                  massSolar:
                    null,
                }),
            ),
          ),
        innerOrbitEccentricity:
          null,
        outerOrbitEccentricity:
          null,
        stableHabitableZoneFraction:
          null,
        hasStableHabitableZone:
          false,
      }),
  });
}

function physicalCard(
  materialized:
    MaterializedArchiveStellarSystem,

  confirmed:
    boolean,
): ArchiveStellarSystemCardModel {

  const {
    system,
    primaryPhysicalProperties,
    primarySpectralAppearance,
    primaryLifetimeProfile,
  } =
    materialized;

  const components:
    ArchiveStellarSystemComponentCardModel[] =
    [
      primaryComponentCard(
        system,
        primaryPhysicalProperties,
        primarySpectralAppearance,
        primaryLifetimeProfile,
      ),
    ];

  if (
    system.secondaryCompanion !==
      null
  ) {
    components.push(
      companionCard(
        system.secondaryCompanion,
      ),
    );
  }

  if (
    system.tertiaryCompanion !==
      null
  ) {
    components.push(
      companionCard(
        system.tertiaryCompanion,
      ),
    );
  }

  const orbits:
    ArchiveStellarSystemOrbitCardModel[] =
    [];

  if (
    system.orbitHierarchy.innerOrbit !==
      null
  ) {
    orbits.push(
      orbitCard(
        'Órbita interior A–B',
        'Órbita relativa del par interior',
        system.orbitHierarchy.innerOrbit,
      ),
    );
  }

  if (
    system.orbitHierarchy.outerOrbit !==
      null
  ) {
    orbits.push(
      orbitCard(
        'Órbita exterior (A+B)–C',
        'C alrededor del baricentro del par interior',
        system.orbitHierarchy.outerOrbit,
      ),
    );
  }

  const compatibilityFacts =
    circumbinaryFacts(
      system,
    );

  const habitabilityFacts =
    confirmed
      ? confirmedHabitabilityFacts(
          system,
        )
      : Object.freeze([]);

  const knowledgeLevel =
    confirmed
      ? ArchiveStellarSystemKnowledgeLevel.CONFIRMED
      : ArchiveStellarSystemKnowledgeLevel.CATALOGUED;

  const stableHabitableZoneFraction =
    confirmed
      ? system
          .circumbinaryHabitabilityAssessment
          ?.stableHabitableZoneFraction ??
        null
      : null;

  return Object.freeze({
    knowledgeLevel,

    knowledgeLevelLabel:
      confirmed
        ? 'Arquitectura confirmada'
        : 'Caracterización catalogada',

    title:
      system.designation.name,

    summary:
      physicalSummary(
        system,
        confirmed,
      ),

    nextScientificStep:
      confirmed
        ? 'Sistema múltiple V1 confirmado; listo para representación y uso por la futura generación planetaria.'
        : 'Confirmar el sistema para resolver el cruce final entre estabilidad circumbinaria y zona habitable.',

    multiplicityLabel:
      multiplicityLabel(
        system.multiplicity,
      ),

    componentCount:
      system.stellarComponentCount,

    systemFacts:
      Object.freeze([
        fact(
          'Designación procedural',
          system.designation.proceduralCode,
        ),
        fact(
          'Multiplicidad',
          multiplicityLabel(
            system.multiplicity,
          ),
        ),
        fact(
          'Componentes',
          String(
            system.stellarComponentCount,
          ),
        ),
        fact(
          'SystemSeed',
          system.seed.normalizedValue,
        ),
      ]),

    components:
      Object.freeze(
        components,
      ),

    orbits:
      Object.freeze(
        orbits,
      ),

    circumbinaryFacts:
      compatibilityFacts,

    habitabilityFacts,

    render:
      Object.freeze({
        accessibleLabel:
          `Representación procedural orbital del sistema ${system.designation.name}, ${multiplicityLabel(system.multiplicity).toLowerCase()}`,
        knowledgeLevel,
        multiplicity:
          system.multiplicity,
        components:
          Object.freeze(
            components.map(
              component => {
                const physical =
                  component.componentLabel ===
                    'A'
                    ? primaryPhysicalProperties
                    : component.componentLabel ===
                        'B'
                      ? system.secondaryCompanion!
                          .physicalProperties
                      : system.tertiaryCompanion!
                          .physicalProperties;

                return Object.freeze({
                  label:
                    component.componentLabel,
                  colorHex:
                    component.colorHex,
                  radiusScale:
                    renderRadiusScale(
                      physical.radiusSolar,
                    ),
                  massSolar:
                    physical.initialMassSolar,
                });
              },
            ),
          ),
        innerOrbitEccentricity:
          system
            .orbitHierarchy
            .innerOrbit
            ?.eccentricity ??
          null,
        outerOrbitEccentricity:
          system
            .orbitHierarchy
            .outerOrbit
            ?.eccentricity ??
          null,
        stableHabitableZoneFraction,
        hasStableHabitableZone:
          confirmed &&
          system.hasStableCircumbinaryHabitableZone,
      }),
  });
}

function primaryComponentCard(
  system:
    StellarSystem,

  physical:
    StellarPhysicalProperties,

  spectral:
    StellarSpectralAppearance,

  lifetime:
    StellarLifetimeProfile,
): ArchiveStellarSystemComponentCardModel {

  const designation =
    system.primaryComponentDesignation;

  return Object.freeze({
    componentLabel:
      'A',
    designation:
      designation.name,
    proceduralCode:
      designation.proceduralCode,
    spectralType:
      spectral.spectralType.designation,
    evolutionStateLabel:
      evolutionStateLabel(
        system.primaryStar.evolutionState,
      ),
    colorHex:
      spectral.color.hex,
    facts:
      stellarPhysicalFacts(
        physical,
        lifetime,
      ),
  });
}

function companionCard(
  companion:
    StellarCompanion,
): ArchiveStellarSystemComponentCardModel {

  return Object.freeze({
    componentLabel:
      companion.componentLabel.name,
    designation:
      companion.designation.name,
    proceduralCode:
      companion.designation.proceduralCode,
    spectralType:
      companion
        .spectralAppearance
        .spectralType
        .designation,
    evolutionStateLabel:
      evolutionStateLabel(
        companion.currentEvolutionState,
      ),
    colorHex:
      companion
        .spectralAppearance
        .color
        .hex,
    facts:
      stellarPhysicalFacts(
        companion.physicalProperties,
        companion.lifetimeProfile,
      ),
  });
}

function stellarPhysicalFacts(
  physical:
    StellarPhysicalProperties,

  lifetime:
    StellarLifetimeProfile,
): readonly ArchiveStellarSystemFactModel[] {

  return Object.freeze([
    fact(
      'Masa de referencia',
      `${formatNumber(physical.initialMassSolar)} M☉`,
    ),
    fact(
      'Radio de referencia',
      `${formatNumber(physical.radiusSolar)} R☉`,
    ),
    fact(
      'Luminosidad de referencia',
      `${formatNumber(physical.luminositySolar)} L☉`,
    ),
    fact(
      'Temperatura efectiva',
      `${Math.round(physical.effectiveTemperatureKelvin)} K`,
    ),
    fact(
      'Edad',
      `${formatNumber(lifetime.ageBillionYears)} Ga`,
    ),
  ]);
}

function orbitCard(
  label:
    string,

  roleLabel:
    string,

  orbit:
    StellarRelativeOrbit,
): ArchiveStellarSystemOrbitCardModel {

  return Object.freeze({
    label,
    roleLabel,
    facts:
      Object.freeze([
        fact(
          'Semieje mayor',
          `${formatNumber(orbit.semiMajorAxisAu)} AU`,
        ),
        fact(
          'Excentricidad',
          formatNumber(
            orbit.eccentricity,
          ),
        ),
        fact(
          'Periastro',
          `${formatNumber(orbit.periastronAu)} AU`,
        ),
        fact(
          'Apoastro',
          `${formatNumber(orbit.apoastronAu)} AU`,
        ),
        fact(
          'Periodo',
          `${formatNumber(orbit.periodYears)} años`,
        ),
      ]),
  });
}

function circumbinaryFacts(
  system:
    StellarSystem,
): readonly ArchiveStellarSystemFactModel[] {

  const compatibility =
    system.circumbinaryPlanetCompatibility;

  if (
    compatibility ===
    null
  ) {
    return Object.freeze([]);
  }

  const stableInterval =
    compatibility.maximumStableSemiMajorAxisAu ===
      null
      ? `≥ ${formatNumber(compatibility.minimumStableSemiMajorAxisAu)} AU`
      : `${formatNumber(compatibility.minimumStableSemiMajorAxisAu)} – ${formatNumber(compatibility.maximumStableSemiMajorAxisAu)} AU`;

  return Object.freeze([
    fact(
      'Compatibilidad planetaria',
      compatibility.isCompatible
        ? 'Compatible con órbitas P-type'
        : 'Excluida dinámicamente',
    ),
    fact(
      'Régimen',
      compatibilityRegimeLabel(
        compatibility.regime,
      ),
    ),
    fact(
      'Intervalo orbital estable',
      stableInterval,
    ),
  ]);
}

function confirmedHabitabilityFacts(
  system:
    StellarSystem,
): readonly ArchiveStellarSystemFactModel[] {

  const assessment =
    system.circumbinaryHabitabilityAssessment;

  if (
    assessment ===
    null
  ) {
    return Object.freeze([]);
  }

  const stableInterval =
    assessment.stableHabitableInnerEdgeAu ===
      null ||
    assessment.stableHabitableOuterEdgeAu ===
      null
      ? 'Sin solapamiento estable'
      : `${formatNumber(assessment.stableHabitableInnerEdgeAu)} – ${formatNumber(assessment.stableHabitableOuterEdgeAu)} AU`;

  return Object.freeze([
    fact(
      'HZ radiativa A+B',
      `${formatNumber(assessment.radiativeHabitableInnerEdgeAu)} – ${formatNumber(assessment.radiativeHabitableOuterEdgeAu)} AU`,
    ),
    fact(
      'HZ dinámicamente estable',
      stableInterval,
    ),
    fact(
      'Solapamiento HZ',
      `${formatNumber(assessment.stableHabitableZoneFraction * 100)} %`,
    ),
    fact(
      'Estabilidad planetaria',
      planetaryStabilityRegimeLabel(
        assessment.planetaryStabilityRegime,
      ),
    ),
    fact(
      'Persistencia estelar',
      stellarEvolutionRegimeLabel(
        assessment.stellarEvolutionRegime,
      ),
    ),
    fact(
      'Candidato persistente',
      assessment.isPersistentHabitabilityCandidate
        ? 'Sí'
        : 'No',
    ),
  ]);
}

function physicalSummary(
  system:
    StellarSystem,

  confirmed:
    boolean,
): string {

  const base =
    `${system.designation.name} es un sistema ${multiplicityLabel(system.multiplicity).toLowerCase()} de ${system.stellarComponentCount} componente${system.stellarComponentCount === 1 ? '' : 's'}.`;

  if (
    system.multiplicity ===
    StellarSystemMultiplicities.SINGLE
  ) {
    return `${base} La arquitectura simple no contiene órbitas estelares relativas ni evaluación circumbinaria.`;
  }

  if (
    !confirmed
  ) {
    return `${base} La ficha catalogada resuelve componentes, propiedades de referencia, jerarquía orbital y compatibilidad dinámica con órbitas planetarias circumbinarias.`;
  }

  return `${base} La confirmación añade el cruce entre la ventana dinámica circumbinaria y la zona habitable radiativa A+B sin materializar planetas.`;
}

function labelsForMultiplicity(
  multiplicity:
    StellarSystemMultiplicity,
): readonly (
  typeof StellarSystemComponentLabel.A |
  typeof StellarSystemComponentLabel.B |
  typeof StellarSystemComponentLabel.C
)[] {

  if (
    multiplicity ===
    StellarSystemMultiplicities.SINGLE
  ) {
    return Object.freeze([
      StellarSystemComponentLabel.A,
    ]);
  }

  if (
    multiplicity ===
    StellarSystemMultiplicities.BINARY
  ) {
    return Object.freeze([
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
    ]);
  }

  return Object.freeze([
    StellarSystemComponentLabel.A,
    StellarSystemComponentLabel.B,
    StellarSystemComponentLabel.C,
  ]);
}

function multiplicityLabel(
  multiplicity:
    StellarSystemMultiplicity,
): string {

  if (
    multiplicity ===
    StellarSystemMultiplicities.SINGLE
  ) {
    return 'Simple';
  }

  if (
    multiplicity ===
    StellarSystemMultiplicities.BINARY
  ) {
    return 'Binario';
  }

  return 'Triple';
}

function evolutionStateLabel(
  state:
    StellarEvolutionState,
): string {

  switch (
    state.name
  ) {
    case 'BROWN_DWARF':
      return 'Enana marrón';

    case 'MAIN_SEQUENCE':
      return 'Secuencia principal';

    case 'GIANT':
      return 'Gigante';

    case 'SUPERGIANT':
      return 'Supergigante';

    case 'WHITE_DWARF':
      return 'Enana blanca';

    case 'NEUTRON_STAR':
      return 'Estrella de neutrones';

    case 'STELLAR_BLACK_HOLE':
      return 'Agujero negro estelar';
  }
}

function compatibilityRegimeLabel(
  regime:
    CircumbinaryPlanetCompatibilityRegime,
): string {

  if (
    regime ===
    CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER
  ) {
    return 'Abierto hacia el exterior';
  }

  if (
    regime ===
    CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED
  ) {
    return 'Limitado por componente C';
  }

  return 'Excluido por componente C';
}

function planetaryStabilityRegimeLabel(
  regime:
    CircumbinaryPlanetaryStabilityRegime,
): string {

  if (
    regime ===
    CircumbinaryPlanetaryStabilityRegime.FULL_STABLE_HABITABLE_ZONE
  ) {
    return 'HZ estable completa';
  }

  if (
    regime ===
    CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE
  ) {
    return 'HZ estable parcial';
  }

  return 'Sin HZ estable';
}

function stellarEvolutionRegimeLabel(
  regime:
    CircumbinaryStellarEvolutionRegime,
): string {

  return regime ===
    CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR
    ? 'Par A+B en secuencia principal'
    : 'Geometría de referencia únicamente';
}

function renderRadiusScale(
  radiusSolar:
    number,
): number {

  const logarithmic =
    1 +
    0.18 *
      Math.log10(
        Math.max(
          0.01,
          radiusSolar,
        ),
      );

  return Math.min(
    1.55,
    Math.max(
      0.72,
      logarithmic,
    ),
  );
}

function fact(
  label:
    string,

  value:
    string,
): ArchiveStellarSystemFactModel {

  return Object.freeze({
    label,
    value,
  });
}

function formatNumber(
  value:
    number,
): string {

  const absolute =
    Math.abs(
      value,
    );

  if (
    absolute !==
      0 &&
    (
      absolute <
        0.001 ||
      absolute >=
        100_000
    )
  ) {
    return value
      .toExponential(
        3,
      );
  }

  return Number(
    value.toPrecision(
      5,
    ),
  ).toString();
}
