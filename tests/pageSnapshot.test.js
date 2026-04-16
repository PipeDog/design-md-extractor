import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAiPayload } from '../src/core/pageSnapshot.js';

const reportFixture = {
  title: 'example.com DESIGN.md',
  overview: {
    url: 'https://example.com',
    pageType: 'marketing',
  },
  summary: 'A reference-style design system draft.',
  tokens: {
    colors: ['#ffffff', '#101418', '#4f46e5'],
    typography: ['IBM Plex Sans', 'Georgia'],
    spacing: ['8px', '16px', '32px'],
    radii: ['16px', '999px'],
    shadows: ['0 20px 60px rgba(16,20,24,0.18)'],
  },
  components: {
    navigation: 1,
    buttons: 2,
    cards: 3,
    forms: 1,
    images: 1,
  },
  layout: ['顶部导航 + Hero', '中部对比卡片', '底部 FAQ 与页脚'],
};

const snapshotFixture = {
  url: 'https://example.com',
  title: 'Example',
  headings: [{ level: 1, text: 'Headline' }],
  textBlocks: ['A compact summary paragraph that is long enough to be included in the payload.'],
  colors: ['#ffffff', '#101418', '#4f46e5'],
  fonts: ['IBM Plex Sans', 'Georgia'],
  radii: ['16px', '999px'],
  shadows: ['0 20px 60px rgba(16,20,24,0.18)'],
  buttons: [{ text: 'Start', variant: 'primary' }],
  links: [{ text: 'Docs' }],
  forms: [{ type: 'signup' }],
  images: [{ alt: 'Product preview' }],
  landmarks: { nav: 1, main: 1, footer: 1 },
  cards: 3,
};

test('buildAiPayload 默认使用高完成度 DESIGN.md 章节约束', () => {
  const payload = buildAiPayload(reportFixture, snapshotFixture, {
    ai: {
      language: 'en',
      systemPromptOverride: '',
    },
    analysis: {
      includeRawAuditAppendix: false,
    },
  });

  assert.match(payload.systemPrompt, /高密度设计系统文档/);
  assert.match(payload.systemPrompt, /# Design System Inspiration of <Brand or Domain>/);
  assert.match(payload.systemPrompt, /## 9\. Agent Prompt Guide/);
  assert.match(payload.userPrompt, /## 1\. Visual Theme & Atmosphere/);
  assert.doesNotMatch(payload.userPrompt, /页面概览|Visual Tokens|Component Patterns/);
});

test('buildAiPayload 在开启原始附录时要求附加 Appendix', () => {
  const payload = buildAiPayload(reportFixture, snapshotFixture, {
    ai: {
      language: 'en',
      systemPromptOverride: '',
    },
    analysis: {
      includeRawAuditAppendix: true,
    },
  });

  assert.match(payload.systemPrompt, /## Appendix/);
  assert.match(payload.userPrompt, /## Appendix/);
});
