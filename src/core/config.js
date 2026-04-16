import { resolveSupportedLanguage } from './uiMetadata.js';

export const DEFAULT_SETTINGS = {
  ai: {
    enabled: false,
    modePreference: '',
    baseUrl: '',
    apiKey: '',
    model: '',
    protocol: 'responses',
    endpointPath: '/v1/responses',
    temperature: 0.1,
    maxOutputTokens: 5200,
    timeoutMs: 45000,
    language: 'en',
    systemPromptOverride: '',
  },
  analysis: {
    redactInputs: true,
    maxDomNodes: 400,
    includeColorTokens: true,
    includeTypographyTokens: true,
    includeSpacingHeuristics: true,
    includeRawAuditAppendix: false,
  },
  export: {
    filenameTemplate: '{domain}-DESIGN.md',
    autoDownloadAfterGeneration: true,
    includeFrontmatter: false,
  },
  rules: {
    siteAllowlist: '',
    siteBlocklist: '',
  },
  ui: {
    displayLanguage: 'en',
  },
};

const REQUIRED_AI_FIELDS = ['baseUrl', 'apiKey', 'model', 'protocol'];

export function isAiConfigComplete(config = {}) {
  return validateAiConfig(config).valid;
}

export function normalizeAiModePreference(modePreference, enabled = false) {
  if (modePreference === 'local' || modePreference === 'hybrid') {
    return modePreference;
  }

  return enabled ? 'hybrid' : 'local';
}

export function getSettingsWithDefaults(partial = {}) {
  return {
    ai: {
      ...DEFAULT_SETTINGS.ai,
      ...(partial.ai || {}),
      endpointPath: normalizeEndpointPath(
        partial.ai?.endpointPath || DEFAULT_SETTINGS.ai.endpointPath,
      ),
    },
    analysis: {
      ...DEFAULT_SETTINGS.analysis,
      ...(partial.analysis || {}),
    },
    export: {
      ...DEFAULT_SETTINGS.export,
      ...(partial.export || {}),
    },
    rules: {
      ...DEFAULT_SETTINGS.rules,
      ...(partial.rules || {}),
    },
    ui: {
      ...DEFAULT_SETTINGS.ui,
      ...(partial.ui || {}),
    },
  };
}

export function resolveDefaultSettings(partial = {}, browserLanguage = 'en') {
  const resolvedLanguage = resolveSupportedLanguage(browserLanguage);
  const merged = getSettingsWithDefaults(partial);
  const hasSavedOutputLanguage = Boolean(partial.ai?.language);
  const hasSavedDisplayLanguage = Boolean(partial.ui?.displayLanguage);

  return {
    ...merged,
    ai: {
      ...merged.ai,
      language: hasSavedOutputLanguage ? resolveSupportedLanguage(merged.ai.language) : 'en',
    },
    ui: {
      ...merged.ui,
      displayLanguage: hasSavedDisplayLanguage
        ? resolveSupportedLanguage(merged.ui.displayLanguage)
        : resolvedLanguage,
    },
  };
}

export function validateAiConfig(config = {}) {
  const missing = REQUIRED_AI_FIELDS.filter((key) => !String(config?.[key] || '').trim());
  return {
    valid: missing.length === 0,
    missing,
  };
}

export function validateEnabledAiSettings(settings = {}) {
  const merged = getSettingsWithDefaults(settings);
  if (!merged.ai.enabled) {
    return {
      valid: true,
      missing: [],
      fieldErrors: {},
    };
  }

  const result = validateAiConfig(merged.ai);
  return {
    ...result,
    fieldErrors: Object.fromEntries(
      result.missing.map((field) => [field, 'This field is required when AI is enabled.']),
    ),
  };
}

export function getEffectiveMode(settings) {
  const merged = getSettingsWithDefaults(settings);
  if (!isAiConfigComplete(merged.ai)) {
    return 'local';
  }

  return normalizeAiModePreference(merged.ai.modePreference, merged.ai.enabled);
}

export function getDefaultEndpointForProtocol(protocol) {
  return protocol === 'chat_completions' ? '/v1/chat/completions' : '/v1/responses';
}

export function normalizeEndpointPath(endpointPath, protocol = 'responses') {
  const raw = String(endpointPath || '').trim();
  if (!raw) {
    return getDefaultEndpointForProtocol(protocol);
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function normalizeAiConfig(config = {}) {
  const protocol = config.protocol === 'chat_completions' ? 'chat_completions' : 'responses';

  return {
    ...DEFAULT_SETTINGS.ai,
    ...config,
    protocol,
    baseUrl: String(config.baseUrl || '').trim().replace(/\/+$/, ''),
    apiKey: String(config.apiKey || '').trim(),
    model: String(config.model || '').trim(),
    endpointPath: normalizeEndpointPath(
      config.endpointPath || getDefaultEndpointForProtocol(protocol),
      protocol,
    ),
  };
}

export function shouldAnalyzeUrl(rawUrl) {
  if (!rawUrl) {
    return false;
  }

  try {
    const url = new URL(rawUrl);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function matchSiteRule(rawUrl, ruleText = '') {
  const entries = String(ruleText || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return false;
  }

  try {
    const url = new URL(rawUrl);
    return entries.some((entry) => url.hostname.includes(entry));
  } catch {
    return false;
  }
}
