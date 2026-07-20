import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, MousePointerClick, Sparkles, Check, ArrowRight, Rocket, Clock } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   EDITABLE CONTENT — marketing can change all copy/numbers here without touching
   the layout. Anything in {curly} on the teams block below is filled from `metrics`.
   ──────────────────────────────────────────────────────────────────────────── */
const CONTENT = {
  // Section-tile title style: dark lead + light-green gradient accent phrase.
  headline: "No prompting. No photography. No marketing know-how.",
  headlineAccent: "Just click.",
  subline: "Built by a prompt engineer, photographer, and marketer, so you don't have to be.",
  valueLine: "New teammates are productive within 5 minutes.",
  steps: [
    { title: "Upload", desc: "Drop in your product photo.", icon: Upload },
    { title: "Pick a look", desc: "Choose a model, scene, or one-click style.", icon: MousePointerClick },
    { title: "Click Generate", desc: "One button — that's the whole flow.", icon: Sparkles },
    { title: "Done", desc: "Export-ready, sized for every channel.", icon: Check },
  ],
  teams: {
    eyebrow: "For teams & enterprise",
    title: "Your new people are productive immediately, no training.",
    points: [
      "New teammates are productive within {productiveTime}.",
      "Create campaign-ready creatives in {creativeTime}, no training, no AI knowledge.",
      "No learning curve: your whole team adds value from day one.",
      "Scale your e-commerce content without extra tools or specialists.",
    ],
  },
  // Placeholder numbers ([X time]) — marketing sets exact values here.
  metrics: {
    productiveTime: "5 minutes",
    creativeTime: "minutes",
  },
  cta: { label: "Start for €1", href: "/auth?mode=signup" },
};

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

const EaseOfUseHowItWorks = () => (
  <section className="py-16 md:py-24 bg-background overflow-hidden">
    <div className="container mx-auto px-4">
      {/* Header — leads with why it's effortless for you */}
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> How it works
        </span>
        <h2 className="mt-4 text-3xl md:text-5xl font-bold text-header-dark">
          {CONTENT.headline}{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {CONTENT.headlineAccent}
          </span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{CONTENT.subline}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Clock className="h-4 w-4" /> {CONTENT.valueLine}
        </p>
      </div>

      {/* 4 effortless steps — bigger, central */}
      <div className="max-w-5xl mx-auto relative">
        <div className="hidden md:block absolute top-[52px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-primary/20 via-primary to-primary/20 z-0" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-6 relative z-10">
          {CONTENT.steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="relative mb-4">
                <div className="w-[104px] h-[104px] rounded-full bg-gradient-to-br from-card to-muted border-2 border-border/50 flex items-center justify-center shadow-lg group-hover:border-primary/50 transition-all duration-500">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-base md:text-lg font-bold text-foreground mb-1">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[180px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Speed-to-value for teams & enterprise */}
      <div className="max-w-4xl mx-auto mt-14 md:mt-20 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 p-8 md:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Rocket className="h-3.5 w-3.5" /> {CONTENT.teams.eyebrow}
        </span>
        <h3 className="mt-4 text-2xl md:text-3xl font-bold text-header-dark max-w-2xl">
          {CONTENT.teams.title}
        </h3>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {CONTENT.teams.points.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-3 w-3" />
              </span>
              {fill(point, CONTENT.metrics)}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link to={CONTENT.cta.href}>
            <Button size="lg" variant="offer" className="shadow-glow">
              {CONTENT.cta.label} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default EaseOfUseHowItWorks;
