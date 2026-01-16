/**
 * 配置文件 - 管理外部资源路径
 */

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

// 生成 GitHub raw 文件 URL
export function getRawUrl(repo: typeof GITHUB_CONFIG.devRepo, filePath: string): string {
  return `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${filePath}`;
}

// 数据文件路径
export const DATA_URLS = {
  cmuDict: getRawUrl(GITHUB_CONFIG.devRepo, 'public/data/cmu-dict.json')
};
