import {
  buildSystemScenePlanetTextureV1,
  SYSTEM_SCENE_PLANET_TEXTURE_HEIGHT,
  SYSTEM_SCENE_PLANET_TEXTURE_WIDTH,
  systemScenePlanetTextureSeed,
  type SystemScenePlanetTextureSurfaceStyle,
} from './system-scene-planet-texture';

describe(
  'SystemScene procedural planet textures point 25.2',
  () => {
    const fixture = {
      systemIdentity: 'G3 / S-17 / O8',
      planetId: 'planet-1',
      surfaceStyle: 'rocky' as const,
      baseColorHex: '#8F7964',
    };

    it(
      'should generate the same stable albedo bytes for the same system/body identity',
      () => {
        const first = buildSystemScenePlanetTextureV1(fixture);
        const second = buildSystemScenePlanetTextureV1(fixture);

        expect(first.version).toBe(1);
        expect(first.width).toBe(SYSTEM_SCENE_PLANET_TEXTURE_WIDTH);
        expect(first.height).toBe(SYSTEM_SCENE_PLANET_TEXTURE_HEIGHT);
        expect(first.seedUint32).toBe(second.seedUint32);
        expect(first.rgba).toEqual(second.rgba);
        expect(first.rgba).toHaveLength(
          SYSTEM_SCENE_PLANET_TEXTURE_WIDTH *
            SYSTEM_SCENE_PLANET_TEXTURE_HEIGHT *
            4,
        );
      },
    );

    it(
      'should change texture identity across systems without using orbital/camera state',
      () => {
        const here = buildSystemScenePlanetTextureV1(fixture);
        const elsewhere = buildSystemScenePlanetTextureV1({
          ...fixture,
          systemIdentity: 'G9 / S241 / O2',
        });

        expect(here.seedUint32).not.toBe(elsewhere.seedUint32);
        expect(Array.from(here.rgba.slice(0, 256))).not.toEqual(
          Array.from(elsewhere.rgba.slice(0, 256)),
        );
      },
    );

    it(
      'should keep the equirectangular longitude seam byte-identical',
      () => {
        const texture = buildSystemScenePlanetTextureV1({
          ...fixture,
          surfaceStyle: 'oceanic',
          baseColorHex: '#4B7FCB',
        });

        for (let y = 0; y < texture.height; y += 1) {
          const first = y * texture.width * 4;
          const last = (y * texture.width + texture.width - 1) * 4;
          expect(Array.from(texture.rgba.slice(first, first + 4))).toEqual(
            Array.from(texture.rgba.slice(last, last + 4)),
          );
        }
      },
    );

    it(
      'should provide distinct generic albedo families without asserting 25.3 surface geography',
      () => {
        const signatures = [
          'rocky',
          'oceanic',
          'icy',
          'gaseous',
          'volcanic',
        ].map(surfaceStyle => {
          const texture = buildSystemScenePlanetTextureV1({
            ...fixture,
            surfaceStyle: surfaceStyle as SystemScenePlanetTextureSurfaceStyle,
          });
          let checksum = 0;
          for (let index = 0; index < texture.rgba.length; index += 97) {
            checksum = (checksum + texture.rgba[index]!) >>> 0;
          }
          return checksum;
        });

        expect(new Set(signatures).size).toBeGreaterThanOrEqual(4);
      },
    );

    it(
      'should produce clearly different same-family signatures for different planets',
      () => {
        for (const surfaceStyle of [
          'rocky',
          'oceanic',
          'icy',
          'gaseous',
          'volcanic',
        ] satisfies readonly SystemScenePlanetTextureSurfaceStyle[]) {
          const a = textureSignature(
            buildSystemScenePlanetTextureV1({
              ...fixture,
              surfaceStyle,
              planetId: `${surfaceStyle}-planet-a`,
            }).rgba,
          );
          const b = textureSignature(
            buildSystemScenePlanetTextureV1({
              ...fixture,
              surfaceStyle,
              planetId: `${surfaceStyle}-planet-b`,
            }).rgba,
          );

          expect(signatureDistance(a, b)).toBeGreaterThan(18);
        }
      },
    );

    it(
      'should expose strong macro identity separation for gaseous and rocky families',
      () => {
        const fixtures = [
          {
            surfaceStyle: 'gaseous' as const,
            planetIds: ['gaseous-v3-6', 'gaseous-v3-24'] as const,
            baseColorHex: '#9C9B88',
            minimumDistance: 60,
          },
          {
            surfaceStyle: 'rocky' as const,
            planetIds: ['rocky-v3-9', 'rocky-v3-13'] as const,
            baseColorHex: '#8F7964',
            minimumDistance: 75,
          },
        ];

        for (const variantFixture of fixtures) {
          // These deterministic identities are frozen representatives of visibly
          // separated V3 subvariants. Rendering four full textures is enough to
          // protect macro separation without making the 572-file coverage suite
          // compete with 24 CPU-heavy 256x128 fBm texture builds in one test.
          const first = averageRgb(
            buildSystemScenePlanetTextureV1({
              ...fixture,
              surfaceStyle: variantFixture.surfaceStyle,
              planetId: variantFixture.planetIds[0],
              baseColorHex: variantFixture.baseColorHex,
            }).rgba,
          );
          const second = averageRgb(
            buildSystemScenePlanetTextureV1({
              ...fixture,
              surfaceStyle: variantFixture.surfaceStyle,
              planetId: variantFixture.planetIds[1],
              baseColorHex: variantFixture.baseColorHex,
            }).rgba,
          );

          expect(rgbDistance(first, second)).toBeGreaterThan(
            variantFixture.minimumDistance,
          );
        }
      },
    );

    it(
      'should reject unstable or malformed texture identity inputs',
      () => {
        expect(() =>
          systemScenePlanetTextureSeed({
            systemIdentity: '',
            planetId: 'planet-1',
            surfaceStyle: 'rocky',
          }),
        ).toThrow(RangeError);

        expect(() =>
          buildSystemScenePlanetTextureV1({
            ...fixture,
            systemIdentity: '   ',
          }),
        ).toThrow(RangeError);

        expect(() =>
          buildSystemScenePlanetTextureV1({
            ...fixture,
            baseColorHex: 'blue',
          }),
        ).toThrow(RangeError);
      },
    );
  },
);

