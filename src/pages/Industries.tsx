import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";

type IndustryPage = {
  id: string;
  slug: string;
  industry_name: string;
  hero_image_url: string | null;
  intro_title: string;
  category_id: string | null;
  header_bg_color: string;
};
type Category = { id: string; slug: string; name: string };

const Industries = () => {
  const [pages, setPages] = useState<IndustryPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: ps }, { data: cats }] = await Promise.all([
        supabase
          .from("industry_pages")
          .select("id, slug, industry_name, hero_image_url, intro_title, category_id, header_bg_color")
          .eq("is_published", true)
          .order("published_at", { ascending: false }),
        supabase
          .from("case_categories")
          .select("id, slug, name")
          .order("sort_order", { ascending: true }),
      ]);
      const sorted = ((ps as IndustryPage[]) || []).slice().sort((a, b) =>
        a.industry_name.localeCompare(b.industry_name)
      );
      setPages(sorted);
      setCategories((cats as Category[]) || []);
      setLoading(false);
    })();
  }, []);

  const usedCategoryIds = new Set(pages.map((p) => p.category_id).filter(Boolean));
  const filterCats = categories.filter((c) => usedCategoryIds.has(c.id));

  const Card1 = ({ p }: { p: IndustryPage }) => (
    <Link to={`/industries/${p.slug}`} className="block group">
      <Card className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1">
        {p.hero_image_url ? (
          <div className="aspect-[4/3] overflow-hidden bg-muted">
            <img src={p.hero_image_url} alt={p.industry_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
          </div>
        ) : (
          <div className="aspect-[4/3]" style={{ backgroundColor: p.header_bg_color }} />
        )}
        <CardContent className="p-5">
          <Badge variant="outline" className="mb-2">Industry</Badge>
          <h3 className="text-xl font-semibold mb-1">{p.industry_name}</h3>
          {p.intro_title && <p className="text-sm text-muted-foreground line-clamp-2">{p.intro_title}</p>}
          <Button variant="ghost" size="sm" className="px-0 mt-3">Explore →</Button>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Industries | Floowy"
        description="Discover how Floowy helps brands across fashion, beauty, food, electronics and more create high-quality visuals at scale."
        canonicalUrl="https://floowy.ai/industries"
      />
      <Navigation />

      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-header-dark">Built for </span>
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">your industry</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See how Floowy adapts to the visual workflows of your industry.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : pages.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">No industry pages published yet.</p>
          ) : filterCats.length > 1 ? (
            <Tabs defaultValue="all">
              <TabsList className="mx-auto flex flex-wrap justify-center gap-2 mb-8 h-auto bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border-foreground data-[state=active]:shadow-none hover:bg-muted transition-colors"
                >
                  All
                </TabsTrigger>
                {filterCats.map((c) => (
                  <TabsTrigger
                    key={c.id}
                    value={c.id}
                    className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border-foreground data-[state=active]:shadow-none hover:bg-muted transition-colors"
                  >
                    {c.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pages.map((p) => <Card1 key={p.id} p={p} />)}
                </div>
              </TabsContent>
              {filterCats.map((c) => (
                <TabsContent key={c.id} value={c.id}>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.filter((p) => p.category_id === c.id).map((p) => <Card1 key={p.id} p={p} />)}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((p) => <Card1 key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Industries;