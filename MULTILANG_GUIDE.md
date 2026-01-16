# 🌍 多语言词典添加指南

## 📁 文件结构

```
public/data/
├── eng-cmu.json      # 英语词典（CMU格式）
├── zh-pinyin.json    # 中文词典（拼音格式）【示例】
└── fr-phonemes.json  # 法语词典（音素格式）【示例】
```

---

## 🎯 添加新语言步骤

### 1️⃣ 准备词典文件

词典必须是 **JSON 格式**，结构如下：

```json
{
  "word1": [
    ["P", "H", "O1", "N", "E2", "M", "E0", "S"]
  ],
  "word2": [
    ["A1", "L", "T", "ER0", "N", "A2", "T", "IH0", "V"],
    ["A2", "L", "T", "ER1", "N", "A0", "T", "IH0", "V"]
  ]
}
```

**格式说明：**
- **键**：单词（小写）
- **值**：二维数组
  - 外层数组：该词的多个发音
  - 内层数组：音素列表
  
**音素标注规则：**
- 元音音素必须以 `0`、`1` 或 `2` 结尾
  - `0` = 无重音
  - `1` = 主重音（Primary stress）
  - `2` = 次重音（Secondary stress）
- 辅音音素没有数字后缀

**示例：**
```json
{
  "hello": [["HH", "AH0", "L", "OW1"]],
  "world": [["W", "ER1", "L", "D"]],
  "poetry": [["P", "OW1", "AH0", "T", "R", "IY0"]]
}
```

---

### 2️⃣ 放置词典文件

将准备好的词典文件放到：
```
public/data/your-language.json
```

**命名建议：**
- `eng-cmu.json` - 英语（CMU格式）
- `zh-pinyin.json` - 中文（拼音）
- `fr-phonemes.json` - 法语
- `de-phonemes.json` - 德语
- `es-phonemes.json` - 西班牙语

---

### 3️⃣ 注册语言配置

编辑 `src/config.ts`，在 `SUPPORTED_LANGUAGES` 数组中添加：

```typescript
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    dictionaryFile: 'eng-cmu.json'
  },
  // 添加新语言 👇
  {
    code: 'zh',           // ISO 639-1 语言代码
    name: '中文',          // 显示名称
    dictionaryFile: 'zh-pinyin.json'  // 文件名
  },
  {
    code: 'fr',
    name: 'Français',
    dictionaryFile: 'fr-phonemes.json'
  }
];
```

**参数说明：**
- `code`: 语言代码（推荐使用 ISO 639-1 标准）
- `name`: 在界面上显示的语言名称
- `dictionaryFile`: `public/data/` 目录下的文件名

---

### 4️⃣ 构建和部署

```bash
# 1. 构建项目
npm run build

# 2. 部署到 GitHub Pages
npm run deploy
```

完成！新语言会自动出现在语言选择器中。

---

## 🔧 词典格式转换

### 从其他格式转换到要求格式

如果你有现成的词典，但格式不同，可以编写转换脚本。

**示例：转换 CMU 词典格式**

原始 CMU 格式（`cmudict.txt`）：
```
HELLO  HH AH0 L OW1
WORLD  W ER1 L D
```

转换成 JSON：
```javascript
// convert-cmu-to-json.js
const fs = require('fs');

const lines = fs.readFileSync('cmudict.txt', 'utf-8').split('\n');
const dict = {};

for (const line of lines) {
  if (!line || line.startsWith(';')) continue; // 跳过注释
  
  const [word, ...phonemes] = line.trim().split(/\s+/);
  const cleanWord = word.toLowerCase().replace(/\(\d+\)$/, ''); // 去掉变体标记
  
  if (!dict[cleanWord]) {
    dict[cleanWord] = [];
  }
  dict[cleanWord].push(phonemes);
}

fs.writeFileSync('eng-cmu.json', JSON.stringify(dict, null, 2));
console.log('Conversion complete!');
```

