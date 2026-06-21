import { Helmet } from "react-helmet-async";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface StructuredDataProps {
  type: "organization" | "breadcrumb" | "product" | "article";
  data?: any;
  breadcrumbs?: BreadcrumbItem[];
}

const StructuredData = ({ type, data, breadcrumbs }: StructuredDataProps) => {
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
