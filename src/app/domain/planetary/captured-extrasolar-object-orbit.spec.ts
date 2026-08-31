import { CapturedExtrasolarObjectOrbit } from './captured-extrasolar-object-orbit';
describe('CapturedExtrasolarObjectOrbit point 22.9',()=>{it('should require a bound Keplerian orbit',()=>{const a=20,e=.7;const o=new CapturedExtrasolarObjectOrbit(1,a,e,120,10,20,30,a*(1-e),a*(1+e),Math.sqrt(a**3));expect(o.isBound).toBe(true);expect(o.specificOrbitalEnergyAu2PerYear2).toBeLessThan(0);});});
