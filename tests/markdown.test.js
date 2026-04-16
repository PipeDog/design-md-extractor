import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDesignMarkdown } from '../src/core/markdown.js';

const reportFixture = {
  title: 'example.com DESIGN.md',
  overview: {
    url: 'https://example.com',
    generatedAt: '2026-04-16T10:00:00.000Z',
    mode: 'hybrid',
    pageType: 'marketing',
  },
  summary: '这是一个强调转化的营销页面，采用高对比视觉层级。',
  tokens: {
    colors: ['#ffffff', '#101418', '#4f46e5'],
    typography: ['Georgia', 'IBM Plex Sans'],
    spacing: ['8px', '16px', '32px'],
    radii: ['16px'],
    shadows: ['0 20px 60px rgba(16,20,24,0.18)'],
  },
  components: {
    navigation: 1,
    buttons: 2,
    cards: 3,
    forms: 1,
  },
  layout: ['顶部导航 + Hero', '中部对比卡片', '底部 FAQ 与页脚'],
  interactions: ['主 CTA 明确', '表单入口清晰'],
  accessibility: ['标题层级清晰', '需要补强按钮可访问名称'],
  recommendations: ['为次级按钮增加更明显的 hover 状态'],
  appendix: ['分析模式：hybrid'],
  includeAuditAppendix: false,
};

test('buildDesignMarkdown 生成标题和核心章节', () => {
  const markdown = buildDesignMarkdown(reportFixture);

  assert.match(markdown, /^# Design System Inspiration of example\.com/m);
  assert.match(markdown, /## 1\. Visual Theme & Atmosphere/);
  assert.match(markdown, /## 2\. Color Palette & Roles/);
  assert.match(markdown, /## 6\. Depth & Elevation/);
  assert.match(markdown, /## 9\. Agent Prompt Guide/);
});

test('buildDesignMarkdown 包含 token 和建议内容', () => {
  const markdown = buildDesignMarkdown(reportFixture);

  assert.match(markdown, /#4f46e5/);
  assert.match(markdown, /IBM Plex Sans/);
  assert.match(markdown, /hover 状态/);
  assert.doesNotMatch(markdown, /## Appendix/);
});
