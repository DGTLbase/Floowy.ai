import { Helmet } from "react-helmet-async";
import { useEffect, useRef } from "react";

interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

const MetaTags = ({ 
  title, 
  description, 
  keywords,
  canonicalUrl,
  ogImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/jiw4ULwE27QKeFTbZfvzJa8DA213/social-images/social-1764335311016-Screenshot 2025-11-28 210811.png"
}: MetaTagsProps) => {
  const fullUrl = canonicalUrl || `https://floowy.ai${typeof window !== 'undefined' ? window.location.pathname : ''}`;
  const titleRef = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLSpanElement>(null);

  // Imperatively set meta tags to ensure they update on every page
  useEffect(() => {
    document.title = title;
    
    const setMeta = (selector: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', fullUrl);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', ogImage);
    
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', fullUrl);
  }, [title, description, fullUrl, ogImage]);

  // Sync translated text back into <head> meta tags
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const translatedTitle = titleRef.current?.innerText;
      const translatedDesc = descRef.current?.innerText;

      if (translatedTitle && translatedTitle !== document.title) {
        document.title = translatedTitle;
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', translatedTitle);
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', translatedTitle);
      }
      if (translatedDesc) {
        document.querySelector('meta[name="description"]')?.setAttribute('content', translatedDesc);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', translatedDesc);
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', translatedDesc);
      }
    });

    const container = titleRef.current?.parentElement;
    if (container) {
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }

    return () => observer.disconnect();
  }, [title, description]);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        <link rel="canonical" href={fullUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Hidden translatable elements — Google Translate will process these, 
          then MutationObserver syncs the translated text back to <head> */}
      <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <span ref={titleRef} data-meta-translate="title">{title}</span>
        <span ref={descRef} data-meta-translate="description">{description}</span>
      </div>
    </>
  );
};

export default MetaTags;
