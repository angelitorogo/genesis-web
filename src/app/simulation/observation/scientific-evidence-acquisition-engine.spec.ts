import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1,
} from '../../domain/discovery/stellar-system-scientific-profile';

import {
  BodyLocator,
  GalacticObjectLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  CataloguedToConfirmedScientificProgressionEngine,
} from '../exploration/catalogued-to-confirmed-scientific-progression-engine';

import {
  DetectedToDiscoveredScientificProgressionEngine,
} from '../exploration/detected-to-discovered-scientific-progression-engine';

import {
  VisitedToCataloguedScientificProgressionEngine,
} from '../exploration/visited-to-catalogued-scientific-progression-engine';

import {
  ScientificEvidenceAcquisitionEngine,
} from './scientific-evidence-acquisition-engine';

import {
  StellarSystemScientificObservationCatalogV1,
  StellarSystemScientificObservationRuleCode,
} from './stellar-system-scientific-observation-catalog';

const generationKey =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

const systemLocator =
  new SystemLocator(
    0n,
    0n,
    0n,
  );

function known(
  systemState:
    typeof DiscoveryState.DETECTED |
    typeof DiscoveryState.DISCOVERED |
    typeof DiscoveryState.VISITED |
    typeof DiscoveryState.CATALOGUED |
    typeof DiscoveryState.CONFIRMED,

  advancedMilestones =
    false,
): readonly KnownDiscovery[] {

  const discoveries:
    KnownDiscovery[] =
    [
      new KnownDiscovery(
        generationKey,
        systemLocator,
        systemState,
      ),
    ];

  if (
    advancedMilestones
  ) {
    discoveries.push(
      new KnownDiscovery(
        generationKey,
        new BodyLocator(
          0n,
          0n,
          0n,
          0n,
        ),
        DiscoveryState.DISCOVERED,
      ),
      new KnownDiscovery(
        generationKey,
        new GalacticObjectLocator(
          0n,
          0n,
          1n,
        ),
        DiscoveryState.CATALOGUED,
      ),
    );
  }

  return Object.freeze(
    discoveries,
  );
}

