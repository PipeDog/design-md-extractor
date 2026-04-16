import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getEffectiveMode,
  getSettingsWithDefaults,
  normalizeAiModePreference,
  resolveDefaultSettings,
  validateEnabledAiSettings,
  validateAiConfig,
} from '../src/core/config.js';

test('validateAiConfig 在缺少必填项时返回 invalid', () => {
  const result = validateAiConfig({
    enabled: true,
    baseUrl: '',
    apiKey: '',
    model: '',
    protocol: '',
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.missing, ['baseUrl', 'apiKey', 'model', 'protocol']);
});

test('validateAiConfig 在配置完整时返回 valid', () => {
  const result = validateAiConfig({
    enabled: true,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk-demo',
    model: 'gpt-x',
    protocol: 'responses',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.missing, []);
});

test('getEffectiveMode 在 AI 配置不完整时回退到 local', () => {
  const settings = getSettingsWithDefaults({
    ai: {
      enabled: true,
      baseUrl: '',
      apiKey: '',
      model: '',
      protocol: '',
    },
  });

  assert.equal(getEffectiveMode(settings), 'local');
});

test('getEffectiveMode 在 AI 配置完整时启用 hybrid', () => {
  const settings = getSettingsWithDefaults({
    ai: {
      enabled: true,
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-demo',
      model: 'gpt-x',
      protocol: 'chat_completions',
    },
  });

  assert.equal(getEffectiveMode(settings), 'hybrid');
});

test('getEffectiveMode 在 AI 参数完整但未勾选启用时回退到 local', () => {
  const settings = getSettingsWithDefaults({
    ai: {
      enabled: false,
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-demo',
      model: 'gpt-x',
      protocol: 'responses',
    },
  });

  assert.equal(getEffectiveMode(settings), 'local');
});

test('getEffectiveMode 支持通过 modePreference 在已配置时快速切换模式', () => {
  const settings = getSettingsWithDefaults({
    ai: {
      enabled: false,
      modePreference: 'hybrid',
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-demo',
      model: 'gpt-x',
      protocol: 'responses',
    },
  });

  assert.equal(getEffectiveMode(settings), 'hybrid');
});

test('resolveDefaultSettings 使用浏览器当前语言作为页面和输出默认语言', () => {
  const settings = resolveDefaultSettings({}, 'fr-FR');

  assert.equal(settings.ui.displayLanguage, 'fr');
  assert.equal(settings.ai.language, 'en');
});

test('getSettingsWithDefaults 采用更严格的 DESIGN.md 生成默认参数', () => {
  const settings = getSettingsWithDefaults();

  assert.equal(settings.ai.temperature, 0.1);
  assert.equal(settings.ai.maxOutputTokens, 5200);
  assert.equal(settings.ai.language, 'en');
  assert.equal(settings.ai.modePreference, '');
  assert.equal(settings.analysis.maxDomNodes, 400);
  assert.equal(settings.analysis.includeRawAuditAppendix, false);
});

test('normalizeAiModePreference 在缺省情况下根据 enabled 推导模式', () => {
  assert.equal(normalizeAiModePreference(undefined, true), 'hybrid');
  assert.equal(normalizeAiModePreference(undefined, false), 'local');
  assert.equal(normalizeAiModePreference('local', true), 'local');
});

test('validateEnabledAiSettings 仅在启用 AI 时返回必要参数字段错误', () => {
  const disabled = validateEnabledAiSettings({
    ai: {
      enabled: false,
      baseUrl: '',
      apiKey: '',
      model: '',
      protocol: '',
    },
  });

  assert.equal(disabled.valid, true);
  assert.deepEqual(disabled.fieldErrors, {});

  const enabled = validateEnabledAiSettings({
    ai: {
      enabled: true,
      baseUrl: '',
      apiKey: '',
      model: '',
      protocol: '',
    },
  });

  assert.equal(enabled.valid, false);
  assert.deepEqual(Object.keys(enabled.fieldErrors), ['baseUrl', 'apiKey', 'model', 'protocol']);
});
