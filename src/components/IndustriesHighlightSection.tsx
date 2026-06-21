import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TiltCard } from "@/components/TiltCard";

type IndustryPage = {
  id: string;
  slug: string;
  industry_name: string;
  hero_image_url: string | null;
  intro_title: string | null;
  header_bg_color: string;
};

interface IndustriesHighlightSectionProps {
  headline?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

const IndustriesHighlightSection = ({
  headline,
  subtitle = "Discover how brands in your space use Floowy to create on-brand visuals at scale.",
  className = "",
}: IndustriesHighlightSectionProps) => {
  const [pages, setPages] = useState<IndustryPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("industry_pages")
        .select("id, slug, industry_name, hero_image_url, intro_title, header_bg_color")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      setPages((data as IndustryPage[]) || []);
      setLoading(false);
    })();
  }, []);

  if (!loading && pages.length === 0) return null;

  return (
    <section className={`container mx-auto px-4 py-8 md:py-12 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 px-4 scroll-animate">
          {headline || (
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              Built For <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Your Industry</span>
            </h2>
          )}
          <p className="text-lg sm:text-xl text-muted-foreground">{subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 items-stretch">
            {pages.map((p) => (
              <Link key={p.id} to={`/industries/${p.slug}`} className="block h-full">
                <TiltCard className="h-full">
                  <Card className="transition-all duration-300 border-border/50 overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl h-full">
                    <div className="flex flex-col h-full">
                      <div className="relative h-[280px] md:h-[340px] overflow-hidden">
                        {p.hero_image_url ? (
                          <img
                            src={p.hero_image_url}
                            alt={p.industry_name}
                            className="absolute inset-0 w-full h-full object-cover object-top"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="absolute inset-0" style={{ backgroundColor: p.header_bg_color }} />
                        )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col items-center md:items-start">
                        <p className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wide">Industry</p>
                        <h3 className="text-base font-bold text-foreground mb-2">{p.industry_name}</h3>
                        {p.intro_title && (
                          <p className="text-xs text-muted-foreground mb-3 text-center md:text-left line-clamp-3">
                            {p.intro_title}
                          </p>
                        )}
                        <Button size="sm" className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 mt-auto">
                          Explore <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TiltCard>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/industries">
            <Button size="lg" className="text-lg px-8 h-14 bg-primary text-primary-foreground hover:bg-primary/90">
              View All Industries <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default IndustriesHighlightSection;