describe(
  'ScientificEvidenceAcquisitionEngine point 26.A.8',
  () => {
    it(
      'should derive L1/L2/L3/L4 evidence quality from existing instrument precision without spending PD',
      () => {
        const rule =
          StellarSystemScientificObservationCatalogV1
            .rule(
              StellarSystemScientificObservationRuleCode.RESOLVE_NATURE_OPTICAL,
            );

        const samples =
          [
            [
              ObservationInstrumentLevel.LEVEL_1,
              0n,
              known(
                DiscoveryState.DETECTED,
              ),
              0.70,
              0.30,
            ],
            [
              ObservationInstrumentLevel.LEVEL_2,
              1000n,
              known(
                DiscoveryState.DISCOVERED,
              ),
              0.82,
              0.22,
            ],
            [
              ObservationInstrumentLevel.LEVEL_3,
              2500n,
              [
                ...known(
                  DiscoveryState.DISCOVERED,
                  true,
                ),
              ],
              0.94,
              0.14,
            ],
            [
              ObservationInstrumentLevel.LEVEL_4,
              5000n,
              known(
                DiscoveryState.DISCOVERED,
                true,
              ),
              1.00,
              0.072,
            ],
          ] as const;

        for (
          const [
            level,
            globalPd,
            discoveries,
            quality,
            uncertainty,
          ]
          of samples
        ) {
          const acquired =
            ScientificEvidenceAcquisitionEngine
              .acquire(
                generationKey,
                globalPd,
                discoveries,
                rule,
                ObservationInstrumentType.OPTICAL,
                level,
                1000,
              );

          expect(
            acquired.evidence.quality01,
          ).toBeCloseTo(
            quality,
            12,
          );
          expect(
            acquired.evidence.uncertainty01,
          ).toBeCloseTo(
            uncertainty,
            12,
          );
        }
      },
    );

    it(
      'should keep a locked instrument unavailable even when the scientific rule itself accepts it',
      () => {
        const rule =
          StellarSystemScientificObservationCatalogV1
            .rule(
              StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_RADIO,
            );

        const blocked =
          ScientificEvidenceAcquisitionEngine
            .availability(
              generationKey,
              999n,
              known(
                DiscoveryState.DISCOVERED,
              ),
              rule,
              ObservationInstrumentType.RADIO,
              ObservationInstrumentLevel.LEVEL_2,
            );

        expect(
          blocked.isRuleInstrumentCompatible,
        ).toBe(true);
        expect(
          blocked.isGloballyUnlocked,
        ).toBe(false);
        expect(
          blocked.missingGlobalDiscoveryPoints,
        ).toBe(1n);
        expect(
          blocked.isAvailable,
        ).toBe(false);
      },
    );

    it(
      'should make the A7 discovery and catalogue profiles reachable at the intended L1/L2 capability gates',
      () => {
        const discoveryEvidence =
          [
            StellarSystemScientificObservationRuleCode.RESOLVE_NATURE_OPTICAL,
            StellarSystemScientificObservationRuleCode.RESOLVE_IDENTITY_OPTICAL,
            StellarSystemScientificObservationRuleCode.RESOLVE_BASIC_ARCHITECTURE_OPTICAL,
          ]
            .map(
              ruleCode =>
                ScientificEvidenceAcquisitionEngine
                  .acquire(
                    generationKey,
                    0n,
                    known(
                      DiscoveryState.DETECTED,
                    ),
                    StellarSystemScientificObservationCatalogV1
                      .rule(
                        ruleCode,
                      ),
                    ObservationInstrumentType.OPTICAL,
                    ObservationInstrumentLevel.LEVEL_1,
                    1000,
                  )
                  .evidence,
            );

        expect(
          DetectedToDiscoveredScientificProgressionEngine
            .evaluate(
              DiscoveryState.DETECTED,
              STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
                .discoveryProfile,
              discoveryEvidence,
            )
            .stateAfter,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        const catalogueEvidence =
          [
            StellarSystemScientificObservationRuleCode.CLASSIFICATION_PHOTOMETRY,
            StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_OPTICAL,
            StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_RADIO,
            StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_ASTROMETRY,
            StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_RADIO_TIMING,
          ]
            .map(
              ruleCode => {
                const rule =
                  StellarSystemScientificObservationCatalogV1
                    .rule(
                      ruleCode,
                    );

                return ScientificEvidenceAcquisitionEngine
                  .acquire(
                    generationKey,
                    1000n,
                    known(
                      DiscoveryState.DISCOVERED,
                    ),
                    rule,
                    rule.compatibleInstrumentTypes[0],
                    ObservationInstrumentLevel.LEVEL_2,
                    2000,
                  )
                  .evidence;
              },
            );

        expect(
          VisitedToCataloguedScientificProgressionEngine
            .evaluate(
              DiscoveryState.VISITED,
              STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
                .cataloguingProfile,
              catalogueEvidence,
            )
            .stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );
      },
    );

    it(
      'should require the L4-quality follow-up set to satisfy the A7 confirmation thresholds',
      () => {
        const confirmationRuleCodes =
          [
            StellarSystemScientificObservationRuleCode.CLASSIFICATION_PHOTOMETRY,
            StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_OPTICAL,
            StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_RADIO,
            StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_ASTROMETRY,
            StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_RADIO_TIMING,
            StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY,
            StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_INFRARED,
            StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS,
          ] as const;

        const evidence =
          confirmationRuleCodes
            .map(
              ruleCode => {
                const rule =
                  StellarSystemScientificObservationCatalogV1
                    .rule(
                      ruleCode,
                    );

                return ScientificEvidenceAcquisitionEngine
                  .acquire(
                    generationKey,
                    5000n,
                    known(
                      DiscoveryState.CATALOGUED,
                      true,
                    ),
                    rule,
                    rule.compatibleInstrumentTypes[0],
                    ObservationInstrumentLevel.LEVEL_4,
                    3000,
                  )
                  .evidence;
              },
            );

        const confirmation =
          CataloguedToConfirmedScientificProgressionEngine
            .evaluate(
              DiscoveryState.CATALOGUED,
              STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
                .confirmationProfile,
              evidence,
            );

        expect(
          confirmation.stateAfter,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );
      },
    );
  },
);
