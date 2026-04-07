import { describe, it, expect } from 'vitest'
import { bgrIntToHex, hexToBgrInt } from './convert'

describe('bgrIntToHex', () => {
  it('converts black', () => {
    expect(bgrIntToHex(0x000000)).toBe('#000000')
  })

  it('converts white', () => {
    expect(bgrIntToHex(0xFFFFFF)).toBe('#FFFFFF')
  })

  it('converts BGR blue (0xFF0000) to RGB blue (#0000FF)', () => {
    expect(bgrIntToHex(0xFF0000)).toBe('#0000FF')
  })

  it('converts BGR red (0x0000FF) to RGB red (#FF0000)', () => {
    expect(bgrIntToHex(0x0000FF)).toBe('#FF0000')
  })

  it('converts mixed color', () => {
    expect(bgrIntToHex(0x66CCFF)).toBe('#FFCC66')
  })
})

describe('hexToBgrInt', () => {
  it('converts red #FF0000 to BGR 0x0000FF', () => {
    expect(hexToBgrInt('#FF0000')).toBe(0x0000FF)
  })

  it('converts blue #0000FF to BGR 0xFF0000', () => {
    expect(hexToBgrInt('#0000FF')).toBe(0xFF0000)
  })

  it('handles lowercase hex', () => {
    expect(hexToBgrInt('#aabbcc')).toBe(hexToBgrInt('#AABBCC'))
  })
})

describe('round-trip', () => {
  it('round-trips correctly', () => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#AABBCC', '#123456']
    for (const color of colors) {
      expect(bgrIntToHex(hexToBgrInt(color))).toBe(color.toUpperCase())
    }
  })
})
