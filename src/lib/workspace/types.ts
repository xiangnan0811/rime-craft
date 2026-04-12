import type { EditorModule, EditorUIState, RimeProject } from '@/types/config';

export interface PersistedSourceFile {
  id: string;
  fileName: string;
  kind: 'default' | 'platform' | 'schema' | 'custom_phrase';
  content: string;
  platform?: 'macos' | 'windows';
  schemaId?: string;
  updatedAt: string;
}

export interface WorkspaceSnapshot {
  version: 1;
  savedAt: string;
  project: RimeProject;
  editorUI: Pick<EditorUIState, 'viewMode' | 'tutorialCollapsed'> & {
    activeModule: EditorModule;
  };
  sourceFiles: Record<string, PersistedSourceFile>;
}
