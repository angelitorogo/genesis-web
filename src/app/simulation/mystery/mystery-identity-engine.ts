import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import {
  BodyLocator, CivilizationLocator, GalacticObjectLocator,
  GalaxyLocator, MoonLocator, SectorLocator, SystemLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import {
  LocatedObservationObject, ObservationTransientCandidate,
  type ObservationSubject,
} from '../../domain/observation/observation-classification';
import {
  UnknownPhenomenon, UnclassifiedSource,
  type MysteryOriginScope, type MysteryOriginScopeKind,
} from '../../domain/mystery/mystery-observational-subject';
import { MysteryObservedOriginAssociation } from '../../domain/mystery/mystery-observed-origin-association';
import {
  CanonicalMysterySourceAssociation, type CanonicalMysteryTarget,
} from '../../domain/mystery/canonical-mystery-source-association';

const ID_DOMAIN = 'GENESIS-30.1-OBSERVATIONAL-IDENTITY-V1';

/**
 * The key is an explicit, immutable observation/candidate key assigned by the
 * discovery/observation system. NEVER derive it from physical class, a mutable
 * confidence score, an observation timestamp, or the order of measurements.
 */
export class MysteryIdentityEngine {
  private constructor() {}

  static createSource(subject: ObservationSubject, observationKey: string): UnclassifiedSource {
    const a = anchor(subject);
    return new UnclassifiedSource(
      opaque('UCS30', 'SOURCE', a.universeKey, a.scopeKey, observationCode(observationKey)),
      opaque('U30', 'UNIVERSE', a.universeKey),
      a.scope,
    );
  }

  static createPhenomenon(
    subject: ObservationSubject,
    observationKey: string,
    relatedSource: UnclassifiedSource | null = null,
  ): UnknownPhenomenon {
    const a = anchor(subject);
    const universeIdentity = opaque('U30', 'UNIVERSE', a.universeKey);
    if (relatedSource !== null && (
      relatedSource.universeIdentity !== universeIdentity ||
      relatedSource.scope.id !== a.scope.id
    )) {
      throw new RangeError('A mystery phenomenon cannot reference a source from another observational scope.');
    }
    return new UnknownPhenomenon(
      opaque('UPH30', 'PHENOMENON', a.universeKey, a.scopeKey, observationCode(observationKey)),
      universeIdentity, a.scope, relatedSource?.id ?? null,
    );
  }

  /** Retain the initial observed anchor for internal map/fiche routing. */
  static associateObservedOrigin(
    mystery: UnclassifiedSource | UnknownPhenomenon,
    originalSubject: ObservationSubject,
  ): MysteryObservedOriginAssociation {
    const a = anchor(originalSubject);
    if (mystery.universeIdentity !== opaque('U30', 'UNIVERSE', a.universeKey) ||
        mystery.scope.id !== a.scope.id || mystery.scope.kind !== a.scope.kind) {
      throw new RangeError('The observational anchor cannot be changed or moved across universes.');
    }
    return new MysteryObservedOriginAssociation(mystery.id, mystery.scope, originalSubject);
  }

  /** Optional, explicitly supplied canonical linkage; it NEVER affects IDs. */
  static associateCanonicalSource(
    source: UnclassifiedSource,
    physicalGenerationKey: UniverseGenerationKey,
    target: CanonicalMysteryTarget,
  ): CanonicalMysterySourceAssociation {
    if (source.universeIdentity !== opaque('U30', 'UNIVERSE', generationKeyCode(physicalGenerationKey))) {
      throw new RangeError('Canonical source association belongs to another universe or generator version.');
    }
    if (target.kind === 'PROCEDURAL_OBJECT') {
      locatorScope(target.locator); // reject malformed / unsupported runtime locators
    }
    return new CanonicalMysterySourceAssociation(source.id, source.universeIdentity, target);
  }
}

function opaque(prefix: 'UCS30' | 'UPH30' | 'USC30' | 'U30', ...segments: string[]): string {
  const digest = sha256(utf8ToBytes(JSON.stringify([ID_DOMAIN, prefix, ...segments])));
  return `${prefix}-${bytesToHex(digest.slice(0, 16)).toUpperCase()}`;
}

function generationKeyCode(key: UniverseGenerationKey): string {
  if (!key || !key.universeSeed ||
      !Number.isInteger(key.generatorVersionCode) ||
      (key.generatorVersionCode !== 1 && key.generatorVersionCode !== 2)) {
    throw new RangeError('A released universe generation key is required.');
  }
  return JSON.stringify([key.universeSeed.toString(), key.generatorVersionCode]);
}

function observationCode(value: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_.:/-]{1,128}$/.test(value)) {
    throw new RangeError('Mystery observation key must be a stable, non-empty ASCII identifier.');
  }
  return value.toUpperCase();
}

