import { InterstellarObjectCompositionRegime as R } from './interstellar-object-composition-regime';
describe('InterstellarObjectCompositionRegime point 22.8',()=>{it('should expose the three V1 composition families',()=>{expect(Object.values(R)).toEqual(['ROCK_DOMINATED','MIXED','VOLATILE_RICH']);});});