运行：
```bash
node convert-cmu-to-json.js
```

---

## 📚 获取现成词典

### 英语
- **CMU Pronouncing Dictionary**: http://www.speech.cs.cmu.edu/cgi-bin/cmudict
- 已包含在项目中：`public/data/eng-cmu.json`

### 其他语言资源

**中文：**
- 汉语拼音词典：可以基于 CC-CEDICT
- 格式需要转换成音素标注

**法语：**
- Lexique 3: http://www.lexique.org/
- 需要转换成音素格式

**德语：**
- PHONOLEX: https://www.phonetik.uni-muenchen.de/Bas/BasPHONOLEXeng.html

**西班牙语：**
- LEXESP: 西班牙语发音词典

---

## 🎨 语言特定处理（高级）

如果某个语言需要特殊的音节分析逻辑，可以扩展 `DictionaryService` 类：

```typescript
// src/dictionary.ts

extractSyllables(phonemes: string[]): Syllable[] {
  // 根据当前语言使用不同逻辑
  switch (this.currentLanguage) {
    case 'en':
      return this.extractSyllablesEnglish(phonemes);
    case 'zh':
      return this.extractSyllablesChinese(phonemes);
    default:
      return this.extractSyllablesEnglish(phonemes); // 默认
  }
}

private extractSyllablesChinese(phonemes: string[]): Syllable[] {
  // 中文特定的音节提取逻辑
  // ...
}
```

---

## ✅ 测试清单

添加新语言后，请测试：

- [ ] 词典文件能正常加载
- [ ] 语言选择器显示新语言
- [ ] 切换语言后能正确分析单词
- [ ] 音节划分正确
- [ ] 重音标记正确
- [ ] 押韵检测正常工作

---

## 🐛 常见问题

### Q: 为什么词典加载失败？
**A**: 检查：
1. 文件名是否在 `config.ts` 中正确配置
2. JSON 格式是否正确（可以用 JSON validator 验证）
3. 浏览器控制台是否有错误信息

### Q: 如何减小词典文件大小？
**A**: 
1. 移除不常用词
2. 压缩 JSON（去掉空格和换行）
3. 考虑使用 gzip 压缩

### Q: 可以动态加载词典吗？
**A**: 可以！当前设计支持：
- 用户切换语言时自动加载对应词典
- 不需要预加载所有词典

---

## 📝 词典文件示例

### 最小示例（用于测试）

```json
{
  "the": [["DH", "AH0"]],
  "quick": [["K", "W", "IH1", "K"]],
  "brown": [["B", "R", "AW1", "N"]],
  "fox": [["F", "AA1", "K", "S"]],
  "jumps": [["JH", "AH1", "M", "P", "S"]],
  "over": [["OW1", "V", "ER0"]],
  "lazy": [["L", "EY1", "Z", "IY0"]],
  "dog": [["D", "AO1", "G"]]
}
```

保存为 `public/data/test-mini.json`，然后在 `config.ts` 中添加：
```typescript
{
  code: 'test',
  name: 'Test (Mini)',
  dictionaryFile: 'test-mini.json'
}
```

---

## 🚀 未来扩展

可以考虑添加：
- 从在线 API 动态加载词典
- 支持用户上传自定义词典
- 词典缓存（localStorage）
- 多词典合并使用

---

**需要帮助？** 查看现有的 `eng-cmu.json` 作为参考示例。

# 🏛️ 多语言多诗歌形式架构说明

## 📐 新架构概览

### 之前的问题 ❌
```typescript
// 所有语言的诗歌形式混在一起
export const SONNET_FORMS = {
  shakespearean: {...},
  petrarchan1: {...},
  petrarchan2: {...},
  // 以后添加拉丁语、希腊语时会变成...
  dactylic_hexameter: {...},
  elegiac_couplet: {...},
  sapphic_stanza: {...},
  // 越来越长，难以管理！
}
```

