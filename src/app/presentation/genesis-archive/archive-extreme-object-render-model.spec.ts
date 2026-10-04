import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

import {
  archiveExtremeObjectRenderModel,
} from './archive-extreme-object-render-model';

describe(
  '28.2G.2 — Archive extreme-object renderer adapter',
  () => {
    const seed =
      'GENESIS-28.2G.2-ARCHIVE-EXTREME-RENDER';

    it(
      'routes every distributed compact-star type to the approved neutron-star renderer family',
      () => {
        for (
          const type
          of [
            ExtremeType.NEUTRON_STAR,
            ExtremeType.PULSAR,
            ExtremeType.MILLISECOND_PULSAR,
            ExtremeType.MAGNETAR,
          ] as const
        ) {
          const model =
            archiveExtremeObjectRenderModel(
              type,
              seed,
            );

          expect(model.type).toBe(type);
          expect(model.neutronStarModel?.type).toBe(type);
          expect(model.blackHoleModel).toBeNull();
          expect(model.xrayBinaryModel).toBeNull();
        }
      },
    );

    it(
      'routes stellar and intermediate black holes to the approved black-hole renderer family',
      () => {
        for (
          const type
          of [
            ExtremeType.STELLAR_MASS_BLACK_HOLE,
            ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
          ] as const
        ) {
          const model =
            archiveExtremeObjectRenderModel(
              type,
              seed,
            );

          expect(model.blackHoleModel?.type).toBe(type);
          expect(model.neutronStarModel).toBeNull();
          expect(model.xrayBinaryModel).toBeNull();
        }
      },
    );

    it(
      'routes X-ray binaries, microquasars and ULX to the approved high-energy binary renderer family',
      () => {
        for (
          const type
          of [
            ExtremeType.X_RAY_BINARY_NS,
            ExtremeType.X_RAY_BINARY_BH,
            ExtremeType.MICROQUASAR,
            ExtremeType.ULX,
          ] as const
        ) {
          const model =
            archiveExtremeObjectRenderModel(
              type,
              seed,
            );

          expect(model.xrayBinaryModel?.type).toBe(type);
          expect(model.neutronStarModel).toBeNull();
          expect(model.blackHoleModel).toBeNull();
        }
      },
    );

    it(
      'reuses the approved laboratory discovery progression for compact stars, black holes and X-ray binaries',
      () => {
        const neutronDetected =
          archiveExtremeObjectRenderModel(
            ExtremeType.PULSAR,
            seed,
            'DETECTED',
          );

        const neutronDiscovered =
          archiveExtremeObjectRenderModel(
            ExtremeType.PULSAR,
            seed,
            'DISCOVERED',
          );

        const neutronConfirmed =
          archiveExtremeObjectRenderModel(
            ExtremeType.PULSAR,
            seed,
            'CONFIRMED',
          );

        expect(neutronDetected.detailStage).toBe('DETECTED');
        expect(neutronDetected.detectedCompactVisual?.kind).toBe('PULSAR');
        expect(neutronDetected.neutronStarModel).toBeNull();
        expect(neutronDiscovered.neutronStarModel).not.toBeNull();
        expect(neutronConfirmed.neutronStarModel).not.toBeNull();

        if (
          neutronDiscovered.neutronStarModel === null ||
          neutronConfirmed.neutronStarModel === null
        ) {
          throw new Error(
            '28.2G.3a neutron-star progression must expose DISCOVERED and CONFIRMED models.',
          );
        }

        expect(
          neutronDiscovered.neutronStarModel.surfaceDetailScale,
        ).toBeLessThan(
          neutronConfirmed.neutronStarModel.surfaceDetailScale,
        );

        const blackHoleDetected =
          archiveExtremeObjectRenderModel(
            ExtremeType.STELLAR_MASS_BLACK_HOLE,
            seed,
            'DETECTED',
          );

        const blackHoleDiscovered =
          archiveExtremeObjectRenderModel(
            ExtremeType.STELLAR_MASS_BLACK_HOLE,
            seed,
            'DISCOVERED',
          );

        const blackHoleConfirmed =
          archiveExtremeObjectRenderModel(
            ExtremeType.STELLAR_MASS_BLACK_HOLE,
            seed,
            'CONFIRMED',
          );

        expect(blackHoleDetected.detectedCompactVisual?.kind).toBe('BLACK_HOLE');
        expect(blackHoleDetected.blackHoleModel).toBeNull();
        expect(blackHoleDiscovered.blackHoleModel).not.toBeNull();
        expect(blackHoleConfirmed.blackHoleModel).not.toBeNull();

        if (
          blackHoleDiscovered.blackHoleModel === null ||
          blackHoleConfirmed.blackHoleModel === null
        ) {
          throw new Error(
            '28.2G.3a black-hole progression must expose DISCOVERED and CONFIRMED models.',
          );
        }

        expect(
          blackHoleDiscovered.blackHoleModel.diskBrightness,
        ).toBeLessThan(
          blackHoleConfirmed.blackHoleModel.diskBrightness,
        );

        const xrayDetected =
          archiveExtremeObjectRenderModel(
            ExtremeType.X_RAY_BINARY_BH,
            seed,
            'DETECTED',
          );

        const xrayDiscovered =
          archiveExtremeObjectRenderModel(
            ExtremeType.X_RAY_BINARY_BH,
            seed,
            'DISCOVERED',
          );

        const xrayCatalogued =
          archiveExtremeObjectRenderModel(
            ExtremeType.X_RAY_BINARY_BH,
            seed,
            'CATALOGUED',
          );

        expect(xrayDetected.xrayBinaryModel).not.toBeNull();
        expect(xrayDiscovered.xrayBinaryModel).not.toBeNull();
        expect(xrayCatalogued.xrayBinaryModel).not.toBeNull();

        if (
          xrayDetected.xrayBinaryModel === null ||
          xrayDiscovered.xrayBinaryModel === null ||
          xrayCatalogued.xrayBinaryModel === null
        ) {
          throw new Error(
            '28.2G.3a X-ray-binary progression must expose DETECTED, DISCOVERED and CATALOGUED models.',
          );
        }

        expect(
          xrayDetected.xrayBinaryModel.donorScale,
        ).toBeLessThan(
          xrayCatalogued.xrayBinaryModel.donorScale,
        );
        expect(
          xrayDiscovered.xrayBinaryModel.donorScale,
        ).toBeGreaterThan(
          xrayDetected.xrayBinaryModel.donorScale,
        );
        expect(xrayCatalogued.detailStage).toBe('CATALOGUED');
      },
    );

    it(
      'keeps SNR and PWN on the existing canonical remnant renderer path',
      () => {
        for (
          const type
          of [
            ExtremeType.SUPERNOVA_REMNANT,
            ExtremeType.PULSAR_WIND_NEBULA,
          ] as const
        ) {
          const model =
            archiveExtremeObjectRenderModel(
              type,
              seed,
            );

          expect(model.type).toBe(type);
          expect(model.neutronStarModel).toBeNull();
          expect(model.blackHoleModel).toBeNull();
          expect(model.xrayBinaryModel).toBeNull();
        }
      },
    );

    it(
      'selects the same A-H preset for the same stable render identity',
      () => {
        const first =
          archiveExtremeObjectRenderModel(
            ExtremeType.MAGNETAR,
            seed,
          );

        const second =
          archiveExtremeObjectRenderModel(
            ExtremeType.MAGNETAR,
            seed,
          );

        expect(second.presetIndex).toBe(first.presetIndex);
        expect(second.presetLabel).toBe(first.presetLabel);
        expect(second.neutronStarModel).toEqual(first.neutronStarModel);
      },
    );

    it(
      'rejects nucleus-only ExtremeTypes and empty render identities',
      () => {
        for (
          const type
          of [
            ExtremeType.SMBH,
            ExtremeType.AGN,
            ExtremeType.QUASAR,
          ] as const
        ) {
          expect(
            () =>
              archiveExtremeObjectRenderModel(
                type,
                seed,
              ),
          ).toThrow(RangeError);
        }

        expect(
          () =>
            archiveExtremeObjectRenderModel(
              ExtremeType.NEUTRON_STAR,
              '',
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
