/**
 * Parse a macOS Info.plist XML to extract CFBundleIdentifier.
 * Returns null if the content is binary, invalid XML, or missing the key.
 */
export function parseBundleIdFromPlist(xmlContent: string): string | null {
  // Binary plist starts with "bplist"
  if (xmlContent.startsWith('bplist')) return null

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'application/xml')

    // Check for parse errors
    if (doc.querySelector('parsererror')) return null

    const keys = doc.querySelectorAll('dict > key')
    for (const key of keys) {
      if (key.textContent === 'CFBundleIdentifier') {
        const valueNode = key.nextElementSibling
        if (valueNode?.tagName === 'string') {
          return valueNode.textContent ?? null
        }
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Extract the filename from a File object (for Windows .exe files).
 */
export function getExeFileName(file: File): string {
  return file.name
}

/**
 * Parse a Linux .desktop file to extract the app identifier.
 * Prefers StartupWMClass, falls back to the command name from Exec.
 */
export function parseDesktopFile(content: string): string | null {
  if (!content.trim()) return null

  const lines = content.split('\n')
  let wmClass: string | null = null
  let exec: string | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('StartupWMClass=')) {
      wmClass = trimmed.slice('StartupWMClass='.length).trim()
    } else if (trimmed.startsWith('Exec=') && !exec) {
      exec = trimmed.slice('Exec='.length).trim()
    }
  }

  if (wmClass) return wmClass

  if (exec) {
    return extractCommandName(exec)
  }

  return null
}

/**
 * Extract the base command name from an Exec line.
 * Handles: "/usr/bin/app --flag %u", "env VAR=1 /usr/bin/app"
 */
function extractCommandName(execLine: string): string {
  const parts = execLine.split(/\s+/)

  // Skip env prefix and env variable assignments (KEY=VALUE)
  let i = 0
  if (parts[0] === 'env') i = 1
  while (i < parts.length && parts[i]!.includes('=')) i++

  const command = parts[i]
  if (!command) return execLine

  // Take only the basename (after last /)
  const basename = command.split('/').pop()!
  return basename
}
