import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from './galactic-object-scientific-subject';

describe(
  'point-12.7 GalacticObject scientific subject contracts',
  () => {
    it(
      'should expose exactly the five physical subjects implemented through points 12.2 to 12.6',
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
