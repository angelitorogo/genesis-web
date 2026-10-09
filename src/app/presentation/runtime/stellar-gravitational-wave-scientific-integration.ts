import { type GravitationalWaveEventProfile } from '../../domain/transient/gravitational-wave-event-profile';
import { GravitationalWaveEventEngine } from '../../simulation/transient/gravitational-wave-event-engine';
import { type StellarCompactMergerScientificSnapshot } from './stellar-compact-merger-scientific-integration';

export interface StellarGravitationalWaveScientificEvent {
  readonly eventKey: string;
  readonly primaryComponentLabel: string;
  readonly secondaryComponentLabel: string;
  readonly primaryDesignation: string;
  readonly secondaryDesignation: string;
  readonly mergerDelayYears: number;
  readonly profile: GravitationalWaveEventProfile;
}

export interface StellarGravitationalWaveScientificSnapshot {
  readonly events: readonly StellarGravitationalWaveScientificEvent[];
}

/**
 * 29.5 is a deterministic scientific projection of persisted 29.4 canonical
 * mergers. It owns no repository and creates no second event identity.
 */
export class StellarGravitationalWaveScientificIntegration {
  private constructor() {}

  static derive(
    compactMergerSnapshot: StellarCompactMergerScientificSnapshot,
  ): StellarGravitationalWaveScientificSnapshot {
    return Object.freeze({
      events: Object.freeze(compactMergerSnapshot.events.map(event => Object.freeze({
        eventKey: event.eventKey,
        primaryComponentLabel: event.primaryComponentLabel.name,
        secondaryComponentLabel: event.secondaryComponentLabel.name,
        primaryDesignation: event.primaryDesignation,
        secondaryDesignation: event.secondaryDesignation,
        mergerDelayYears: event.mergerDelayYears,
        profile: GravitationalWaveEventEngine.deriveProfile(event.profile),
      }))),
    });
  }
}
