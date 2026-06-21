import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { LANG_CODES, stripLangPrefix, getLangFromPath, getStoredLang } from "./LanguageLayout";

const languages = [
  { code: "en", label: "English", flag: "https://flagcdn.com/w40/us.png" },
  { code: "nl", label: "Dutch", flag: "https://flagcdn.com/w40/nl.png" },
  { code: "es", label: "Spanish", flag: "https://flagcdn.com/w40/es.png" },
  { code: "de", label: "German", flag: "https://flagcdn.com/w40/de.png" },
  { code: "fr", label: "French", flag: "https://flagcdn.com/w40/fr.png" },
  { code: "it", label: "Italian", flag: "https://flagcdn.com/w40/it.png" },
  { code: "ar", label: "Arabic", flag: "https://flagcdn.com/w40/sa.png" },
  { code: "zh-CN", label: "Mandarin", flag: "https://flagcdn.com/w40/cn.png" },
  { code: "pt", label: "Portuguese", flag: "https://flagcdn.com/w40/pt.png" },
];

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
  // If already set to this language, reset to 'en' first to force re-translation
  if (combo.value === langCode) {
    combo.value = 'en';
    combo.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(() => {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    }, 100);
  } else {
    combo.value = langCode;
    combo.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

interface LanguageSelectorProps {
  className?: string;
  mobile?: boolean;
}

const LanguageSelector = ({ className = "", mobile = false }: LanguageSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams<{ lang?: string }>();

  const cookieLang = getStoredLang();
  const pathLang = getLangFromPath(location.pathname);

  // Prefer URL suffix, then current route param, then persisted cookie
  const activeLang = pathLang || (lang && LANG_CODES.includes(lang) ? lang : null) || cookieLang || "en";
  const selected = languages.find(l => l.code === activeLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((langItem: typeof languages[0]) => {
    setOpen(false);
    const basePath = stripLangPrefix(location.pathname);

    if (langItem.code === "en") {
      // Navigate to /en/... prefix and clear Google Translate
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
      const combo = getGoogleTranslateSelect();
      if (combo) {
        combo.value = "en";
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const enPath = basePath === '/' ? '/en' : `/en${basePath}`;
      navigate(enPath);
      setTimeout(() => window.location.reload(), 300);
      return;
    }

    // Navigate to /{lang}/path (prefix)
    const prefix = basePath === '/' ? `/${langItem.code}` : `/${langItem.code}${basePath}`;
    navigate(prefix);
    doTranslate(langItem.code);
  }, [location.pathname, navigate]);

  if (mobile) {
    return (
      <div className={className}>
        <p className="text-sm font-medium text-muted-foreground mb-2">Language</p>
        <div className="grid grid-cols-5 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.label}
              onClick={() => handleSelect(lang)}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all hover:scale-105 ${
                selected.label === lang.label 
                  ? 'border-primary border-2 bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              title={lang.label}
            >
              <img src={lang.flag} alt={lang.label} className="w-6 h-4 object-cover rounded-[2px]" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors outline-none"
      >
        <img src={selected.flag} alt={selected.label} className="w-5 h-3.5 object-cover rounded-[2px]" />
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 pt-2 z-50 animate-fade-in">
          <div className="w-48 bg-popover border border-border shadow-lg rounded-md p-1">
            {languages.map((lang) => (
              <button
                key={lang.label}
                onClick={() => handleSelect(lang)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-sm text-left text-sm transition-colors ${
                  selected.label === lang.label
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <img src={lang.flag} alt={lang.label} className="w-6 h-4 object-cover rounded-[2px]" />
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
