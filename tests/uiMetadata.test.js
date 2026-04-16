import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LANGUAGE_OPTIONS,
  PROTOCOL_OPTIONS,
  TOOLTIP_COPY,
  getMessage,
  resolveSupportedLanguage,
} from '../src/core/uiMetadata.js';

test('协议选项文案不包含 Compatible 后缀', () => {
  assert.deepEqual(PROTOCOL_OPTIONS, [
    { value: 'responses', label: 'Responses' },
    { value: 'chat_completions', label: 'Chat Completions' },
  ]);
});

test('输出语言使用预定义选项而不是自由输入', () => {
  assert.deepEqual(LANGUAGE_OPTIONS, [
    { value: 'en', label: 'English' },
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
  ]);
});

test('专业术语存在明确提示文案', () => {
  assert.match(TOOLTIP_COPY.includeFrontmatter, /元数据|标题信息/);
  assert.match(TOOLTIP_COPY.includeRawAuditAppendix, /附录|原始分析/);
  assert.match(TOOLTIP_COPY.language, /默认英文|效果最好|不建议修改/);
  assert.equal('providerLabel' in TOOLTIP_COPY, false);
  assert.equal('maxTextLength' in TOOLTIP_COPY, false);
});

test('默认语言根据浏览器语言映射到支持语言', () => {
  assert.equal(resolveSupportedLanguage('zh-Hans-CN'), 'zh-CN');
  assert.equal(resolveSupportedLanguage('zh-Hant-TW'), 'zh-TW');
  assert.equal(resolveSupportedLanguage('zh-TW'), 'zh-TW');
  assert.equal(resolveSupportedLanguage('en-US'), 'en');
  assert.equal(resolveSupportedLanguage('ja-JP'), 'ja');
  assert.equal(resolveSupportedLanguage('ko-KR'), 'ko');
  assert.equal(resolveSupportedLanguage('fr-FR'), 'fr');
  assert.equal(resolveSupportedLanguage('de-DE'), 'de');
  assert.equal(resolveSupportedLanguage('es-MX'), 'es');
});

test('不支持的浏览器语言回退到英文', () => {
  assert.equal(resolveSupportedLanguage('it-IT'), 'en');
});

test('可获取不同语言下的界面文案', () => {
  assert.equal(getMessage('zh-CN', 'settings.title'), 'DESIGN.md Extractor 设置');
  assert.equal(getMessage('zh-TW', 'settings.title'), 'DESIGN.md Extractor 設定');
  assert.equal(getMessage('en', 'settings.title'), 'DESIGN.md Extractor Settings');
  assert.equal(getMessage('ja', 'settings.saveButton'), '設定を保存');
  assert.equal(getMessage('zh-CN', 'settings.uiLanguage'), '当前语言');
  assert.equal(getMessage('zh-CN', 'settings.enableAi'), '启动 AI 分析生成');
  assert.equal(getMessage('zh-CN', 'settings.enableAiHint'), '推荐开启，生成质量明显更高');
  assert.equal(getMessage('zh-CN', 'popup.analyzeButton'), '分析并生成 DESIGN.md');
  assert.equal(getMessage('zh-CN', 'popup.localMode'), '本地模式 · 基础稿');
  assert.equal(getMessage('en', 'popup.localMode'), 'Local Mode · Base Draft');
  assert.equal(getMessage('en', 'popup.hybridMode'), 'AI Mode · Refined Output');
  assert.equal(getMessage('zh-CN', 'popup.localPromptSwitchAi'), '切换到 AI 模式');
});
