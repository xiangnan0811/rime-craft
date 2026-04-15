import { describe, expect, it } from 'vitest'
import { getSchemaById } from './schema-data'

function mustGetSchema(id: string) {
  const schema = getSchemaById(id)
  expect(schema, id).toBeDefined()
  return schema!
}

describe('schema detail data contract', () => {
  it('uses the canonical wanxiang repository and issues URLs', () => {
    const wanxiang = mustGetSchema('wanxiang')
    const wanxiangPro = mustGetSchema('wanxiang_pro')

    expect(wanxiang.links.repository).toBe('https://github.com/amzxyz/rime_wanxiang')
    expect(wanxiangPro.links.repository).toBe('https://github.com/amzxyz/rime_wanxiang')

    expect(wanxiang.links.community).toContainEqual({
      label: 'GitHub Issues',
      url: 'https://github.com/amzxyz/rime_wanxiang/issues',
    })
    expect(wanxiangPro.links.community).toContainEqual({
      label: 'GitHub Issues',
      url: 'https://github.com/amzxyz/rime_wanxiang/issues',
    })
  })

  it('uses the canonical wanxiang learning-resource URLs', () => {
    const expected = {
      title: '万象拼音 GitHub 仓库',
      url: 'https://github.com/amzxyz/rime_wanxiang',
    }

    expect(mustGetSchema('wanxiang').learningResources).toContainEqual(expected)
    expect(mustGetSchema('wanxiang_pro').learningResources).toContainEqual(expected)
  })

  it('labels wanxiang pro as double-pinyin only', () => {
    expect(mustGetSchema('wanxiang_pro').type).toBe('double_pinyin')
  })

  it('points rime-ice community links to GitHub Issues instead of the missing discussions page', () => {
    const communityLinks = mustGetSchema('rime_ice').links.community
    const urls = communityLinks.map((link) => link.url)

    expect(communityLinks).toContainEqual({
      label: 'GitHub Issues',
      url: 'https://github.com/iDvel/rime-ice/issues',
    })
    expect(urls).not.toContain('https://github.com/iDvel/rime-ice/discussions')
  })
})
