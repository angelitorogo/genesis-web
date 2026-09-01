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
        expect(Array.from(first.rgba)).toEqual(Array.from(second.rgba));
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
          const first = (y * texture.width) * 4;
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
      'should reject unstable or malformed texture identity inputs',
      () => {
        expect(() => systemScenePlanetTextureSeed({
          systemIdentity: '',
          planetId: 'planet-1',
          surfaceStyle: 'rocky',
        })).toThrow(RangeError);

        expect(() => buildSystemScenePlanetTextureV1({
          ...fixture,
          systemIdentity: '   ',
        })).toThrow(RangeError);

        expect(() => buildSystemScenePlanetTextureV1({
          ...fixture,
          baseColorHex: 'blue',
        })).toThrow(RangeError);
      },
    );
  },
);
