import { create } from 'zustand'
import type {
  RimeProject,
  DefaultConfig,
  SchemaListItem,
  FuzzyRuleState,
  EditorModule,
} from '@/types/config'
import { createEmptyProject } from '@/lib/config/defaults'

interface ConfigState {
  project: RimeProject;
  activeModule: EditorModule;
  isDirty: boolean;

  setActiveModule: (module: EditorModule) => void;
  loadProject: (project: RimeProject) => void;
  reset: () => void;
  setTargetPlatform: (platform: RimeProject['targetPlatform']) => void;
  updateDefaultConfig: (partial: Partial<DefaultConfig>) => void;
  setSchemaList: (schemas: SchemaListItem[]) => void;
  setAppOption: (bundleId: string, asciiMode: boolean) => void;
  removeAppOption: (bundleId: string) => void;
  setFuzzyRules: (schemaId: string, rules: FuzzyRuleState[]) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  project: createEmptyProject(),
  activeModule: 'schema-manager',
  isDirty: false,

  setActiveModule: (module) => set({ activeModule: module }),

  loadProject: (project) => set({ project, isDirty: false }),

  reset: () =>
    set({
      project: createEmptyProject(),
      activeModule: 'schema-manager',
      isDirty: false,
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
}))
