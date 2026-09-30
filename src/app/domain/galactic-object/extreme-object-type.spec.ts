import {
  EXTREME_TYPE_CATALOGUE,
  EXTREME_TYPE_DEFINITIONS,
  EXTREME_TYPE_ORDER,
  ExtremeFamily,
  ExtremeSemanticKind,
  ExtremeType,
  extremeTypeDefinition,
  isBlackHoleExtremeType,
  isCompactBinaryExtremeType,
  isGalacticNucleusExtremeType,
  isNeutronStarExtremeType,
  supportsAccretionObservation,
  supportsJetObservation,
  supportsMagneticObservation,
  supportsPulseObservation,
} from './extreme-object-type';

describe(
  '28.2F.1 extreme-object taxonomy',
  () => {
    it(
      'should freeze exactly the fifteen canonical extreme types in stable presentation order',
      () => {
        expect(
          EXTREME_TYPE_ORDER,
        ).toEqual([
          'SMBH',
          'AGN',
          'QUASAR',
          'NEUTRON_STAR',
          'PULSAR',
          'MILLISECOND_PULSAR',
          'MAGNETAR',
          'STELLAR_MASS_BLACK_HOLE',
          'INTERMEDIATE_MASS_BLACK_HOLE',
          'SUPERNOVA_REMNANT',
          'PULSAR_WIND_NEBULA',
          'X_RAY_BINARY_NS',
          'X_RAY_BINARY_BH',
          'MICROQUASAR',
          'ULX',
        ]);

        expect(
          Object.isFrozen(
            ExtremeType,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            EXTREME_TYPE_ORDER,
          ),
        ).toBe(true);
      },
    );

    it(
      'should provide one immutable definition for every canonical type',
      () => {
        expect(
          EXTREME_TYPE_CATALOGUE,
        ).toHaveLength(
          15,
        );

        expect(
          new Set(
            EXTREME_TYPE_CATALOGUE
              .map(
                definition =>
                  definition.type,
              ),
          ).size,
        ).toBe(
          15,
        );

        for (
          const type
          of EXTREME_TYPE_ORDER
        ) {
          const definition =
            EXTREME_TYPE_DEFINITIONS[
              type
            ];

          expect(
            definition.type,
          ).toBe(
            type,
          );

          expect(
            Object.isFrozen(
              definition,
            ),
          ).toBe(true);

          expect(
            Object.isFrozen(
              definition.capabilities,
            ),
          ).toBe(true);
        }
      },
    );

    it(
      'should keep nuclear regimes distinct from distributed compact-object families',
      () => {
        for (
          const type
          of [
            ExtremeType.SMBH,
            ExtremeType.AGN,
            ExtremeType.QUASAR,
          ]
        ) {
          expect(
            isGalacticNucleusExtremeType(
              type,
            ),
          ).toBe(true);

          expect(
            extremeTypeDefinition(
              type,
            ).family,
          ).toBe(
            ExtremeFamily.GALACTIC_NUCLEUS,
          );
        }

        expect(
          extremeTypeDefinition(
            ExtremeType.SMBH,
          ).semanticKind,
        ).toBe(
          ExtremeSemanticKind.COMPACT_OBJECT,
        );

        expect(
          extremeTypeDefinition(
            ExtremeType.AGN,
          ).semanticKind,
        ).toBe(
          ExtremeSemanticKind.ACTIVITY_REGIME,
        );

        expect(
          extremeTypeDefinition(
            ExtremeType.QUASAR,
          ).semanticKind,
        ).toBe(
          ExtremeSemanticKind.ACTIVITY_REGIME,
        );

        expect(
          isGalacticNucleusExtremeType(
            ExtremeType.PULSAR,
          ),
        ).toBe(false);
      },
    );

    it(
      'should classify neutron-star and black-hole branches without conflating them with nuclear activity',
      () => {
        expect(
          [
            ExtremeType.NEUTRON_STAR,
            ExtremeType.PULSAR,
            ExtremeType.MILLISECOND_PULSAR,
            ExtremeType.MAGNETAR,
          ].every(
            isNeutronStarExtremeType,
          ),
        ).toBe(true);

        expect(
          isBlackHoleExtremeType(
            ExtremeType.STELLAR_MASS_BLACK_HOLE,
          ),
        ).toBe(true);

        expect(
          isBlackHoleExtremeType(
            ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
          ),
        ).toBe(true);

        expect(
          isBlackHoleExtremeType(
            ExtremeType.SMBH,
          ),
        ).toBe(true);

        expect(
          isBlackHoleExtremeType(
            ExtremeType.AGN,
          ),
        ).toBe(false);
      },
    );

    it(
      'should classify the compact-binary branch explicitly',
      () => {
        expect(
          [
            ExtremeType.X_RAY_BINARY_NS,
            ExtremeType.X_RAY_BINARY_BH,
            ExtremeType.MICROQUASAR,
          ].every(
            isCompactBinaryExtremeType,
          ),
        ).toBe(true);

        expect(
          isCompactBinaryExtremeType(
            ExtremeType.ULX,
          ),
        ).toBe(false);
      },
    );

    it(
      'should expose observation capabilities without asserting that an optional phenomenon is present',
      () => {
        expect(
          supportsPulseObservation(
            ExtremeType.PULSAR,
          ),
        ).toBe(true);

        expect(
          supportsPulseObservation(
            ExtremeType.MILLISECOND_PULSAR,
          ),
        ).toBe(true);

        expect(
          supportsPulseObservation(
            ExtremeType.MAGNETAR,
          ),
        ).toBe(true);

        expect(
          supportsMagneticObservation(
            ExtremeType.MAGNETAR,
          ),
        ).toBe(true);

        expect(
          supportsMagneticObservation(
            ExtremeType.PULSAR,
          ),
        ).toBe(false);

        expect(
          supportsAccretionObservation(
            ExtremeType.X_RAY_BINARY_NS,
          ),
        ).toBe(true);

        expect(
          supportsAccretionObservation(
            ExtremeType.ULX,
          ),
        ).toBe(true);

        expect(
          supportsJetObservation(
            ExtremeType.MICROQUASAR,
          ),
        ).toBe(true);

        expect(
          supportsJetObservation(
            ExtremeType.SUPERNOVA_REMNANT,
          ),
        ).toBe(false);
      },
    );
  },
);