### 现在的解决方案 ✅
```typescript
// 诗歌形式按语言分组
SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    poeticForms: [shakespearean, petrarchan1, petrarchan2]
  },
  {
    code: 'la',
    name: 'Latin',
    poeticForms: [dactylic_hexameter, elegiac_couplet]
  },
  {
    code: 'grc',
    name: 'Ancient Greek',
    poeticForms: [sapphic_stanza, alcaic_stanza]
  }
]
```

---

## 🎯 核心改进

### 1. **语言与诗歌形式绑定**

每个语言配置包含：
- `dictionaryFile`: 发音词典
- `poeticForms[]`: 该语言支持的所有诗歌形式

### 2. **诗歌形式结构增强**

```typescript
interface SonnetForm {
  id: string;          // 唯一标识符
  name: string;        // 显示名称
  description: string; // 简短描述（如 "ABAB CDCD EFEF GG"）
  rhymeScheme: string[];
  meter: MeterPattern;
  lineCount: number;   // 0 表示可变长度
}
```

### 3. **级联选择器 UI**

```
┌─────────────────────┬─────────────────────┐
│  Language           │  Poetic Form        │
│  ↓ English          │  ↓ Shakespearean    │
│  · Latin            │  · Petrarchan (1)   │
│  · Ancient Greek    │  · Petrarchan (2)   │
└─────────────────────┴─────────────────────┘
```

**用户体验：**
1. 选择语言 → 自动加载对应词典
2. 诗歌形式选择器自动更新 → 显示该语言的所有形式
3. 选择诗歌形式 → 开始分析

---

## 📚 添加新语言示例

### 示例 1: 拉丁语

```typescript
// 在 config.ts 中定义拉丁语格律
const DACTYLIC_HEXAMETER: MeterPattern = {
  name: 'Dactylic Hexameter',
  description: 'Long-short-short pattern (— ∪ ∪), 6 feet',
  stressPattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], // 简化版
  syllableCount: 17 // 理想情况
};

const ELEGIAC_COUPLET: MeterPattern = {
  name: 'Elegiac Couplet',
  description: 'Hexameter + Pentameter',
  stressPattern: [], // 需要特殊处理
  syllableCount: 0
};

// 拉丁语诗歌形式
const LATIN_FORMS: SonnetForm[] = [
  {
    id: 'dactylic_hexameter',
    name: 'Dactylic Hexameter',
    description: 'Epic meter (Homer, Virgil)',
    rhymeScheme: [], // 古典拉丁诗歌不押韵
    meter: DACTYLIC_HEXAMETER,
    lineCount: 0 // 可变长度
  },
  {
    id: 'elegiac_couplet',
    name: 'Elegiac Couplet',
    description: 'Hexameter + Pentameter alternating',
    rhymeScheme: [],
    meter: ELEGIAC_COUPLET,
    lineCount: 0 // 双行为单位
  }
];

// 添加到语言列表
{
  code: 'la',
  name: 'Latin',
  dictionaryFile: 'latin-prosody.json',
  poeticForms: LATIN_FORMS
}
```

### 示例 2: 古希腊语

```typescript
const SAPPHIC_STANZA: MeterPattern = {
  name: 'Sapphic Stanza',
  description: 'Three sapphic lines + one adonic',
  stressPattern: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1], // 萨福行
  syllableCount: 11
};

const GREEK_FORMS: SonnetForm[] = [
  {
    id: 'sapphic_stanza',
    name: 'Sapphic Stanza',
    description: 'Lyric meter (Sappho, Horace)',
    rhymeScheme: [],
    meter: SAPPHIC_STANZA,
    lineCount: 4 // 4行为一组
  },
  {
    id: 'alcaic_stanza',
    name: 'Alcaic Stanza',
    description: 'Four-line lyric meter',
    rhymeScheme: [],
    meter: ALCAIC_METER,
    lineCount: 4
  }
];

{
  code: 'grc',
  name: 'Ancient Greek (Ἑλληνική)',
  dictionaryFile: 'greek-prosody.json',
  poeticForms: GREEK_FORMS
}
```

