import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeSnapshot } from '../src/core/localAnalyzer.js';

const snapshotFixture = {
  url: 'https://example.com/pricing',
  title: 'Acme Pricing',
  lang: 'zh-CN',
  metaDescription: '定价页面',
  headings: [
    { level: 1, text: '简单、透明的价格' },
    { level: 2, text: '功能对比' },
  ],
  textBlocks: [
    '开始使用，数分钟内完成部署。',
    'Trusted by teams shipping SaaS products.',
  ],
  colors: ['#ffffff', '#101418', '#4f46e5'],
  fonts: ['Georgia', 'IBM Plex Sans'],
  radii: ['16px', '999px'],
  shadows: ['0 20px 60px rgba(16, 20, 24, 0.18)'],
  buttons: [
    { text: '开始试用', variant: 'primary' },
    { text: '查看价格', variant: 'secondary' },
  ],
  links: [{ text: '产品' }, { text: '文档' }, { text: '登录' }],
  forms: [{ type: 'email-signup' }],
  images: [{ alt: '产品界面' }],
  landmarks: {
    nav: 1,
    main: 1,
    footer: 1,
    section: 4,
  },
  cards: 3,
};

test('analyzeSnapshot 能识别页面类型、导航和 CTA', () => {
  const result = analyzeSnapshot(snapshotFixture);

  assert.equal(result.pageType, 'marketing');
  assert.equal(result.components.navigation, 1);
  assert.equal(result.components.buttons, 2);
  assert.equal(result.components.forms, 1);
});

test('analyzeSnapshot 能提取设计 token', () => {
  const result = analyzeSnapshot(snapshotFixture);

  assert.deepEqual(result.tokens.colors, ['#ffffff', '#101418', '#4f46e5']);
  assert.deepEqual(result.tokens.typography, ['Georgia', 'IBM Plex Sans']);
  assert.deepEqual(result.tokens.radii, ['16px', '999px']);
});

test('analyzeSnapshot 能生成设计摘要与建议', () => {
  const result = analyzeSnapshot(snapshotFixture);

  assert.match(result.summary, /营销|营销型|landing|pricing/i);
  assert.ok(result.recommendations.length > 0);
});
