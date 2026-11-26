import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { ArchiveDiscoveryDetail } from './archive-discovery-detail';
import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
} from './archive-discovery-detail.facade';

/** Navigation must refresh the centre even when Angular reuses this component. */
describe('NUCLEUS-SYNC.1 · angular route reuse', () => {
  it('reloads a different V3 nucleus once and discards the subscription on destroy', async () => {
    const params = new BehaviorSubject(convertToParamMap({
      galaxyIndex: '7931794046369509303', sectorKey: '0', galacticObjectIndex: '0',
    }));
    const query = new BehaviorSubject(convertToParamMap({
      seed: '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5', version: '3',
    }));
    const data = new BehaviorSubject({
      archiveDiscoveryLocatorKind: ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
    });
    const load = vi.fn(async () => undefined);

    await TestBed.configureTestingModule({
      imports: [ArchiveDiscoveryDetail],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {
          snapshot: {
            data: data.value,
            paramMap: params.value,
            queryParamMap: query.value,
          },
          paramMap: params.asObservable(),
          queryParamMap: query.asObservable(),
          data: data.asObservable(),
        } },
        { provide: ArchiveDiscoveryDetailFacade, useValue: {
          load,
          state: () => ({kind: 'error', message: 'fixture'}),
          model: () => null,
          errorMessage: () => 'fixture',
        } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ArchiveDiscoveryDetail);
    fixture.detectChanges();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenLastCalledWith(expect.objectContaining({
      galaxyIndex: '7931794046369509303', generatorVersionCode: '3',
    }));

    params.next(convertToParamMap({
      galaxyIndex: '7931794046369509304', sectorKey: '0', galacticObjectIndex: '0',
    }));
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenLastCalledWith(expect.objectContaining({
      galaxyIndex: '7931794046369509304',
    }));
    params.next(params.value);
    expect(load).toHaveBeenCalledTimes(2);

    fixture.destroy();
    params.next(convertToParamMap({
      galaxyIndex: '7931794046369509305', sectorKey: '0', galacticObjectIndex: '0',
    }));
    expect(load).toHaveBeenCalledTimes(2);
  });
});
