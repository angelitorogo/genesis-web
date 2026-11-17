import {moonRomanNumeralV1} from '../../../domain/planetary/moon-designation';
/** Public display of a moon in the Archive. Internal locator 0 = ordinal I;
 * keeping the locator unchanged preserves all scientific links and persistence.
 */
export function archiveMoonDesignation38BisA4(planetName:string,moonIndex:string):string {
  const index=Number(moonIndex);
  if(!Number.isSafeInteger(index)||index<0||index>=3999||String(index)!==moonIndex)
    return `${planetName} · Luna ${moonIndex}`;
  return `${planetName} ${moonRomanNumeralV1(index+1)}`;
}
