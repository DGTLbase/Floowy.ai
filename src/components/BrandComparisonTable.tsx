import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight } from "lucide-react";
import floowyLogo from "@/assets/floowy-logo.png";
import chatgptLogo from "@/assets/chatgpt-logo.png";
import higgsfieldLogo from "@/assets/higgsfield-logo.png";

/* Gemini's four-point sparkle, drawn inline (blue→purple) so no asset is needed. */
const GeminiMark = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <defs>
      <linearGradient id="gemini-grad" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4" />
        <stop offset="0.5" stopColor="#9177C7" />
        <stop offset="1" stopColor="#D96570" />
      </linearGradient>
    </defs>
    <path
      d="M12 1.5c.9 6 3.6 8.7 9.6 9.6.4.06.4.66 0 .72C15.6 12.72 12.9 15.42 12 21.42c-.06.4-.66.4-.72 0C10.38 15.42 7.68 12.72 1.68 11.82c-.4-.06-.4-.66 0-.72C7.68 10.2 10.38 7.5 11.28 1.5c.06-.4.66-.4.72 0Z"
      fill="url(#gemini-grad)"
    />
  </svg>
);

/* ────────────────────────────────────────────────────────────────────────────
   EDITABLE CONTENT — marketing can change headings, columns, logos and every row
   value here without touching the layout. Drop a competitor logo image into
   `logo` (import it at top) to show it instead of the text wordmark.
   The first four rows (expertise angle) and the "Cost to a usable result" row are
   flagged `emphasized` and get extra visual weight.
   ──────────────────────────────────────────────────────────────────────────── */
const HEADING = {
  eyebrow: "Floowy vs. the rest",
  title: "The Expertise Is",
  titleAccent: "Built Into The Buttons",
  subtitle:
    "With general and creator-focused tools, the prompting, photography and marketing are on you. With Floowy, that expertise is already inside the tool, so you just click.",
};

interface Column { key: string; name: string; logo?: string | null; mark?: ReactNode; isFloowy?: boolean; }
const COLUMNS: Column[] = [
  { key: "floowy", name: "Floowy", logo: floowyLogo, isFloowy: true },
  { key: "higgsfield", name: "Higgsfield", logo: higgsfieldLogo },
  { key: "chatgpt", name: "ChatGPT", logo: chatgptLogo },
  { key: "gemini", name: "Gemini", mark: <GeminiMark /> },
];

interface Row { label: string; emphasized?: boolean; values: Record<string, string>; }
const ROWS: Row[] = [
  { label: "How you operate it", emphasized: true, values: { floowy: "Click buttons", higgsfield: "Write prompts", chatgpt: "Write prompts", gemini: "Write prompts" } },
  { label: "Prompt skills needed", emphasized: true, values: { floowy: "No, built into the buttons", higgsfield: "Yes, you write them", chatgpt: "Yes, you write them", gemini: "Yes, you write them" } },
  { label: "Photography knowledge", emphasized: true, values: { floowy: "No, built in", higgsfield: "Yes, lighting & framing on you", chatgpt: "Yes", gemini: "Yes" } },
  { label: "Marketing know-how", emphasized: true, values: { floowy: "No, built in", higgsfield: "Yes, you direct it", chatgpt: "Yes", gemini: "Yes" } },
  { label: "Built for e-commerce", values: { floowy: "Yes, by default", higgsfield: "General creative", chatgpt: "General purpose", gemini: "General purpose" } },
  { label: "Product stays accurate", values: { floowy: "Yes, kept intact", higgsfield: "Often reinterpreted", chatgpt: "Product drifts", gemini: "Product drifts" } },
  { label: "Cost to a usable result", emphasized: true, values: { floowy: "Low, right the first time", higgsfield: "Regenerate until it fits", chatgpt: "Regenerate until it fits", gemini: "Regenerate until it fits" } },
  { label: "Ready to publish", values: { floowy: "Sized & export-ready", higgsfield: "Needs editing", chatgpt: "Needs editing", gemini: "Needs editing" } },
];

const CTA = { label: "Start for €1", href: "/auth?mode=signup" };

const ColHeader = ({ col }: { col: Column }) => (
  <div className={`flex items-center justify-start gap-2 ${col.isFloowy ? "text-primary-foreground" : "text-foreground"}`}>
    {col.logo ? (
      <img
        src={col.logo}
        alt=""
        aria-hidden="true"
        className={`w-auto shrink-0 object-contain ${col.isFloowy ? "h-6" : "h-5"}`}
      />
    ) : col.mark ? (
      col.mark
    ) : null}
    <span className={`text-base font-bold ${col.isFloowy ? "text-primary-foreground" : "text-foreground"}`}>{col.name}</span>
  </div>
);

const BrandComparisonTable = () => (
  <section className="py-16 md:py-24 bg-background overflow-hidden">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          {HEADING.eyebrow}
        </span>
        <h2 className="mt-4 text-3xl md:text-5xl font-bold text-header-dark">
          {HEADING.title}{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{HEADING.titleAccent}</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{HEADING.subtitle}</p>
      </div>

      {/* ───────── Desktop / tablet table ───────── */}
      <div className="hidden md:block max-w-5xl mx-auto overflow-hidden rounded-2xl border border-border shadow-elegant">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-[26%] bg-muted/40 p-4 text-left align-bottom" />
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`p-4 align-middle ${col.isFloowy ? "bg-primary" : "bg-muted/60"} ${col.isFloowy ? "" : "border-l border-border/50"}`}
                >
                  <ColHeader col={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr key={row.label} className={row.emphasized ? "bg-primary/[0.04]" : ri % 2 ? "bg-muted/20" : ""}>
                <td className={`p-4 text-left align-middle border-t border-border/50 ${row.emphasized ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                  {row.label}
                </td>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`p-4 align-middle border-t border-border/50 text-left ${col.isFloowy ? "bg-primary/[0.06]" : "border-l border-border/50"}`}
                  >
                    <span className={`inline-flex items-start gap-1.5 text-left ${col.isFloowy ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {col.isFloowy ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                      )}
                      {row.values[col.key]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────── Mobile: per-row cards ───────── */}
      <div className="md:hidden space-y-4 max-w-md mx-auto">
        {ROWS.map((row) => (
          <div key={row.label} className={`rounded-xl border p-4 ${row.emphasized ? "border-primary/30 bg-primary/[0.04]" : "border-border bg-card"}`}>
            <p className="mb-3 text-sm font-semibold text-foreground">{row.label}</p>
            <div className="space-y-2">
              {COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${col.isFloowy ? "bg-primary/10" : "bg-muted/40"}`}
                >
                  {col.isFloowy ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                  )}
                  <span className="flex-1">
                    <span className={`mr-1.5 font-semibold ${col.isFloowy ? "text-primary" : "text-foreground"}`}>{col.name}:</span>
                    <span className={col.isFloowy ? "text-foreground" : "text-muted-foreground"}>{row.values[col.key]}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <Link to={CTA.href}>
          <Button size="lg" variant="offer" className="shadow-glow">
            {CTA.label} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

export default BrandComparisonTable;
