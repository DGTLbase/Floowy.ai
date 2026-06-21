import { useEffect } from "react";
import { Outlet, useParams, useLocation, useNavigate } from "react-router-dom";

const SUPPORTED_LANGS = ["en", "nl", "es", "de", "fr", "it", "ar", "zh-CN", "pt"];

function getGoogleTranslateSelect(): HTMLSelectElement | null {
  return document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
}

function doTranslate(langCode: string, retries = 20) {
  const combo = getGoogleTranslateSelect();
  if (!combo) {
    if (retries > 0) {
      setTimeout(() => doTranslate(langCode, retries - 1), 500);
    }
    return;
  }
  // Force re-translation by briefly resetting to English, then setting target
  if (combo.value === langCode) {
    combo.value = 'en';
    combo.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(() => {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    }, 50);
  } else {
    combo.value = langCode;
    combo.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/** Read the persisted language from the googtrans cookie */
export function getStoredLang(): string | null {
  const match = document.cookie.match(/googtrans=\/(?:en\/)?([a-zA-Z-]+)/);
  if (match) {
    const val = match[1];
    if (val !== "en" && SUPPORTED_LANGS.includes(val)) return val;
  }
  return null;
}

/** Strip the language prefix from a pathname (e.g. /nl/ads-studio -> /ads-studio) */
export function stripLangPrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && SUPPORTED_LANGS.includes(segments[0])) {
    const rest = segments.slice(1).join('/');
    return rest ? '/' + rest : '/';
  }
  return pathname || '/';
}

// Keep old name as alias for backwards compat in case anything references it
export const stripLangSuffix = stripLangPrefix;

/** Get the current lang from the beginning of a pathname */
export function getLangFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && SUPPORTED_LANGS.includes(first)) {
    return first;
  }
  return null;
}

export const LANG_CODES = SUPPORTED_LANGS;

const LanguageLayout = () => {
  const { lang } = useParams<{ lang?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // The :lang param from React Router (prefix position)
  const activeLang = lang && SUPPORTED_LANGS.includes(lang) ? lang : null;

  useEffect(() => {
    if (activeLang) {
      if (activeLang === "en") {
        // English — ensure Google Translate is reset (no translation)
        const combo = getGoogleTranslateSelect();
        if (combo && combo.value !== "en") {
          combo.value = "en";
          combo.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        // Non-English — trigger translation
        doTranslate(activeLang === "zh-CN" ? "zh-CN" : activeLang);
      }
    } else {
      // No lang prefix — redirect to /en/... (or stored lang)
      const storedLang = getStoredLang();
      const targetLang = storedLang && SUPPORTED_LANGS.includes(storedLang) ? storedLang : "en";
      const basePath = location.pathname === '/' ? '' : location.pathname;
      const newPath = `/${targetLang}${basePath}${location.search}${location.hash}`;
      navigate(newPath, { replace: true });
    }
  }, [activeLang, location.pathname]);

  return <Outlet />;
};

export default LanguageLayout;
