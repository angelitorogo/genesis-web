/**
 * Point-12.7 physical subject families that already have a complete V1
 * GalacticObject Ground Truth model and therefore can expose dedicated
 * scientific actions after the target has reached DISCOVERED.
 *
 * This is deliberately separate from the frozen point-8.9 generic
 * ObservationClassification catalog. It is an action-routing contract, not a
 * replacement for that generic classification model.
 */
export enum GalacticObjectScientificSubject {
  NEBULA =
    'NEBULA',

  HII_REGION =
    'HII_REGION',

  OPEN_CLUSTER =
    'OPEN_CLUSTER',

  GLOBULAR_CLUSTER =
    'GLOBULAR_CLUSTER',

  SUPERNOVA_REMNANT =
    'SUPERNOVA_REMNANT',
}

/**
 * Coarse point-9.4 families used only by the first scientific survey.
 *
 * Keeping these separate from GalacticObjectScientificSubject is the key
 * anti-leak boundary: while the target is merely DETECTED, the action system
 * can route a survey from the already-known coarse family without resolving
 * hidden point-12.x physical Ground Truth.
 */
export enum GalacticObjectScientificSurveyFamily {
  NEBULA =
    'NEBULA',

  STAR_CLUSTER =
    'STAR_CLUSTER',

  EXTREME_OBJECT =
    'EXTREME_OBJECT',
}
