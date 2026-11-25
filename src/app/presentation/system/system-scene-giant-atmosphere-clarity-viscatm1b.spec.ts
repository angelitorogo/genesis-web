import * as THREE from 'three';
import { buildSystemSceneGiantAtmospherePresentationV1 } from './system-scene-giant-atmosphere-presentation';
import { buildSystemSceneGiantAtmosphereTextureV1 } from './system-scene-giant-atmosphere-texture';
import { refineGiantAtmosphereMultiresVISCATM1, giantAtmosphereFocusWidthVISCATM1,
  GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1 } from './system-scene-giant-atmosphere-multires-viscatm1';
import { refinePlanetRgbaTextureV1 } from './system-scene-planet-texture-refinement';
import { buildSystemSceneAtmosphereOpticsV1 } from './system-scene-atmosphere-optics';
import { createSystemSceneAtmosphereShellMaterialV1, ATMOSPHERE_FRAGMENT_SHADER_V1 } from './system-scene-atmosphere-material';

function atmosphere(kind: 'GAS_GIANT' | 'ICE_GIANT' | 'MINI_NEPTUNE') {
  return buildSystemSceneGiantAtmospherePresentationV1({
    planetType: kind, massEarth: kind === 'GAS_GIANT' ? 250 : 17,
    radiusEarth: kind === 'GAS_GIANT' ? 10.2 : 4.1,
    densityGramsPerCubicCentimeter: 1.4, envelopeMassFraction01: .55,
    iceBearingFractionOfSolids01: .66, rotationPeriodHours: 15,
    equilibriumTemperatureKelvin: 90, referenceBondAlbedo01: .48,
    retainedMeanMolarMassGramsPerMole: 2.5,
    retainedGasComposition: [
      { gas:'HYDROGEN', moleFraction01: .74 },
      { gas:'HELIUM', moleFraction01: .18 },
      { gas:'METHANE', moleFraction01: .08 },
    ],
  })!;
}

function edgeEnergy(pixels: Uint8Array, width: number): number {
  let energy = 0; let n = 0;
  for (let y = 18; y < width / 2 - 18; y += 3) {
    for (let x = 4; x < width - 8; x += 5) {
      const i = (y * width + x) * 4;
      energy += Math.abs(pixels[i]! - pixels[i + 4]!);
      energy += Math.abs(pixels[i]! - pixels[i + width * 4]!);
      n += 2;
    }
  }
  return energy / n;
}

describe('GENESIS VISCATM.1b — mayor definición real, paridad y bruma controlada', () => {
  it('emplea alta resolución desde un diámetro útil, solo en el gaseoso enfocado', () => {
    expect(giantAtmosphereFocusWidthVISCATM1(350, 512)).toBe(512);
    expect(giantAtmosphereFocusWidthVISCATM1(390, 512)).toBe(512);
    expect(giantAtmosphereFocusWidthVISCATM1(300, 1024)).toBe(512);
    expect(giantAtmosphereFocusWidthVISCATM1(250, 1024)).toBe(512);
    expect(GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1).toBe(3); // 1c extends the same validated pipeline
  });

  it.each(['GAS_GIANT', 'ICE_GIANT', 'MINI_NEPTUNE'] as const)(
    'conserva identidad exacta entre atlas cercano y ficha en %s', kind => {
      const state = atmosphere(kind);
      const input = { systemIdentity:'G0/Droveria', planetId:'planet-h', atmosphere: state };
      const base = buildSystemSceneGiantAtmosphereTextureV1(input);
      const fiche = buildSystemSceneGiantAtmosphereTextureV1({ ...input, width: 1024, height: 512 });
      const focused = refineGiantAtmosphereMultiresVISCATM1(
        base.albedoRgba, 256, 128, 1024, base.seedUint32, state, 'CLOUD_TOPS',
      );
      expect(fiche.albedoRgba).toEqual(focused);
      expect(fiche.upperHazeRgba).toEqual(base.upperHazeRgba === null ? null :
        refineGiantAtmosphereMultiresVISCATM1(
          base.upperHazeRgba, 256, 128, 1024, base.seedUint32, state, 'UPPER_HAZE',
        ));
      const originalInterpolation = refinePlanetRgbaTextureV1(
        base.albedoRgba, 256, 128, 1024, base.seedUint32, 'GAS',
      );
      expect(edgeEnergy(fiche.albedoRgba, 1024)).toBeGreaterThan(
        edgeEnergy(originalInterpolation, 1024) * 1.25,
      );
    },
  );

  it('no aplica la reducción de velo a las atmósferas de planetas sólidos', () => {
    const binding = {
      lightDirectionsView: [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0),
        new THREE.Vector3(0,0,1)] as const,
      lightWeightsView: new THREE.Vector3(1,0,0),
    };
    const giant = buildSystemSceneAtmosphereOpticsV1({
      baseColorHex: '#62B5DF', surfaceStyle: 'gaseous', surfaceEnvironment: null,
      giantAtmosphere: atmosphere('ICE_GIANT'),
    });
    const solid = buildSystemSceneAtmosphereOpticsV1({
      baseColorHex: '#62B5DF', surfaceStyle: 'rocky', giantAtmosphere: null,
      surfaceEnvironment: {
        solidSurfaceAvailable: true, retainedSurfacePressurePascal: 101325,
        retainedAtmosphericWaterVaporMoleFraction01: .02,
        presentationCloudCoverageFraction01: .45, surfaceIceCoverageFraction01: .05,
      },
    });
    const gasMaterial = createSystemSceneAtmosphereShellMaterialV1(giant,binding)!;
    const solidMaterial = createSystemSceneAtmosphereShellMaterialV1(solid,binding)!;
    expect(gasMaterial.uniforms['uGenesisDeepEnvelopeClarity'].value).toBe(1);
    expect(solidMaterial.uniforms['uGenesisDeepEnvelopeClarity'].value).toBe(0);
    expect(ATMOSPHERE_FRAGMENT_SHADER_V1).toContain('mix(1.0, 0.47, genesisClarity)');
    gasMaterial.dispose(); solidMaterial.dispose();
  });
});
