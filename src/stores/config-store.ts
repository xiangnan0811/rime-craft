import { create } from 'zustand'
import type {
  RimeProject,
  DefaultConfig,
  SchemaListItem,
  FuzzyRuleState,
  SwitchItem,
  PunctuatorConfig,
  CustomPhrase,
  EditorModule,
  ThemeStyle,
  ThemeColors,
  SchemaConfig,
  EditorUIState,
  CustomTrigger,
  LuaScript,
} from '@/types/config'
import { createEmptyProject } from '@/lib/config/defaults'
import type { PersistedSourceFile, WorkspaceSnapshot } from '@/lib/workspace/types'
import {
  clearWorkspaceSnapshot,
  loadWorkspaceSnapshot,
  saveWorkspaceSnapshot,
} from '@/lib/workspace/storage'
import {
  createSourceFilesFromProject,
  syncSourceFilesWithProject,
} from '@/lib/workspace/source-files'

const createDefaultEditorUI = (): EditorUIState => ({
  viewMode: 'panel',
  tutorialCollapsed: false,
  activeSection: undefined,
})

const createInitialProject = (): RimeProject => createEmptyProject()

let persistTimer: ReturnType<typeof setTimeout> | undefined

const persistCurrentState = (
  project: RimeProject,
  activeModule: EditorModule,
  editorUI: EditorUIState,
  sourceFiles: Record<string, PersistedSourceFile>,
): void => {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    saveWorkspaceSnapshot({
      version: 1,
      savedAt: new Date().toISOString(),
      project,
      editorUI: {
        activeModule,
        viewMode: editorUI.viewMode,
        tutorialCollapsed: editorUI.tutorialCollapsed,
      },
      sourceFiles,
    })
  }, 500)
}

interface ConfigState {
  project: RimeProject
  activeModule: EditorModule
  isDirty: boolean
  editorUI: EditorUIState
  sourceFiles: Record<string, PersistedSourceFile>
  setViewMode: (mode: 'panel' | 'immersive') => void
  setTutorialCollapsed: (collapsed: boolean) => void
  setActiveSection: (section?: string) => void
  updateSchemaConfig: (schemaId: string, partial: Partial<SchemaConfig>) => void
  setActiveModule: (module: EditorModule) => void
  replaceWorkspace: (
    project: RimeProject,
    sourceFiles: Record<string, PersistedSourceFile>,
  ) => void
  loadProject: (project: RimeProject) => void
  hydrateWorkspace: (snapshot: WorkspaceSnapshot) => void
  restorePersistedWorkspace: () => void
  clearWorkspace: () => void
  reset: () => void
  setTargetPlatform: (platform: RimeProject['targetPlatform']) => void
  updateDefaultConfig: (partial: Partial<DefaultConfig>) => void
  setSchemaList: (schemas: SchemaListItem[]) => void
  setAppOption: (bundleId: string, asciiMode: boolean) => void
  removeAppOption: (bundleId: string) => void
  setFuzzyRules: (schemaId: string, rules: FuzzyRuleState[]) => void
  setSwitches: (schemaId: string, switches: SwitchItem[]) => void
  setPunctuator: (schemaId: string, punctuator: PunctuatorConfig) => void
  setThemeStyle: (style: ThemeStyle) => void
  updateThemeColors: (colors: Partial<ThemeColors>) => void
  updateThemeLayout: (layout: Partial<Omit<ThemeStyle, 'colors' | 'name'>>) => void
  addCustomPhrase: (phrase: CustomPhrase) => void
  removeCustomPhrase: (index: number) => void
  updateCustomPhrase: (index: number, phrase: CustomPhrase) => void
  setCustomPhrases: (phrases: CustomPhrase[]) => void
  addCustomTrigger: (schemaId: string, trigger: Omit<CustomTrigger, 'id'>) => void
  updateCustomTrigger: (
    schemaId: string,
    id: string,
    partial: Partial<Omit<CustomTrigger, 'id'>>,
  ) => void
  deleteCustomTrigger: (schemaId: string, id: string) => void
  addLuaScript: (schemaId: string, script: Omit<LuaScript, 'id'>) => void
  updateLuaScript: (
    schemaId: string,
    id: string,
    partial: Partial<Omit<LuaScript, 'id'>>,
  ) => void
  deleteLuaScript: (schemaId: string, id: string) => boolean
}

