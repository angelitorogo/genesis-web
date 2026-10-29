import { TestBed } from '@angular/core/testing';
import { describe,it,expect,vi,beforeEach } from 'vitest';
import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import type { ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { SystemTechnosignatureAlert37a } from './system-technosignature-alert-37a';
import { SystemTechnosignature37aDataSource } from './system-technosignature-37a.data-source';

const model=(state:DiscoveryStateValue=DiscoveryState.CONFIRMED,system=7n)=>({
  universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
  generatorVersionCode:3,galaxyIndex:0n,sectorKey:4n,
  galacticObjectIndex:system,discoveryState:state,
}) as unknown as ArchiveDiscoveryDetailModel;

describe('37.A: aviso de sistema sin revelar planeta',()=>{
  const read=vi.fn();
  beforeEach(async()=>{
    read.mockReset();
    await TestBed.configureTestingModule({imports:[SystemTechnosignatureAlert37a],
      providers:[{provide:SystemTechnosignature37aDataSource,useValue:{read}}]}).compileComponents();
  });
  it('muestra aviso avanzado y permite cerrarlo, sin revelar localización',async()=>{
    read.mockResolvedValue({alert:'ADVANCED',profiles:[]});
    const fixture=TestBed.createComponent(SystemTechnosignatureAlert37a);
    fixture.componentRef.setInput('model',model());
    fixture.detectChanges();
    await vi.waitFor(()=>{
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="system-37a-technology-alert"]')).not.toBeNull();
    });
    const node=fixture.nativeElement as HTMLElement;
    const text=node.querySelector('[data-testid="system-37a-technology-alert"]')?.textContent??'';
    expect(text).toContain('civilización avanzada');
    expect(text).not.toContain('Planeta 7');
    expect(text).not.toContain('especie fundadora');
    (node.querySelector('[data-testid="system-37a-technology-dismiss"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(node.querySelector('[data-testid="system-37a-technology-alert"]')).toBeNull();
  });
  it('no consulta biología de sistemas no confirmados',()=>{
    const fixture=TestBed.createComponent(SystemTechnosignatureAlert37a);
    fixture.componentRef.setInput('model',model(DiscoveryState.CATALOGUED));
    fixture.detectChanges();
    expect(read).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="system-37a-technology-alert"]')).toBeNull();
  });
  it('descarta respuestas tardías cuando se cambia de sistema',async()=>{
    let release:((result:{alert:'ADVANCED';profiles:[]})=>void)|undefined;
    read.mockReturnValueOnce(new Promise(resolve=>{release=resolve;}));
    read.mockResolvedValueOnce({alert:null,profiles:[]});
    const fixture=TestBed.createComponent(SystemTechnosignatureAlert37a);
    fixture.componentRef.setInput('model',model(DiscoveryState.CONFIRMED,7n));
    fixture.detectChanges();
    expect(read).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('model',model(DiscoveryState.CONFIRMED,8n));
    fixture.detectChanges();
    expect(read).toHaveBeenCalledTimes(2);
    expect(release).toBeDefined();
    release?.({alert:'ADVANCED',profiles:[]});
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="system-37a-technology-alert"]')).toBeNull();
  });
});
