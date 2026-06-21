import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/floowy-logo.png";

interface ComparisonSectionProps {
  headline?: React.ReactNode;
  subtitle?: string;
  floowyLabel?: string;
  floowySubtitle?: string;
  othersLabel?: string;
  othersSubtitle?: string;
  floowyItems: string[];
  othersItems: string[];
  ctaText?: string;
  ctaLink?: string;
  className?: string;
}

const ComparisonSection = ({
  headline,
  subtitle = "Everyone's talking about it. AI content creation made simple.",
  floowyLabel = "Floowy.ai",
  floowySubtitle = "The smarter way",
  othersLabel = "Others",
  othersSubtitle = "The old way",
  floowyItems,
  othersItems,
  ctaText = "Start for €1",
  ctaLink = "/auth?mode=signup",
  className = "",
}: ComparisonSectionProps) => {
  return (
    <section className={`container mx-auto px-4 py-8 md:py-12 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 px-4 scroll-animate">
          {headline || (
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
              Why Scaling Brands <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Switch to Floowy</span>
            </h2>
          )}
          <p className="text-base sm:text-lg text-muted-foreground">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-6 scroll-animate" style={{ transitionDelay: '0.15s' }}>
          {/* Floowy.ai */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-glow" />
            <CardContent className="p-3 sm:p-8 pt-5 sm:pt-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <img src={logoImage} alt="Floowy.ai" className="h-5 sm:h-8 w-auto" loading="lazy" decoding="async" />
                <span className="font-bold text-sm sm:text-xl text-foreground">{floowyLabel}</span>
              </div>
              <p className="text-[10px] sm:text-sm text-primary font-medium mb-3 sm:mb-6">{floowySubtitle}</p>
              <div className="space-y-2.5 sm:space-y-4">
                {floowyItems.map((item) => (
                  <div key={item} className="flex items-start gap-1.5 sm:gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/15 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-primary" />
                    </div>
                    <p className="text-xs sm:text-base text-foreground leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Others */}
          <Card className="border-border/30 bg-muted/30 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted-foreground/20" />
            <CardContent className="p-3 sm:p-8 pt-5 sm:pt-10">
              <div className="mb-1 sm:mb-2">
                <span className="font-bold text-sm sm:text-xl text-muted-foreground">{othersLabel}</span>
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground/70 font-medium mb-3 sm:mb-6">{othersSubtitle}</p>
              <div className="space-y-2.5 sm:space-y-4">
                {othersItems.map((item) => (
                  <div key={item} className="flex items-start gap-1.5 sm:gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-destructive/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-destructive/70" />
                    </div>
                    <p className="text-xs sm:text-base text-muted-foreground leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-10 scroll-animate" style={{ transitionDelay: '0.25s' }}>
          <Link to={ctaLink}>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14">
              {ctaText}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
