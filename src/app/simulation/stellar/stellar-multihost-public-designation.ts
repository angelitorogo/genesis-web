import { moonRomanNumeralV1 } from '../../domain/planetary/moon-designation';
import { type MultihostLabel } from './stellar-multihost-formation';

export type StellarMultihostPublicPlanetHost = MultihostLabel | 'AB';

function canonicalSystemName(systemName: string): string {
  const value = systemName.trim();
  if (value.length === 0) {
    throw new RangeError('A multihost public designation requires a non-empty canonical system name.');
  }
  return value;
}

function positiveOrdinal(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
  return value;
}

/**
 * Canonical PUBLIC naming boundary for one generated multihost system.
 *
 * Internal A/B/C/P child scopes preserve their own frozen designations for
 * deterministic regeneration. Those names are implementation details and must
 * never escape into public BINARY/TRIPLE scene/card labels.
 */
export function stellarMultihostPublicComponentDesignation(
  systemName: string,
  componentLabel: MultihostLabel,
): string {
  return `${canonicalSystemName(systemName)} ${componentLabel}`;
}

export function stellarMultihostPublicPlanetDesignation(
  systemName: string,
  host: StellarMultihostPublicPlanetHost,
  sourcePlanetOrdinal: number,
): string {
  return `${canonicalSystemName(systemName)} ${host}-${positiveOrdinal(sourcePlanetOrdinal, 'sourcePlanetOrdinal')}`;
}

export function stellarMultihostPublicMoonDesignation(
  systemName: string,
  host: StellarMultihostPublicPlanetHost,
  sourcePlanetOrdinal: number,
  moonOrdinal: number,
): string {
  return `${stellarMultihostPublicPlanetDesignation(systemName, host, sourcePlanetOrdinal)} ${moonRomanNumeralV1(
    positiveOrdinal(moonOrdinal, 'moonOrdinal'),
  )}`;
}
