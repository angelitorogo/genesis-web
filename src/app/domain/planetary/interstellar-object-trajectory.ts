const AU_PER_YEAR_TO_KM_PER_SECOND=4.740470463533349;
const TWO_PI_SQUARED=4*Math.PI*Math.PI;
const TOL=1e-9;
export class InterstellarObjectTrajectory {
  constructor(readonly gravitatingMassSolar:number, readonly hyperbolicExcessVelocityKmPerSecond:number, readonly periapsisAu:number, readonly eccentricity:number, readonly semiMajorAxisAu:number, readonly inclinationDegrees:number, readonly longitudeOfAscendingNodeDegrees:number, readonly argumentOfPeriapsisDegrees:number){
    for(const [n,v] of [['gravitatingMassSolar',gravitatingMassSolar],['hyperbolicExcessVelocityKmPerSecond',hyperbolicExcessVelocityKmPerSecond],['periapsisAu',periapsisAu]] as const) if(!Number.isFinite(v)||v<=0) throw new RangeError(`${n} must be positive and finite.`);
    if(!Number.isFinite(eccentricity)||eccentricity<=1) throw new RangeError('Interstellar trajectories must be hyperbolic with eccentricity > 1.');
    if(!Number.isFinite(semiMajorAxisAu)||semiMajorAxisAu>=0) throw new RangeError('Hyperbolic semiMajorAxisAu must be finite and negative.');
    if(!Number.isFinite(inclinationDegrees)||inclinationDegrees<0||inclinationDegrees>180) throw new RangeError('inclinationDegrees must be inside [0,180].');
    for(const [n,v] of [['longitudeOfAscendingNodeDegrees',longitudeOfAscendingNodeDegrees],['argumentOfPeriapsisDegrees',argumentOfPeriapsisDegrees]] as const) if(!Number.isFinite(v)||v<0||v>=360) throw new RangeError(`${n} must be inside [0,360).`);
    const vAuYr=hyperbolicExcessVelocityKmPerSecond/AU_PER_YEAR_TO_KM_PER_SECOND;
    const expectedAbsA=TWO_PI_SQUARED*gravitatingMassSolar/(vAuYr*vAuYr);
    if(relativeError(Math.abs(semiMajorAxisAu),expectedAbsA)>TOL) throw new RangeError('Hyperbolic semi-major axis must match the frozen host mass and v-infinity.');
    if(relativeError(periapsisAu,Math.abs(semiMajorAxisAu)*(eccentricity-1))>TOL) throw new RangeError('Hyperbolic periapsis must satisfy q = |a| (e - 1).');
  }
  get isBound():boolean { return false; }
  get isHyperbolic():boolean { return true; }
  get periapsisVelocityKmPerSecond():number { const vInfAuYr=this.hyperbolicExcessVelocityKmPerSecond/AU_PER_YEAR_TO_KM_PER_SECOND; const mu=TWO_PI_SQUARED*this.gravitatingMassSolar; return Math.sqrt(vInfAuYr*vInfAuYr+2*mu/this.periapsisAu)*AU_PER_YEAR_TO_KM_PER_SECOND; }
}
function relativeError(a:number,b:number):number{return Math.abs(a-b)/Math.max(1,Math.abs(a),Math.abs(b));}
