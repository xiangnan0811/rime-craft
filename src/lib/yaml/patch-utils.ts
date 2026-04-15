import { parseDocument } from 'yaml'

export function flattenPatchEntries(
  value: Record<string, unknown>,
  path: string[] = [],
): Array<{ path: string[]; value: unknown }> {
  const entries: Array<{ path: string[]; value: unknown }> = []
  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key]
    if (
      child &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      Object.keys(child as Record<string, unknown>).length > 0
    ) {
      entries.push(...flattenPatchEntries(child as Record<string, unknown>, nextPath))
      continue
    }
    entries.push({ path: nextPath, value: child })
  }
  return entries
}

export function isYamlMapNodeEmpty(node: unknown): node is { items: unknown[] } {
  return (
    typeof node === 'object' &&
    node !== null &&
    'items' in node &&
    Array.isArray((node as { items: unknown[] }).items) &&
    (node as { items: unknown[] }).items.length === 0
  )
}

export function pruneEmptyParents(
  doc: ReturnType<typeof parseDocument>,
  path: string[],
): void {
  for (let depth = path.length - 1; depth > 0; depth -= 1) {
    const currentPath = ['patch', ...path.slice(0, depth)]
    const node = doc.getIn(currentPath, true)
    if (!isYamlMapNodeEmpty(node)) {
      break
    }
    doc.deleteIn(currentPath)
  }
}
