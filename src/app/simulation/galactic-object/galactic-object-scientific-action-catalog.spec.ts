import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

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
  ObservationActionCatalogV1,
} from '../observation/observation-action-catalog';

import {
  GalacticObjectScientificActionCatalogV1,
} from './galactic-object-scientific-action-catalog';

describe(
  'GalacticObjectScientificActionCatalogV1',
  () => {
    it(
      'should freeze exactly thirteen actions in canonical roadmap order',
      () => {
        expect(
          GalacticObjectScientificActionCatalogV1
            .supportedActions,
        ).toEqual([
          GalacticObjectScientificActionType.NEBULA_SURVEY,
          GalacticObjectScientificActionType.STAR_CLUSTER_SURVEY,
          GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
          GalacticObjectScientificActionType.NEBULA_SPECTROSCOPIC_CHARACTERIZATION,
          GalacticObjectScientificActionType.NEBULA_PHYSICAL_CONFIRMATION,
          GalacticObjectScientificActionType.HII_IONIZATION_CHARACTERIZATION,
          GalacticObjectScientificActionType.HII_STAR_FORMATION_CONFIRMATION,
          GalacticObjectScientificActionType.OPEN_CLUSTER_POPULATION_CHARACTERIZATION,
          GalacticObjectScientificActionType.OPEN_CLUSTER_AGE_METALLICITY_CONFIRMATION,
          GalacticObjectScientificActionType.GLOBULAR_CLUSTER_STRUCTURE_CHARACTERIZATION,
          GalacticObjectScientificActionType.GLOBULAR_CLUSTER_POPULATION_CONFIRMATION,
          GalacticObjectScientificActionType.SUPERNOVA_REMNANT_SHOCK_CHARACTERIZATION,
          GalacticObjectScientificActionType.SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION,
        ]);
      },
    );

    it(
      'should expose one and only one DETECTED to DISCOVERED survey for each coarse GalacticObject family',
      () => {
        for (
          const family
          of Object.values(
            GalacticObjectScientificSurveyFamily,
          )
        ) {
          const rule =
            GalacticObjectScientificActionCatalogV1
              .surveyRule(
                family,
              );

          expect(
            rule.minimumDiscoveryState,
          ).toBe(
            DiscoveryState.DETECTED,
          );

          expect(
            rule.targetDiscoveryState,
          ).toBe(
            DiscoveryState.DISCOVERED,
          );

          expect(
            rule.scientificSubject,
          ).toBeNull();
        }
      },
    );

    it(
      'should expose exactly characterization then confirmation for every supported physical subject',
      () => {
        for (
          const subject
          of Object.values(
            GalacticObjectScientificSubject,
          )
        ) {
          const rules =
            GalacticObjectScientificActionCatalogV1
              .subjectRules(
                subject,
              );

          expect(
            rules,
          ).toHaveLength(2);

          expect(
            rules[0].minimumDiscoveryState,
          ).toBe(
            DiscoveryState.DISCOVERED,
          );

          expect(
            rules[0].targetDiscoveryState,
          ).toBe(
            DiscoveryState.CATALOGUED,
          );

          expect(
            rules[1].minimumDiscoveryState,
          ).toBe(
            DiscoveryState.CATALOGUED,
          );

          expect(
            rules[1].targetDiscoveryState,
          ).toBe(
            DiscoveryState.CONFIRMED,
          );
        }
      },
    );

    it(
      'should never broaden the frozen point-8.7 generic instrument compatibility matrix',
      () => {
        for (
          const rule
          of GalacticObjectScientificActionCatalogV1
            .rules
        ) {
          const genericRule =
            ObservationActionCatalogV1
              .rule(
                rule.observationActionType,
              );

          expect(
            rule
              .compatibleInstrumentTypes
              .every(
                (
                  instrumentType,
                ) =>
                  genericRule
                    .compatibleInstrumentTypes
                    .includes(
                      instrumentType,
                    ),
              ),
          ).toBe(true);
        }
      },
    );

    it(
      'should preserve the frozen V1 instrument and level matrix for representative actions',
      () => {
        const nebulaSpectrum =
          GalacticObjectScientificActionCatalogV1
            .rule(
              GalacticObjectScientificActionType
                .NEBULA_SPECTROSCOPIC_CHARACTERIZATION,
            );

        expect(
          nebulaSpectrum.observationActionType,
        ).toBe(
          ObservationActionType.ACQUIRE_SPECTRUM,
        );

        expect(
          nebulaSpectrum.compatibleInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType.SPECTROSCOPY,
        ]);

        expect(
          nebulaSpectrum.minimumInstrumentLevel,
        ).toBe(
          ObservationInstrumentLevel.LEVEL_2,
        );

        const snrConfirm =
          GalacticObjectScientificActionCatalogV1
            .rule(
              GalacticObjectScientificActionType
                .SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION,
            );

        expect(
          snrConfirm.observationActionType,
        ).toBe(
          ObservationActionType.TEMPORAL_MONITORING,
        );

        expect(
          snrConfirm.compatibleInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType.RADIO,
          ObservationInstrumentType.X_RAY,
        ]);

        expect(
          snrConfirm.minimumInstrumentLevel,
        ).toBe(
          ObservationInstrumentLevel.LEVEL_4,
        );
      },
    );

    it(
      'should reject unknown action and subject lookups',
      () => {
        expect(
          () =>
            GalacticObjectScientificActionCatalogV1
              .rule(
                'UNKNOWN' as GalacticObjectScientificActionType,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            GalacticObjectScientificActionCatalogV1
              .subjectRules(
                'UNKNOWN' as GalacticObjectScientificSubject,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
