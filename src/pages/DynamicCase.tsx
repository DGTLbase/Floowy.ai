import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowLeft, ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import PageMeta from "@/components/PageMeta";

type Stat = { value: string; label: string };

type CaseRecord = {
  id: string; slug: string; client_name: string; subtitle: string;
  tags: string[]; header_bg_color: string;
  client_logo_url: string | null; hero_image_url: string | null;
  intro_text: string; stats: Stat[]; problem_text: string; solution_text: string;
  comparison_left_label: string; comparison_left_image_url: string | null;
  comparison_right_label: string; comparison_right_image_url: string | null;
  quote_text: string; quote_attribution: string; key_results: string[];
  meta_title: string | null; meta_description: string | null;
  meta_keywords: string | null; og_image_url: string | null;
};

function AnimatedStat({ value, label }: Stat) {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const numeric = parseInt(value.replace(/[^0-9]/g, "")) || 0;
  const prefix = value.includes("+") ? "+" : "";
  const suffix = value.includes("%") ? "%" : "";

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const steps = 60; const inc = numeric / steps; let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= numeric) { setCount(numeric); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, 2000 / steps);
    return () => clearInterval(t);
  }, [visible, numeric]);

  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="text-6xl font-bold text-primary mb-2">
        {numeric > 0 ? `${prefix}${count}${suffix}` : value}
      </div>
      <div className="text-base text-white/90">{label}</div>
    </div>
  );
}

