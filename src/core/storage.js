import { DEFAULT_SETTINGS, getSettingsWithDefaults, resolveDefaultSettings } from './config.js';

const SETTINGS_KEY = 'settings';
const LAST_RESULT_KEY = 'lastResult';

function getStorageArea() {
  return chrome?.storage?.sync || chrome?.storage?.local;
}

export async function getSettings() {
  const area = getStorageArea();
  if (!area) {
    return resolveDefaultSettings(DEFAULT_SETTINGS, getBrowserLanguage());
  }

  const result = await area.get(SETTINGS_KEY);
  return resolveDefaultSettings(result[SETTINGS_KEY] || {}, getBrowserLanguage());
}

export async function saveSettings(settings) {
  const area = getStorageArea();
  if (!area) {
    return getSettingsWithDefaults(settings);
  }

  const merged = getSettingsWithDefaults(settings);
  await area.set({ [SETTINGS_KEY]: merged });
  return merged;
}

function getBrowserLanguage() {
  return chrome?.i18n?.getUILanguage?.() || globalThis.navigator?.language || 'en';
}

export async function getLastResult() {
  const area = chrome?.storage?.local;
  if (!area) {
    return null;
  }
  const result = await area.get(LAST_RESULT_KEY);
  return result[LAST_RESULT_KEY] || null;
}

export async function saveLastResult(result) {
  const area = chrome?.storage?.local;
  if (!area) {
    return;
  }
  await area.set({ [LAST_RESULT_KEY]: result });
}