export const useConfigStore = create<ConfigState>((set, get) => {
  const updateProjectWorkspace = (project: RimeProject): void => {
    const state = get()
    const sourceFiles = syncSourceFilesWithProject(
      state.project,
      project,
      state.sourceFiles,
    )
    persistCurrentState(project, state.activeModule, state.editorUI, sourceFiles)
    set({
      project,
      sourceFiles,
      isDirty: true,
    })
  }

  const updateSchemaField = <K extends keyof SchemaConfig>(
    schemaId: string,
    field: K,
    value: SchemaConfig[K],
  ): void => {
    const state = get()
    const project = {
      ...state.project,
      schemaConfigs: {
        ...state.project.schemaConfigs,
        [schemaId]: {
          ...(state.project.schemaConfigs[schemaId] ?? { schemaId, fuzzyRules: [] }),
          schemaId,
          [field]: value,
        },
      },
    }
    updateProjectWorkspace(project)
  }

  const initialProject = createInitialProject()
  return {
    project: initialProject,
    activeModule: 'schema-manager',
    isDirty: false,
    editorUI: createDefaultEditorUI(),
    sourceFiles: createSourceFilesFromProject(initialProject),

    setActiveModule: (module) => {
      const state = get()
      persistCurrentState(state.project, module, state.editorUI, state.sourceFiles)
      set({ activeModule: module })
    },

    replaceWorkspace: (project, sourceFiles) => {
      const state = get()
      persistCurrentState(project, state.activeModule, state.editorUI, sourceFiles)
      set({ project, sourceFiles, isDirty: false })
    },

    loadProject: (project) => {
      get().replaceWorkspace(project, createSourceFilesFromProject(project))
    },

    hydrateWorkspace: (snapshot) => {
      const editorUI = {
        ...createDefaultEditorUI(),
        viewMode: snapshot.editorUI.viewMode,
        tutorialCollapsed: snapshot.editorUI.tutorialCollapsed,
      }

      persistCurrentState(
        snapshot.project,
        snapshot.editorUI.activeModule,
        editorUI,
        snapshot.sourceFiles,
      )
      set({
        project: snapshot.project,
        activeModule: snapshot.editorUI.activeModule,
        editorUI,
        sourceFiles: snapshot.sourceFiles,
        isDirty: false,
      })
    },

    restorePersistedWorkspace: () => {
      const snapshot = loadWorkspaceSnapshot()
      if (!snapshot) {
        return
      }

      get().hydrateWorkspace(snapshot)
    },

    clearWorkspace: () => {
      clearWorkspaceSnapshot()
      const project = createInitialProject()
      set({
        project,
        activeModule: 'schema-manager',
        isDirty: false,
        editorUI: createDefaultEditorUI(),
        sourceFiles: createSourceFilesFromProject(project),
      })
    },

    reset: () =>
      (() => {
        const project = createInitialProject()
        const editorUI = createDefaultEditorUI()
        const sourceFiles = createSourceFilesFromProject(project)
        persistCurrentState(project, 'schema-manager', editorUI, sourceFiles)
        set({
          project,
          sourceFiles,
          activeModule: 'schema-manager',
          isDirty: false,
          editorUI,
        })
      })(),

    setTargetPlatform: (platform) => {
      const state = get()
      const project = { ...state.project, targetPlatform: platform }
      updateProjectWorkspace(project)
    },

    updateDefaultConfig: (partial) => {
      const state = get()
      const project = {
        ...state.project,
        defaultConfig: { ...state.project.defaultConfig, ...partial },
      }
      updateProjectWorkspace(project)
    },

    setSchemaList: (schemas) => {
      const state = get()
      const project = {
        ...state.project,
        defaultConfig: { ...state.project.defaultConfig, schemaList: schemas },
      }
      updateProjectWorkspace(project)
    },

    setAppOption: (bundleId, asciiMode) => {
      const state = get()
      const project = {
        ...state.project,
        platformConfig: {
          ...state.project.platformConfig,
          appOptions: {
            ...state.project.platformConfig.appOptions,
            [bundleId]: { asciiMode },
          },
        },
      }
      updateProjectWorkspace(project)
    },

    removeAppOption: (bundleId) => {
      const state = get()
      const entries = Object.entries(state.project.platformConfig.appOptions).filter(
        ([key]) => key !== bundleId,
      )
      const project = {
        ...state.project,
        platformConfig: {
          ...state.project.platformConfig,
          appOptions: Object.fromEntries(entries),
        },
      }
      updateProjectWorkspace(project)
    },

    setFuzzyRules: (schemaId, rules) => updateSchemaField(schemaId, 'fuzzyRules', rules),

    setSwitches: (schemaId, switches) => updateSchemaField(schemaId, 'switches', switches),

    setPunctuator: (schemaId, punctuator) => updateSchemaField(schemaId, 'punctuator', punctuator),

    setThemeStyle: (style) => {
      const state = get()
      const project = {
        ...state.project,
        platformConfig: { ...state.project.platformConfig, style },
      }
      updateProjectWorkspace(project)
    },

    updateThemeColors: (colors) => {
      const state = get()
      const current = state.project.platformConfig.style
      if (!current) return
      const project = {
        ...state.project,
        platformConfig: {
          ...state.project.platformConfig,
          style: {
            ...current,
            colors: { ...current.colors, ...colors },
          },
        },
      }
      updateProjectWorkspace(project)
    },

    updateThemeLayout: (layout) => {
      const state = get()
      const current = state.project.platformConfig.style
      if (!current) return
      const project = {
        ...state.project,
        platformConfig: {
          ...state.project.platformConfig,
          style: { ...current, ...layout },
        },
      }
      updateProjectWorkspace(project)
    },

    addCustomPhrase: (phrase) => {
      const state = get()
      const project = {
        ...state.project,
        customPhrases: [...state.project.customPhrases, phrase],
      }
      updateProjectWorkspace(project)
    },

    removeCustomPhrase: (index) => {
      const state = get()
      const project = {
        ...state.project,
        customPhrases: state.project.customPhrases.filter((_, i) => i !== index),
      }
      updateProjectWorkspace(project)
    },

    updateCustomPhrase: (index, phrase) => {
      const state = get()
      const project = {
        ...state.project,
        customPhrases: state.project.customPhrases.map((p, i) =>
          i === index ? phrase : p,
        ),
      }
      updateProjectWorkspace(project)
    },

    setCustomPhrases: (phrases) => {
      const state = get()
      const project = { ...state.project, customPhrases: phrases }
      updateProjectWorkspace(project)
    },

    setViewMode: (mode) => {
      const state = get()
      const editorUI = { ...state.editorUI, viewMode: mode }
      persistCurrentState(state.project, state.activeModule, editorUI, state.sourceFiles)
      set({ editorUI })
    },

    setTutorialCollapsed: (collapsed) => {
      const state = get()
      const editorUI = { ...state.editorUI, tutorialCollapsed: collapsed }
      persistCurrentState(state.project, state.activeModule, editorUI, state.sourceFiles)
      set({ editorUI })
    },

    setActiveSection: (section) =>
      set((state) => ({ editorUI: { ...state.editorUI, activeSection: section } })),

    updateSchemaConfig: (schemaId, partial) => {
      const state = get()
      const project = {
        ...state.project,
        schemaConfigs: {
          ...state.project.schemaConfigs,
          [schemaId]: {
            ...(state.project.schemaConfigs[schemaId] ?? { schemaId, fuzzyRules: [] }),
            ...partial,
          },
        },
      }
      updateProjectWorkspace(project)
    },

    addCustomTrigger: (schemaId, trigger) => {
      const state = get()
      const existing = state.project.schemaConfigs[schemaId]
      const currentSpecial = existing?.specialInput ?? {
        enabledTriggers: [],
        customTriggers: [],
      }
      const newTrigger: CustomTrigger = {
        ...trigger,
        id: crypto.randomUUID(),
      }
      const project = {
        ...state.project,
        schemaConfigs: {
          ...state.project.schemaConfigs,
          [schemaId]: {
            ...(existing ?? { schemaId, fuzzyRules: [] }),
            specialInput: {
              enabledTriggers: currentSpecial.enabledTriggers,
              customTriggers: [...currentSpecial.customTriggers, newTrigger],
            },
          },
        },
      }
      updateProjectWorkspace(project)
    },

    updateCustomTrigger: (schemaId, id, partial) => {
      const state = get()
      const existing = state.project.schemaConfigs[schemaId]
      if (!existing?.specialInput) return
      const project = {
        ...state.project,
        schemaConfigs: {
          ...state.project.schemaConfigs,
          [schemaId]: {
            ...existing,
            specialInput: {
              ...existing.specialInput,
              customTriggers: existing.specialInput.customTriggers.map((t) =>
                t.id === id ? { ...t, ...partial } : t,
              ),
            },
          },
        },
      }
      updateProjectWorkspace(project)
    },

    deleteCustomTrigger: (schemaId, id) => {
      const state = get()
      const existing = state.project.schemaConfigs[schemaId]
      if (!existing?.specialInput) return
      const project = {
        ...state.project,
        schemaConfigs: {
          ...state.project.schemaConfigs,
          [schemaId]: {
            ...existing,
            specialInput: {
              ...existing.specialInput,
              customTriggers: existing.specialInput.customTriggers.filter(
                (t) => t.id !== id,
              ),
            },
          },
        },
      }
      updateProjectWorkspace(project)
    },

    addLuaScript: (schemaId, script) => {
      const state = get()
      const existing = state.project.schemaConfigs[schemaId]
      const currentScripts = existing?.luaScripts ?? []
      const newScript: LuaScript = {
        ...script,
        id: crypto.randomUUID(),
      }
      const project = {
        ...state.project,
        schemaConfigs: {
          ...state.project.schemaConfigs,
          [schemaId]: {
            ...(existing ?? { schemaId, fuzzyRules: [] }),
            luaScripts: [...currentScripts, newScript],
          },
        },
      }
      updateProjectWorkspace(project)
    },

    updateLuaScript: (schemaId, id, partial) => {
      const state = get()
      const existing = state.project.schemaConfigs[schemaId]
      if (!existing?.luaScripts) return
      const project = {
        ...state.project,
        schemaConfigs: {
          ...state.project.schemaConfigs,
          [schemaId]: {
            ...existing,
            luaScripts: existing.luaScripts.map((sc) =>
              sc.id === id ? { ...sc, ...partial } : sc,
            ),
          },
        },
      }
      updateProjectWorkspace(project)
    },

    deleteLuaScript: (schemaId, id) => {
      const state = get()
      const existing = state.project.schemaConfigs[schemaId]
      if (!existing?.luaScripts) return false
      const isReferenced = (existing.specialInput?.customTriggers ?? []).some(
        (trigger) => trigger.scriptId === id,
      )
      if (isReferenced) return false
      const project = {
        ...state.project,
        schemaConfigs: {
          ...state.project.schemaConfigs,
          [schemaId]: {
            ...existing,
            luaScripts: existing.luaScripts.filter((sc) => sc.id !== id),
          },
        },
      }
      updateProjectWorkspace(project)
      return true
    },
  }
})
