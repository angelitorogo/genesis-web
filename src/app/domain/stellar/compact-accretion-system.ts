import { CompactAccretionDisk } from './compact-accretion-disk';
import { RelativisticJet } from './relativistic-jet';

/** 27.7: one existing host and disk, plus zero or one independently justified bipolar jet. */
export class CompactAccretionSystem {
  constructor(
    readonly disk: CompactAccretionDisk,
    readonly jet: RelativisticJet | null,
  ) {
    if (!(disk instanceof CompactAccretionDisk) ||
        (jet !== null && (!(jet instanceof RelativisticJet) || jet.disk !== disk))) {
      throw new TypeError('27.7 jet and disk must share the exact canonical disk instance.');
    }
    Object.freeze(this);
  }
}
