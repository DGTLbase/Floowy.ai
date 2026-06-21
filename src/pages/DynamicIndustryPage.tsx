import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import PageMeta from "@/components/PageMeta";

type FaqItem = { question: string; answer: string };
type CaseLite = {
  id: string; slug: string; client_name: string; subtitle: string;
  hero_image_url: string | null; client_logo_url: string | null;
  stats: Array<{ value: string; label: string }>;
  intro_text: string;
};
type IndustryRecord = {
  id: string; slug: string; industry_name: string;
  header_bg_color: string; hero_image_url: string | null;
  meta_title: string | null; meta_description: string | null;
  meta_keywords: string | null; og_image_url: string | null;
  intro_title: string; intro_body: string;
  recognition_title: string; recognition_bullets: string[];
  solution_title: string; solution_body: string;
  cases_section_title: string;
  case_1_id: string | null; case_2_id: string | null; case_3_id: string | null;
  faq_section_title: string; faq_items: FaqItem[];
};

const DynamicIndustryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<IndustryRecord | null>(null);
  const [linkedCases, setLinkedCases] = useState<CaseLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: page, error } = await supabase
        .from("industry_pages").select("*")
        .eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error || !page) { setNotFound(true); setLoading(false); return; }
      setData(page as unknown as IndustryRecord);
      const ids = [page.case_1_id, page.case_2_id, page.case_3_id].filter(Boolean) as string[];
      if (ids.length) {
        const { data: cs } = await supabase
          .from("cases")
          .select("id, slug, client_name, subtitle, hero_image_url, client_logo_url, stats, intro_text")
          .in("id", ids).eq("is_published", true);
        // preserve order
        const map = new Map((cs || []).map((c) => [c.id, c]));
        setLinkedCases(ids.map((i) => map.get(i)).filter(Boolean) as unknown as CaseLite[]);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-32 text-center">
          <h1 className="text-3xl font-bold mb-4">Industry page not found</h1>
          <Button onClick={() => navigate("/industries")}>Back to Industries</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const headerStyle = { backgroundColor: data.header_bg_color || "#1DB954" };

  // FAQ JSON-LD
  const faqLd = data.faq_items?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq_items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={data.meta_title || `${data.industry_name} | Floowy`}
        description={data.meta_description || data.intro_title}
        keywords={data.meta_keywords || ""}
        canonicalUrl={`https://floowy.ai/industries/${data.slug}`}
        ogImageUrl={data.og_image_url || data.hero_image_url || undefined}
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Industries", url: "https://floowy.ai/industries" },
          { name: data.industry_name, url: `https://floowy.ai/industries/${data.slug}` },
        ]}
      />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <Navigation />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-header-dark" style={headerStyle}>
        <div className="container mx-auto max-w-6xl">
          <Button variant="ghost" onClick={() => navigate("/industries")} className="mb-6 text-header-dark hover:bg-black/10 hover:text-header-dark">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Industries
          </Button>
          <div className="grid md:grid-cols-3 gap-10 items-center">
            <div className="md:col-span-2">
              <p className="uppercase tracking-wider text-sm font-semibold text-header-dark/80 mb-3">{data.industry_name}</p>
              <h1 className="text-3xl font-bold leading-tight mb-4 text-header-dark md:text-5xl">{data.intro_title || data.industry_name}</h1>
              {data.intro_body && (
                <p className="text-header-dark/85 text-lg whitespace-pre-line">{data.intro_body}</p>
              )}
              <div className="flex gap-3 mt-8">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/auth?mode=signup")}>Start for €1</Button>
                <Button size="lg" variant="outline" className="text-header-dark border-header-dark/40 hover:bg-header-dark/10 hover:text-header-dark" onClick={() => navigate("/request-demo")}>Book a Call</Button>
              </div>
            </div>
            {data.hero_image_url && (
              <img src={data.hero_image_url} alt={data.industry_name} className="rounded-xl shadow-elegant w-full h-auto md:col-span-1" loading="lazy" />
            )}
          </div>
        </div>
      </section>

      {/* Block 2 — Recognition */}
      {data.recognition_bullets?.length > 0 && (
        <section className="py-8 md:py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center">
              <span className="text-header-dark">{data.recognition_title}</span>
            </h2>
            <ul className="space-y-3 max-w-2xl mx-auto">
              {data.recognition_bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-lg">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Block 3 — Solution */}
      {data.solution_body && (
        <section className="py-8 md:py-12 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="text-header-dark">{data.solution_title.split(" ").slice(0, -1).join(" ")} </span>
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {data.solution_title.split(" ").slice(-1)[0]}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg whitespace-pre-line">{data.solution_body}</p>
          </div>
        </section>
      )}

      {/* Block 4 — Case References */}
      {linkedCases.length > 0 && (
        <section className="py-8 md:py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-10 text-center">
              <span className="text-header-dark">{data.cases_section_title}</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {linkedCases.map((c) => (
                <Link key={c.id} to={`/cases/${c.slug}`} className="block group">
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                    {c.hero_image_url && (
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        <img src={c.hero_image_url} alt={c.client_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{c.client_name}</h3>
                        {c.client_logo_url && (
                          <img src={c.client_logo_url} alt="" className="h-6 max-w-[80px] object-contain opacity-80" loading="lazy" />
                        )}
                      </div>
                      {Array.isArray(c.stats) && c.stats[0] && (
                        <div>
                          <div className="text-3xl font-bold text-primary">{c.stats[0].value}</div>
                          <div className="text-xs text-muted-foreground">{c.stats[0].label}</div>
                        </div>
                      )}
                      <p className="text-lg text-muted-foreground line-clamp-3">{c.subtitle || c.intro_text}</p>
                      <div className="text-sm text-primary font-medium inline-flex items-center gap-1">
                        Read case study <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Block 5 — FAQ */}
      {data.faq_items?.length > 0 && (
        <section className="py-8 md:py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center">
              <span className="text-header-dark">{data.faq_section_title}</span>
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {data.faq_items.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-lg">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-line">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-header-dark">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join 1000+ ecommerce brands creating stunning visuals with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14">
              Start for €1
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/request-demo")} className="text-lg px-8 h-14">
              Book a Call
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DynamicIndustryPage;