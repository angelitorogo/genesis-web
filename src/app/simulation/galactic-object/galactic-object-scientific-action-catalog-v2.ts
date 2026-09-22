import { DiscoveryState } from '../../domain/discovery/discovery-state';
import {
  GalacticObjectScientificActionRule,
  GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';
import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';
import { ObservationActionType } from '../../domain/observation/observation-action';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import { ScientificObservationEvidenceRule } from '../../domain/discovery/scientific-observation-evidence-rule';
import { ObservationActionCatalogV1 } from '../observation/observation-action-catalog';
import { GalacticObjectScientificActionCatalogV1 } from './galactic-object-scientific-action-catalog';

/**
 * 27.10 V2 additive catalogue. The original thirteen point-12.7 rules and
 * ordering are unchanged. These two gameplay observing campaigns do NOT
 * simulate a real astrophysical IMBH-detection likelihood or a measurement
 * of the black-hole mass: state unlocks an explicitly model-derived profile.
 */
const IMBH_RULES: readonly GalacticObjectScientificActionRule[] = Object.freeze([
  new GalacticObjectScientificActionRule(
    GalacticObjectScientificActionType.IMBH_COMPACT_CHARACTERIZATION,
    ObservationActionType.REOBSERVE,
    [ObservationInstrumentType.OPTICAL, ObservationInstrumentType.INFRARED],
    ObservationInstrumentLevel.LEVEL_3,
    DiscoveryState.DISCOVERED,
    DiscoveryState.CATALOGUED,
    null,
    GalacticObjectScientificSubject.INTERMEDIATE_MASS_BLACK_HOLE,
  ),
  new GalacticObjectScientificActionRule(
    GalacticObjectScientificActionType.IMBH_INDEPENDENT_CONFIRMATION,
    ObservationActionType.TEMPORAL_MONITORING,
    [ObservationInstrumentType.RADIO, ObservationInstrumentType.X_RAY],
    ObservationInstrumentLevel.LEVEL_4,
    DiscoveryState.CATALOGUED,
    DiscoveryState.CONFIRMED,
    null,
    GalacticObjectScientificSubject.INTERMEDIATE_MASS_BLACK_HOLE,
  ),
]);

/** Per-target observed-knowledge provenance, not physical mass measurements. */
const IMBH_EVIDENCE_RULES: ReadonlyMap<GalacticObjectScientificActionType, ScientificObservationEvidenceRule> =
  new Map([
    [GalacticObjectScientificActionType.IMBH_COMPACT_CHARACTERIZATION,
      new ScientificObservationEvidenceRule({
        profileCode: 'INTERMEDIATE_MASS_BLACK_HOLE',
        ruleCode: 'IMBH_MULTIBAND_CAMPAIGN',
        observationActionType: ObservationActionType.REOBSERVE,
        compatibleInstrumentTypes: [ObservationInstrumentType.OPTICAL, ObservationInstrumentType.INFRARED],
        minimumInstrumentLevel: ObservationInstrumentLevel.LEVEL_3,
        dimensionCode: 'IMBH_OBSERVING_CAMPAIGN',
        evidenceCode: 'MULTIBAND_CHARACTERIZATION',
        sourceKey: 'IMBH_MULTIBAND',
        independenceKey: 'OPTICAL_INFRARED_CAMPAIGN',
      })],
    [GalacticObjectScientificActionType.IMBH_INDEPENDENT_CONFIRMATION,
      new ScientificObservationEvidenceRule({
        profileCode: 'INTERMEDIATE_MASS_BLACK_HOLE',
        ruleCode: 'IMBH_INDEPENDENT_TEMPORAL_CAMPAIGN',
        observationActionType: ObservationActionType.TEMPORAL_MONITORING,
        compatibleInstrumentTypes: [ObservationInstrumentType.RADIO, ObservationInstrumentType.X_RAY],
        minimumInstrumentLevel: ObservationInstrumentLevel.LEVEL_4,
        dimensionCode: 'IMBH_OBSERVING_CAMPAIGN',
        evidenceCode: 'INDEPENDENT_TEMPORAL_FOLLOWUP',
        sourceKey: 'IMBH_TEMPORAL',
        independenceKey: 'RADIO_XRAY_CAMPAIGN',
      })],
  ]);

const RULES: readonly GalacticObjectScientificActionRule[] = Object.freeze([
  ...GalacticObjectScientificActionCatalogV1.rules,
  ...IMBH_RULES,
]);

if (RULES.length !== 15 ||
    new Set(RULES.map(rule => rule.actionType)).size !== RULES.length ||
    IMBH_RULES.some(rule => rule.surveyFamily !== null ||
      rule.scientificSubject !== GalacticObjectScientificSubject.INTERMEDIATE_MASS_BLACK_HOLE ||
      rule.compatibleInstrumentTypes.some(type =>
        !ObservationActionCatalogV1.rule(rule.observationActionType)
          .compatibleInstrumentTypes.includes(type)))) {
  throw new Error('27.10 V2 requires thirteen frozen V1 rules and two compatible IMBH rules.');
}

export class GalacticObjectScientificActionCatalogV2 {
  private constructor() {}

  static readonly rules = RULES;
  static readonly supportedActions: readonly GalacticObjectScientificActionType[] = Object.freeze(
    RULES.map(rule => rule.actionType),
  );

  static rule(actionType: GalacticObjectScientificActionType): GalacticObjectScientificActionRule {
    const rule = RULES.find(candidate => candidate.actionType === actionType);
    if (!rule) throw new RangeError(`Unsupported GalacticObjectScientificActionType: ${String(actionType)}.`);
    return rule;
  }

  /** Only new IMBH transitions produce point-26.A.2 evidence records. */
  static evidenceRule(actionType: GalacticObjectScientificActionType): ScientificObservationEvidenceRule | null {
    return IMBH_EVIDENCE_RULES.get(actionType) ?? null;
  }

  static surveyRule(family: GalacticObjectScientificSurveyFamily): GalacticObjectScientificActionRule {
    // Coarse DETECTED -> DISCOVERED contracts are the *same* V1 objects.
    return GalacticObjectScientificActionCatalogV1.surveyRule(family);
  }

  static subjectRules(subject: GalacticObjectScientificSubject): readonly GalacticObjectScientificActionRule[] {
    if (!Object.values(GalacticObjectScientificSubject).includes(subject)) {
      throw new RangeError(`Unknown GalacticObjectScientificSubject: ${String(subject)}.`);
    }
    return Object.freeze(RULES.filter(rule => rule.scientificSubject === subject));
  }
}
