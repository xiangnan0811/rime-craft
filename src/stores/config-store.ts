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
} from '@/types/config'
import { createEmptyProject } from '@/lib/config/defaults'

interface ConfigState {
  project: RimeProject;
  activeModule: EditorModule;
  isDirty: boolean;
  editorUI: EditorUIState;
  setViewMode: (mode: 'panel' | 'immersive') => void;
  setTutorialCollapsed: (collapsed: boolean) => void;
  setActiveSection: (section?: string) => void;
  updateSchemaConfig: (schemaId: string, partial: Partial<SchemaConfig>) => void;

  setActiveModule: (module: EditorModule) => void;
  loadProject: (project: RimeProject) => void;
  reset: () => void;
  setTargetPlatform: (platform: RimeProject['targetPlatform']) => void;
  updateDefaultConfig: (partial: Partial<DefaultConfig>) => void;
  setSchemaList: (schemas: SchemaListItem[]) => void;
  setAppOption: (bundleId: string, asciiMode: boolean) => void;
  removeAppOption: (bundleId: string) => void;
  setFuzzyRules: (schemaId: string, rules: FuzzyRuleState[]) => void;
  setSwitches: (schemaId: string, switches: SwitchItem[]) => void;
  setPunctuator: (schemaId: string, punctuator: PunctuatorConfig) => void;
  setThemeStyle: (style: ThemeStyle) => void;
  updateThemeColors: (colors: Partial<ThemeColors>) => void;
  updateThemeLayout: (layout: Partial<Omit<ThemeStyle, 'colors' | 'name'>>) => void;
  addCustomPhrase: (phrase: CustomPhrase) => void;
  removeCustomPhrase: (index: number) => void;
  updateCustomPhrase: (index: number, phrase: CustomPhrase) => void;
  setCustomPhrases: (phrases: CustomPhrase[]) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  project: createEmptyProject(),
  activeModule: 'schema-manager',
  isDirty: false,
  editorUI: {
    viewMode: 'panel' as const,
    tutorialCollapsed: false,
    activeSection: undefined,
  },

  setActiveModule: (module) => set({ activeModule: module }),

  loadProject: (project) => set({ project, isDirty: false }),

  reset: () =>
    set({
      project: createEmptyProject(),
      activeModule: 'schema-manager',
      isDirty: false,
      editorUI: { viewMode: 'panel' as const, tutorialCollapsed: false, activeSection: undefined },
    }),

  setTargetPlatform: (platform) =>
    set((s) => ({
      project: { ...s.project, targetPlatform: platform },
      isDirty: true,
    })),

  updateDefaultConfig: (partial) =>
    set((s) => ({
      project: {
        ...s.project,
        defaultConfig: { ...s.project.defaultConfig, ...partial },
      },
      isDirty: true,
    })),

  setSchemaList: (schemas) =>
    set((s) => ({
      project: {
        ...s.project,
        defaultConfig: { ...s.project.defaultConfig, schemaList: schemas },
      },
      isDirty: true,
    })),

  setAppOption: (bundleId, asciiMode) =>
    set((s) => ({
      project: {
        ...s.project,
        platformConfig: {
          ...s.project.platformConfig,
          appOptions: {
            ...s.project.platformConfig.appOptions,
            [bundleId]: { asciiMode },
          },
        },
      },
      isDirty: true,
    })),

  removeAppOption: (bundleId) =>
    set((s) => {
      const entries = Object.entries(s.project.platformConfig.appOptions).filter(
        ([key]) => key !== bundleId
      )
      return {
        project: {
          ...s.project,
          platformConfig: {
            ...s.project.platformConfig,
            appOptions: Object.fromEntries(entries),
          },
        },
        isDirty: true,
      }
    }),

  setFuzzyRules: (schemaId, rules) =>
    set((s) => ({
      project: {
        ...s.project,
        schemaConfigs: {
          ...s.project.schemaConfigs,
          [schemaId]: {
            ...(s.project.schemaConfigs[schemaId] ?? { schemaId }),
            schemaId,
            fuzzyRules: rules,
          },
        },
      },
      isDirty: true,
    })),

  setSwitches: (schemaId, switches) =>
    set((s) => ({
      project: {
        ...s.project,
        schemaConfigs: {
          ...s.project.schemaConfigs,
          [schemaId]: {
            ...(s.project.schemaConfigs[schemaId] ?? { schemaId, fuzzyRules: [] }),
            schemaId,
            switches,
          },
        },
      },
      isDirty: true,
    })),

  setPunctuator: (schemaId, punctuator) =>
    set((s) => ({
      project: {
        ...s.project,
        schemaConfigs: {
          ...s.project.schemaConfigs,
          [schemaId]: {
            ...(s.project.schemaConfigs[schemaId] ?? { schemaId, fuzzyRules: [] }),
            schemaId,
            punctuator,
          },
        },
      },
      isDirty: true,
    })),

  setThemeStyle: (style) =>
    set((s) => ({
      project: {
        ...s.project,
        platformConfig: { ...s.project.platformConfig, style },
      },
      isDirty: true,
    })),

  updateThemeColors: (colors) =>
    set((s) => {
      const current = s.project.platformConfig.style
      if (!current) return {}
      return {
        project: {
          ...s.project,
          platformConfig: {
            ...s.project.platformConfig,
            style: {
              ...current,
              colors: { ...current.colors, ...colors },
            },
          },
        },
        isDirty: true,
      }
    }),

  updateThemeLayout: (layout) =>
    set((s) => {
      const current = s.project.platformConfig.style
      if (!current) return {}
      return {
        project: {
          ...s.project,
          platformConfig: {
            ...s.project.platformConfig,
            style: { ...current, ...layout },
          },
        },
        isDirty: true,
      }
    }),

  addCustomPhrase: (phrase) =>
    set((s) => ({
      project: {
        ...s.project,
        customPhrases: [...s.project.customPhrases, phrase],
      },
      isDirty: true,
    })),

  removeCustomPhrase: (index) =>
    set((s) => ({
      project: {
        ...s.project,
        customPhrases: s.project.customPhrases.filter((_, i) => i !== index),
      },
      isDirty: true,
    })),

  updateCustomPhrase: (index, phrase) =>
    set((s) => ({
      project: {
        ...s.project,
        customPhrases: s.project.customPhrases.map((p, i) => (i === index ? phrase : p)),
      },
      isDirty: true,
    })),

  setCustomPhrases: (phrases) =>
    set((s) => ({
      project: { ...s.project, customPhrases: phrases },
      isDirty: true,
    })),

  setViewMode: (mode) =>
    set((s) => ({ editorUI: { ...s.editorUI, viewMode: mode } })),

  setTutorialCollapsed: (collapsed) =>
    set((s) => ({ editorUI: { ...s.editorUI, tutorialCollapsed: collapsed } })),

  setActiveSection: (section) =>
    set((s) => ({ editorUI: { ...s.editorUI, activeSection: section } })),

  updateSchemaConfig: (schemaId, partial) =>
    set((s) => ({
      project: {
        ...s.project,
        schemaConfigs: {
          ...s.project.schemaConfigs,
          [schemaId]: {
            ...(s.project.schemaConfigs[schemaId] ?? { schemaId, fuzzyRules: [] }),
            ...partial,
          },
        },
      },
      isDirty: true,
    })),
}))
