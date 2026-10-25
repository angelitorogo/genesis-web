/**
 * PRE-33.12 — read-only cross-layer integrity gate over the REAL contracts.
 * This is a verification boundary, NOT a generator, a migration, an observed
 * scientific fact or an activation of biology. It has no RNG, clock or I/O.
 */
import { validateEnvironmentalContractPRE3301 } from '../../domain/planetary/environmental-physical-contract-pre33-01';
import type { EnvironmentalPhysicalContractPRE3301 } from '../../domain/planetary/environmental-physical-contract-pre33-01';
import type { EnvironmentalContinuityReportPRE3309 } from '../../domain/planetary/environmental-continuity-pre33-09';
import type { LifeReadinessReportPRE3311c } from '../../simulation/planetary/galactic-life-readiness-pre33-11c';
import type { PlanetScientificSectionsModel } from '../planet-detail/planet-scientific-sections';
import type { MoonScientificSectionsModel } from '../moon-detail/moon-scientific-sections';

export const SCIENTIFIC_INTEGRATION_PRE3312 = 'PRE-33.12/V3-READONLY-INTEGRATION/v1' as const;
export type IntegrationFaultPRE3312 =
  | 'INVALID_PHYSICAL_CONTRACT' | 'PRIVATE_DATA_IN_PUBLIC_FICHE' |
    'INCOMPLETE_PLANET_FICHE' | 'INCOMPLETE_MOON_FICHE' |
    'MOON_IDENTITY_COVERAGE' | 'MOON_IDENTITY_DUPLICATION' |
    'UNAUTHORIZED_OBSERVATION' | 'UNSOURCED_HISTORICAL_CONTINUITY' |
    'FOREIGN_HISTORICAL_BODY' | 'BIOLOGICAL_EVIDENCE_LEAK' |
    'FOREIGN_BIOLOGICAL_READINESS' | 'MULTIHOST_PHYSICAL_ORIGIN_MISMATCH';
export interface ScientificIntegrationInputPRE3312 {
  readonly environmental: EnvironmentalPhysicalContractPRE3301;
  readonly access: 'SCIENTIFIC_FICHE_AVAILABLE' | 'SCIENTIFIC_FICHE_LOCKED';
  /** No private physical object is accepted or copied into the public fiche. */
  readonly planetFiche?: PlanetScientificSectionsModel;
  readonly moonFiche?: MoonScientificSectionsModel;
  readonly observedText?: string;
  readonly history?: EnvironmentalContinuityReportPRE3309;
  readonly lifeReadiness?: LifeReadinessReportPRE3311c;
  /** Ordinals in the frozen private producer vs public multihost wrapper. */
  readonly moonOrigin?: Readonly<{
    publicHostPlanetOrdinal: number;
    physicalHostPlanetOrdinal: number;
    oceanHostPlanetOrdinal: number | null;
    radiationHostPlanetOrdinal: number | null;
  }>;
  readonly moonInventory?: Readonly<{
    total: number;
    detailed: number;
    minorIdentityOnly: number;
  }>;
}
export interface ScientificIntegrationResultPRE3312 {
  readonly contract: typeof SCIENTIFIC_INTEGRATION_PRE3312;
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly passed: boolean;
  readonly issues: readonly IntegrationFaultPRE3312[];
  readonly permission: 'PRESENTATION_ONLY' | 'LOCKED';
  readonly historicalCompatibility: 'NOT_CERTIFIED_GLOBALLY';
  readonly life: 'NOT_EVALUATED';
  readonly newPersistentData: false;
  readonly discoveryGranted: false;
}
const PLANET_IDS = ['general', 'orbit', 'surface', 'atmosphere', 'climate', 'geology', 'moons', 'comparison'] as const;
const MOON_IDS = ['general', 'orbit', 'tides', 'environment', 'atmosphere', 'radiation', 'geochemistry', 'history', 'habitability', 'comparison'] as const;
const privateMarkers = [
  'PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY',
  'INTERNAL_SIMULATED_REALITY',
  'PRE-33.01/CT0/v1',
  'NO_AUTOMATIC_DISCOVERY',
  'NOT_SIMULATED',
];
const validOrdinal = (n: number): boolean => Number.isSafeInteger(n) && n > 0;
const unique = (ids: readonly string[]): boolean => ids.length === new Set(ids).size;

