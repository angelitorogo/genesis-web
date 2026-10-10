import type { ObservationSubject } from '../observation/observation-classification';
import type { MysteryOriginScope } from './mystery-observational-subject';

/**
 * Internal observational routing link. The source's origin is the immutable
 * discovery anchor, NOT its later refined sky position or physical identity.
 * Keep this out of the public/Observed Knowledge DTO.
 */
export class MysteryObservedOriginAssociation {
  constructor(
    readonly mysteryId: string,
    readonly originScope: MysteryOriginScope,
    readonly originalSubject: ObservationSubject,
  ) {
    if (!/^(?:UCS30|UPH30)-[A-F0-9]{32}$/.test(mysteryId)) {
      throw new RangeError('Unknown mystery identity in origin association.');
    }
    Object.freeze(this);
  }
}
