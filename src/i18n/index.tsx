import React, { createContext, useContext, useMemo } from 'react';
import ua from './locales/ua.json';
import en from './locales/en.json';

export const SUPPORTED_LANGS = ['ua', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

type DictionaryValue = string | Dictionary;
interface Dictionary {
  [key: string]: DictionaryValue;
}

const dictionaries: Record<Lang, Dictionary> = {
  ua,
  en,
};

interface I18nContextValue {
  lang: Lang;
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'ua',
  t: (key, fallback) => fallback ?? key,
});

const interpolate = (template: string, params?: Record<string, string | number>): string => {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((result, [paramName, paramValue]) => {
    return result.replaceAll(`{{${paramName}}}`, String(paramValue));
  }, template);
};

const getDictionaryValue = (dictionary: Dictionary, key: string): string | undefined => {
  const segments = key.split('.');
  let current: DictionaryValue | undefined = dictionary;

  for (const segment of segments) {
    if (!current || typeof current === 'string') {
      return undefined;
    }
    current = current[segment];
  }

  return typeof current === 'string' ? current : undefined;
};

export const getLangFromPath = (pathname: string): Lang | null => {
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (!firstSegment) {
    return null;
  }

  return SUPPORTED_LANGS.includes(firstSegment as Lang) ? (firstSegment as Lang) : null;
};

export const getCurrentLang = (): Lang => {
  if (typeof window === 'undefined') {
    return 'ua';
  }

  return getLangFromPath(window.location.pathname) || 'ua';
};

export const addLangPrefix = (pathname: string, lang: Lang): string => {
  if (pathname === '/') {
    return `/${lang}`;
  }

  return `/${lang}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
};

export const I18nProvider = ({ children, lang }: { children: React.ReactNode; lang: Lang }) => {
  const contextValue = useMemo<I18nContextValue>(() => {
    const currentDictionary = dictionaries[lang];
    const fallbackDictionary = dictionaries.ua;

    return {
      lang,
      t: (key, fallback, params) => {
        const translated = getDictionaryValue(currentDictionary, key);
        if (translated) {
          return interpolate(translated, params);
        }

        const fallbackTranslated = getDictionaryValue(fallbackDictionary, key);
        if (fallbackTranslated) {
          return interpolate(fallbackTranslated, params);
        }

        return interpolate(fallback ?? key, params);
      },
    };
  }, [lang]);

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

export const translate = (key: string, fallback?: string, params?: Record<string, string | number>): string => {
  const lang = getCurrentLang();
  const activeDictionary = dictionaries[lang];
  const fallbackDictionary = dictionaries.ua;

  const translated = getDictionaryValue(activeDictionary, key);
  if (translated) {
    return interpolate(translated, params);
  }

  const fallbackTranslated = getDictionaryValue(fallbackDictionary, key);
  if (fallbackTranslated) {
    return interpolate(fallbackTranslated, params);
  }

  return interpolate(fallback ?? key, params);
};
