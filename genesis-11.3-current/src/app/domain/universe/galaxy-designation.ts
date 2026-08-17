/**
 * Human-readable and technical procedural designation of a galaxy.
 *
 * Both values are deterministic Ground Truth derived from the
 * UniverseGenerationKey and galaxy index.
 */
export class GalaxyDesignation {

  constructor(
    readonly name:
      string,

    readonly proceduralCode:
      string,
  ) {}
}