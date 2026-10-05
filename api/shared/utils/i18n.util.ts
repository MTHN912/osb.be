import * as fs from 'fs';
import * as path from 'path';

type I18nData = Record<string, string>;

const cache: Record<string, I18nData> = {};
const DEFAULT_LOCALE = 'en';

function loadLocale(locale: string): I18nData {
  if (cache[locale]) return cache[locale];

  const candidatePaths = [
    path.resolve(__dirname, '..', '..', 'i18n', locale, 'data.json'),
    path.resolve(process.cwd(), 'dist', 'api', 'i18n', locale, 'data.json'),
    path.resolve(process.cwd(), 'api', 'i18n', locale, 'data.json'),
  ];

  const filePath = candidatePaths.find((p) => fs.existsSync(p));
  cache[locale] = filePath ? (JSON.parse(fs.readFileSync(filePath, 'utf-8')) as I18nData) : {};
  return cache[locale];
}

export function t(key: string, params?: Record<string, string | number>, locale = DEFAULT_LOCALE): string {
  const message = loadLocale(locale)[key];

  if (!message) {
    return locale !== DEFAULT_LOCALE ? t(key, params, DEFAULT_LOCALE) : key;
  }

  return message.replace(/\{(\w+)\}/g, (_, name) =>
    params?.[name] !== undefined ? String(params[name]) : `{${name}}`,
  );
}
