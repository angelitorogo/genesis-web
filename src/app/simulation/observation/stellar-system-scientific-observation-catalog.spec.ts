import {
  DetectedToDiscoveredScientificDimension,
} from '../../domain/discovery/detected-to-discovered-scientific-profile';

import {
  STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
  StellarSystemScientificDimension,
} from '../../domain/discovery/stellar-system-scientific-profile';

import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  StellarSystemScientificObservationCatalogV1,
  StellarSystemScientificObservationRuleCode,
} from './stellar-system-scientific-observation-catalog';

describe(
  'StellarSystemScientificObservationCatalogV1 point 26.A.8',
  () => {
    it(
      'should freeze exactly eleven unique STELLAR_SYSTEM evidence methods',
      () => {
        const rules =
          StellarSystemScientificObservationCatalogV1
            .rules;

        expect(
          rules,
        ).toHaveLength(11);
        expect(
          new Set(
            rules.map(
              rule =>
                rule.ruleCode,
            ),
          ).size,
        ).toBe(11);
        expect(
          rules.every(
            rule =>
              rule.profileCode ===
              STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
          ),
        ).toBe(true);
        expect(
          Object.isFrozen(
            rules,
          ),
        ).toBe(true);
      },
    );

    it(
      'should bootstrap DETECTED to DISCOVERED with Optical L1 only, avoiding a first-system unlock cycle',
      () => {
        const discoveryRules =
          [
            DetectedToDiscoveredScientificDimension.NATURE,
            DetectedToDiscoveredScientificDimension.IDENTITY,
            DetectedToDiscoveredScientificDimension.BASIC_ARCHITECTURE,
          ]
            .flatMap(
              dimension =>
                StellarSystemScientificObservationCatalogV1
                  .rulesForDimension(
                    dimension,
                  ),
            );

        expect(
          discoveryRules,
        ).toHaveLength(3);

        for (
          const rule
          of discoveryRules
        ) {
          expect(
            rule.compatibleInstrumentTypes,
          ).toEqual([
            ObservationInstrumentType.OPTICAL,
          ]);
          expect(
            rule.minimumInstrumentLevel,
          ).toBe(
            ObservationInstrumentLevel.LEVEL_1,
          );
        }
      },
    );

    it(
      'should provide enough independent L2 methods for cataloguing and additional L4 methods for confirmation',
      () => {
        expect(
          StellarSystemScientificObservationCatalogV1
            .rulesForDimension(
              StellarSystemScientificDimension.STELLAR_CLASSIFICATION,
            )
            .map(
              rule =>
                rule.independenceKey,
            ),
        ).toEqual([
          'PHOTOMETRY',
          'SPECTROSCOPY',
        ]);

        expect(
          new Set(
            StellarSystemScientificObservationCatalogV1
              .rulesForDimension(
                StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
              )
              .map(
                rule =>
                  rule.independenceKey,
              ),
          ).size,
        ).toBe(3);

        expect(
          new Set(
            StellarSystemScientificObservationCatalogV1
              .rulesForDimension(
                StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
              )
              .map(
                rule =>
                  rule.independenceKey,
              ),
          ).size,
        ).toBe(3);

        expect(
          StellarSystemScientificObservationCatalogV1
            .rule(
              StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY,
            )
            .observationActionType,
        ).toBe(
          ObservationActionType.ACQUIRE_SPECTRUM,
        );

        expect(
          StellarSystemScientificObservationCatalogV1
            .rule(
              StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY,
            )
            .minimumInstrumentLevel,
        ).toBe(
          ObservationInstrumentLevel.LEVEL_4,
        );
      },
    );
  },
);