const DynamicCase = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("cases").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error || !data) setNotFound(true);
      else setData(data as unknown as CaseRecord);
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
          <h1 className="text-3xl font-bold mb-4">Case not found</h1>
          <Button onClick={() => navigate("/cases")}>Back to Cases</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const headerStyle = { backgroundColor: data.header_bg_color || "#1DB954" };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={data.meta_title || `${data.client_name} | Floowy`}
        description={data.meta_description || data.subtitle}
        keywords={data.meta_keywords || ""}
        canonicalUrl={`https://floowy.ai/cases/${data.slug}`}
        ogImageUrl={data.og_image_url || data.hero_image_url || undefined}
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Cases", url: "https://floowy.ai/cases" },
          { name: data.client_name, url: `https://floowy.ai/cases/${data.slug}` },
        ]}
      />
      <Navigation />

      <section className="pt-20 md:pt-24 pb-10 md:pb-12 px-3 sm:px-4">
        <div className="container mx-auto max-w-7xl">
          <Button variant="ghost" onClick={() => navigate("/cases")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cases
          </Button>

          <Card className="overflow-hidden rounded-2xl md:rounded-3xl">
            <CardHeader className="text-white py-6 md:py-8 px-6 md:px-8 relative rounded-t-2xl md:rounded-t-3xl" style={headerStyle}>
              <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {data.tags?.map((t) => (
                      <span key={t} className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">{t}</span>
                    ))}
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl md:text-4xl mb-2 break-words">{data.client_name}</CardTitle>
                  {data.subtitle && <p className="text-base sm:text-lg md:text-xl font-medium opacity-90">{data.subtitle}</p>}
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-muted/30">
              {/* Block 1 — Intro (editorial, oversized lead) */}
              {data.intro_text && (
                <div className="px-6 md:px-16 pt-12 md:pt-16 pb-10 md:pb-12 bg-background">
                  <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
                    <div className="flex-1 max-w-3xl">
                      <h3 className="mb-6 text-3xl md:text-4xl font-bold text-header-dark">
                        Overview
                      </h3>
                      <p className="text-base md:text-lg font-normal leading-relaxed text-foreground whitespace-pre-line">
                        {data.intro_text}
                      </p>
                    </div>
                    {data.client_logo_url && (
                      <div className="md:w-64 flex-shrink-0 flex md:justify-end md:pt-2">
                        <img src={data.client_logo_url} alt={`${data.client_name} Logo`} className="h-28 md:h-40 object-contain mix-blend-multiply dark:mix-blend-screen bg-transparent" loading="lazy" decoding="async" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Block 2 — Results (full-bleed dark band, distinct from header color) */}
              {Array.isArray(data.stats) && data.stats.length > 0 && (
                <div className="relative px-6 md:px-16 py-14 md:py-20 bg-header-dark text-white overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-[0.07] pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div className="relative grid md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-4">
                      <div className="flex items-start justify-between md:block">
                        <div>
                          <div className="text-7xl md:text-8xl font-bold leading-none text-white/30">01</div>
                          <h3 className="mt-4 text-3xl md:text-4xl font-bold">The Results</h3>
                        </div>
                        <TrendingUp className="h-10 w-10 text-white/30 md:mt-6" />
                      </div>
                    </div>
                    <div className="md:col-span-8 grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-4 md:divide-x md:divide-white/10">
                      {data.stats.map((s, i) => (
                        <div key={i} className="md:px-6 first:md:pl-0">
                          <AnimatedStat value={s.value} label={s.label} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Block 3 — Problem (asymmetric, chapter-numbered) */}
              {data.problem_text && (
                <div className="px-6 md:px-16 py-12 md:py-20 bg-background">
                  <div className="grid md:grid-cols-12 gap-8">
                    <div className="md:col-span-4">
                      <div className="text-7xl md:text-8xl font-bold leading-none text-foreground/10">02</div>
                      <h3 className="mt-4 text-3xl md:text-4xl font-bold text-header-dark">
                        The Problem
                      </h3>
                    </div>
                    <div className="md:col-span-8 md:pt-6">
                      <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                        {data.problem_text}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Block 4 — Solution (mirrored asymmetric, subtle tinted bg) */}
              {data.solution_text && (
                <div className="px-6 md:px-16 py-12 md:py-20 bg-muted/40 border-y border-border/60">
                  <div className="grid md:grid-cols-12 gap-8">
                    <div className="md:col-span-8 md:order-2">
                      <p className="text-lg leading-relaxed text-foreground/80 whitespace-pre-line">
                        {data.solution_text}
                      </p>
                    </div>
                    <div className="md:col-span-4 md:order-1">
                      <div className="text-7xl md:text-8xl font-bold leading-none text-primary/20">03</div>
                      <h3 className="mt-4 text-3xl md:text-4xl font-bold">
                        <span className="text-header-dark">How We </span>
                        <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Did It</span>
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Block 5 — Visual Comparison */}
              {(data.comparison_left_image_url || data.comparison_right_image_url) && (
                <div className="px-6 md:px-16 py-12 md:py-20 bg-background">
                  <div className="mb-10">
                    <div className="text-7xl md:text-8xl font-bold leading-none text-foreground/10">04</div>
                    <h3 className="mt-4 text-3xl md:text-4xl font-bold">
                      <span className="text-header-dark">Before vs </span>
                      <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">After</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60">
                        {data.comparison_left_image_url && (
                          <img src={data.comparison_left_image_url} alt={data.comparison_left_label} className="w-full h-auto block" loading="lazy" decoding="async" />
                        )}
                        <span className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur text-xs font-semibold uppercase tracking-wider rounded-full">
                          {data.comparison_left_label}
                        </span>
                      </div>
                    </div>
                    <div className="group">
                      <div className="relative bg-card rounded-2xl overflow-hidden border-2 border-primary/40 shadow-glow">
                        {data.comparison_right_image_url && (
                          <img src={data.comparison_right_image_url} alt={data.comparison_right_label} className="w-full h-auto block" loading="lazy" decoding="async" />
                        )}
                        <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-full">
                          {data.comparison_right_label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Block 6 — Quote (oversized editorial pull-quote) */}
              {data.quote_text && (
                <div className="px-6 md:px-16 py-6 md:py-10 bg-background relative">
                  <div className="max-w-4xl mx-auto text-center">
                    <div className="text-[5rem] md:text-[9rem] leading-none text-primary/20 select-none -mb-6 md:-mb-10">
                      “
                    </div>
                    <p className="text-xl md:text-3xl font-medium leading-snug text-foreground">
                      {data.quote_text}
                    </p>
                    {data.quote_attribution && (
                      <div className="mt-6 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                        <span className="h-px w-8 bg-foreground/30" />
                        <span className="font-semibold">{data.quote_attribution}</span>
                        <span className="h-px w-8 bg-foreground/30" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Block 7 — Key Results (numbered list cards) */}
              {data.key_results?.length > 0 && (
                <div className="px-6 md:px-16 py-12 md:py-20 bg-muted/40 border-t border-border/60">
                  <div className="mb-10">
                    <div className="text-7xl md:text-8xl font-bold leading-none text-foreground/10">05</div>
                    <h3 className="mt-4 text-3xl md:text-4xl font-bold">
                      <span className="text-header-dark">Key </span>
                      <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Results</span>
                    </h3>
                  </div>
                  <ul className="grid md:grid-cols-2 gap-4">
                    {data.key_results.map((item, i) => (
                      <li
                        key={i}
                        className="group flex items-start gap-4 p-5 rounded-xl bg-background border border-border/60 hover:border-primary/40 hover:shadow-elegant transition-all"
                      >
                        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-foreground/80 leading-relaxed pt-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Block 8 — CTA */}
              <div className="relative px-6 md:px-16 py-12 md:py-20 bg-primary text-primary-foreground overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.05] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="relative text-center max-w-2xl mx-auto">
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to write your own story?</h3>
                  <p className="text-primary-foreground/80 mb-8">Join the brands scaling their content with Floowy.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="bg-header-dark text-white hover:bg-header-dark/90">
                      Start for €1
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => navigate("/request-demo")} className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                      Book a Call
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DynamicCase;