/**
 * 配置文件 - 管理外部资源路径和诗歌形式
 */

import type { LanguageConfig, SonnetForm, MeterPattern } from './types';

// GitHub 仓库配置
export const GITHUB_CONFIG = {
  // 开发仓库（存放源代码和数据文件）
  devRepo: {
    owner: 'ShioLilia',
    name: 'sonnetaw',
    branch: 'main'
  },
  
  // 托管仓库（仅存放构建产物）
  pagesRepo: {
    owner: 'ShioLilia',
    name: 'ShioLilia.github.io',
    branch: 'main'
  }
};

// 通用格律模式定义
const IAMBIC_PENTAMETER: MeterPattern = {
  name: 'Iambic Pentameter',
  description: 'Unstressed-stressed pattern, 10 syllables per line',
  stressPattern: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  syllableCount: 10
};

const IAMBIC_HEXAMETER: MeterPattern = {
  name: 'Iambic Hexameter',
  description: 'Unstressed-stressed pattern, 12 syllables per line',
  stressPattern: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  syllableCount: 12
};

// 英语诗歌形式
const ENGLISH_FORMS: SonnetForm[] = [
  {
    id: 'shakespearean',
    name: 'Shakespearean Sonnet',
    description: 'ABAB CDCD EFEF GG',
    rhymeScheme: ['A', 'B', 'A', 'B', 'C', 'D', 'C', 'D', 'E', 'F', 'E', 'F', 'G', 'G'],
    meter: IAMBIC_PENTAMETER,
    lineCount: 14
  },
  {
    id: 'petrarchan1',
    name: 'Petrarchan Sonnet (CDECDE)',
    description: 'ABBAABBA CDECDE',
    rhymeScheme: ['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A', 'C', 'D', 'E', 'C', 'D', 'E'],
    meter: IAMBIC_PENTAMETER,
    lineCount: 14
  },
  {
    id: 'petrarchan2',
    name: 'Petrarchan Sonnet (CDCDCD)',
    description: 'ABBAABBA CDCDCD',
    rhymeScheme: ['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A', 'C', 'D', 'C', 'D', 'C', 'D'],
    meter: IAMBIC_PENTAMETER,
    lineCount: 14
  }
];

// 支持的语言列表（包含各自的诗歌形式）
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    dictionaryFile: 'eng-cmu.json',
    poeticForms: ENGLISH_FORMS
  },
  // 添加拉丁语示例：
  // {
  //   code: 'la',
  //   name: 'Latin',
  //   dictionaryFile: 'latin-prosody.json',
  //   poeticForms: [
  //     {
  //       id: 'dactylic_hexameter',
  //       name: 'Dactylic Hexameter',
  //       description: 'Classical epic meter (Homer, Virgil)',
  //       rhymeScheme: [], // No rhyme scheme
  //       meter: DACTYLIC_HEXAMETER,
  //       lineCount: 0 // Variable
  //     },
  //     {
  //       id: 'elegiac_couplet',
  //       name: 'Elegiac Couplet',
  //       description: 'Hexameter + Pentameter',
  //       rhymeScheme: [],
  //       meter: ELEGIAC_METER,
  //       lineCount: 2
  //     }
  //   ]
  // },
  // 古希腊语示例：
  // {
  //   code: 'grc',
  //   name: 'Ancient Greek',
  //   dictionaryFile: 'greek-prosody.json',
  //   poeticForms: [
  //     {
  //       id: 'sapphic_stanza',
  //       name: 'Sapphic Stanza',
  //       description: 'Three sapphic lines + one adonic',
  //       rhymeScheme: [],
  //       meter: SAPPHIC_METER,
  //       lineCount: 4
  //     }
  //   ]
  // }
];

// 生成 GitHub raw 文件 URL
export function getRawUrl(repo: typeof GITHUB_CONFIG.devRepo, filePath: string): string {
  return `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${filePath}`;
}

// 生成词典 URL（根据语言代码）
export function getDictionaryUrl(languageCode: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  if (!language) {
    throw new Error(`Unsupported language: ${languageCode}`);
  }
  return getRawUrl(GITHUB_CONFIG.devRepo, `public/data/${language.dictionaryFile}`);
}

// 数据文件路径（兼容旧代码）
export const DATA_URLS = {
  cmuDict: getDictionaryUrl('en') // 默认英语
};
