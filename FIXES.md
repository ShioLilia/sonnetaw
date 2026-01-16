# 🔧 问题修复说明

## 已解决的问题

### 0. ✅ 报错行背景色
**问题**：报错的句子有浅红色背景，太显眼
**解决**：移除背景色，只保留左侧橙色边框提示

```css
.line.meter-invalid {
  border-left: 4px solid #ffb3b3; /* 只有边框 */
}
```

---

### 1. ✅ 格律检查过于严格
**问题**：单音节词（shall, hath, too）被标记为错误，因为它们的重音在非重音位置
**解决**：改为**抑扬格宽松模式** - 允许"轻→重"，标记"重→轻"和"轻→轻"错误

**抑扬格（Iambic）检查规则**：
- ✅ **允许**：`expected[i]=0 && actual[i]=1` （轻音位置有重音 - 单音节词灵活性）
- ❌ **报错**：`expected[i]=1 && actual[i]=0` （重音位置缺失 - "轻轻"错误）
- ❌ **报错**：`expected[i]=1 && actual[i]≠1` （重音位置是轻音 - "重→轻"错误）

```typescript
// 抑扬格检查逻辑
if (expected[i] === 1) {
  if (actual[i] === 0) {
    return false; // "轻轻" - 错误！
  }
  // actual[i] === 1 或 2 都可以
}
```

**非抑扬格（Trochaic, Dactylic等）**：
使用严格模式，精确匹配重音模式（为未来扩展预留）

**效果**：
- ✅ shall, I, too 在轻音位置 → 允许
- ❌ 重音位置完全没有重音 → 报错
- 🔧 支持未来添加其他格律类型

---

### 2. ✅ 重音高亮太显眼
**问题**：每个单词都黄色背景高亮，太刺眼
**解决**：改用**文字颜色**而非背景色

**新样式**：
- **无重音 (0)**：正常黑色
- **主重音 (1)**：橙色 `#d97706` + 加粗
- **次重音 (2)**：黄色 `#f59e0b` + 中粗

```css
.syllable.stress-1 {
  color: #d97706;  /* 橙色 */
  font-weight: 600;
}

.syllable.stress-2 {
  color: #f59e0b;  /* 黄色 */
  font-weight: 500;
}
```

**效果**：视觉更清爽，重音仍然清晰可见 🎨

---

### 3. ✅ 古英语单词不在词典
**问题**：hath, thee, thou 等词不在 CMU 词典中
**影响**：
- 句中：影响音节计数
- 句末：韵脚判断失败

**解决方案（多层防护）**：

#### A. 启发式音节估算
对于未找到的词，使用智能规则估算：

```typescript
estimateSyllables(word) {
  // 1. 数元音组（连续元音=1个音节）
  // 2. 去掉词尾静音 'e'
  // 3. 特殊词处理：fire, hour → 1音节
  // 4. 至少1个音节
}
```

**例子**：
- `hath` → 1音节，主重音
- `thee` → 1音节（去掉静音e）
- `wanderest` → 3音节

#### B. 基础韵脚推测
使用词尾2-3个字母作为韵脚：

```typescript
rhymeKey = word.slice(-2).toLowerCase()
```

**例子**：
- `thee` → "ee"
- `day` → "ay"  
- `see` → "ee"  ✓ 可以匹配

#### C. 警告提示框
显示所有未找到的词：

```
⚠️ Words not in dictionary: hath, thee, thou
Analysis may be less accurate. Syllable counts and rhymes are estimated.
```

#### D. 自定义词典（已实现基础架构）
用户可以添加自己的词：

```typescript
// 完全在前端实现，存储在浏览器 localStorage
dictionary.addCustomWord('hath', ['HH', 'AE1', 'TH']);
```

**✨ 不需要后端！完全静态托管可用！**

**技术实现**：
```typescript
// 保存到 localStorage（按语言分别存储）
localStorage.setItem('customDict_en', JSON.stringify({
  'hath': [['HH', 'AE1', 'TH']],
  'thee': [['DH', 'IY1']],
  'thou': [['DH', 'AW1']]
}));

// 查词时先查自定义词典，再查主词典
lookup(word) {
  return this.customDict[word] || this.dict[word];
}
```

**优点**：
- ✅ 无需服务器，纯静态网页
- ✅ 数据保存在用户浏览器本地
- ✅ 按语言分别存储（customDict_en, customDict_la）
- ✅ 支持导出/导入 JSON 文件
- ✅ 可以分享自定义词典文件

**未来可以添加 UI**：
- 点击灰色词 → 弹出"添加发音"对话框
- 输入音素 → 保存到 localStorage
- 下次自动使用
- 导出按钮 → 下载 JSON 文件
- 导入按钮 → 上传 JSON 文件

---

## 🔧 静态网页 vs 后端对比

### 自定义词典功能

| 功能 | 静态网页（localStorage） | 需要后端 |
|------|-------------------------|----------|
| 保存用户词典 | ✅ 浏览器本地 | ❌ |
| 导出/导入文件 | ✅ JSON文件 | ❌ |
| 跨设备同步 | ❌ 需手动导入 | ✅ |
| 社区共享 | ✅ GitHub Gist / 文件分享 | ✅ |
| 投票/评分 | ❌ | ✅ |
| 自动更新 | ❌ | ✅ |

### 推荐方案（纯静态）

