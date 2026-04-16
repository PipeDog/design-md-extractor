# DESIGN.md Extractor Chrome 插件实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个可分析当前网页 UI、自动生成并下载 `DESIGN.md` 的 Chrome 插件，支持本地规则和远程 AI 增强两种模式。

**架构：** 采用 Manifest V3 扩展结构，使用 `popup` 作为主入口、`options` 管理配置、`content script` 采集页面、`background service worker` 调度分析。核心分析、Markdown 生成与 AI 协议适配抽到共享模块，并通过 Node 内置测试覆盖。

**技术栈：** Chrome Extension Manifest V3、原生 HTML/CSS/JavaScript、Node.js 内置测试运行器

---

## 文件结构

- 创建：`package.json`
- 创建：`.gitignore`
- 创建：`src/core/config.js`
- 创建：`src/core/pageSnapshot.js`
- 创建：`src/core/localAnalyzer.js`
- 创建：`src/core/markdown.js`
- 创建：`src/core/aiProvider.js`
- 创建：`src/core/storage.js`
- 创建：`src/background.js`
- 创建：`src/content.js`
- 创建：`src/popup.js`
- 创建：`src/options.js`
- 创建：`manifest.json`
- 创建：`popup.html`
- 创建：`popup.css`
- 创建：`options.html`
- 创建：`options.css`
- 创建：`tests/config.test.js`
- 创建：`tests/localAnalyzer.test.js`
- 创建：`tests/markdown.test.js`
- 创建：`tests/aiProvider.test.js`
- 修改：`README.md`

### 任务 1：初始化项目骨架

**文件：**
- 创建：`package.json`
- 创建：`.gitignore`
- 创建：`manifest.json`

- [ ] **步骤 1：创建项目元数据文件**

