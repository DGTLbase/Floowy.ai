import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import PageMeta from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
type Stat = { value: string; label: string };
type CaseRow = {
  id: string;
  slug: string;
  client_name: string;
  subtitle: string;
  hero_image_url: string | null;
  stats: Stat[];
  category_id: string | null;
};
type Category = { id: string; slug: string; name: string };

const Cases = () => {
  useScrollAnimationInit();
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: cs }, { data: cats }] = await Promise.all([
        supabase
          .from("cases")
          .select("id, slug, client_name, subtitle, hero_image_url, stats, category_id")
          .eq("is_published", true)
          .order("published_at", { ascending: false }),
        supabase
          .from("case_categories")
          .select("id, slug, name")
          .order("sort_order", { ascending: true }),
      ]);
      setCases((cs as unknown as CaseRow[]) || []);
      setCategories((cats as Category[]) || []);
      setLoading(false);
    })();
  }, []);

  const byCategory = (catId: string) => cases.filter((c) => c.category_id === catId);

  // Dedupe categories by normalized name (case-insensitive), preserving sort order
  const dedupedCategories = (() => {
    const seen = new Set<string>();
    const out: Category[] = [];
    for (const c of categories) {
      const key = c.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  })();
  const dedupedById = new Map(dedupedCategories.map((c) => [c.id, c]));
  // Map duplicate category ids -> kept canonical id so case filtering still works
  const canonicalCatId = (id: string | null) => {
    if (!id) return id;
    const cat = categories.find((c) => c.id === id);
    if (!cat) return id;
    const match = dedupedCategories.find(
      (c) => c.name.trim().toLowerCase() === cat.name.trim().toLowerCase()
    );
    return match?.id ?? id;
  };
  const byCategoryDeduped = (catId: string) =>
    cases.filter((c) => canonicalCatId(c.category_id) === catId);

  const CaseCard = ({ caseStudy }: { caseStudy: CaseRow }) => (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-105 w-full max-w-sm mx-auto bg-gradient-to-br from-primary via-primary to-primary-glow border-none"
      onClick={() => navigate(`/cases/${caseStudy.slug}`)}
    >
      {caseStudy.hero_image_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={caseStudy.hero_image_url}
            alt={caseStudy.client_name}
            className="w-full h-full object-cover" loading="lazy" decoding="async"
          />
        </div>
      )}
      <CardHeader className="text-white pb-3">
        <CardTitle className="text-xl text-white">{caseStudy.client_name}</CardTitle>
        <CardDescription className="text-base text-white/90">{caseStudy.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {(caseStudy.stats || []).map((stat, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium whitespace-nowrap"
            >
              {stat.value} {stat.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ name }: { name: string }) => (
    <Card>
      <CardContent className="p-12 text-center">
        <h3 className="text-2xl font-semibold mb-4">
          <span className="text-header-dark">{name} Case Studies</span>{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Coming Soon
          </span>
        </h3>
        <p className="text-muted-foreground">
          We're working on showcasing amazing results from {name.toLowerCase()} brands using Floowy.ai
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="See AI content creation cases from leading modern brands | Floowy"
        description="Explore AI content creation cases and learn how brands scale marketing visuals. See real results from companies using AI for creative production."
        keywords="AI content creation cases, AI marketing case studies, brand content cases"
        canonicalUrl="https://floowy.ai/cases"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Cases", url: "https://floowy.ai/cases" },
        ]}
      />
      <Navigation />

      <section className="pt-20 md:pt-24 pb-8 md:pb-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-header-dark">Success</span>{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Stories
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            See How Leading Brands Are Using AI To Transform Their Content Creation And Boost Performance
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mx-auto flex flex-wrap justify-center gap-2 mb-8 h-auto bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border-foreground data-[state=active]:shadow-none hover:bg-muted transition-colors"
                >
                  All
                </TabsTrigger>
                {dedupedCategories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.slug}
                    className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border-foreground data-[state=active]:shadow-none hover:bg-muted transition-colors"
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="space-y-8">
                {cases.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cases.map((c) => <CaseCard key={c.id} caseStudy={c} />)}
                  </div>
                ) : (
                  <EmptyState name="" />
                )}
              </TabsContent>

              {dedupedCategories.map((cat) => {
                const list = byCategoryDeduped(cat.id);
                return (
                  <TabsContent key={cat.id} value={cat.slug} className="space-y-8">
                    {list.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {list.map((c) => <CaseCard key={c.id} caseStudy={c} />)}
                      </div>
                    ) : (
                      <EmptyState name={cat.name} />
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </section>

      <PlatformsSection />

      <IndustriesHighlightSection />
      <Footer />
    </div>
  );
};

export default Cases;
