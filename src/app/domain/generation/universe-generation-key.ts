import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  GeneratorVersion,
} from './generator-version';

export class UniverseGenerationKey {
  constructor(
    readonly universeSeed:
      UniverseSeed,

    readonly generatorVersion:
      GeneratorVersion,
  ) {}

  get generatorVersionCode():
    number {

    return this
      .generatorVersion
      .code;
  }

  copy():
    UniverseGenerationKey {

    return new UniverseGenerationKey(
      this
        .universeSeed
        .copy(),

      this.generatorVersion,
    );
  }

  equals(
    other:
      UniverseGenerationKey,
  ): boolean {
    return (
      this
        .universeSeed
        .equals(
          other.universeSeed,
        ) &&
      this
        .generatorVersion
        .code ===
      other
        .generatorVersion
        .code
    );
  }
}