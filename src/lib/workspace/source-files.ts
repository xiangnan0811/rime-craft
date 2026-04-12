import { FUZZY_RULE_DEFINITIONS } from '@/data/fuzzy-rules';
import { serializeCustomPhrases } from '@/lib/config/custom-phrase';
import {
  getFormalPlatformFileName,
  isFormalEditorPlatform,
} from '@/lib/product/support-contract';
import type { RimeProject, SchemaConfig } from '@/types/config';
import {
  buildCustomYaml,
  serializeDefaultConfig,
  serializePlatformConfig,
  serializeSchemaConfig,
} from '@/lib/yaml/serializer';

import type { PersistedSourceFile } from './types';

type SourceFileMap = Record<string, PersistedSourceFile>;
type ImportedFile = { name: string; content: string };

interface SourceFileMetadata {
  fileName: string;
  kind: PersistedSourceFile['kind'];
  platform?: PersistedSourceFile['platform'];
  schemaId?: string;
}

const isYamlFile = (fileName: string): boolean => /\.ya?ml$/i.test(fileName);

const createPersistedSourceFile = (
  metadata: SourceFileMetadata,
  content: string,
  updatedAt: string,
): PersistedSourceFile => ({
  id: metadata.fileName,
  fileName: metadata.fileName,
  kind: metadata.kind,
  content,
  updatedAt,
  ...(metadata.platform ? { platform: metadata.platform } : {}),
  ...(metadata.schemaId ? { schemaId: metadata.schemaId } : {}),
});

const getSourceFileMetadata = (fileName: string): SourceFileMetadata | null => {
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedFileName.includes('custom_phrase') && !isYamlFile(fileName)) {
    return {
      fileName,
      kind: 'custom_phrase',
    };
  }

  if (!isYamlFile(fileName)) {
    return null;
  }

  if (normalizedFileName.includes('default')) {
    return {
      fileName,
      kind: 'default',
    };
  }

  if (normalizedFileName.includes('squirrel')) {
    return {
      fileName,
      kind: 'platform',
      platform: 'macos',
    };
  }

  if (normalizedFileName.includes('weasel')) {
    return {
      fileName,
      kind: 'platform',
      platform: 'windows',
    };
  }

  return {
    fileName,
    kind: 'schema',
    schemaId: fileName
      .replace(/\.custom\.ya?ml$/i, '')
      .replace(/\.ya?ml$/i, ''),
  };
};

const hasEntries = (value?: Record<string, unknown>): boolean =>
  Boolean(value && Object.keys(value).length > 0);

const buildSchemaPatch = (schemaConfig: SchemaConfig): Record<string, unknown> => {
  const patch: Record<string, unknown> = {};
  const enabledRules = schemaConfig.fuzzyRules.filter((rule) => rule.enabled);

  if (enabledRules.length > 0) {
    const algebraRules: string[] = [];
    const seenRules = new Set<string>();

    for (const rule of enabledRules) {
      const definition = FUZZY_RULE_DEFINITIONS.find(
        (item) => item.id === rule.ruleId,
      );

      if (!definition) {
        continue;
      }

      for (const expression of definition.algebraRules) {
        if (seenRules.has(expression)) {
          continue;
        }

        seenRules.add(expression);
        algebraRules.push(expression);
      }
    }

    if (algebraRules.length > 0) {
      patch['speller/algebra/@before 0'] = algebraRules;
    }
  }

  Object.assign(patch, serializeSchemaConfig(schemaConfig));
  return patch;
};

const addYamlSourceFile = (
  sourceFiles: SourceFileMap,
  metadata: SourceFileMetadata,
  patch: Record<string, unknown>,
  preserved: Record<string, unknown> | undefined,
  updatedAt: string,
): void => {
  if (Object.keys(patch).length === 0 && !hasEntries(preserved)) {
    return;
  }

  sourceFiles[metadata.fileName] = createPersistedSourceFile(
    metadata,
    buildCustomYaml(patch, preserved),
    updatedAt,
  );
};

export function createSourceFilesFromImport(files: ImportedFile[]): SourceFileMap {
  const updatedAt = new Date().toISOString();
  const sourceFiles: SourceFileMap = {};

  for (const file of files) {
    const metadata = getSourceFileMetadata(file.name);
    if (!metadata) {
      continue;
    }

    sourceFiles[file.name] = createPersistedSourceFile(
      metadata,
      file.content,
      updatedAt,
    );
  }

  return sourceFiles;
}

export function createSourceFilesFromProject(project: RimeProject): SourceFileMap {
  const updatedAt = new Date().toISOString();
  const sourceFiles: SourceFileMap = {};

  addYamlSourceFile(
    sourceFiles,
    {
      fileName: 'default.custom.yaml',
      kind: 'default',
    },
    serializeDefaultConfig(project.defaultConfig),
    project.preserved['default.custom.yaml'],
    updatedAt,
  );

  if (isFormalEditorPlatform(project.targetPlatform)) {
    const platformFileName = getFormalPlatformFileName(project.targetPlatform);
    addYamlSourceFile(
      sourceFiles,
      {
        fileName: platformFileName,
        kind: 'platform',
        platform: project.targetPlatform,
      },
      serializePlatformConfig(project.platformConfig),
      project.preserved[platformFileName],
      updatedAt,
    );
  }

  for (const [schemaId, schemaConfig] of Object.entries(project.schemaConfigs)) {
    const fileName = `${schemaId}.custom.yaml`;
    addYamlSourceFile(
      sourceFiles,
      {
        fileName,
        kind: 'schema',
        schemaId,
      },
      buildSchemaPatch(schemaConfig),
      project.preserved[fileName],
      updatedAt,
    );
  }

  for (const [fileName, preserved] of Object.entries(project.preserved)) {
    if (fileName in sourceFiles) {
      continue;
    }

    const metadata = getSourceFileMetadata(fileName);
    if (!metadata || metadata.kind === 'custom_phrase') {
      continue;
    }

    addYamlSourceFile(sourceFiles, metadata, {}, preserved, updatedAt);
  }

  if (project.customPhrases.length > 0) {
    sourceFiles['custom_phrase.txt'] = createPersistedSourceFile(
      {
        fileName: 'custom_phrase.txt',
        kind: 'custom_phrase',
      },
      serializeCustomPhrases(project.customPhrases),
      updatedAt,
    );
  }

  return sourceFiles;
}
