import { CapturedExtrasolarObjectCaptureRegime } from './captured-extrasolar-object-capture-regime';
describe('CapturedExtrasolarObjectCaptureRegime point 22.9',()=>{it('should expose only multi-body capture channels',()=>{expect(Object.values(CapturedExtrasolarObjectCaptureRegime)).toEqual(['PLANETARY_SCATTERING','BINARY_EXCHANGE','COMBINED_MULTIBODY']);});});