---

## 🎨 UI 美观性改进

### 1. **紧凑的双列布局**

```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
```

**优点：**
- 节省垂直空间
- 语言和形式并排，视觉关联更清晰
- 移动端自动切换为单列

### 2. **信息提示**

```html
<label>
  Language
  <small>(Select poetry language)</small>
</label>
```

**效果：**
- 主标签加粗
- 说明文字小号、浅色
- 不会太拥挤

### 3. **悬停和焦点效果**

```css
select:hover {
  border-color: #667eea;
}

select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

**体验：**
- 交互反馈明确
- 渐变过渡平滑
- 无障碍友好

### 4. **Option 提示**

```javascript
option.title = form.description; // 鼠标悬停显示完整描述
```

---

## 🔧 特殊情况处理

### 无押韵的诗歌

对于古典拉丁语、希腊语诗歌：

```typescript
rhymeScheme: [] // 空数组表示无押韵要求
```

程序会跳过押韵检查，只检查格律。

### 可变长度诗歌

```typescript
lineCount: 0 // 0 表示可变长度
```

程序不会限制行数，适合：
- 自由诗
- 散文诗
- 不定长的古典诗歌

### 复合格律

对于 Elegiac Couplet（双行体）：

```typescript
{
  id: 'elegiac_couplet',
  name: 'Elegiac Couplet',
  description: 'Hexameter + Pentameter',
  rhymeScheme: [],
  meter: {
    name: 'Elegiac',
    description: 'Alternating Hexameter and Pentameter',
    stressPattern: [], // 需要在 analyzer 中特殊处理
    syllableCount: 0
  },
  lineCount: 0 // 以双行为单位
}
```

**实现提示：**可以在 `SonnetAnalyzer` 中添加特殊逻辑：

```typescript
if (form.id === 'elegiac_couplet') {
  // 奇数行用六步格
  // 偶数行用五步格
}
```

---

## 📊 架构对比

### 之前
```
扁平结构
├── shakespearean
├── petrarchan1
├── petrarchan2
└── ...50种诗歌形式...
```
**问题：** 100个形式怎么办？用户要在巨长的下拉菜单中找？

### 现在
```
层次结构
├── English
│   ├── Shakespearean
│   ├── Petrarchan (1)
│   └── Petrarchan (2)
├── Latin
│   ├── Dactylic Hexameter
│   └── Elegiac Couplet
└── Ancient Greek
    ├── Sapphic Stanza
    └── Alcaic Stanza
```
**优势：** 每个语言最多 5-10 个形式，易于管理！

---

## 🚀 未来扩展方向

### 1. 分类标签
为诗歌形式添加标签：

```typescript
interface SonnetForm {
  // ...
  tags: string[]; // ['sonnet', 'fixed-form', 'renaissance']
  era: string;    // 'Renaissance', 'Classical', 'Modern'
}
```

### 2. 搜索功能
```html
<input type="text" placeholder="Search forms..." />
```

### 3. 收藏夹
```typescript
localStorage.setItem('favoriteForm', 'shakespearean');
```

### 4. 自定义形式
让用户创建自己的诗歌形式：
```typescript
{
  id: 'custom_user_form',
  name: 'My Custom Form',
  // ...
}
```

---

## 📝 总结

**核心理念：** 
- 语言 → 诗歌形式 → 分析
- 分层管理，清晰明了
- UI 紧凑美观，易于扩展

**可扩展性：**
- ✅ 添加新语言：1个对象
- ✅ 添加新形式：1个元素
- ✅ UI 自动更新
- ✅ 无需修改核心代码

**用户体验：**
- ✅ 级联选择，逻辑清晰
- ✅ 响应式布局
- ✅ 信息提示到位
- ✅ 未来可支持几十种语言！
