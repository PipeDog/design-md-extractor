import {
  getDefaultEndpointForProtocol,
  getSettingsWithDefaults,
  isAiConfigComplete,
  normalizeAiModePreference,
  normalizeAiConfig,
  validateEnabledAiSettings,
} from './core/config.js';
import { getSettings, saveSettings } from './core/storage.js';
import {
  LANGUAGE_OPTIONS,
  PROTOCOL_OPTIONS,
  getMessage,
  getTooltipCopy,
  resolveSupportedLanguage,
} from './core/uiMetadata.js';

const form = document.querySelector('#settings-form');
const statusEl = document.querySelector('#save-status');
const feedbackEl = document.querySelector('#save-feedback');
const protocolEl = document.querySelector('#protocol');
const endpointPathEl = document.querySelector('#endpointPath');
const aiHintEl = document.querySelector('#ai-hint');
const languageEl = document.querySelector('#language');
const uiLanguageEl = document.querySelector('#uiLanguage');
const enableAiDialog = document.querySelector('#enable-ai-dialog');

let activeLanguage = 'en';
let feedbackTimer;

const REQUIRED_AI_FIELD_LABEL_KEYS = {
  baseUrl: 'settings.baseUrl',
  apiKey: 'settings.apiKey',
  model: 'settings.model',
  protocol: 'settings.protocol',
};

function fillSelect(select, options) {
  select.replaceChildren(
    ...options.map((option) => {
      const element = document.createElement('option');
      element.value = option.value;
      element.textContent = option.label;
      return element;
    }),
  );
}

function applyTooltips() {
  for (const element of document.querySelectorAll('[data-tooltip-key]')) {
    const copy = getTooltipCopy(activeLanguage, element.dataset.tooltipKey);
    element.setAttribute('data-tooltip', copy);
    element.setAttribute('title', copy);
    element.setAttribute('aria-label', copy);
  }
}

function applyLocalization(language) {
  activeLanguage = resolveSupportedLanguage(language);
  document.documentElement.lang = activeLanguage;
  document.title = getMessage(activeLanguage, 'settings.title');
  uiLanguageEl.setAttribute('aria-label', getMessage(activeLanguage, 'settings.uiLanguage'));
  uiLanguageEl.setAttribute('title', getMessage(activeLanguage, 'settings.uiLanguage'));

  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = getMessage(activeLanguage, element.dataset.i18n);
  }

  applyTooltips();
}

function fillForm(settings) {
  uiLanguageEl.value = settings.ui.displayLanguage;
  form.enabled.checked = settings.ai.enabled;
  form.baseUrl.value = settings.ai.baseUrl;
  form.apiKey.value = settings.ai.apiKey;
  form.model.value = settings.ai.model;
  form.protocol.value = settings.ai.protocol;
  form.endpointPath.value = settings.ai.endpointPath;
  form.temperature.value = settings.ai.temperature;
  form.maxOutputTokens.value = settings.ai.maxOutputTokens;
  form.timeoutMs.value = settings.ai.timeoutMs;
  form.language.value = settings.ai.language;
  form.systemPromptOverride.value = settings.ai.systemPromptOverride;
  form.redactInputs.checked = settings.analysis.redactInputs;
  form.maxDomNodes.value = settings.analysis.maxDomNodes;
  form.includeColorTokens.checked = settings.analysis.includeColorTokens;
  form.includeTypographyTokens.checked = settings.analysis.includeTypographyTokens;
  form.includeSpacingHeuristics.checked = settings.analysis.includeSpacingHeuristics;
  form.includeRawAuditAppendix.checked = settings.analysis.includeRawAuditAppendix;
  form.filenameTemplate.value = settings.export.filenameTemplate;
  form.autoDownloadAfterGeneration.checked = settings.export.autoDownloadAfterGeneration;
  form.includeFrontmatter.checked = settings.export.includeFrontmatter;
  form.siteAllowlist.value = settings.rules.siteAllowlist;
  form.siteBlocklist.value = settings.rules.siteBlocklist;
  applyLocalization(settings.ui.displayLanguage);
  renderAiHint(settings.ai);
  setStatusMessage(getMessage(activeLanguage, 'settings.unsaved'), 'idle');
}

function clearValidationErrors() {
  for (const element of form.querySelectorAll('[aria-invalid="true"]')) {
    element.removeAttribute('aria-invalid');
  }
}

function applyValidationErrors(validation) {
  clearValidationErrors();

  for (const field of Object.keys(validation.fieldErrors)) {
    const element = form.elements[field];
    if (!element) {
      continue;
    }
    element.setAttribute('aria-invalid', 'true');
  }

  const firstInvalid = form.querySelector('[aria-invalid="true"]');
  firstInvalid?.focus();
}

function buildRequiredFieldsMessage(missingFields) {
  const labels = missingFields
    .map((field) => {
      const key = REQUIRED_AI_FIELD_LABEL_KEYS[field];
      return key ? getMessage(activeLanguage, key) : field;
    })
    .join(', ');
  return getMessage(activeLanguage, 'settings.validationRequired').replace('{fields}', labels);
}

