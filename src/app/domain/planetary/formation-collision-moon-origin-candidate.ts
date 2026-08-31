import { type Planet } from './planet';
import { type RelevantMoon } from './relevant-moon';

const TOLERANCE=1e-9;

/** Point-23.12 score for one existing relevant moon against one giant-collision scenario. */
export class FormationCollisionMoonOriginCandidate {
  constructor(
    readonly hostPlanet:Planet,
    readonly moon:RelevantMoon,
    readonly moonToPlanetMassRatio01:number,
    readonly moonMassCompatibilityIndex01:number,
    readonly moonOrbitCompatibilityIndex01:number,
    readonly originPlausibilityIndex01:number,
  ) {
    if(moon.hostPlanetOrdinal!==hostPlanet.planetOrdinal) {
      throw new RangeError('Point-23.12 moon-origin candidate must preserve the moon host planet ordinal.');
    }
    assertIndex(moonToPlanetMassRatio01,'moonToPlanetMassRatio01');
    assertIndex(moonMassCompatibilityIndex01,'moonMassCompatibilityIndex01');
    assertIndex(moonOrbitCompatibilityIndex01,'moonOrbitCompatibilityIndex01');
    assertIndex(originPlausibilityIndex01,'originPlausibilityIndex01');

    const expectedRatio=moon.massEarth/hostPlanet.massEarth;
    if(relativeError(moonToPlanetMassRatio01,expectedRatio)>TOLERANCE) {
      throw new RangeError('Point-23.12 moon/planet mass ratio must preserve the exact point-19/21 masses.');
    }
  }

  get moonOrdinal(){return this.moon.moonOrdinal;}
  get moonName(){return this.moon.name;}
  get moonProceduralCode(){return this.moon.proceduralCode;}
}

function assertIndex(value:number,name:string):void {
  if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);
}
function relativeError(actual:number,expected:number):number {
  return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));
}