function textureSignature(
  rgba: Uint8Array,
): readonly [number, number, number, number, number] {
  let red = 0;
  let green = 0;
  let blue = 0;
  let contrast = 0;
  let stripes = 0;

  for (let index = 0; index < rgba.length; index += 4 * 211) {
    red += rgba[index] ?? 0;
    green += rgba[index + 1] ?? 0;
    blue += rgba[index + 2] ?? 0;
  }

  for (let index = 0; index < rgba.length - 8; index += 4 * 503) {
    const luminanceHere =
      (rgba[index] ?? 0) * 0.2126 +
      (rgba[index + 1] ?? 0) * 0.7152 +
      (rgba[index + 2] ?? 0) * 0.0722;
    const luminanceNext =
      (rgba[index + 4] ?? 0) * 0.2126 +
      (rgba[index + 5] ?? 0) * 0.7152 +
      (rgba[index + 6] ?? 0) * 0.0722;
    contrast += Math.abs(luminanceHere - luminanceNext);
  }

  const rowStride = SYSTEM_SCENE_PLANET_TEXTURE_WIDTH * 4;
  for (let row = 0; row < SYSTEM_SCENE_PLANET_TEXTURE_HEIGHT; row += 11) {
    const left = row * rowStride;
    const mid = left + Math.floor(SYSTEM_SCENE_PLANET_TEXTURE_WIDTH / 2) * 4;
    stripes += Math.abs((rgba[left] ?? 0) - (rgba[mid] ?? 0));
  }

  return [red, green, blue, contrast, stripes] as const;
}

function signatureDistance(
  a: readonly number[],
  b: readonly number[],
): number {
  let total = 0;
  for (let index = 0; index < a.length; index += 1) {
    total += Math.abs((a[index] ?? 0) - (b[index] ?? 0));
  }
  return total;
}

function averageRgb(
  rgba: Uint8Array,
): readonly [number, number, number] {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let index = 0; index < rgba.length; index += 4 * 79) {
    red += rgba[index] ?? 0;
    green += rgba[index + 1] ?? 0;
    blue += rgba[index + 2] ?? 0;
    count += 1;
  }

  return [red / count, green / count, blue / count] as const;
}

function rgbDistance(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return Math.abs(a[0] - b[0]) +
    Math.abs(a[1] - b[1]) +
    Math.abs(a[2] - b[2]);
}
