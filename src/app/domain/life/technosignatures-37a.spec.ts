import { describe,it,expect } from 'vitest';
import { technosignatureProfile37a,systemTechnosignatureAlert37a } from './technosignatures-37a';

describe('37.A: perfiles cualitativos de tecnofirmas nativas',()=>{
  it('las primitivas carecen de radio artificial y no disparan aviso',()=>{
    const p=technosignatureProfile37a({tier:'PRIMITIVE'});
    expect(p.radio).toBe('NONE');
    expect(p.nightLight).toBe('LOCAL_POSSIBLE');
    expect(p.sceneAlert).toBe(false);
    expect(systemTechnosignatureAlert37a([p])).toBeNull();
  });
  it('las avanzadas admiten comunicaciones potenciales, no una detección inventada',()=>{
    const p=technosignatureProfile37a({tier:'ADVANCED'});
    expect(p.radio).toBe('POSSIBLE');
    expect(p.observedRadioSignal).toBe(false);
    expect(systemTechnosignatureAlert37a([p])).toBe('ADVANCED');
  });
  it('las muy avanzadas prevalecen sin declarar observaciones o estructuras reales',()=>{
    const primitive=technosignatureProfile37a({tier:'PRIMITIVE'});
    const advanced=technosignatureProfile37a({tier:'ADVANCED'});
    const very=technosignatureProfile37a({tier:'VERY_ADVANCED'});
    expect(very.observedRadioSignal).toBe(false);
    expect(very.radio).toBe('EXTENDED_POSSIBLE');
    expect(systemTechnosignatureAlert37a([primitive,advanced,very])).toBe('VERY_ADVANCED');
    expect(systemTechnosignatureAlert37a([])).toBeNull();
  });
});
