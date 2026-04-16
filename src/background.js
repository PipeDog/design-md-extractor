import {
  getEffectiveMode,
  isAiConfigComplete,
  getSettingsWithDefaults,
  matchSiteRule,
  normalizeAiConfig,
  shouldAnalyzeUrl,
} from './core/config.js';
import { buildAiPayload, buildMarkdownFilename } from './core/pageSnapshot.js';
import { analyzeSnapshot } from './core/localAnalyzer.js';
import { buildDesignMarkdown } from './core/markdown.js';
import { buildAiRequest, parseAiResponse } from './core/aiProvider.js';
import { getLastResult, getSettings, saveLastResult, saveSettings } from './core/storage.js';

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_POPUP_STATE') {
    getPopupState().then(sendResponse).catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === 'SET_POPUP_MODE') {
    setPopupMode(message.mode)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'RUN_ANALYSIS') {
    runAnalysis()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

async function getPopupState() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const settings = await getSettings();
  const mode = getEffectiveMode(settings);
  const lastResult = await getLastResult();

  return {
    ok: true,
    url: tab?.url || '',
    canAnalyze: shouldAnalyzeUrl(tab?.url),
    mode,
    displayLanguage: settings.ui.displayLanguage,
    aiReady: isAiConfigComplete(settings.ai),
    canToggleMode: isAiConfigComplete(settings.ai),
    lastResult,
  };
}

async function setPopupMode(mode) {
  if (!['local', 'hybrid'].includes(mode)) {
    throw new Error('Unsupported mode.');
  }

  const currentSettings = getSettingsWithDefaults(await getSettings());
  if (!isAiConfigComplete(currentSettings.ai)) {
    throw new Error('AI configuration is incomplete.');
  }

  const nextSettings = getSettingsWithDefaults({
    ...currentSettings,
    ai: {
      ...currentSettings.ai,
      enabled: mode === 'hybrid',
      modePreference: mode,
    },
  });

  await saveSettings(nextSettings);

  return {
    ok: true,
    mode: getEffectiveMode(nextSettings),
  };
}

async function runAnalysis() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    throw new Error('无法定位当前页面。');
  }

  if (!shouldAnalyzeUrl(tab.url)) {
    throw new Error('当前页面协议不受支持，仅支持 http/https 页面。');
  }

  const settings = getSettingsWithDefaults(await getSettings());
  if (matchSiteRule(tab.url, settings.rules.siteBlocklist)) {
    throw new Error('当前站点已在排除列表中。');
  }

  const snapshot = await collectSnapshot(tab.id);
  const localReport = buildReportFromSnapshot(snapshot, tab.url, 'local', settings);

  let markdown = buildDesignMarkdown(localReport);
  let finalMode = 'local';
  let warning = '';

  if (getEffectiveMode(settings) === 'hybrid') {
    try {
      const aiConfig = normalizeAiConfig(settings.ai);
      const aiMarkdown = await generateAiMarkdown(aiConfig, localReport, snapshot, settings);
      if (aiMarkdown) {
        markdown = aiMarkdown;
        finalMode = 'hybrid';
      }
    } catch (error) {
      warning = `AI 增强失败，已回退到本地规则输出：${error.message}`;
    }
  }

  const filename = buildMarkdownFilename(tab.url, settings.export.filenameTemplate);

  if (settings.export.autoDownloadAfterGeneration) {
    await downloadMarkdown(filename, markdown);
  }

  const result = {
    ok: true,
    filename,
    markdown,
    mode: finalMode,
    summary: localReport.summary,
    pageType: localReport.overview.pageType,
    warning,
    generatedAt: localReport.overview.generatedAt,
  };

  await saveLastResult(result);
  return result;
}

async function collectSnapshot(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'COLLECT_PAGE_SNAPSHOT' });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content.js'],
    });

    return chrome.tabs.sendMessage(tabId, { type: 'COLLECT_PAGE_SNAPSHOT' });
  }
}

function buildReportFromSnapshot(snapshot, url, mode, settings) {
  const analysis = analyzeSnapshot(snapshot);

  return {
    title: `${new URL(url).hostname.replace(/^www\./, '')} DESIGN.md`,
    overview: {
      url,
      generatedAt: new Date().toISOString(),
      mode,
      pageType: analysis.pageType,
    },
    summary: analysis.summary,
    tokens: analysis.tokens,
    components: analysis.components,
    layout: analysis.layout,
    interactions: analysis.interactions,
    accessibility: analysis.accessibility,
    recommendations: analysis.recommendations,
    includeAuditAppendix: settings.analysis.includeRawAuditAppendix,
    appendix: [
      `原始页面标题：${snapshot.title || '无'}`,
      `页面语言：${snapshot.lang || 'unknown'}`,
      `采集到标题数：${(snapshot.headings || []).length}`,
      `采集到文本块数：${(snapshot.textBlocks || []).length}`,
    ],
  };
}

async function generateAiMarkdown(aiConfig, report, snapshot, settings) {
  const payload = buildAiPayload(report, snapshot, settings);
  const request = buildAiRequest(aiConfig, payload);
  const response = await fetch(request.url, request.options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const responseJson = await response.json();
  const parsed = parseAiResponse(aiConfig.protocol, responseJson);
  if (!parsed.markdown.trim()) {
    throw new Error('模型返回为空。');
  }

  return parsed.markdown;
}

async function downloadMarkdown(filename, markdown) {
  const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
  await chrome.downloads.download({
    url,
    filename,
    saveAs: false,
    conflictAction: 'uniquify',
  });
}
