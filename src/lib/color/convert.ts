/**
 * Convert Rime BGR integer (from YAML) to standard HEX string.
 * Rime stores colors as 0xBBGGRR integers in YAML.
 * @param bgr - Integer like 0xFF0000 (which is blue 0,0,255 in BGR)
 * @returns HEX string like "#0000FF"
 */
export function bgrIntToHex(bgr: number): string {
  const hex = (bgr >>> 0).toString(16).padStart(6, '0')
  const bb = hex.substring(0, 2)
  const gg = hex.substring(2, 4)
  const rr = hex.substring(4, 6)
  return `#${rr}${gg}${bb}`.toUpperCase()
}

/**
 * Convert standard HEX string to Rime BGR integer.
 * @param hex - HEX string like "#FF0000" (red)
 * @returns Integer like 255 (0x0000FF in BGR)
 */
export function hexToBgrInt(hex: string): number {
  const clean = hex.replace('#', '')
  const rr = clean.substring(0, 2)
  const gg = clean.substring(2, 4)
  const bb = clean.substring(4, 6)
  return parseInt(`${bb}${gg}${rr}`, 16)
}
