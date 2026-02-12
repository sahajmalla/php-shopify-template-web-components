import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import ShopifyFormat from "@shopify/i18next-shopify";
import resourcesToBackend from "i18next-resources-to-backend";
import { match } from "@formatjs/intl-localematcher";
import { shouldPolyfill as shouldPolyfillLocale } from "@formatjs/intl-locale/should-polyfill";
import { shouldPolyfill as shouldPolyfillPluralRules } from "@formatjs/intl-pluralrules/should-polyfill";

/**
 * The default locale for the app.
 */
const DEFAULT_APP_LOCALE = "en";

/**
 * The supported locales for the app.
 *
 * These should correspond with the JSON files in the `locales` folder.
 *
 * @example
 *   en.json
 *   de.json
 *   fr.json
 * @see Available Shopify Admin languages in the Shopify Help Center:
 * https://help.shopify.com/en/manual/your-account/languages#available-languages
 */
const SUPPORTED_APP_LOCALES = ["en", "de", "fr"];

let _userLocale;

/**
 * Retrieves the user's locale from the `locale` request parameter and matches it to supported app locales.
 *
 * Returns the default app locale if the user locale is not supported.
 *
 * @see https://shopify.dev/docs/apps/best-practices/internationalization/getting-started#step-2-get-access-to-the-users-locale
 *
 * @returns {string} User locale
 */
export function getUserLocale() {
  if (_userLocale) {
    return _userLocale;
  }
  const url = new URL(window.location.href);
  const locale = url.searchParams.get("locale") || DEFAULT_APP_LOCALE;
  _userLocale = match([locale], SUPPORTED_APP_LOCALES, DEFAULT_APP_LOCALE);
  return _userLocale;
}

/**
 * @async
 * Asynchronously initializes i18next.
 *
 * Intended to be called before rendering the app to ensure translations are present.
 */
export async function initI18n() {
  await loadIntlPolyfills();
  await initI18next();
}

/**
 * @private
 * @async
 * Asynchronously loads Intl polyfills for the default locale and user locale.
 */
async function loadIntlPolyfills() {
  if (shouldPolyfillLocale()) {
    await import("@formatjs/intl-locale/polyfill");
  }
  const promises = [];
  if (shouldPolyfillPluralRules(DEFAULT_APP_LOCALE)) {
    await import("@formatjs/intl-pluralrules/polyfill-force");
    promises.push(loadIntlPluralRulesLocaleData(DEFAULT_APP_LOCALE));
  }
  if (
    DEFAULT_APP_LOCALE !== getUserLocale() &&
    shouldPolyfillPluralRules(getUserLocale())
  ) {
    promises.push(loadIntlPluralRulesLocaleData(getUserLocale()));
  }
  await Promise.all(promises);
}

/**
 * A subset of the available plural rules locales
 *  that match available Shopify Admin languages
 * @see Available Shopify Admin languages in the Shopify Help Center:
 * https://help.shopify.com/en/manual/your-account/languages#available-languages
 */
const PLURAL_RULES_LOCALE_DATA = {
  cs: () => import("@formatjs/intl-pluralrules/locale-data/cs"),
  da: () => import("@formatjs/intl-pluralrules/locale-data/da"),
  de: () => import("@formatjs/intl-pluralrules/locale-data/de"),
  en: () => import("@formatjs/intl-pluralrules/locale-data/en"),
  es: () => import("@formatjs/intl-pluralrules/locale-data/es"),
  fi: () => import("@formatjs/intl-pluralrules/locale-data/fi"),
  fr: () => import("@formatjs/intl-pluralrules/locale-data/fr"),
  it: () => import("@formatjs/intl-pluralrules/locale-data/it"),
  ja: () => import("@formatjs/intl-pluralrules/locale-data/ja"),
  ko: () => import("@formatjs/intl-pluralrules/locale-data/ko"),
  nb: () => import("@formatjs/intl-pluralrules/locale-data/nb"),
  nl: () => import("@formatjs/intl-pluralrules/locale-data/nl"),
  pl: () => import("@formatjs/intl-pluralrules/locale-data/pl"),
  pt: () => import("@formatjs/intl-pluralrules/locale-data/pt"),
  "pt-PT": () => import("@formatjs/intl-pluralrules/locale-data/pt-PT"),
  sv: () => import("@formatjs/intl-pluralrules/locale-data/sv"),
  th: () => import("@formatjs/intl-pluralrules/locale-data/th"),
  tr: () => import("@formatjs/intl-pluralrules/locale-data/tr"),
  vi: () => import("@formatjs/intl-pluralrules/locale-data/vi"),
  zh: () => import("@formatjs/intl-pluralrules/locale-data/zh"),
};

async function loadIntlPluralRulesLocaleData(locale) {
  return (await PLURAL_RULES_LOCALE_DATA[locale]()).default;
}
/**
 * @private
 * @async
 * Asynchronously initializes i18next.
 * @see https://www.i18next.com/overview/configuration-options
 * @returns Promise of initialized i18next instance
 */
async function initI18next() {
  return await i18next
    .use(initReactI18next)
    .use(ShopifyFormat)
    .use(localResourcesToBackend())
    .init({
      debug: process.env.NODE_ENV === "development",
      lng: getUserLocale(),
      fallbackLng: DEFAULT_APP_LOCALE,
      supportedLngs: SUPPORTED_APP_LOCALES,
      interpolation: {
        // React escapes values by default
        escapeValue: false,
      },
      react: {
        // Wait for the locales to be loaded before rendering the app
        // instead of using a Suspense component
        useSuspense: false,
      },
    });
}

function localResourcesToBackend() {
  return resourcesToBackend(async (locale, _namespace) => {
    return (await import(`../locales/${locale}.json`)).default;
  });
}
