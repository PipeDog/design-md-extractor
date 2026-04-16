import { getLanguageLabel } from './uiMetadata.js';

const REFERENCE_SECTION_TITLES = [
  '## 1. Visual Theme & Atmosphere',
  '## 2. Color Palette & Roles',
  '## 3. Typography Rules',
  '## 4. Component Stylings',
  '## 5. Layout Principles',
  '## 6. Depth & Elevation',
  "## 7. Do's and Don'ts",
  '## 8. Responsive Behavior',
  '## 9. Agent Prompt Guide',
];

export function summarizeSnapshot(snapshot = {}, limits = {}) {
  const maxHeadings = limits.maxHeadings ?? 8;
  const maxTextBlocks = limits.maxTextBlocks ?? 10;

  return {
    url: snapshot.url || '',
    title: snapshot.title || '',
    lang: snapshot.lang || '',
    metaDescription: snapshot.metaDescription || '',
    headings: (snapshot.headings || []).slice(0, maxHeadings),
    textBlocks: (snapshot.textBlocks || []).slice(0, maxTextBlocks),
    colors: (snapshot.colors || []).slice(0, 12),
    fonts: (snapshot.fonts || []).slice(0, 8),
    radii: (snapshot.radii || []).slice(0, 8),
    shadows: (snapshot.shadows || []).slice(0, 8),
    buttons: (snapshot.buttons || []).slice(0, 10),
    links: (snapshot.links || []).slice(0, 16),
    forms: (snapshot.forms || []).slice(0, 4),
    images: (snapshot.images || []).slice(0, 8),
    landmarks: snapshot.landmarks || {},
    cards: snapshot.cards || 0,
  };
}

export function buildMarkdownFilename(rawUrl, template = '{domain}-DESIGN.md') {
  let domain = 'page';

  try {
    domain = new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = 'page';
  }

  return template.replaceAll('{domain}', domain);
}

export function buildAiPayload(report, snapshot, settings) {
  const outputLanguage = getLanguageLabel(settings.ai.language);
  const includeAppendix = settings.analysis.includeRawAuditAppendix;
  const appendixInstruction = includeAppendix
    ? '在第 9 节后额外追加 `## Appendix`，仅放入原始证据摘要。'
    : '不要退回旧版通用审计报告骨架，也不要追加额外尾部附录。';

  return {
    systemPrompt:
      settings.ai.systemPromptOverride ||
      [
        '你是一名资深设计系统作者，负责输出可直接作为 Stitch/设计生成参考的 DESIGN.md。',
        '默认写作基线严格参照一份高密度设计系统文档：设计语言化描述、证据驱动、章节完整、可直接拿去继续提示生成。',
        `最终内容必须使用 ${outputLanguage}。`,
        '你必须保留参考文档的章节组织方式、语气、细节密度和提示工程导向，但绝不能把参考文档的品牌内容生搬硬套到当前页面。',
        '所有判断都必须锚定到给定的结构化页面证据；信息不足时要明确说明是 inferred / observed / unavailable，不能编造品牌颜色、字体权重、阴影层级或响应式断点。',
        '标题格式必须是 `# Design System Inspiration of <Brand or Domain>`。',
        '正文必须严格按以下顺序输出章节：',
        ...REFERENCE_SECTION_TITLES,
        '第 1 节需要先写一段氛围总结，再给出 `**Key Characteristics:**` 列表。',
        '第 2 节必须为每个颜色写出描述性名称、十六进制值与功能角色。',
        '第 3 节必须包含 `### Font Family`、`### Hierarchy` 和 `### Principles`，其中 Hierarchy 优先使用 Markdown 表格。',
        '第 4 节必须至少覆盖 Buttons、Cards & Containers、Inputs；如证据允许，再写 Navigation、Image Treatment。',
        '第 5 节必须覆盖 Spacing System、Grid & Container、Whitespace Philosophy、Border Radius Scale。',
        '第 6 节必须包含一张 Level/Treatment/Use 表，并补一段 Shadow Philosophy。',
        "第 7 节必须拆成 `### Do` 和 `### Don't`。",
        '第 8 节必须覆盖 Breakpoints、Touch Targets、Collapsing Strategy、Image Behavior；如果无法确认真实断点，要明确写成推断。',
        '第 9 节必须覆盖 Quick Color Reference、Example Component Prompts、Iteration Guide。',
        '不要输出代码围栏，不要输出 JSON，不要解释你的推理过程。',
        appendixInstruction,
      ].join(' '),
    userPrompt: [
      '请把下面的结构化页面分析整理成接近高完成度参考文档水准的 DESIGN.md。',
      '写作要求：自然语言要具体、有设计感、可执行，但所有细节都必须能从证据中落地。',
      '如果页面是普通网页而不是成熟设计系统，也要按参考文档的格式产出，只是对不确定项明确标注推断来源与局限。',
      '避免旧版“审计报告”口吻，优先写成“设计系统参考稿”。',
      `必须严格按以下章节顺序输出：\n${REFERENCE_SECTION_TITLES.join('\n')}`,
      appendixInstruction,
    ].join('\n'),
    report,
    snapshot: summarizeSnapshot(snapshot, {
      maxHeadings: 8,
      maxTextBlocks: 10,
    }),
  };
}
