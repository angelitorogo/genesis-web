import { inject } from '@angular/core';
import { GENESIS_LOCAL_REPOSITORIES } from './genesis-local-repositories';

export function compactMergerCanonicalEventRepositoryOrNull() {
  return inject(GENESIS_LOCAL_REPOSITORIES).compactMergerCanonicalEventRepository ?? null;
}
