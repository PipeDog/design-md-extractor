# Chrome 手动安装说明

本文档说明如何在 Chrome 中手动安装本项目导出的扩展产物。

## 产物位置

当前项目已经导出了 2 份可用产物：

- 解压后的扩展目录：`dist/design-md-extractor`
- 压缩包：`dist/design-md-extractor-chrome-extension.zip`

## 重要说明

Chrome 的开发者扩展安装方式是「加载已解压的扩展程序」，不能直接选择 `zip` 文件安装。

如果你已经有了解压目录，可以直接加载目录。
如果你手里只有 `zip` 文件，需要先解压，再加载解压后的目录。

## 安装步骤

### 方式 1：直接加载已解压目录（推荐）

1. 打开 Chrome。
2. 在地址栏输入 `chrome://extensions/` 并回车。
3. 打开右上角的「开发者模式」。
4. 点击左上角的「加载已解压的扩展程序」。
5. 选择当前项目中的目录：

```text
dist/design-md-extractor
```

6. 安装成功后，Chrome 扩展列表中会出现 `DESIGN.md Extractor`。

### 方式 2：先解压 zip，再加载目录

1. 找到压缩包：

```text
dist/design-md-extractor-chrome-extension.zip
```

2. 解压该文件。
3. 打开 `chrome://extensions/`。
4. 打开右上角的「开发者模式」。
5. 点击「加载已解压的扩展程序」。
6. 选择解压后的 `design-md-extractor` 目录。

## 安装后如何使用

1. 打开任意 `http` 或 `https` 网站页面。
2. 点击 Chrome 工具栏中的扩展图标。
3. 打开 `DESIGN.md Extractor`。
4. 如果未配置 AI 参数，插件会自动使用本地规则分析。
5. 如果已在设置页填写完整模型参数，插件会自动启用增强分析。
6. 点击「分析并导出 DESIGN.md」。
7. 生成完成后，浏览器会直接下载导出的 Markdown 文件。

## AI 配置说明

如果你希望启用增强分析，需要在插件设置页至少填写以下参数：

- `Base URL`
- `API Key`
- `Model`
- `Protocol`

当前支持的协议：

- `Responses`
- `Chat Completions`

如果上述参数未填写完整，插件会自动回退到本地规则分析模式。

## 常见问题

### 1. 为什么不能直接安装 zip？

因为 Chrome 的开发者扩展加载机制要求选择一个解压后的目录，而不是压缩包文件。

### 2. 为什么点击插件后无法分析？

请确认当前页面是 `http` 或 `https` 页面。像 `chrome://`、扩展页、本地某些受限页面通常不能被插件分析。

### 3. 如果 AI 配置失败会怎样？

插件会自动回退到本地规则分析，不会阻止生成基础版 `DESIGN.md`。
