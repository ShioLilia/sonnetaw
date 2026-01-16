/**
 * CMU Dictionary Converter
 * 将 CMU 发音字典从文本格式转换为 JSON 格式
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { dirname } from 'path';

// 输入输出文件路径
const INPUT_FILE = 'cmudict-0.7b';
const OUTPUT_FILE = 'data/cmu-dict-full.json';

console.log('🔄 开始转换 CMU 字典...\n');

// 读取原始字典文件
const content = readFileSync(INPUT_FILE, 'utf-8');
const lines = content.split('\n');

const dictionary = {};
let processedCount = 0;
let skippedCount = 0;

for (const line of lines) {
  // 跳过空行和注释行
  if (!line.trim() || line.startsWith(';;;')) {
    continue;
  }

  // 分割单词和音素
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) {
    skippedCount++;
    continue;
  }

  let word = parts[0];
  const phonemes = parts.slice(1);

  // 处理变体标记，如 WORD(1), WORD(2)
  // 移除括号中的数字，保留主单词
  word = word.replace(/\(\d+\)$/, '');

  // 转换为小写
  word = word.toLowerCase();

  // 过滤掉特殊符号开头的"单词"（如 !EXCLAMATION-POINT）
  if (/^[^a-z']/.test(word)) {
    skippedCount++;
    continue;
  }

  // 如果单词已存在，添加为另一个发音变体
  if (!dictionary[word]) {
    dictionary[word] = [];
  }
  
  // 确保是数组（防御性编程）
  if (!Array.isArray(dictionary[word])) {
    dictionary[word] = [];
  }

  // 检查是否已有相同的发音（避免重复）
  const phonemeString = JSON.stringify(phonemes);
  const isDuplicate = dictionary[word].some(
    existing => JSON.stringify(existing) === phonemeString
  );

  if (!isDuplicate) {
    dictionary[word].push(phonemes);
  }

  processedCount++;
  
  // 显示进度
  if (processedCount % 10000 === 0) {
    console.log(`已处理 ${processedCount} 行...`);
  }
}

// 按字母顺序排序
const sortedDictionary = Object.keys(dictionary)
  .sort()
  .reduce((acc, key) => {
    acc[key] = dictionary[key];
    return acc;
  }, {});

// 创建输出目录
const outputDir = dirname(OUTPUT_FILE);
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// 写入 JSON 文件（每个单词一行的格式）
const jsonLines = ['{\n'];
const words = Object.keys(sortedDictionary);
words.forEach((word, index) => {
  const pronunciations = JSON.stringify(sortedDictionary[word]);
  const comma = index < words.length - 1 ? ',' : '';
  jsonLines.push(`  "${word}": ${pronunciations}${comma}\n`);
});
jsonLines.push('}');

writeFileSync(
  OUTPUT_FILE,
  jsonLines.join(''),
  'utf-8'
);

// 统计信息
const uniqueWords = Object.keys(dictionary).length;
const totalPronunciations = Object.values(dictionary).reduce(
  (sum, pronunciations) => sum + pronunciations.length,
  0
);

console.log('\n✅ 转换完成！');
console.log(`\n📊 统计信息:`);
console.log(`   处理的行数: ${processedCount}`);
console.log(`   跳过的行数: ${skippedCount}`);
console.log(`   唯一单词数: ${uniqueWords}`);
console.log(`   总发音数: ${totalPronunciations}`);
console.log(`   输出文件: ${OUTPUT_FILE}`);
console.log(`   文件大小: ${(statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);

// 显示一些示例
console.log('\n📝 示例条目:');
const sampleWords = ['hello', 'world', 'love', 'poetry', 'by'];
sampleWords.forEach(word => {
  if (dictionary[word]) {
    console.log(`   "${word}": ${JSON.stringify(dictionary[word])}`);
  }
});

console.log('\n💡 提示: 完整字典较大，如需用于 Web 版本，建议创建精简版本。');