function anchor(subject: ObservationSubject): {
  readonly universeKey: string; readonly scopeKey: string; readonly scope: MysteryOriginScope;
} {
  if (!(subject instanceof LocatedObservationObject) &&
      !(subject instanceof ObservationTransientCandidate)) {
    throw new RangeError('A real observational subject is required; mysteries are not randomly injected.');
  }
  const universeKey = generationKeyCode(subject.generationKey);
  let scopeKind: MysteryOriginScopeKind;
  let scopeKey: string;
  if (subject instanceof ObservationTransientCandidate) {
    scopeKind = 'UNLOCATED';
    scopeKey = JSON.stringify([scopeKind, subject.candidateId.index.toString()]);
  } else {
    const a = locatorScope(subject.targetLocator);
    scopeKind = a.kind;
    scopeKey = a.code;
  }
  return Object.freeze({
    universeKey, scopeKey,
    scope: Object.freeze({ kind: scopeKind, id: opaque('USC30', 'SCOPE', universeKey, scopeKey) }),
  });
}

function locatorScope(locator: ProceduralLocator | MoonLocator): { readonly kind: MysteryOriginScopeKind; readonly code: string } {
  if (locator instanceof GalaxyLocator) return {
    kind: 'GALAXY', code: JSON.stringify(['GALAXY', locator.galaxyIndex.toString()]),
  };
  if (locator instanceof SectorLocator) return {
    kind: 'SECTOR', code: JSON.stringify(['SECTOR', locator.galaxyIndex.toString(), locator.sectorKey.toString()]),
  };
  if (locator instanceof GalacticObjectLocator) return {
    kind: 'GALACTIC_OBJECT', code: JSON.stringify(['GALACTIC_OBJECT', locator.galaxyIndex.toString(), locator.sectorKey.toString(), locator.galacticObjectIndex.toString()]),
  };
  if (locator instanceof SystemLocator) return {
    kind: 'SYSTEM', code: JSON.stringify(['SYSTEM', locator.galaxyIndex.toString(), locator.sectorKey.toString(), locator.galacticObjectIndex.toString()]),
  };
  if (locator instanceof BodyLocator) return {
    kind: 'BODY', code: JSON.stringify(['BODY', locator.galaxyIndex.toString(), locator.sectorKey.toString(), locator.galacticObjectIndex.toString(), locator.bodyIndex.toString()]),
  };
  if (locator instanceof MoonLocator) return {
    kind: 'MOON', code: JSON.stringify(['MOON', locator.galaxyIndex.toString(), locator.sectorKey.toString(), locator.galacticObjectIndex.toString(), locator.bodyIndex.toString(), locator.moonIndex.toString()]),
  };
  if (locator instanceof CivilizationLocator) return {
    kind: 'CIVILIZATION', code: JSON.stringify(['CIVILIZATION', locator.galaxyIndex.toString(), locator.sectorKey.toString(), locator.galacticObjectIndex.toString(), locator.bodyIndex.toString(), locator.civilizationIndex.toString()]),
  };
  throw new RangeError('Unknown or unsupported procedural origin scope.');
}
