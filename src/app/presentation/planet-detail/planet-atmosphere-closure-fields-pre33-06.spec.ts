import { describe, expect, it } from 'vitest';
import { AtmosphereCausalClosureEnginePRE3306 as Engine } from '../../simulation/planetary/atmosphere-causal-closure-engine-pre33-06';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { atmosphereClosureFieldsPRE3306 } from './planet-atmosphere-closure-fields-pre33-06';

describe('PRE-33.06 transversal environmental scientific fiche fields',()=>{
  it('one consistent shared five-field block with scientific uncertainties',()=>{
    const c=Engine.evaluate({bodyKind:'PLANET',radiusEarth:1,surfaceGravityEarth:1,
      hasDefinedSolidSurface:true,legacyScenarioPressurePascal:101325,
      legacyScenarioMoleFractions:[{gas:AtmosphereGas.NITROGEN,moleFraction01:1}],
      conditionalVolatileReservoirCeilingKilograms:null,reservoirSourceId:'FORMATION_WATER',
      referenceH2OCT0Kilograms:1e20});
    const fields=atmosphereClosureFieldsPRE3306(c);
    expect(fields).toHaveLength(5);
    expect(new Set(fields.map(f=>f.label)).size).toBe(5);
    expect(fields.find(f=>f.label.includes('presión'))?.value).toContain('No resuelto');
    expect(fields[0].value).toContain('H₂O CT-0');
    expect(fields[0].value).toContain('No resuelto');
    expect(fields.every(f=>f.note.length>20)).toBe(true);
  });
  it('legacy versions add no V3 fields',()=>{
    expect(atmosphereClosureFieldsPRE3306(null)).toEqual([]);
  });
});
