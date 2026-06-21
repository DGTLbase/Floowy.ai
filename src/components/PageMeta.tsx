import MetaTags from "./MetaTags";
import StructuredData from "./StructuredData";

interface PageMetaProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogImageUrl?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const PageMeta = ({ title, description, keywords, canonicalUrl, ogImageUrl, breadcrumbs }: PageMetaProps) => {
  return (
    <>
      <MetaTags 
        title={title}
        description={description}
        keywords={keywords}
        canonicalUrl={canonicalUrl}
        ogImage={ogImageUrl}
      />
      <StructuredData type="organization" />
      {breadcrumbs && breadcrumbs.length > 0 && (
        <StructuredData 
          type="breadcrumb" 
          breadcrumbs={breadcrumbs}
        />
      )}
    </>
  );
};

export default PageMeta;
