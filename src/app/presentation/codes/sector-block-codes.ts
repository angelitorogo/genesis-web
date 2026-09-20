/** Public hexadecimal test codes; local progression, not a secure licence system. */
export const SECTOR_BLOCK_CODES = Object.freeze(
  Array.from({ length: 9 }, (_, index) => {
    const size = index + 2;
    return Object.freeze({
      size,
      code: `B10C-0000-0000-${size.toString(16).toUpperCase().padStart(4, '0')}`,
    });
  }),
);

export function sectorBlockSizeForCode(code: string): number | null {
  return SECTOR_BLOCK_CODES.find(item => item.code === code)?.size ?? null;
}

export function codesReceiptKey(seed: string, version: number, code: string): string {
  // Keep exactly the existing receipt namespace; previously redeemed PD codes survive.
  return `codes.v1:${seed}:v${version}:${code}`;
}
