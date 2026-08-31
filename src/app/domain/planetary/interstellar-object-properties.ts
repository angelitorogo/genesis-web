import { InterstellarObjectCompositionRegime, type InterstellarObjectCompositionRegime as Regime } from './interstellar-object-composition-regime';
export class InterstellarObjectProperties {
  constructor(readonly encounterOrdinal:number, readonly compositionRegime:Regime, readonly diameterKilometers:number, readonly refractoryFraction01:number, readonly volatileFraction01:number, readonly porosityIndex01:number, readonly bulkDensityGramsPerCubicCentimeter:number, readonly geometricAlbedo:number, readonly elongationRatio:number){
    if(!Number.isInteger(encounterOrdinal)||encounterOrdinal<=0) throw new RangeError('encounterOrdinal must be positive.');
    if(!Object.values(InterstellarObjectCompositionRegime).includes(compositionRegime)) throw new RangeError('Unknown interstellar composition regime.');
    for(const [n,v] of [['diameterKilometers',diameterKilometers],['bulkDensityGramsPerCubicCentimeter',bulkDensityGramsPerCubicCentimeter],['elongationRatio',elongationRatio]] as const) if(!Number.isFinite(v)||v<=0) throw new RangeError(`${n} must be positive and finite.`);
    for(const [n,v] of [['refractoryFraction01',refractoryFraction01],['volatileFraction01',volatileFraction01],['porosityIndex01',porosityIndex01],['geometricAlbedo',geometricAlbedo]] as const) if(!Number.isFinite(v)||v<0||v>1) throw new RangeError(`${n} must be inside [0,1].`);
    if(Math.abs(refractoryFraction01+volatileFraction01-1)>1e-12) throw new RangeError('Interstellar refractory and volatile fractions must sum to 1.');
    if(elongationRatio<1) throw new RangeError('elongationRatio must be at least 1.');
  }
  get isPotentiallyVolatileActive():boolean { return this.volatileFraction01>=0.45; }
}
