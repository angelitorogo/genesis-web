import {
  BodyLocator, CivilizationLocator, GalacticObjectLocator,
  GalaxyLocator, MoonLocator, SectorLocator, SystemLocator,
  type ProceduralLocator,
} from '../generation/procedural-locator';

/**
 * Ground Truth association, deliberately SEPARATE from UnclassifiedSource and
 * its observed DTO. It belongs to a physical resolver, not to observations.
 * No observed classification can be inferred from this optional association.
 */
export type CanonicalMysteryTarget =
  | { readonly kind: 'PROCEDURAL_OBJECT'; readonly locator: ProceduralLocator | MoonLocator }
  | { readonly kind: 'CANONICAL_EVENT'; readonly eventId: string };

export class CanonicalMysterySourceAssociation {
  constructor(
    readonly unclassifiedSourceId: string,
    readonly universeIdentity: string,
    readonly target: CanonicalMysteryTarget,
  ) {
    if (!/^UCS30-[A-F0-9]{32}$/.test(unclassifiedSourceId) ||
        !/^U30-[A-F0-9]{32}$/.test(universeIdentity)) {
      throw new RangeError('Canonical mystery association requires a stable source/universe id.');
    }
    if (target.kind === 'CANONICAL_EVENT') {
      if (typeof target.eventId !== 'string' ||
          !/^[A-Za-z0-9_.:-]{1,128}$/.test(target.eventId)) {
        throw new RangeError('Invalid canonical event identifier.');
      }
      this.target = Object.freeze({ kind: 'CANONICAL_EVENT', eventId: target.eventId });
    } else if (target.kind === 'PROCEDURAL_OBJECT') {
      if (!(
        target.locator instanceof GalaxyLocator ||
        target.locator instanceof SectorLocator ||
        target.locator instanceof GalacticObjectLocator ||
        target.locator instanceof SystemLocator ||
        target.locator instanceof BodyLocator ||
        target.locator instanceof MoonLocator ||
        target.locator instanceof CivilizationLocator
      )) throw new RangeError('A canonical procedural locator is required.');
      this.target = Object.freeze({ kind: 'PROCEDURAL_OBJECT', locator: target.locator });
    } else {
      throw new RangeError('Unsupported canonical association kind.');
    }
    Object.freeze(this);
  }
}
