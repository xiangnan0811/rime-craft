import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createEmptyProject } from '@/lib/config/defaults';
import { serializeCustomPhrases } from '@/lib/config/custom-phrase';
import { getFormalPlatformFileName } from '@/lib/product/support-contract';
import {
  buildCustomYaml,
  serializeDefaultConfig,
  serializePlatformConfig,
  serializeSchemaConfig,
} from '@/lib/yaml/serializer';
import {
  createSourceFilesFromImport,
  createSourceFilesFromProject,
  syncSourceFilesWithProject,
} from './source-files';

describe('source file helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-12T08:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('captures imported YAML files as persisted source files', () => {
    const defaultFile = {
      name: 'default.custom.yaml',
      content: 'patch:\n  menu:\n    page_size: 9\n',
    };
    const platformFile = {
      name: 'weasel.custom.yaml',
      content: 'patch:\n  app_options:\n    code.exe:\n      ascii_mode: true\n',
    };
    const schemaFile = {
      name: 'double_pinyin_flypy.custom.yaml',
      content: 'patch:\n  switches:\n    - name: ascii_mode\n      reset: 0\n',
    };
    const customPhraseFile = {
      name: 'custom_phrase.txt',
      content: '你好\tnihao\t100\n',
    };
    const files = [defaultFile, platformFile, schemaFile, customPhraseFile];

    const sourceFiles = createSourceFilesFromImport(files);

    expect(sourceFiles).toEqual({
      'default.custom.yaml': {
        id: 'default.custom.yaml',
        fileName: 'default.custom.yaml',
        kind: 'default',
        content: defaultFile.content,
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
      'weasel.custom.yaml': {
        id: 'weasel.custom.yaml',
        fileName: 'weasel.custom.yaml',
        kind: 'platform',
        content: platformFile.content,
        platform: 'windows',
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
      'double_pinyin_flypy.custom.yaml': {
        id: 'double_pinyin_flypy.custom.yaml',
        fileName: 'double_pinyin_flypy.custom.yaml',
        kind: 'schema',
        content: schemaFile.content,
        schemaId: 'double_pinyin_flypy',
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
      'custom_phrase.txt': {
        id: 'custom_phrase.txt',
        fileName: 'custom_phrase.txt',
        kind: 'custom_phrase',
        content: customPhraseFile.content,
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
    });
  });

  it('synthesizes baseline source files from a project when imported sources are absent', () => {
    const project = createEmptyProject();
    project.targetPlatform = 'macos';
    project.defaultConfig.schemaList = [{ schema: 'double_pinyin_flypy' }];
    project.defaultConfig.pageSize = 9;
    project.platformConfig.platform = 'macos';
    project.platformConfig.appOptions = {
      'com.apple.Terminal': { asciiMode: true },
    };
    project.schemaConfigs.double_pinyin_flypy = {
      schemaId: 'double_pinyin_flypy',
      fuzzyRules: [
        { ruleId: 'l_n', enabled: true },
        { ruleId: 'ian_iang', enabled: true },
      ],
      spellingScheme: 'flypy',
      auxiliaryCode: {
        scheme: 'hexing',
        triggerMode: 'direct',
        hintEnabled: true,
        hintLength: 2,
        splitHintEnabled: true,
      },
      switches: [{ name: 'ascii_mode', reset: 0 }],
    };
    project.customPhrases = [
      { text: '你好', code: 'nihao', weight: 100 },
    ];

    const platformFile = getFormalPlatformFileName('macos');
    const sourceFiles = createSourceFilesFromProject(project);

    expect(sourceFiles).toEqual({
      'default.custom.yaml': {
        id: 'default.custom.yaml',
        fileName: 'default.custom.yaml',
        kind: 'default',
        content: buildCustomYaml(serializeDefaultConfig(project.defaultConfig)),
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
      [platformFile]: {
        id: platformFile,
        fileName: platformFile,
        kind: 'platform',
        content: buildCustomYaml(serializePlatformConfig(project.platformConfig)),
        platform: 'macos',
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
      'double_pinyin_flypy.custom.yaml': {
        id: 'double_pinyin_flypy.custom.yaml',
        fileName: 'double_pinyin_flypy.custom.yaml',
        kind: 'schema',
        content: buildCustomYaml(
          serializeSchemaConfig(project.schemaConfigs.double_pinyin_flypy),
        ),
        schemaId: 'double_pinyin_flypy',
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
      'custom_phrase.txt': {
        id: 'custom_phrase.txt',
        fileName: 'custom_phrase.txt',
        kind: 'custom_phrase',
        content: serializeCustomPhrases(project.customPhrases),
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
    });
  });

  it('falls back to synthesized files when no backing artifact exists', () => {
    const previousProject = createEmptyProject();
    const nextProject = createEmptyProject();
    nextProject.defaultConfig.pageSize = 9;

    const sourceFiles = syncSourceFilesWithProject(
      previousProject,
      nextProject,
      {},
    );

    expect(sourceFiles).toEqual(createSourceFilesFromProject(nextProject));
  });
});
