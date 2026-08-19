import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  SpectrumPlot,
} from '../spectroscopy/spectrum-plot';

import {
  SpectroscopyValidationCaseId,
  SPECTROSCOPY_VALIDATION_CASES,
  SpectroscopyValidationFixtures,
  type SpectroscopyValidationCase,
} from './spectroscopy-validation-fixtures';

const SpectroscopyValidationLevelId =
  Object.freeze({
    LEVEL_1:
      'L1',

    LEVEL_2:
      'L2',

    LEVEL_3:
      'L3',

    LEVEL_4:
      'L4',

    LEVEL_5:
      'L5',
  } as const);

type SpectroscopyValidationLevelId =
  typeof SpectroscopyValidationLevelId[
    keyof typeof SpectroscopyValidationLevelId
  ];

interface SpectroscopyValidationLevel {
  readonly id:
    SpectroscopyValidationLevelId;

  readonly label:
    string;

  readonly level:
    ObservationInstrumentLevel;
}

const LEVELS:
  readonly SpectroscopyValidationLevel[] =
  Object.freeze([
    Object.freeze({
      id:
        SpectroscopyValidationLevelId
          .LEVEL_1,
      label:
        'L1',
      level:
        ObservationInstrumentLevel
          .LEVEL_1,
    }),
    Object.freeze({
      id:
        SpectroscopyValidationLevelId
          .LEVEL_2,
      label:
        'L2',
      level:
        ObservationInstrumentLevel
          .LEVEL_2,
    }),
    Object.freeze({
      id:
        SpectroscopyValidationLevelId
          .LEVEL_3,
      label:
        'L3',
      level:
        ObservationInstrumentLevel
          .LEVEL_3,
    }),
    Object.freeze({
      id:
        SpectroscopyValidationLevelId
          .LEVEL_4,
      label:
        'L4',
      level:
        ObservationInstrumentLevel
          .LEVEL_4,
    }),
    Object.freeze({
      id:
        SpectroscopyValidationLevelId
          .LEVEL_5,
      label:
        'L5',
      level:
        ObservationInstrumentLevel
          .LEVEL_5,
    }),
  ]);

@Component({
  selector:
    'app-spectroscopy-validation',

  standalone:
    true,

  imports: [
    SpectrumPlot,
  ],

  templateUrl:
    './spectroscopy-validation.html',

  styleUrl:
    './spectroscopy-validation.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class SpectroscopyValidationPage {

  readonly cases =
    SPECTROSCOPY_VALIDATION_CASES;

  readonly levels =
    LEVELS;

  readonly selectedCaseId =
    signal<SpectroscopyValidationCaseId>(
      SpectroscopyValidationCaseId
        .STELLAR,
    );

  readonly selectedLevelId =
    signal<SpectroscopyValidationLevelId>(
      SpectroscopyValidationLevelId
        .LEVEL_3,
    );

  readonly selectedCase =
    computed<
      SpectroscopyValidationCase
    >(
      () =>
        this.cases
          .find(
            entry =>
              entry.id ===
              this.selectedCaseId(),
          ) ??
        this.cases[
          0
        ],
    );

  readonly selectedLevel =
    computed<
      SpectroscopyValidationLevel
    >(
      () =>
        this.levels
          .find(
            entry =>
              entry.id ===
              this.selectedLevelId(),
          ) ??
        this.levels[
          2
        ],
    );

  readonly frame =
    computed(
      () =>
        SpectroscopyValidationFixtures
          .frame(
            this.selectedCaseId(),
            this
              .selectedLevel()
              .level,
          ),
    );

  readonly comparison =
    computed(
      () =>
        SpectroscopyValidationFixtures
          .comparison(
            this.selectedCaseId(),
          ),
    );

  selectCase(
    caseId:
      SpectroscopyValidationCaseId,
  ): void {

    this.selectedCaseId
      .set(
        caseId,
      );
  }

  selectLevel(
    levelId:
      SpectroscopyValidationLevelId,
  ): void {

    this.selectedLevelId
      .set(
        levelId,
      );
  }
}