/** A diagnostic result; never a public scientific fiche and never a discovery grant. */
export function verifyScientificIntegrationPRE3312(
  input: ScientificIntegrationInputPRE3312,
): ScientificIntegrationResultPRE3312 {
  const issues = new Set<IntegrationFaultPRE3312>();
  const physical = input.environmental;
  if (validateEnvironmentalContractPRE3301(physical).length > 0 ||
      physical.materialization !== 'PHYSICALLY_MATERIALIZED') {
    issues.add('INVALID_PHYSICAL_CONTRACT');
  }
  const authorized = input.access === 'SCIENTIFIC_FICHE_AVAILABLE';
  if (!authorized && (input.planetFiche || input.moonFiche || input.observedText !== undefined))
    issues.add('UNAUTHORIZED_OBSERVATION');
  if (input.planetFiche) {
    if (physical.bodyKind !== 'PLANET' || input.moonFiche ||
        !unique(input.planetFiche.sections.map(s => s.id)) ||
        PLANET_IDS.some(id => !input.planetFiche!.sections.some(s => s.id === id)))
      issues.add('INCOMPLETE_PLANET_FICHE');
    const entries = input.planetFiche.allMoons ?? [];
    const inventory = input.moonInventory;
    if (!inventory || !Number.isSafeInteger(inventory.total) || inventory.total < 0 ||
        !Number.isSafeInteger(inventory.detailed) || inventory.detailed < 0 ||
        !Number.isSafeInteger(inventory.minorIdentityOnly) || inventory.minorIdentityOnly < 0 ||
        inventory.total !== inventory.detailed + inventory.minorIdentityOnly ||
        entries.length !== inventory.total ||
        entries.filter(x => x.kind === 'DETAILED').length !== inventory.detailed ||
        entries.filter(x => x.kind === 'IDENTITY_ONLY').length !== inventory.minorIdentityOnly ||
        input.planetFiche.relevantMoons.length !== inventory.detailed)
      issues.add('MOON_IDENTITY_COVERAGE');
    if (!unique(entries.map(x => String(x.moonIndex))) ||
        entries.some((x, i) => x.moonIndex !== i || x.ordinalLabel !== `Luna ${i + 1}` ||
          (x.kind === 'IDENTITY_ONLY' && (x.fields.length !== 0 || x.badges.length !== 0))))
      issues.add('MOON_IDENTITY_DUPLICATION');
  }
  if (physical.bodyKind === 'MOON' && !physical.bodyKey.startsWith(`${physical.hostPlanetKey}/M`))
    issues.add('INVALID_PHYSICAL_CONTRACT');
  if (input.moonFiche && (physical.bodyKind !== 'MOON' || input.planetFiche ||
      !unique(input.moonFiche.sections.map(s => s.id)) ||
      MOON_IDS.some(id => !input.moonFiche!.sections.some(s => s.id === id))))
    issues.add('INCOMPLETE_MOON_FICHE');
  if (input.observedText !== undefined && privateMarkers.some(s => input.observedText!.includes(s)))
    issues.add('PRIVATE_DATA_IN_PUBLIC_FICHE');
  if (input.history) {
    const h = input.history;
    if (h.contractVersion !== 'PRE-33.09/CT0-DATED-CONTINUITY/v1' ||
        h.historicalCompleteness !== 'NOT_ESTABLISHED' ||
        h.lifePresence !== 'NOT_EVALUATED' || h.biologicalContinuity !== 'NOT_EVALUATED' ||
        h.eventCatalogCompleteness !== 'NOT_ESTABLISHED' ||
        (h.perspective === 'OBSERVED_KNOWLEDGE' && !authorized))
      issues.add('UNSOURCED_HISTORICAL_CONTINUITY');
    if (h.bodyKind !== physical.bodyKind || h.bodyKey !== physical.bodyKey)
      issues.add('FOREIGN_HISTORICAL_BODY');
    if (h.routes.some(r => r.compatibleYearSlots < 0 ||
        r.longestContinuousYearSlots > r.compatibleYearSlots ||
        r.segments.some(s => s.verdict === 'COMPATIBLE' && !s.physicalEnvironmentRecordKey)))
      issues.add('UNSOURCED_HISTORICAL_CONTINUITY');
  }
  // A CT-0 scene does NOT carry a completed history, even if a separate
  // dated reconstruction has a compatible finite interval.
  if (physical.history.continuousCompatibleYears.state === 'MODELLED_CT0' ||
      physical.history.continuousCompatibleYears.state === 'CONDITIONAL_SCENARIO')
    issues.add('UNSOURCED_HISTORICAL_CONTINUITY');
  if (input.lifeReadiness) {
    const life = input.lifeReadiness;
    if (life.contract !== 'PRE-33.11c/V3-LIFE-READINESS-NON-GENERATING/v1' ||
        life.versionGate !== 'BIOLOGY_DISABLED_UNTIL_PRE33_13' ||
        life.lifeFrequency !== 'NOT_ESTIMABLE_FROM_ENVIRONMENT' ||
        life.observerView !== 'NO_AUTOMATIC_DISCOVERY' ||
        life.futurePhases.length !== 6 || life.routes.some(r => r.livingOrganisms !== 'NOT_SIMULATED' ||
          r.abiogenesis !== 'NOT_EVALUATED' || r.candidateBiosignatures !== 'NOT_INFERRED'))
      issues.add('BIOLOGICAL_EVIDENCE_LEAK');
    if ((life.bodyKind === 'PLANET') !== (physical.bodyKind === 'PLANET'))
      issues.add('FOREIGN_BIOLOGICAL_READINESS');
  }
  if (input.moonOrigin) {
    const m = input.moonOrigin;
    if (physical.bodyKind !== 'MOON' || !validOrdinal(m.publicHostPlanetOrdinal) ||
        !validOrdinal(m.physicalHostPlanetOrdinal) ||
        (m.oceanHostPlanetOrdinal !== null && m.oceanHostPlanetOrdinal !== m.physicalHostPlanetOrdinal) ||
        (m.radiationHostPlanetOrdinal !== null && m.radiationHostPlanetOrdinal !== m.physicalHostPlanetOrdinal))
      issues.add('MULTIHOST_PHYSICAL_ORIGIN_MISMATCH');
    // Public and source ordinals MAY differ (BINARY/TRIPLE); never compare them.
  }
  return Object.freeze({contract: SCIENTIFIC_INTEGRATION_PRE3312, bodyKind: physical.bodyKind,
    passed: issues.size === 0, issues: Object.freeze([...issues].sort()),
    permission: authorized ? 'PRESENTATION_ONLY' : 'LOCKED',
    historicalCompatibility: 'NOT_CERTIFIED_GLOBALLY', life: 'NOT_EVALUATED',
    newPersistentData: false, discoveryGranted: false});
}
