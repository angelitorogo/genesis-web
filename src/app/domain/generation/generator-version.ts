/**
 * Persistent universe generation identity. V2 is released for NEW universes
 * at stage 12.2; V1 algorithms and existing saved identities remain frozen.
 * This version distinguishes public persistence; private frozen V1 physical
 * sources are never persisted as V2 entities.
 */
export type GeneratorVersion = Readonly<{
  readonly name: 'V1';
  readonly code: 1;
}> | Readonly<{
  readonly name: 'V2';
  readonly code: 2;
}>;

const V1 = Object.freeze({ name: 'V1', code: 1 } as const);
const V2 = Object.freeze({ name: 'V2', code: 2 } as const);

export const GeneratorVersion = Object.freeze({
  V1,
  V2,

  fromCodeOrNull(code: number): GeneratorVersion | null {
    if (code === V1.code) return V1;
    if (code === V2.code) return V2;
    return null;
  },

  fromCode(code: number): GeneratorVersion {
    const version = this.fromCodeOrNull(code);
    if (version === null) {
      throw new RangeError(`Unknown GeneratorVersion code: ${code}`);
    }
    return version;
  },

  /** The version check is canonical: similarly shaped objects are not released. */
  isReleasedForNewUniverses(version: GeneratorVersion): boolean {
    return version === V1 || version === V2;
  },
});
