import {describe,expect,it} from 'vitest';
import {systemTechnosignatureAlert37a,technosignatureProfile37a} from './technosignatures-37a';
import {regionalSignalStatus37b} from '../../presentation/galaxy-map/regional-technosignature-37b';

/** Certificación 37.C: VIDA.7 es la única fuente del nivel tecnológico. */
describe('37.C: compatibilidad estricta entre tecnología y conocimiento',()=>{
  it('nunca declara recepción de radio instrumental por el nivel tecnológico',()=>{
    for(const tier of ['PRIMITIVE','ADVANCED','VERY_ADVANCED'] as const){
      const profile=technosignatureProfile37a({tier});
      expect(profile.observedRadioSignal).toBe(false);
      expect(Object.isFrozen(profile)).toBe(true);
      expect(profile.tier).toBe(tier);
    }
  });
  it('primitiva no emite radio; avanzada y muy avanzada no son pruebas de radio interceptada',()=>{
    expect(technosignatureProfile37a({tier:'PRIMITIVE'}).radio).toBe('NONE');
    expect(technosignatureProfile37a({tier:'PRIMITIVE'}).sceneAlert).toBe(false);
    expect(technosignatureProfile37a({tier:'ADVANCED'}).radio).toBe('POSSIBLE');
    expect(technosignatureProfile37a({tier:'VERY_ADVANCED'}).radio).toBe('EXTENDED_POSSIBLE');
  });
  it('una sola alerta local muestra el nivel tecnológico máximo conocido',()=>{
    const p=technosignatureProfile37a({tier:'PRIMITIVE'});
    const a=technosignatureProfile37a({tier:'ADVANCED'});
    const v=technosignatureProfile37a({tier:'VERY_ADVANCED'});
    expect(systemTechnosignatureAlert37a([])).toBeNull();
    expect(systemTechnosignatureAlert37a([p,p])).toBeNull();
    expect(systemTechnosignatureAlert37a([p,a])).toBe('ADVANCED');
    expect(systemTechnosignatureAlert37a([v,p,a])).toBe('VERY_ADVANCED');
  });
  it('errores parciales no se convierten en NO_SIGNAL',()=>{
    expect(regionalSignalStatus37b(false,2)).toBe('INCOMPLETE');
    expect(regionalSignalStatus37b(true,2)).toBe('DETECTED');
    expect(regionalSignalStatus37b(false,0)).toBe('NO_SIGNAL');
  });
});
