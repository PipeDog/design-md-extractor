import { getMessage } from './core/uiMetadata.js';

function $(selector) {
  return document.querySelector(selector);
}

const stateEl = $('#mode-state');
const localModeButton = $('#mode-local-btn');
const aiModeButton = $('#mode-ai-btn');
const pageEl = $('#page-url');
const warningEl = $('#warning');
const analyzeButton = $('#analyze-btn');
const settingsButton = $('#settings-btn');
const progressEl = $('#progress');
const localModeDialog = $('#local-mode-dialog');
const localContinueButton = $('#local-continue-btn');
const localPrimaryButton = $('#local-settings-btn');

let activeLanguage = 'en';
let currentMode = 'local';
let canAnalyzeCurrentPage = true;
let canToggleMode = false;

function t(key) {
  return getMessage(activeLanguage, key);
}

function applyLocalization() {
  document.documentElement.lang = activeLanguage;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
}

function renderError(message) {
  warningEl.hidden = false;
  warningEl.textContent = message;
}

function clearError() {
  warningEl.hidden = true;
  warningEl.textContent = '';
}

function renderMode(mode) {
  currentMode = mode;
  stateEl.dataset.mode = mode;
  localModeButton?.classList.toggle('is-active', mode === 'local');
  aiModeButton?.classList.toggle('is-active', mode === 'hybrid');
}

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_POPUP_STATE' });
  if (!response?.ok) {
    renderError(response?.error || t('popup.initFailed'));
    return;
  }

  activeLanguage = response.displayLanguage || 'en';
  applyLocalization();

  canAnalyzeCurrentPage = response.canAnalyze;
  canToggleMode = response.canToggleMode;
  pageEl.textContent = response.url || t('popup.noPage');
  renderMode(response.mode);
  syncModeToggleAvailability();

  if (!response.canAnalyze) {
    analyzeButton.disabled = true;
    progressEl.textContent = t('popup.unsupported');
    return;
  }

  if (response.lastResult?.warning) {
    renderError(response.lastResult.warning);
  }
}

function syncModeToggleAvailability() {
  aiModeButton.disabled = !canToggleMode;
}

function waitForDialogDecision() {
  return new Promise((resolve) => {
    const handleClose = () => {
      localModeDialog.removeEventListener('close', handleClose);
      resolve(localModeDialog.returnValue || 'cancel');
    };

    localModeDialog.addEventListener('close', handleClose);
    localModeDialog.showModal();
  });
}

async function confirmLocalModeIfNeeded() {
  if (currentMode !== 'local') {
    return 'continue';
  }

  localPrimaryButton.textContent = canToggleMode
    ? t('popup.localPromptSwitchAi')
    : t('popup.localPromptPrimary');

  if (!localModeDialog?.showModal) {
    return window.confirm(t('popup.localPromptBody'))
      ? 'continue'
      : canToggleMode
        ? 'switch-ai'
        : 'settings';
  }

  return waitForDialogDecision();
}

async function setMode(mode) {
  if (!canToggleMode || mode === currentMode) {
    return;
  }

  const response = await chrome.runtime.sendMessage({ type: 'SET_POPUP_MODE', mode });
  if (!response?.ok) {
    throw new Error(response?.error || t('popup.failed'));
  }

  renderMode(response.mode || mode);
  clearError();
}

async function runAnalysis() {
  analyzeButton.disabled = true;
  clearError();
  progressEl.textContent = t('popup.running');

  try {
    const result = await chrome.runtime.sendMessage({ type: 'RUN_ANALYSIS' });
    if (!result?.ok) {
      throw new Error(result?.error || t('popup.failed'));
    }

    renderMode(result.mode || currentMode);
    progressEl.textContent = t('popup.done');
    if (result.warning) {
      renderError(result.warning);
    }
  } catch (error) {
    progressEl.textContent = t('popup.failed');
    renderError(error.message);
  } finally {
    analyzeButton.disabled = !canAnalyzeCurrentPage;
  }
}

analyzeButton.addEventListener('click', async () => {
  const decision = await confirmLocalModeIfNeeded();
  if (decision === 'settings') {
    await chrome.runtime.openOptionsPage();
    return;
  }

  if (decision === 'switch-ai') {
    try {
      await setMode('hybrid');
    } catch (error) {
      renderError(error.message);
    }
    return;
  }

  if (decision !== 'continue') {
    return;
  }

  await runAnalysis();
});

settingsButton.addEventListener('click', async () => {
  await chrome.runtime.openOptionsPage();
});

localModeButton?.addEventListener('click', async () => {
  try {
    await setMode('local');
  } catch (error) {
    renderError(error.message);
  }
});

aiModeButton?.addEventListener('click', async () => {
  try {
    await setMode('hybrid');
  } catch (error) {
    renderError(error.message);
  }
});

localPrimaryButton?.addEventListener('click', () => {
  localModeDialog.returnValue = canToggleMode ? 'switch-ai' : 'settings';
});

localContinueButton?.addEventListener('click', () => {
  localModeDialog.returnValue = 'continue';
});

init().catch((error) => renderError(error.message));
