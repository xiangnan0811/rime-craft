// Barrel re-export — split into focused modules for maintainability.
// All public API names are preserved so existing consumers continue to work.

export { resolveModuleSourceFile } from './module-key-map'

export {
  extractModuleYaml,
  extractModuleYamlFromSourceFile,
  extractModuleYamlFromWorkspace,
} from './module-yaml-extract'

export {
  applyModuleYaml,
  applyModuleYamlToSourceFile,
  applyModuleYamlToWorkspace,
} from './module-yaml-apply'
