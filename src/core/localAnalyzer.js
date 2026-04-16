function inferPageType(snapshot) {
  const source = [
    snapshot.url,
    snapshot.title,
    snapshot.metaDescription,
    ...(snapshot.headings || []).map((item) => item.text),
  ]
    .join(' ')
    .toLowerCase();

  if (/(pricing|price|plan|方案|价格|订阅)/i.test(source)) {
    return 'marketing';
  }
  if (/(docs|documentation|guide|文档|指南)/i.test(source)) {
    return 'documentation';
  }
  if (/(dashboard|analytics|insights|报表|控制台)/i.test(source)) {
    return 'dashboard';
  }
  if ((snapshot.forms || []).length > 1) {
    return 'application';
  }
  return 'marketing';
}

function countComponents(snapshot) {
  return {
    navigation: snapshot.landmarks?.nav || 0,
    buttons: (snapshot.buttons || []).length,
    links: (snapshot.links || []).length,
    forms: (snapshot.forms || []).length,
    cards: snapshot.cards || 0,
    images: (snapshot.images || []).length,
  };
}

function unique(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractTokens(snapshot) {
  return {
    colors: unique(snapshot.colors || []).slice(0, 8),
    typography: unique(snapshot.fonts || []).slice(0, 6),
    spacing: inferSpacing(snapshot),
    radii: unique(snapshot.radii || []).slice(0, 6),
    shadows: unique(snapshot.shadows || []).slice(0, 6),
  };
}

function inferSpacing(snapshot) {
  const hints = [];
  const textCount = (snapshot.textBlocks || []).length;
  if (textCount >= 4) {
    hints.push('16px', '24px', '32px');
  } else {
    hints.push('8px', '16px');
  }
  return unique(hints);
}

function buildSummary(pageType, components, tokens) {
  const typeLabelMap = {
    marketing: '这是一个营销型页面',
    documentation: '这是一个文档型页面',
    dashboard: '这是一个数据看板页面',
    application: '这是一个应用型页面',
  };

  const parts = [typeLabelMap[pageType] || '这是一个页面'];

  if (components.navigation > 0) {
    parts.push('具备明确的全局导航结构');
  }
  if (components.buttons > 0) {
    parts.push(`存在 ${components.buttons} 个主要按钮线索`);
  }
  if (tokens.colors.length >= 3) {
    parts.push('颜色系统具备基础主次层级');
  }

  return `${parts.join('，')}。`;
}

function buildRecommendations(pageType, snapshot) {
  const recommendations = [];

  if ((snapshot.buttons || []).length >= 2) {
    recommendations.push('建议继续强化主次按钮的状态差异，避免 CTA 权重接近。');
  }
  if ((snapshot.images || []).length > 0) {
    recommendations.push('建议检查关键视觉素材是否都具备明确的替代文本与语义描述。');
  }
  if (pageType === 'marketing') {
    recommendations.push('营销页面应持续强化首屏价值主张、社会证明与转化路径的一致性。');
  }
  if (recommendations.length === 0) {
    recommendations.push('建议补充更多页面状态与交互反馈线索，以提升文档完整性。');
  }

  return recommendations;
}

function buildLayout(snapshot) {
  const layout = [];
  if ((snapshot.landmarks?.nav || 0) > 0) {
    layout.push('顶部导航区域');
  }
  if ((snapshot.headings || []).length > 0) {
    layout.push('首屏标题与价值主张');
  }
  if ((snapshot.cards || 0) > 0) {
    layout.push('卡片式内容分区');
  }
  if ((snapshot.landmarks?.footer || 0) > 0) {
    layout.push('底部页脚信息');
  }
  return layout;
}

function buildInteractionNotes(snapshot) {
  const notes = [];
  if ((snapshot.buttons || []).length > 0) {
    notes.push('存在清晰的按钮型 CTA。');
  }
  if ((snapshot.forms || []).length > 0) {
    notes.push('页面包含表单或输入入口。');
  }
  if ((snapshot.links || []).length > 5) {
    notes.push('信息架构依赖较多链接跳转。');
  }
  return notes;
}

function buildAccessibilityNotes(snapshot) {
  const notes = [];
  if ((snapshot.images || []).some((item) => !item.alt)) {
    notes.push('部分图片缺少可访问替代文本。');
  } else if ((snapshot.images || []).length > 0) {
    notes.push('图片元素具备基础替代文本线索。');
  }
  if ((snapshot.headings || []).length > 0) {
    notes.push('页面存在可识别的标题层级。');
  }
  if ((snapshot.buttons || []).some((item) => !item.text)) {
    notes.push('存在缺少可读标签的按钮风险。');
  }
  return notes;
}

export function analyzeSnapshot(snapshot = {}) {
  const pageType = inferPageType(snapshot);
  const components = countComponents(snapshot);
  const tokens = extractTokens(snapshot);
  const summary = buildSummary(pageType, components, tokens);

  return {
    title: `${snapshot.title || 'Untitled'} DESIGN.md`,
    pageType,
    summary,
    components,
    tokens,
    layout: buildLayout(snapshot),
    interactions: buildInteractionNotes(snapshot),
    accessibility: buildAccessibilityNotes(snapshot),
    recommendations: buildRecommendations(pageType, snapshot),
  };
}
