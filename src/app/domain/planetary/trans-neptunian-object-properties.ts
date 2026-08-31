import { TransNeptunianObjectDynamicalRegime, type TransNeptunianObjectDynamicalRegime as Regime } from './trans-neptunian-object-dynamical-regime';
export class TransNeptunianObjectProperties {
  constructor(readonly objectOrdinal:number, readonly dynamicalRegime:Regime, readonly diameterKilometers:number, readonly iceFraction01:number, readonly rockFraction01:number, readonly geometricAlbedo:number, readonly bulkDensityGramsPerCubicCentimeter:number, readonly gravitatingMassSolar:number, readonly semiMajorAxisAu:number, readonly eccentricity:number, readonly inclinationDegrees:number, readonly longitudeOfAscendingNodeDegrees:number, readonly argumentOfPeriapsisDegrees:number, readonly meanAnomalyDegrees:number, readonly orbitalPeriodYears:number){
    if(!Number.isInteger(objectOrdinal)||objectOrdinal<=0) throw new RangeError('objectOrdinal must be positive.');
    if(!Object.values(TransNeptunianObjectDynamicalRegime).includes(dynamicalRegime)) throw new RangeError('Unknown TNO dynamical regime.');
    for(const [n,v] of [['diameterKilometers',diameterKilometers],['bulkDensity',bulkDensityGramsPerCubicCentimeter],['gravitatingMassSolar',gravitatingMassSolar],['semiMajorAxisAu',semiMajorAxisAu],['orbitalPeriodYears',orbitalPeriodYears]] as const) if(!Number.isFinite(v)||v<=0) throw new RangeError(`${n} must be positive and finite.`);
    for(const [n,v] of [['iceFraction01',iceFraction01],['rockFraction01',rockFraction01],['geometricAlbedo',geometricAlbedo]] as const) if(!Number.isFinite(v)||v<0||v>1) throw new RangeError(`${n} must be inside [0,1].`);
    if(Math.abs(iceFraction01+rockFraction01-1)>1e-12) throw new RangeError('TNO ice and rock fractions must sum to 1.');
    if(!Number.isFinite(eccentricity)||eccentricity<0||eccentricity>=1) throw new RangeError('eccentricity must be inside [0,1).');
    if(!Number.isFinite(inclinationDegrees)||inclinationDegrees<0||inclinationDegrees>180) throw new RangeError('inclinationDegrees must be inside [0,180].');
  }
  get periapsisAu():number { return this.semiMajorAxisAu*(1-this.eccentricity); }
  get apoapsisAu():number { return this.semiMajorAxisAu*(1+this.eccentricity); }
  get isDwarfPlanetScaleCandidate():boolean { return this.diameterKilometers>=900; }
}
