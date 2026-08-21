import { Helmet } from "react-helmet-async";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface StructuredDataProps {
  type: "organization" | "breadcrumb" | "product" | "article" | "faq" | "software";
  data?: any;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FaqItem[];
}

const StructuredData = ({ type, data, breadcrumbs, faqs }: StructuredDataProps) => {
  const getSchema = () => {
    switch (type) {
      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Floowy",
          "alternateName": "Floowy.ai",
          "url": "https://floowy.ai",
          "logo": "https://floowy.ai/floowy-logo.png",
          "description": "Create marketing content faster with AI power. Generate campaigns, visuals and concepts instantly and scale your brand's creative production.",
          "sameAs": [
            "https://www.linkedin.com/company/floowy-ai",
            "https://twitter.com/floowy_ai"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Support",
            "url": "https://floowy.ai/contact"
          }
        };
      
      // FAQPage. The landing brief requires this so the answers can be cited
      // directly in AI answers and shown as rich results.
      case "faq":
        if (!faqs || faqs.length === 0) return null;
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer },
          })),
        };

      // SoftwareApplication for a specific tool page, rather than the
      // site-wide Organization schema.
      case "software":
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": data?.name ?? "Floowy",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": data?.url ?? "https://floowy.ai",
          "description": data?.description ?? "",
          "offers": {
            "@type": "Offer",
            "price": data?.price ?? "1",
            "priceCurrency": data?.currency ?? "EUR",
            "description": data?.offerDescription ?? "",
          },
        };

      case "breadcrumb":
        if (!breadcrumbs || breadcrumbs.length === 0) return null;
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        };
      
      case "product":
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": data?.name || "Floowy AI Tools",
          "description": data?.description || "AI-powered content creation platform for marketing teams",
          "applicationCategory": "BusinessApplication",
          "offers": {
            "@type": "Offer",
            "price": data?.price || "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": data?.rating ? {
            "@type": "AggregateRating",
            "ratingValue": data.rating,
            "reviewCount": data.reviewCount || 100
          } : undefined
        };
      
      case "article":
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data?.headline,
          "description": data?.description,
          "author": {
            "@type": "Organization",
            "name": "Floowy"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Floowy",
            "logo": {
              "@type": "ImageObject",
              "url": "https://floowy.ai/floowy-logo.png"
            }
          },
          "datePublished": data?.datePublished,
          "dateModified": data?.dateModified || data?.datePublished
        };
      
      default:
        return null;
    }
  };

  const schema = getSchema();
  
  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default StructuredData;
