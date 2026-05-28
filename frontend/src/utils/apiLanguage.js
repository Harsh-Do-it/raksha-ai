import i18n from "../i18n/config";

export function getApiLanguage() {
  const lang = i18n.language || "en";
  return lang.split("-")[0].toLowerCase();
}

export function apiLanguageHeaders(extra = {}) {
  return {
    "Accept-Language": getApiLanguage(),
    ...extra,
  };
}
