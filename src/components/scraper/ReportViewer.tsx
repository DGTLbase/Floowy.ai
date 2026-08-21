import { useCallback, useEffect, useState } from "react";
import { X, FileText, ChevronRight } from "lucide-react";
import type { SampleReport } from "@/content/scraper-reports";

/**
 * The two sample reports on /social-media-scraper, as an interactive viewer.
 *
 * WHY IT WORKS THIS WAY
 * The report IS the product on this page. A visitor who scrolls two real
 * reports for thirty seconds understands the offer better than any headline can
 * explain it — and does it without giving up an email first. So the reports are
 * readable in place rather than gated behind a download.
 *
 * The report data is imported dynamically on first click, not at page load:
 * it is ~23KB of text and would otherwise sit in the critical bundle for a
 * page whose ranking depends on Core Web Vitals. The cards render instantly
 * from static copy, so nothing waits on the import.
 */
const ReportViewer = () => {
  const [reports, setReports] = useState<SampleReport[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const open = useCallback(async (id: string) => {
    if (reports) {
      setOpenId(id);
      return;
    }
    setLoadingId(id);
    const mod = await import("@/content/scraper-reports");
    setReports(mod.SAMPLE_REPORTS);
    setLoadingId(null);
    setOpenId(id);
  }, [reports]);

  // Escape closes, and the page behind must not scroll while the overlay is up.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  const active = reports?.find((r) => r.id === openId) ?? null;

  const CARDS = [
    { id: "insights", kicker: "THE SCRAPER REPORT", name: "Inzichtenrapport",
      description: "What 214 videos in one niche reveal about the content that converts, and where the brand is leaving views on the table.",
      meta: "12 pages · 214 videos · 3,120 comments" },
    { id: "plan", kicker: "THE CONTENT PLAN", name: "Contentplan",
      description: "The same scrape turned into pillars, formats, a hook library and a week-by-week production schedule.",
      meta: "12 pages · formats, hooks and schedule" },
  ];

  return (
    <div className="report-viewer">
      <div className="rv-head">
        <h3>See two real reports</h3>
        <p>Click either report to open it and scroll through the whole thing. No email required.</p>
      </div>

      <div className="rv-cards">
        {CARDS.map((c) => (
          <button key={c.id} className="rv-card" onClick={() => open(c.id)} aria-haspopup="dialog">
            <span className="rv-kicker">{c.kicker}</span>
            <span className="rv-cover"><FileText aria-hidden /></span>
            <span className="rv-name">{c.name}</span>
            <span className="rv-desc">{c.description}</span>
            <span className="rv-meta">{c.meta}</span>
            <span className="rv-open">
              {loadingId === c.id ? "Opening…" : "Read the report"} <ChevronRight aria-hidden />
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="rv-overlay" role="dialog" aria-modal="true" aria-label={active.name}
             onClick={(e) => { if (e.target === e.currentTarget) setOpenId(null); }}>
          <div className="rv-doc">
            <header className="rv-doc-head">
              <div>
                <span className="rv-kicker">{active.kicker}</span>
                <strong>{active.name}</strong>
              </div>
              <button onClick={() => setOpenId(null)} aria-label="Close report"><X aria-hidden /></button>
            </header>
            <div className="rv-doc-body">
              {active.pages.map((p) => (
                <article key={p.n} className="rv-page">
                  <div className="rv-page-n">Page {p.n} of {active.pages.length + 1}</div>
                  <h4>{p.title}</h4>
                  {p.body.map((line, i) => <p key={i}>{line}</p>)}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportViewer;
