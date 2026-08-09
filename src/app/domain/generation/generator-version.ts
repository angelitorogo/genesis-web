export type GeneratorVersion =
  Readonly<{
    readonly name:
      'V1';

    readonly code:
      1;
  }>;

const V1:
  GeneratorVersion =
  Object.freeze({
    name:
      'V1',

    code:
      1,
  });

export const GeneratorVersion =
  Object.freeze({
    V1,

    fromCodeOrNull(
      code: number,
    ): GeneratorVersion | null {
      if (
        code ===
        V1.code
      ) {
        return V1;
      }

      return null;
    },

    fromCode(
      code: number,
    ): GeneratorVersion {
      const version =
        this.fromCodeOrNull(
          code,
        );

      if (
        version ===
        null
      ) {
        throw new RangeError(
          `Unknown GeneratorVersion code: ${code}`,
        );
      }

      return version;
    },
  });