import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from './galactic-object-scientific-subject';

describe(
  'point-12.7 GalacticObject scientific subject contracts',
  () => {
    it(
      'should preserve the five point-12 physical subjects and append the two V2 subjects',
      () => {
        expect(
          Object.values(
            GalacticObjectScientificSubject,
          ),
        ).toEqual([
          GalacticObjectScientificSubject.NEBULA,
          GalacticObjectScientificSubject.HII_REGION,
          GalacticObjectScientificSubject.OPEN_CLUSTER,
          GalacticObjectScientificSubject.GLOBULAR_CLUSTER,
          GalacticObjectScientificSubject.SUPERNOVA_REMNANT,
          GalacticObjectScientificSubject.INTERMEDIATE_MASS_BLACK_HOLE,
          GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS,
        ]);
      },
    );

    it(
      'should expose only the three persistent point-9.4 GalacticObject survey families',
      () => {
        expect(
          Object.values(
            GalacticObjectScientificSurveyFamily,
          ),
        ).toEqual([
          GalacticObjectScientificSurveyFamily.NEBULA,
          GalacticObjectScientificSurveyFamily.STAR_CLUSTER,
          GalacticObjectScientificSurveyFamily.EXTREME_OBJECT,
        ]);
      },
    );
  },
);
