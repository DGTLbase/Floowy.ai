import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import type { LegalDoc } from "@/content/legal";

/**
 * Renders a legal document (privacy policy / terms) from the shared data in
 * src/content/legal.ts. The same data is serialized to static HTML by the
 * prerender plugin so crawlers (and Google's OAuth verifier) read the full text
 * without running JavaScript.
 */
const LegalPage = ({ doc }: { doc: LegalDoc }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{doc.title}</h1>
            <p className="text-xl text-muted-foreground">{doc.version}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            {doc.sections.map((section, i) => (
              <div key={i} className="mb-12 animate-fade-in">
                <h2 className="text-3xl font-bold mb-4 text-foreground">{section.heading}</h2>
                {section.blocks.map((block, j) =>
                  block.type === "p" ? (
                    <p
                      key={j}
                      className="text-muted-foreground mb-4"
                      dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                  ) : (
                    <ul key={j} className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                      {block.items.map((item, k) => (
                        <li key={k} dangerouslySetInnerHTML={{ __html: item }} />
                      ))}
                    </ul>
                  ),
                )}
              </div>
            ))}

            <div className="mt-16 pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">{doc.footer}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LegalPage;
