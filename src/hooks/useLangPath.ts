import { useParams } from "react-router-dom";
import { LANG_CODES } from "@/components/LanguageLayout";

/**
 * Returns a function that prepends the current language prefix to a path.
 * Usage: const lp = useLangPath(); <Link to={lp("/ads-studio")} />
 */
export function useLangPath() {
  const { lang } = useParams<{ lang?: string }>();
  const currentLang = lang && LANG_CODES.includes(lang) ? lang : "en";

  return (path: string): string => {
    if (!path || path.startsWith("http") || path.startsWith("mailto:")) return path;
    
    // Handle hash-only paths like "#pricing"
    if (path.startsWith("#")) return path;
    
    // Handle paths with hash like "/#pricing"
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    
    // Check if path already has a lang prefix
    const segments = cleanPath.split("/").filter(Boolean);
    if (segments[0] && LANG_CODES.includes(segments[0])) return cleanPath;

    return `/${currentLang}${cleanPath}`;
  };
}
