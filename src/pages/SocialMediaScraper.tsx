import { Link } from "react-router-dom";
import { Sparkles, Mail, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import ReportViewer from "@/components/scraper/ReportViewer";

/**
 * /social-media-scraper — the Social Scraper landing page.
 *
 * Built to the v4 SEO/GEO brief. Two rules from that brief shape everything:
 *
 *  1. The story is not "we scrape data", it is "you get a scraper report and a
 *     content plan out of it". That promise sits in the hero and again in the
 *     block directly under it.
 *  2. Organic and ads carry equal weight, organic first. The tool is read as an
 *     ad-research tool, but organic is the bigger audience and the broader
 *     search intent.
 *
 * The head term is owned by developer tools (Apify, Bright Data, ScraperAPI), so
 * the page deliberately avoids proxy/CAPTCHA/API-key language — that traffic
 * does not convert — and competes on marketer intent instead.
 */

const CTA_PRIMARY = "/pricing-1-euro-offer";
const CTA_SECONDARY = "/contact";

const FAQS = [
  { question: "What is a social media scraper used for?",
    answer: "A social media scraper collects public data from platforms like TikTok, Instagram and Facebook at scale, so marketers can analyse what performs in their category. Typical uses are competitor research, trend spotting, creator selection, ad research and building a content plan based on evidence instead of assumptions." },
  { question: "Which platforms does Floowy scrape?",
    answer: "TikTok, Instagram and Facebook for organic content, and Meta Ads for competitor advertising. You can scrape by keyword, hashtag or account username, filtered by time period and country." },
  { question: "Can I use it for organic content, not just ads?",
    answer: "Yes, and most clients start there. Floowy scrapes organic posts by keyword, hashtag or competitor account, scores them for virality, explains why they worked, and builds a content calendar from the result. You can add your own accounts to benchmark yourself against the category." },
  { question: "Do I need to know how to code?",
    answer: "No. Most social media scrapers are APIs built for developers. Floowy is built for marketers. You create a project, add the keywords and accounts you want tracked, hit run, and get a finished report and content plan." },
  { question: "What is the virality score?",
    answer: "Every scraped post gets a score from 0 to 100 based on how it performed relative to its reach. It surfaces content that punched above its weight, which raw view counts hide. A 1,000-view post can score higher than a 3M-view one." },
  { question: "Can I scrape competitor ads?",
    answer: "Yes. Switch a project's source from Posts to Ads and Floowy pulls competitor advertising from Meta's public ad library, then analyses the hook, format and angle the same way it analyses organic content." },
  { question: "What does the AI analysis tell me?",
    answer: "Per post: the hook and why it stops the scroll, the themes, the content type, a point-by-point breakdown of why it worked, the target audience, replication tips for building your own version, and an estimated viral factor." },
  { question: "Can it analyse comments?",
    answer: "Yes. Floowy analyses the comment section per post and returns a sentiment split in percentages, key praise and criticism, top themes, the questions the audience keeps asking, and the overall mood, with the sample size." },
  { question: "Can I export the raw data?",
    answer: "Yes. Every project exports to CSV or JSON, so you can pull the dataset into your own reporting, dashboards or spreadsheets." },
  { question: "Is social media scraping legal?",
    answer: "Collecting publicly available data is generally permitted, and official ad libraries are published by the platforms for transparency. Floowy only collects public data, avoids personal information, and operates in line with GDPR. We do not access private accounts or logged-in content." },
];

const STEPS = [
  { n: "01", h: "Create a project", p: "Pick a platform: TikTok, Instagram, Facebook or Meta Ads. Choose posts or ads. Add your keywords, hashtags and competitor accounts, and name the niche you're tracking." },
  { n: "02", h: "Run the scrape", p: "Set how many videos to pull, the period you want and the country. Worldwide or a single market. Hit run and Floowy collects everything that matches." },
  { n: "03", h: "Let the AI analyse it", p: "Every post gets a virality score. Select the ones that matter and Floowy breaks down the hook, the themes, the content type, why it worked, who it was for and how to replicate it. It reads the comments too." },
  { n: "04", h: "Get your report and content plan", p: "All of it rolls up into a scraper report and a content plan. Re-run the project whenever you want and compare against the last run." },
];

const PLATFORMS = [
  { h: "TikTok", p: "The platform that moves too fast to research by hand. Scrape by keyword, hashtag or account, filtered by period and country, and see which hooks, formats and creators are winning in your category right now." },
  { h: "Instagram", p: "Reels, carousels and static posts from any public account or hashtag, with full engagement data." },
  { h: "Facebook", p: "Public page content, tracked the same way." },
  { h: "Meta Ads", p: "Competitor ads from Meta's public ad library: what they run, how it's built and which angle it leans on." },
];

const ORGANIC = [
  { h: "Find the hooks that work in your niche", p: "Not general best practice. The actual opening lines and first frames that are earning views in your category this month, pulled from real posts." },
  { h: "Spot small accounts that punch above their weight", p: "The virality score ranks by performance relative to reach, so a 1,000-view post that outperformed its account surfaces next to a 3M-view one. That's where the repeatable formats hide, not on the mega accounts." },
  { h: "Let the comments write your content", p: "The common questions from the comment analysis are a content calendar on their own. If a hundred people keep asking the same thing under a competitor's video, that's your next post, your next FAQ and your next product page section." },
  { h: "Track your own accounts too", p: "Add your own handles to a project and benchmark yourself against the category on the same metrics, run after run." },
];

const ADS = [
  { h: "See the angles, not just the creatives", p: "Every ad gets broken down by hook, format and angle. You see which claims a category leans on, which are saturated, and which nobody has claimed yet." },
  { h: "Research before you spend", p: "Proven competitor angles are the cheapest testing budget you'll ever have. Find them before you put money behind a guess." },
  { h: "Turn ad research into your own ads", p: "Take a winning angle straight into Ads Studio and generate creatives and variations in your brand, with your product." },
];

const ANALYSIS = [
  ["Hook", "exactly what the opening does and why it stops the scroll, quoted from the video"],
  ["Themes", "the topics the content actually sits on, not the hashtags it claims"],
  ["Content type", "talking head, UGC, product demo, showcase, listicle. What you'd have to brief"],
  ["Why it works", "point by point: the engagement mechanic, the visual appeal, the novelty, the discoverability play"],
  ["Target audience", "who this is landing with"],
  ["Replication tips", "concrete instructions for building your own version, ready to drop into a brief"],
  ["Estimated viral factor", "low, medium or high, so you know which patterns are worth betting on"],
];

const COMMENTS = [
  ["Sentiment split", "in percentages: positive, neutral, negative, with the sample size"],
  ["Key praise", "what people compliment, in their own words"],
  ["Key criticism", "what they push back on"],
  ["Top themes", "across the comment section"],
  ["Common questions", "the questions the audience keeps asking"],
  ["Engagement signals", "how people react and what they're curious about"],
  ["Overall mood", "in one line"],
];

const USE_CASES = [
  { h: "Agencies", p: "Run competitor research for every client in the time it used to take for one. The report is client-ready, so it doubles as a deliverable and as the argument for your next content proposal." },
  { h: "E-commerce brands", p: "Stop building the calendar from opinions. See what performs in your category, organically and in ads, and plan around evidence." },
  { h: "Influencer marketing teams", p: "Brief creators with data instead of vibes. Replication tips and hook breakdowns turn into a brief a creator can actually follow." },
  { h: "Performance marketers", p: "Find proven angles before you spend on testing them, and pull the audience's own objections straight out of the comments for your ad copy." },
];

const COMPARISON: [string, string, string, string, string][] = [
  ["Setup", "None", "Developer needed", "Account", "None"],
  ["Organic posts", "Slow", "Yes", "Limited", "Yes"],
  ["Competitor ads", "Manual", "Depends", "Yes", "Yes"],
  ["Virality scoring", "No", "No", "Limited", "Yes"],
  ["Explains why it worked", "No", "No", "No", "Yes"],
  ["Comment sentiment", "No", "Raw text only", "No", "Yes"],
  ["Output", "Notes", "CSV / JSON", "Ad gallery", "Report + content plan"],
  ["Produces the content", "No", "No", "No", "Yes"],
];

/* Tokens mirror /ads-studio so the hero reads as the same template. */
const CSS = `
.floowy-scraper{--ink:#0E1A14;--body:#48544D;--muted:#7B857F;--line:#E6ECE8;--page:#FFFFFF;
--mint:#E8F6EE;--soft:#FAFCFB;--green:#1E9E6A;--green-deep:#1E7C5A;--vivid:#22C177;
--coral:#FF5B3F;--coral-deep:#E8412A;--coral-shadow:rgba(255,91,63,.28);
color:var(--body);background:var(--page);font-size:17px;line-height:1.65}
.floowy-scraper h1,.floowy-scraper h2,.floowy-scraper h3,.floowy-scraper h4{color:var(--ink);line-height:1.15;margin:0}
.floowy-scraper section{padding:76px 20px}
.floowy-scraper .wrap{max-width:1120px;margin:0 auto}
.floowy-scraper .kicker{display:inline-block;font-size:12px;letter-spacing:.14em;font-weight:700;
color:var(--green);text-transform:uppercase;margin-bottom:14px}
.floowy-scraper h2{font-size:clamp(28px,3.6vw,42px);margin-bottom:16px}
.floowy-scraper .lede{font-size:19px;max-width:70ch;margin-bottom:34px}
.floowy-scraper .grid{display:grid;gap:22px}
.floowy-scraper .g2{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.floowy-scraper .g3{grid-template-columns:repeat(auto-fit,minmax(270px,1fr))}
.floowy-scraper .g4{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.floowy-scraper .card{background:var(--page);border:1px solid var(--line);border-radius:16px;
padding:26px;box-shadow:0 1px 2px rgba(14,26,20,.04)}
.floowy-scraper .card h3{font-size:19px;margin-bottom:8px}
.floowy-scraper .card p{margin:0;font-size:15.5px}
.floowy-scraper .btn{display:inline-flex;align-items:center;gap:9px;border-radius:12px;
padding:15px 26px;font-weight:700;font-size:16px;text-decoration:none;border:1px solid transparent}
.floowy-scraper .btn-primary{background:var(--coral);color:#fff;box-shadow:0 8px 22px var(--coral-shadow)}
.floowy-scraper .btn-primary:hover{background:var(--coral-deep)}
.floowy-scraper .btn-secondary{background:#fff;color:var(--ink);border-color:var(--line)}
.floowy-scraper .hero{background:var(--mint);padding:84px 20px 72px}
.floowy-scraper .hero h1{font-size:clamp(34px,5.4vw,60px);letter-spacing:-.02em}
.floowy-scraper .hero .green{color:var(--green)}
.floowy-scraper .hero .sub{font-size:19px;max-width:60ch;margin:22px 0 30px}
.floowy-scraper .ctas{display:flex;flex-wrap:wrap;gap:12px}
.floowy-scraper .trial{margin-top:18px;font-weight:700;color:var(--ink)}
.floowy-scraper .cancel{color:var(--muted);font-size:15px}
.floowy-scraper .trust{margin-top:26px;color:var(--muted);font-size:14px}
.floowy-scraper .figs{display:flex;flex-wrap:wrap;gap:34px;margin-top:40px}
.floowy-scraper .fig strong{display:block;font-size:30px;color:var(--ink);line-height:1.1}
.floowy-scraper .fig span{font-size:14px;color:var(--muted)}
.floowy-scraper .statsbar{background:var(--ink);color:#fff;padding:34px 20px}
.floowy-scraper .statsbar .wrap{display:flex;flex-wrap:wrap;gap:40px;justify-content:center;text-align:center}
.floowy-scraper .statsbar b{display:block;font-size:26px}
.floowy-scraper .statsbar span{font-size:14px;opacity:.75}
.floowy-scraper .soft{background:var(--soft)}
.floowy-scraper .callout{background:var(--mint);border-left:4px solid var(--green);
border-radius:0 12px 12px 0;padding:18px 22px;font-weight:600;color:var(--ink);margin-top:22px}
.floowy-scraper ul.ticks{list-style:none;padding:0;margin:14px 0 0}
.floowy-scraper ul.ticks li{display:flex;gap:10px;padding:7px 0;font-size:15.5px}
.floowy-scraper ul.ticks svg{width:17px;height:17px;color:var(--green);flex:none;margin-top:4px}
.floowy-scraper .deflist dt{font-weight:700;color:var(--ink)}
.floowy-scraper .deflist dd{margin:0 0 14px;font-size:15.5px}
.floowy-scraper table{width:100%;border-collapse:collapse;font-size:15px;background:#fff;
border:1px solid var(--line);border-radius:14px;overflow:hidden}
.floowy-scraper th,.floowy-scraper td{padding:13px 14px;text-align:left;border-bottom:1px solid var(--line)}
.floowy-scraper th{background:var(--soft);font-size:13.5px;color:var(--ink)}
.floowy-scraper td.us,.floowy-scraper th.us{background:var(--mint);font-weight:700;color:var(--ink)}
.floowy-scraper .tablewrap{overflow-x:auto}
.floowy-scraper details{border:1px solid var(--line);border-radius:12px;padding:18px 20px;background:#fff;margin-bottom:10px}
.floowy-scraper summary{cursor:pointer;font-weight:700;color:var(--ink);list-style:none}
.floowy-scraper summary::-webkit-details-marker{display:none}
.floowy-scraper details p{margin:12px 0 0;font-size:15.5px}
.floowy-scraper .final{background:var(--mint);text-align:center}
.floowy-scraper .final .ctas{justify-content:center}
.floowy-scraper .shot{border:1px dashed var(--line);border-radius:14px;background:var(--soft);
padding:30px;color:var(--muted);font-size:13.5px;text-align:center}
.report-viewer{margin-top:38px}
.rv-head h3{font-size:22px;margin-bottom:6px}
.rv-head p{margin:0 0 20px;color:var(--muted);font-size:15.5px}
.rv-cards{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
.rv-card{display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left;
background:#fff;border:1px solid #E6ECE8;border-radius:16px;padding:24px;cursor:pointer;font:inherit}
.rv-card:hover{border-color:#1E9E6A;box-shadow:0 8px 24px rgba(14,26,20,.07)}
.rv-kicker{font-size:11.5px;letter-spacing:.14em;font-weight:700;color:#1E9E6A}
.rv-cover{display:flex;align-items:center;justify-content:center;width:100%;height:120px;
background:#E8F6EE;border-radius:12px;color:#1E7C5A;margin:6px 0 10px}
.rv-cover svg{width:34px;height:34px}
.rv-name{font-size:19px;font-weight:700;color:#0E1A14}
.rv-desc{font-size:15px;color:#48544D}
.rv-meta{font-size:13px;color:#7B857F}
.rv-open{display:inline-flex;align-items:center;gap:5px;color:#1E9E6A;font-weight:700;font-size:15px;margin-top:6px}
.rv-open svg{width:15px;height:15px}
.rv-overlay{position:fixed;inset:0;background:rgba(14,26,20,.55);z-index:90;display:flex;
align-items:center;justify-content:center;padding:24px}
.rv-doc{background:#fff;border-radius:16px;width:min(820px,100%);max-height:88vh;display:flex;flex-direction:column}
.rv-doc-head{display:flex;align-items:center;justify-content:space-between;gap:16px;
padding:18px 22px;border-bottom:1px solid #E6ECE8}
.rv-doc-head strong{display:block;font-size:19px;color:#0E1A14}
.rv-doc-head button{background:none;border:none;cursor:pointer;color:#48544D;padding:6px}
.rv-doc-body{overflow-y:auto;padding:6px 22px 26px}
.rv-page{padding:22px 0;border-bottom:1px solid #F0F4F2}
.rv-page-n{font-size:12px;color:#7B857F;margin-bottom:6px}
.rv-page h4{font-size:18px;margin-bottom:10px}
.rv-page p{margin:0 0 9px;font-size:15px;color:#48544D}
@media(max-width:640px){.floowy-scraper section{padding:56px 18px}
.rv-overlay{padding:0}.rv-doc{max-height:100vh;border-radius:0;height:100%}}
`;

const Shot = ({ alt }: { alt: string }) => (
  // Screenshot slot. The brief calls for real product screenshots in every
  // block — "show the product, not a metaphor for the product" — and lists the
  // exact frame and alt text per block. They are not delivered yet, so these
  // render as labelled slots carrying the specified alt text rather than as
  // broken images or stock illustrations.
  <div className="shot" role="img" aria-label={alt}>Screenshot: {alt}</div>
);

const SocialMediaScraper = () => (
  <>
    <MetaTags
      title="Social Media Scraper for TikTok & Ads Research | Floowy AI"
      description="Scrape TikTok, Instagram and competitor ads. Every post scored and analysed, with a scraper report and content plan. Start for €1."
      keywords="social media scraper, tiktok scraper, instagram scraper, meta ads scraper, competitor ad research, social media content plan, organic social media strategy, viral content analysis, social media insights"
      canonicalUrl="https://floowy.ai/social-media-scraper"
    />
    <StructuredData type="software" data={{
      name: "Floowy Social Scraper",
      url: "https://floowy.ai/social-media-scraper",
      description: "Scrape TikTok, Instagram, Facebook posts and Meta ads. Every post scored for virality and analysed, with a scraper report and content plan.",
      price: "1", currency: "EUR", offerDescription: "€1 for your first 3 days",
    }} />
    <StructuredData type="faq" faqs={FAQS} />
    <StructuredData type="breadcrumb" breadcrumbs={[
      { name: "Floowy", url: "https://floowy.ai" },
      { name: "Social Media Scraper", url: "https://floowy.ai/social-media-scraper" },
    ]} />

    <Navigation />
    <style>{CSS}</style>

    <div className="floowy-scraper">
      {/* 1 — Hero */}
      <header className="hero">
        <div className="wrap grid g2" style={{ alignItems: "center" }}>
          <div>
            <h1>Social Media Scraper That Ends With<br /><span className="green">Your Content Plan</span></h1>
            <p className="sub">Scrape TikTok, Instagram, Facebook and Meta ads by keyword, hashtag or account. Floowy scores every post for virality, explains why it worked, reads the comments, and turns all of it into a scraper report and a content plan you can produce this week.</p>
            <div className="ctas">
              <Link className="btn btn-primary" to={CTA_PRIMARY}><Sparkles aria-hidden />Start for €1</Link>
              <Link className="btn btn-secondary" to={CTA_SECONDARY}><Mail aria-hidden />Book a Call</Link>
            </div>
            <p className="trial">€1 for your first 3 days</p>
            <p className="cancel">Cancel anytime</p>
            <p className="trust">Trusted by 1000+ brands with €10m in revenue</p>
          </div>
          <div>
            <Shot alt="Social media scraper dashboard showing virality scores and hook analysis" />
            <div className="figs">
              <div className="fig"><strong>10x</strong><span>faster content research</span></div>
              <div className="fig"><strong>4</strong><span>platforms, organic and ads</span></div>
              <div className="fig"><strong>€2K–€10K</strong><span>/month saved on research and tools</span></div>
            </div>
          </div>
        </div>
      </header>

      {/* 2 — Stats bar */}
      <div className="statsbar">
        <div className="wrap">
          <div><b>4</b><span>platforms</span></div>
          <div><b>2M+</b><span>posts analysed</span></div>
          <div><b>Every project</b><span>ends in a report and a content plan</span></div>
        </div>
      </div>

      {/* 3 — Report + content plan. The core promise, kept high on the page. */}
      <section>
        <div className="wrap">
          <span className="kicker">The output</span>
          <h2>Every scrape ends in a report and a content plan</h2>
          <p className="lede">Most scrapers hand you a CSV and wish you luck. Floowy takes everything the scrape collected, the posts, the scores, the hooks, the comments, the ads, and turns it into the two documents you actually needed in the first place.</p>
          <div className="grid g2">
            <div className="card">
              <h3>The scraper report</h3>
              <p>A readable analysis of your category, built from the full dataset:</p>
              <ul className="ticks">
                {["What performed and what didn't, ranked by virality score",
                  "The hooks and openings that keep winning",
                  "Which formats and content types earn views in your niche",
                  "What competitors are running, organically and in ads",
                  "What the audience praises, questions and complains about in the comments",
                  "The gaps: angles nobody is using yet"].map((l) => (
                  <li key={l}><Check aria-hidden />{l}</li>))}
              </ul>
              <p style={{ marginTop: 14, fontWeight: 600 }}>Client-ready. Forward it as-is.</p>
            </div>
            <div className="card">
              <h3>The content plan</h3>
              <p>The same data, turned into a production schedule:</p>
              <ul className="ticks">
                {["Concrete concepts, not vague themes",
                  "The exact hook and format per concept, taken from what already works",
                  "Platform and posting cadence",
                  "Every concept linked back to the posts it came from, so you can prove why it's on the list"].map((l) => (
                  <li key={l}><Check aria-hidden />{l}</li>))}
              </ul>
              <p style={{ marginTop: 14, fontWeight: 600 }}>Send any concept straight into Creator Studio or Ads Studio and produce it.</p>
            </div>
          </div>
          <div className="callout">One client took a single concept from their content plan, produced it as an AI video in Floowy, and hit 30,000 views on that one video.</div>
          <ReportViewer />
          <div className="ctas" style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" to={CTA_PRIMARY}><Sparkles aria-hidden />See a sample report</Link>
          </div>
        </div>
      </section>

      {/* 4 — Definition. GEO anchor: opens literally with the term. */}
      <section className="soft">
        <div className="wrap">
          <h2>What is a social media scraper?</h2>
          <p className="lede">A social media scraper is a tool that automatically collects publicly available data from social platforms, such as posts, captions, hashtags, view counts, engagement and ads, and turns it into a structured dataset you can analyse.</p>
          <p className="lede">Floowy is a social media scraper built for marketers, not developers. There's no API key and no code. You create a project, tell Floowy which keywords, hashtags or accounts to track, and it collects the content, scores it, analyses it with AI, and delivers a report and a content plan.</p>
          <div className="callout">Traditional scrapers stop at the data. Floowy starts there.</div>
        </div>
      </section>

      {/* 5 — How it works */}
      <section>
        <div className="wrap">
          <h2>How it works</h2>
          <div className="grid g4" style={{ marginTop: 26 }}>
            {STEPS.map((s) => (
              <div className="card" key={s.n}>
                <span className="kicker">{s.n}</span>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>))}
          </div>
          <div style={{ marginTop: 26 }}><Shot alt="Creating a scrape project in Floowy" /></div>
        </div>
      </section>

      {/* 6 — Platforms and sources */}
      <section className="soft">
        <div className="wrap">
          <h2>What can you scrape?</h2>
          <p className="lede">Four sources, two content types, one project setup.</p>
          <div className="grid g4">
            {PLATFORMS.map((p) => (
              <div className="card" key={p.h}><h3>{p.h}</h3><p>{p.p}</p></div>))}
          </div>
          <p className="trust" style={{ marginTop: 22 }}>Keywords · Hashtags · Account usernames · Niche · Filter by period and country</p>
          <div style={{ marginTop: 22 }}><Shot alt="Scrape TikTok, Instagram, Facebook and Meta ads" /></div>
        </div>
      </section>

      {/* 7 — Organic social. Comes before ads: bigger audience, broader intent. */}
      <section>
        <div className="wrap">
          <span className="kicker">Organic social</span>
          <h2>Build an organic content calendar that isn't guesswork</h2>
          <p className="lede">Ad research gets all the attention, but the harder question is what to post on Monday when nobody is paying for reach. Organic is where the guessing really happens: you pick a hook because it feels right, post it, and find out a week later.</p>
          <p className="lede">Floowy scrapes the organic side of your category the same way it scrapes ads. Every TikTok, Reel and post that matches your keywords, hashtags or competitor accounts, scored, analysed and turned into a plan.</p>
          <div className="grid g2">
            {ORGANIC.map((c) => (<div className="card" key={c.h}><h3>{c.h}</h3><p>{c.p}</p></div>))}
          </div>
          <div className="callout">Organic and paid in one project. Organic tells you what an audience wants to watch. Ads tell you what a competitor is willing to pay to show them.</div>
          <div style={{ marginTop: 22 }}><Shot alt="TikTok scraper results sorted by virality score" /></div>
        </div>
      </section>

      {/* 8 — Ads. Equal visual weight to block 7. */}
      <section className="soft">
        <div className="wrap">
          <span className="kicker">Ads</span>
          <h2>Scrape competitor ads, not just their organic posts</h2>
          <p className="lede">Every serious competitor is spending money somewhere, and those ads are public. Switch a project's source from Posts to Ads and Floowy pulls competitor advertising from Meta's public ad library, then runs the same analysis it runs on organic content: what the hook is, what the angle is, why it works and how to build your own version.</p>
          <div className="grid g3">
            {ADS.map((c) => (<div className="card" key={c.h}><h3>{c.h}</h3><p>{c.p}</p></div>))}
          </div>
          <div style={{ marginTop: 22 }}><Shot alt="Meta ads scraper showing competitor ad analysis" /></div>
        </div>
      </section>

      {/* 9 — The data you get */}
      <section>
        <div className="wrap">
          <h2>The numbers behind every post</h2>
          <p className="lede">Every scrape gives you a sortable table of everything it collected, with the metrics that decide whether a piece of content is worth studying.</p>
          <p className="trust">Plays · Likes · Comments · Shares · Virality score · Author · Post date · Total plays across the project</p>
          <div className="callout">Floowy scores every post from 0 to 100 based on how it performed relative to its reach. Raw view counts flatter big accounts. The virality score shows you what actually resonated.</div>
          <p className="lede" style={{ marginTop: 22 }}>Sort by any column, select the posts you want to dig into, and export everything to CSV or JSON whenever you need it in your own stack.</p>
          <Shot alt="Social media scraper data table with engagement metrics and CSV export" />
        </div>
      </section>

      {/* 10 — Post analysis */}
      <section className="soft">
        <div className="wrap">
          <span className="kicker">AI analysis</span>
          <h2>Why did this one work?</h2>
          <p className="lede">The hard part isn't finding the viral video. It's explaining why it went viral, well enough that you can do it again. Floowy does that per post.</p>
          <div className="grid g2">
            <dl className="deflist">
              {ANALYSIS.map(([t, d]) => (
                <div key={t}><dt>{t}</dt><dd>{d}</dd></div>))}
            </dl>
            <Shot alt="AI analysis of a viral TikTok post showing hook and replication tips" />
          </div>
        </div>
      </section>

      {/* 11 — Comment analysis */}
      <section>
        <div className="wrap">
          <span className="kicker">AI analysis</span>
          <h2>Read the comments at scale</h2>
          <p className="lede">The comment section is the fastest source of customer language you will ever get, and nobody has time to read it. Floowy analyses comments per post and hands you what people actually said.</p>
          <div className="grid g2">
            <dl className="deflist">
              {COMMENTS.map(([t, d]) => (
                <div key={t}><dt>{t}</dt><dd>{d}</dd></div>))}
            </dl>
            <Shot alt="Comment sentiment analysis with common audience questions" />
          </div>
          <div className="callout">Those questions become hooks, FAQ content, ad copy and product page answers. Most brands guess at their audience's objections. This hands them over.</div>
        </div>
      </section>

      {/* 12 — From plan to content */}
      <section className="soft">
        <div className="wrap">
          <h2>The only scraper that finishes the job</h2>
          <p className="lede">Floowy is a content platform, not a data vendor. Research and production live in the same place.</p>
          <div className="grid g4">
            {[["Social Scraper", "finds what works and explains why"],
              ["Creator Studio", "turns concepts into product visuals and video"],
              ["Ads Studio", "turns winning angles into ad creatives and variations"],
              ["Listing Studio", "applies the same insights to your product pages"]].map(([h, p]) => (
              <div className="card" key={h}><h3>{h}</h3><p>{p}</p></div>))}
          </div>
          <div className="callout">No handovers, no re-briefing, nothing lost between the report and the post.</div>
          <div style={{ marginTop: 22 }}><Shot alt="From content plan to finished AI creative" /></div>
        </div>
      </section>

      {/* 13 — Use cases */}
      <section>
        <div className="wrap">
          <h2>Who uses it</h2>
          <div className="grid g2" style={{ marginTop: 24 }}>
            {USE_CASES.map((c) => (<div className="card" key={c.h}><h3>{c.h}</h3><p>{c.p}</p></div>))}
          </div>
        </div>
      </section>

      {/* 14 — Comparison */}
      <section className="soft">
        <div className="wrap">
          <h2>Floowy vs the alternatives</h2>
          <div className="tablewrap" style={{ marginTop: 24 }}>
            <table>
              <thead><tr>
                <th />
                <th>Manual research</th><th>Scraper APIs</th><th>Ad spy tools</th><th className="us">Floowy</th>
              </tr></thead>
              <tbody>
                {COMPARISON.map(([label, a, b, c, us]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th><td>{a}</td><td>{b}</td><td>{c}</td><td className="us">{us}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
          <p className="lede" style={{ marginTop: 20 }}>Scraper APIs are excellent at collecting data. They just leave the hardest part, deciding what to do with it, to you.</p>
        </div>
      </section>

      {/* 15 — Compliance */}
      <section>
        <div className="wrap">
          <h2>Public data, collected responsibly</h2>
          <p className="lede">Floowy only collects data that is publicly visible: public posts, public profiles, public comments and official advertising transparency sources. We don't access private accounts, we don't scrape personal contact details, and we don't build profiles of individuals.</p>
          <p className="lede">Analysis is aggregated around content and performance patterns, not people. Everything is handled in line with GDPR and stored within the EU.</p>
        </div>
      </section>

      {/* 16 — FAQ. Mirrors the FAQPage schema emitted above. */}
      <section className="soft">
        <div className="wrap">
          <h2>Frequently asked questions</h2>
          <div style={{ marginTop: 24 }}>
            {FAQS.map((f) => (
              <details key={f.question}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>))}
          </div>
        </div>
      </section>

      {/* 17 — Final CTA */}
      <section className="final">
        <div className="wrap">
          <h2>Stop guessing what to post</h2>
          <p className="lede" style={{ margin: "0 auto 30px" }}>Give Floowy your competitors, your keywords and your niche. Get back a report that explains what works in your category, and a content plan you can start producing today.</p>
          <div className="ctas">
            <Link className="btn btn-primary" to={CTA_PRIMARY}><Sparkles aria-hidden />Start for €1</Link>
            <Link className="btn btn-secondary" to={CTA_SECONDARY}><Mail aria-hidden />Book a Call</Link>
          </div>
          <p className="cancel" style={{ marginTop: 16 }}>€1 for your first 3 days. Cancel anytime.</p>
        </div>
      </section>
    </div>

    <Footer />
  </>
);

export default SocialMediaScraper;