```json
{
  "name": "design-md-extractor",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **步骤 2：创建 `.gitignore`**

```gitignore
node_modules
.DS_Store
coverage
```

- [ ] **步骤 3：创建 Manifest V3**

```json
{
  "manifest_version": 3,
  "name": "DESIGN.md Extractor",
  "version": "0.2.0",
  "permissions": ["activeTab", "storage", "downloads", "scripting", "tabs"],
  "host_permissions": ["http://*/*", "https://*/*"],
  "background": {
    "service_worker": "src/background.js",
    "type": "module"
  }
}
```

- [ ] **步骤 4：运行基础测试命令确认环境可执行**

运行：`npm test`

预期：测试框架启动，若无测试文件则输出 0 个测试或对应提示。

### 任务 2：先写核心测试

**文件：**
- 测试：`tests/config.test.js`
- 测试：`tests/localAnalyzer.test.js`
- 测试：`tests/markdown.test.js`
- 测试：`tests/aiProvider.test.js`

- [ ] **步骤 1：为配置校验编写失败测试**

```javascript
test('validateAiConfig 在缺少必填项时返回 invalid', () => {
  const result = validateAiConfig({ enabled: true, baseUrl: '', apiKey: '' });
  assert.equal(result.valid, false);
});
```

- [ ] **步骤 2：运行单测验证失败**

运行：`npm test -- tests/config.test.js`

预期：FAIL，提示 `validateAiConfig` 未定义或断言失败。

- [ ] **步骤 3：为本地分析器编写失败测试**

```javascript
test('analyzeSnapshot 能识别导航、按钮和颜色 token', () => {
  const result = analyzeSnapshot(snapshotFixture);
  assert.equal(result.components.navigation, 1);
  assert.ok(result.tokens.colors.length > 0);
});
```

- [ ] **步骤 4：为 Markdown 生成器编写失败测试**

```javascript
test('buildDesignMarkdown 生成 DESIGN.md 标题和章节', () => {
  const markdown = buildDesignMarkdown(reportFixture);
  assert.match(markdown, /^# /);
  assert.match(markdown, /## Visual Tokens/);
});
```

- [ ] **步骤 5：为 AI Provider 适配器编写失败测试**

```javascript
test('buildAiRequest 支持 responses 协议', () => {
  const request = buildAiRequest(configFixture, payloadFixture);
  assert.match(request.url, /\/v1\/responses$/);
});
```

- [ ] **步骤 6：运行完整测试集确认红灯**

运行：`npm test`

预期：FAIL，失败原因集中在核心模块尚未实现。

### 任务 3：实现共享核心模块

**文件：**
- 创建：`src/core/config.js`
- 创建：`src/core/pageSnapshot.js`
- 创建：`src/core/localAnalyzer.js`
- 创建：`src/core/markdown.js`
- 创建：`src/core/aiProvider.js`
- 创建：`src/core/storage.js`

- [ ] **步骤 1：实现配置校验与默认值逻辑**

```javascript
export function validateAiConfig(config) {
  const required = ['baseUrl', 'apiKey', 'model', 'protocol'];
  const missing = required.filter((key) => !String(config?.[key] || '').trim());
  return { valid: missing.length === 0, missing };
}
```

- [ ] **步骤 2：实现页面快照摘要和裁剪逻辑**

```javascript
export function normalizeSnapshot(snapshot, limits) {
  return {
    ...snapshot,
    headings: (snapshot.headings || []).slice(0, limits.maxHeadings),
    textBlocks: (snapshot.textBlocks || []).slice(0, limits.maxTextBlocks),
  };
}
```

- [ ] **步骤 3：实现本地分析器**

```javascript
export function analyzeSnapshot(snapshot) {
  return {
    pageType: inferPageType(snapshot),
    components: countComponents(snapshot),
    tokens: extractTokens(snapshot),
  };
}
```

- [ ] **步骤 4：实现 Markdown 生成器**

```javascript
export function buildDesignMarkdown(report) {
  return `# ${report.title}\n\n## 页面概览\n...`;
}
```

- [ ] **步骤 5：实现双协议 AI Provider 适配器**

```javascript
export function buildAiRequest(config, payload) {
  if (config.protocol === 'responses') {
    return { url: `${config.baseUrl}${config.endpointPath}`, body: { model: config.model, input: payload } };
  }
  return { url: `${config.baseUrl}${config.endpointPath}`, body: { model: config.model, messages: payload.messages } };
}
```

- [ ] **步骤 6：运行测试验证通过**

运行：`npm test`

预期：PASS，核心测试全部通过。

### 任务 4：实现扩展壳层

**文件：**
- 创建：`src/background.js`
- 创建：`src/content.js`
- 创建：`src/popup.js`
- 创建：`src/options.js`
- 创建：`popup.html`
- 创建：`popup.css`
- 创建：`options.html`
- 创建：`options.css`

- [ ] **步骤 1：实现 Content Script 采集当前页面**

```javascript
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'COLLECT_PAGE_SNAPSHOT') {
    sendResponse(collectPageSnapshot());
  }
});
```

- [ ] **步骤 2：实现 Background 调度分析和下载**

```javascript
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RUN_ANALYSIS') {
    runAnalysis().then(sendResponse);
    return true;
  }
});
```

- [ ] **步骤 3：实现 Popup 的主交互**

```javascript
analyzeButton.addEventListener('click', async () => {
  const result = await chrome.runtime.sendMessage({ type: 'RUN_ANALYSIS' });
  renderResult(result);
});
```

- [ ] **步骤 4：实现设置页保存和状态提示**

```javascript
saveButton.addEventListener('click', async () => {
  await saveSettings(readFormValues());
  renderSavedState();
});
```

- [ ] **步骤 5：运行测试确认壳层未破坏核心逻辑**

运行：`npm test`

预期：PASS。

### 任务 5：完善文档与手动验证

**文件：**
- 修改：`README.md`

- [ ] **步骤 1：补充 README，说明安装、配置与模式切换**

```markdown
## 模式说明

- 未配置 AI：本地规则分析
- 已配置 AI：本地规则 + 远程增强分析
```

- [ ] **步骤 2：运行测试**

运行：`npm test`

预期：PASS。

- [ ] **步骤 3：检查扩展关键文件存在**

运行：`find . -maxdepth 2 \\( -name 'manifest.json' -o -name 'popup.html' -o -name 'options.html' -o -path './src/*' \\) | sort`

预期：输出 manifest、popup、options 和 `src` 核心文件。

- [ ] **步骤 4：Commit**

```bash
git add .
git commit -m "feat: build hybrid design md extractor extension"
```

## 自检

- 规格覆盖度：计划覆盖模式切换、配置、采集、本地分析、AI 增强、导出、文档与验证。
- 占位符扫描：无 `TODO`、`TBD` 或“后续补充”式占位符。
- 类型一致性：统一使用 `protocol`、`buildAiRequest`、`buildDesignMarkdown`、`analyzeSnapshot` 等术语。
