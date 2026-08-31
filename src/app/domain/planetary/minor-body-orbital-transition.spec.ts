import { MinorBodyKind } from './minor-body-kind';
import { MinorBodyOrbitConicRegime } from './minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from './minor-body-orbital-elements';
import { MinorBodyOrbitalTransition } from './minor-body-orbital-transition';

const ID='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

describe('MinorBodyOrbitalTransition point 23.6',()=>{
  it('should preserve the exact source orbit when no encounter is resolved',()=>{
    const orbit=new MinorBodyOrbitalElements(MinorBodyKind.ASTEROID,ID,'AST',MinorBodyOrbitConicRegime.ELLIPTIC,1,2,0.1,2,3,4,5,1.8,2.2,Math.sqrt(8));
    const body={body:{},orbitalElements:orbit} as any;
    const transition=new MinorBodyOrbitalTransition(body,orbit,orbit,null);
    expect(transition.orbitalChangeOccurred).toBe(false);
  });
});