1. **个人使用**：localStorage（已实现）
2. **分享给他人**：导出 JSON 文件
3. **社区词典**：维护在 GitHub repo 中，用户选择加载
4. **跨设备同步**：用户手动导出/导入（或用 GitHub Gist）

**结论**：对于静态 GitHub Pages 托管，当前方案完全够用！无需后端！🎉

---

## 🎯 效果对比

### 之前
```
- 整行浅红背景 😫
- shall 被标红 ❌
- 每个词黄色背景 🟨🟨🟨
- hath 显示灰色，韵脚错误 ❌
```

### 现在
```
- 只有左侧橙色边框 ✅
- shall 不报错 ✅
- 只有重音词显示橙色字体 🟠
- hath 显示灰色，估算1音节，基础韵脚 ⚠️ + 警告提示
```

---

## 📚 扩充词典方法

### 方法 1：添加古英语词汇到 CMU 词典

创建 `public/data/archaic-english.json`：

```json
{
  "thee": [["DH", "IY1"]],
  "thou": [["DH", "AW1"]],
  "hath": [["HH", "AE1", "TH"]],
  "doth": [["D", "AH1", "TH"]],
  "shalt": [["SH", "AE1", "L", "T"]],
  "wilt": [["W", "IH1", "L", "T"]],
  "art": [["AA1", "R", "T"]],
  "ere": [["EH1", "R"]],
  "oft": [["AO1", "F", "T"]],
  "nigh": [["N", "AY1"]],
  "methinks": [["M", "IH0", "TH", "IH1", "NG", "K", "S"]],
  "wherefore": [["W", "EH1", "R", "F", "AO2", "R"]],
  "whither": [["W", "IH1", "DH", "ER0"]],
  "thine": [["DH", "AY1", "N"]],
  "thy": [["DH", "AY1"]],
  "tis": [["T", "IH1", "Z"]],
  "twas": [["T", "W", "AH1", "Z"]]
}
```

然后在加载时合并：

```typescript
// 在 loadDictionary 后
const archaic = await fetch('/data/archaic-english.json').then(r => r.json());
Object.assign(dictData, archaic);
```

### 方法 2：在线查询

为未知词提供"查询发音"按钮：
- 链接到 https://www.dictionary.com/browse/[word]
- 或 https://en.wiktionary.org/wiki/[word]

### 方法 3：用户贡献（完全静态可行！）

**无需后端的实现方案**：

#### 方案 A：文件分享
```javascript
// 导出自定义词典为 JSON 文件
const exportBtn = document.getElementById('exportDict');
exportBtn.onclick = () => {
  const customDict = localStorage.getItem('customDict_en');
  const blob = new Blob([customDict], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-custom-dict.json';
  a.click();
};

// 导入他人分享的词典
const importBtn = document.getElementById('importDict');
importBtn.onclick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    const text = await file.text();
    const imported = JSON.parse(text);
    // 合并到现有词典
    const current = JSON.parse(localStorage.getItem('customDict_en') || '{}');
    Object.assign(current, imported);
    localStorage.setItem('customDict_en', JSON.stringify(current));
  };
  input.click();
};
```

#### 方案 B：GitHub Gist 集成
```javascript
// 用户可以分享词典到 GitHub Gist
// 其他用户输入 Gist ID 加载
async function loadFromGist(gistId) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`);
  const gist = await response.json();
  const dictFile = gist.files['custom-dict.json'];
  const customDict = JSON.parse(dictFile.content);
  return customDict;
}
```

#### 方案 C：社区词典库（静态托管）
在 GitHub Pages 仓库中维护社区词典：
```
public/data/
├── eng-cmu.json          # 主词典
├── archaic-english.json  # 古英语扩展
├── shakespeare.json      # 莎士比亚词汇
└── community/            # 社区贡献
    ├── medieval.json
    └── scottish.json
```

用户选择加载：
```javascript
<select id="extraDict">
  <option value="">No extra dictionary</option>
  <option value="archaic-english.json">Archaic English</option>
  <option value="shakespeare.json">Shakespeare</option>
</select>
```

**完全不需要后端！** ✨

---

## 🚀 未来改进建议

### UI 增强
1. **点击灰色词 → 编辑对话框**
   ```
   Word: hath
   Pronunciation: [HH] [AE1] [TH]
   [Add] [Cancel]
   ```

2. **导入/导出自定义词典**
   ```
   [Export Custom Words] [Import Custom Words]
   ```

3. **智能建议**
   ```
   Did you mean "has" instead of "hath"?
   Suggested pronunciation: [HH AE1 TH]
   [Accept] [Edit] [Ignore]
   ```

### 算法优化
1. 使用机器学习预测音节和重音
2. 基于上下文调整单音节词的重音
3. 学习用户的修正，改进估算

---

## 测试建议

试试这些诗句，验证修复效果：

```
Shall I compare thee to a summer's day?  ← shall 不应报错
Thou art more lovely and more temperate   ← thou, art 估算音节
Rough winds do shake the darling buds of May
And summer's lease hath all too short a date  ← hath 显示警告但工作

When I do count the clock that tells the time  ← do, I 不报错
And see the brave day sunk in hideous night   ← 正常
```

预期：
- ✅ shall, do, I, too 等不被标红
- ⚠️ thee, thou, hath 显示灰色 + 顶部警告
- ✅ 韵脚基本正确（day/May 仍能匹配）
- ✅ 视觉更清爽（橙色文字而非黄色背景）