function setStatusMessage(message, tone = 'idle') {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

function hideFeedback() {
  feedbackEl.classList.remove('is-visible');
  window.clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(() => {
    feedbackEl.hidden = true;
  }, 180);
}

function showFeedback(message, tone = 'success', autoHide = true) {
  window.clearTimeout(feedbackTimer);
  feedbackEl.hidden = false;
  feedbackEl.textContent = message;
  feedbackEl.dataset.tone = tone;
  feedbackEl.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  feedbackEl.setAttribute('aria-live', tone === 'error' ? 'assertive' : 'polite');
  requestAnimationFrame(() => {
    feedbackEl.classList.add('is-visible');
  });

  if (!autoHide) {
    return;
  }

  feedbackTimer = window.setTimeout(() => {
    hideFeedback();
  }, tone === 'error' ? 4200 : 2600);
}

function renderAiHint(aiConfig) {
  const ready = isAiConfigComplete(aiConfig);
  aiHintEl.textContent = getMessage(
    activeLanguage,
    ready ? 'settings.aiReady' : 'settings.aiFallback',
  );
}

function readSettingsFromForm() {
  const aiConfig = normalizeAiConfig({
    enabled: form.enabled.checked,
    baseUrl: form.baseUrl.value.trim(),
    apiKey: form.apiKey.value.trim(),
    model: form.model.value.trim(),
    protocol: form.protocol.value,
    endpointPath: form.endpointPath.value.trim(),
    temperature: Number(form.temperature.value || 0.1),
    maxOutputTokens: Number(form.maxOutputTokens.value || 5200),
    timeoutMs: Number(form.timeoutMs.value || 45000),
    language: form.language.value.trim() || 'en',
    systemPromptOverride: form.systemPromptOverride.value.trim(),
  });

  const settings = getSettingsWithDefaults({
    ai: {
      ...aiConfig,
      enabled: form.enabled.checked,
      modePreference: normalizeAiModePreference(undefined, form.enabled.checked),
    },
    analysis: {
      redactInputs: form.redactInputs.checked,
      maxDomNodes: Number(form.maxDomNodes.value || 250),
      includeColorTokens: form.includeColorTokens.checked,
      includeTypographyTokens: form.includeTypographyTokens.checked,
      includeSpacingHeuristics: form.includeSpacingHeuristics.checked,
      includeRawAuditAppendix: form.includeRawAuditAppendix.checked,
    },
    export: {
      filenameTemplate: form.filenameTemplate.value.trim() || '{domain}-DESIGN.md',
      autoDownloadAfterGeneration: form.autoDownloadAfterGeneration.checked,
      includeFrontmatter: form.includeFrontmatter.checked,
    },
    rules: {
      siteAllowlist: form.siteAllowlist.value.trim(),
      siteBlocklist: form.siteBlocklist.value.trim(),
    },
    ui: {
      displayLanguage: uiLanguageEl.value,
    },
  });

  return settings;
}

function waitForEnableAiDecision() {
  return new Promise((resolve) => {
    const handleClose = () => {
      enableAiDialog.removeEventListener('close', handleClose);
      resolve(enableAiDialog.returnValue || 'cancel');
    };

    enableAiDialog.addEventListener('close', handleClose);
    enableAiDialog.showModal();
  });
}

uiLanguageEl.addEventListener('change', () => {
  applyLocalization(uiLanguageEl.value);
  renderAiHint(readSettingsFromForm().ai);
  clearValidationErrors();
});

protocolEl.addEventListener('change', () => {
  endpointPathEl.value = getDefaultEndpointForProtocol(protocolEl.value);
  protocolEl.removeAttribute('aria-invalid');
});

for (const fieldName of Object.keys(REQUIRED_AI_FIELD_LABEL_KEYS)) {
  form.elements[fieldName]?.addEventListener('input', (event) => {
    event.currentTarget.removeAttribute('aria-invalid');
  });
  form.elements[fieldName]?.addEventListener('change', (event) => {
    event.currentTarget.removeAttribute('aria-invalid');
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatusMessage(getMessage(activeLanguage, 'settings.saving'), 'saving');
  showFeedback(getMessage(activeLanguage, 'settings.saving'), 'saving', false);

  if (!form.enabled.checked) {
    const decision = enableAiDialog?.showModal ? await waitForEnableAiDecision() : 'keep-local';
    if (decision === 'cancel') {
      setStatusMessage(getMessage(activeLanguage, 'settings.unsaved'), 'idle');
      hideFeedback();
      return;
    }

    if (decision === 'enable-ai') {
      form.enabled.checked = true;
    }
  }

  const settings = readSettingsFromForm();
  const validation = validateEnabledAiSettings(settings);
  if (!validation.valid) {
    applyValidationErrors(validation);
    const message = buildRequiredFieldsMessage(validation.missing);
    setStatusMessage(message, 'error');
    showFeedback(message, 'error');
    return;
  }

  clearValidationErrors();
  await saveSettings(settings);
  form.enabled.checked = settings.ai.enabled;
  applyLocalization(settings.ui.displayLanguage);
  renderAiHint(settings.ai);
  setStatusMessage(getMessage(activeLanguage, 'settings.saved'), 'success');
  showFeedback(getMessage(activeLanguage, 'settings.saved'), 'success');
});

fillSelect(protocolEl, PROTOCOL_OPTIONS);
fillSelect(languageEl, LANGUAGE_OPTIONS);
fillSelect(uiLanguageEl, LANGUAGE_OPTIONS);

const settings = await getSettings();
fillForm(settings);
