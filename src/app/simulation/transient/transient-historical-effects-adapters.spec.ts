import { GreatStellarFlareSourceProfile, GreatStellarFlareSourceKind as Kind, GreatStellarFlareEventState as State } from '../../domain/transient/great-stellar-flare-source-profile';
import { StellarActivityProfile } from '../../domain/stellar/stellar-activity-profile';
import { StellarActivityRegime } from '../../domain/stellar/stellar-activity-regime';
import { historicalEventFromStellarFlare } from './transient-historical-effects-adapters';
import { TransientHistoricalEffectsEngine } from './transient-historical-effects-engine';

describe('29.11 adapter from actual 29.9 input profile', () => {
  const activity = new StellarActivityProfile(true, 0.86, StellarActivityRegime.EXTREME, 1.4, 2e25, 3.496e27);
  const build = (state: typeof State.EXPLICIT_LARGE_FLARE | typeof State.STATISTICAL_ACTIVITY_ONLY) =>
    new GreatStellarFlareSourceProfile(Kind.ORDINARY_STAR,'enana M',0.3,0.02,activity,state,
      state===State.EXPLICIT_LARGE_FLARE?1e27:null,state===State.EXPLICIT_LARGE_FLARE?3600:null);
  it('conserva energía y duración reales, no inventa UV ni fecha',()=>{
    const e=historicalEventFromStellarFlare(build(State.EXPLICIT_LARGE_FLARE),{id:'one',yearsBeforeReference:null,emissionGeometry:'UNRESOLVED'});
    expect(e.photonEnergyJoules).toBe(1e27);
    expect(e.sourceDurationSeconds).toBe(3600);
    expect(e.band).toBe('BOLOMETRIC');
    expect(e.yearsBeforeReference).toBeNull();
    expect(e.state).toBe('INTRINSIC_REFERENCE_ONLY');
    expect(TransientHistoricalEffectsEngine.assessEvent({id:'p',label:'p',kind:'PLANET',separationAu:1,effectiveOpticalDepth:null,biosphereCharacterized:false},e).topOfAtmosphereFluenceJoulesPerSquareMeter).toBeNull();
  });
  it('no convierte la referencia 29.9 en una exposición pasada por añadir geometría',()=>{
    const e=historicalEventFromStellarFlare(build(State.EXPLICIT_LARGE_FLARE),{id:'reference',yearsBeforeReference:null,emissionGeometry:'ISOTROPIC_TOTAL'});
    const target={id:'p',label:'p',kind:'PLANET' as const,separationAu:1,effectiveOpticalDepth:null,biosphereCharacterized:false};
    expect(e.state).toBe('INTRINSIC_REFERENCE_ONLY');
    expect(TransientHistoricalEffectsEngine.assessEvent(target,e).topOfAtmosphereFluenceJoulesPerSquareMeter).toBeNull();
  });
  it('mantiene actividad estadística sin evento ni historia',()=>{
    const e=historicalEventFromStellarFlare(build(State.STATISTICAL_ACTIVITY_ONLY),{id:'stats',yearsBeforeReference:300,emissionGeometry:'ISOTROPIC_TOTAL'});
    expect(e.state).toBe('STATISTICAL_ONLY');
    expect(e.yearsBeforeReference).toBeNull();
    expect(e.photonEnergyJoules).toBeNull();
  });
});
