/** Pure, metadata-only rule for refreshing the visible Archive page.
 * A dirty job in another category or selected galaxy must not trigger another
 * potentially expensive global sort query. Scientific rows are never read. */
import type {UniversalArchiveCategory38Bis,UniversalArchiveSection38Bis}
  from './genesis-universal-archive-38-bis.model';

export function archiveVisibleFragmentChanged38BisT3b(
  before:readonly UniversalArchiveSection38Bis[],
  after:readonly UniversalArchiveSection38Bis[],
  category:UniversalArchiveCategory38Bis|null,
  galaxyIndex:string|null,
):boolean {
  if(category===null||category==='galaxies')return false;
  const visible=(s:UniversalArchiveSection38Bis)=>s.category===category &&
    (galaxyIndex===null||s.galaxyIndex===galaxyIndex);
  const earlier=new Map(before.filter(visible).map(s=>[s.galaxyIndex,s]));
  const current=new Map(after.filter(visible).map(s=>[s.galaxyIndex,s]));
  // Downgrades/restores can REMOVE a confirmed fragment. That must clear an
  // already visible page rather than leaving previously indexed rows exposed.
  if([...earlier.keys()].some(id=>!current.has(id)))return true;
  return [...current.values()].some(s=>
    earlier.get(s.galaxyIndex)?.sourceRevision!==s.sourceRevision ||
    earlier.get(s.galaxyIndex)?.indexedAtEpochMs!==s.indexedAtEpochMs);
}
