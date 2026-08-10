export interface ObservationEntity {
  readonly id:
    string;

  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly targetTypeCode:
    number;

  readonly targetSeed:
    string;

  /**
   * Stable identifier for the future
   * observation payload type.
   */
  readonly observationKind:
    string;

  /**
   * Independent version for the serialized
   * observation payload.
   */
  readonly payloadVersion:
    number;

  /**
   * Portable JSON representation of
   * Observed Knowledge.
   *
   * Its scientific structure will be defined
   * by the corresponding future observation
   * phases.
   */
  readonly payloadJson:
    string;

  readonly observedAtEpochMs:
    number;
}