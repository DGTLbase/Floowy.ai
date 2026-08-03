// Dutch "Social media scraper" landing page (briefing 07 · Scraper landing page).
//
// A dedicated, fully-Dutch funnel page built entirely around the social media
// scraper: scrape → score per post → kant-en-klaar contentplan + inzichtenrapport.
// One conversion action, repeated everywhere: "Start voor €1".
//
// Built on our existing funnel-landing pattern (same approach as AdsLandingPage):
// a self-contained, scoped-CSS block (.floowy-scr) so it renders identically and
// fast, reusing our real brand assets (logos, press, industry covers), the real
// €1 offer wiring (EURO1_OFFER), and our price/credit source of truth
// (SUBSCRIPTION_PLANS). Coral (#FF5B3F) is used ONLY on the €1 CTAs and the
// Starter best-value card; everything else is Floowy green / neutral.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PricingSection from "@/components/PricingSection";

import logoShopify from "@/assets/logo-shopify.svg";
import logoWelhof from "@/assets/logo-welhof.png";
import logoMarcels from "@/assets/logo-marcels.png";
import logoCurly from "@/assets/logo-curlygirl.png";
import logoCetaphil from "@/assets/logo-cetaphil.png";
import logoIcon from "@/assets/logo-icon-amsterdam.png";
import logoLoth from "@/assets/logo-loth-fabenim.png";
import logoNimani from "@/assets/logo-nimani.png";
import pressRtl from "@/assets/press-rtl.png";
import pressVideoland from "@/assets/press-videoland.png";
import pressEmerce from "@/assets/press-emerce.png";
import indFashion from "@/assets/industry-fashion.jpg";
import indEcom from "@/assets/industry-electronics.jpg";
import indRetail from "@/assets/industry-home.jpg";

const YT_ID = "DB9Lrxx7rhs";

const TRUST = [
  { src: logoIcon, alt: "ICON Amsterdam" },
  { src: logoCetaphil, alt: "Cetaphil" },
  { src: logoMarcels, alt: "Marcel's Green Soap" },
  { src: logoCurly, alt: "Curly Girl Movement" },
  { src: logoWelhof, alt: "Welhof" },
  { src: logoNimani, alt: "Nimani" },
  { src: logoLoth, alt: "LOTH · Fabenim" },
];

const STEPS = [
  { n: "1", h: "Scrapen", p: "De scraper analyseert TikTok, Instagram en Facebook in jouw markt." },
  { n: "2", h: "Score per post", p: "Elke post krijgt een score. Je ziet welke content, hoek en format al scoort." },
  { n: "3", h: "Contentplan + rapport", p: "Uit de data rolt een kant-en-klaar contentplan en inzichtenrapport, waar je direct je volgende video's uit maakt." },
];

const INDUSTRIES = [
  { img: indFashion, label: "Fashion", h: "Fashion", p: "Data-gedreven content voor fashion-merken die snel schakelen." },
  { img: indEcom, label: "E-Commerce", h: "E-Commerce", p: "Online merken groeien sneller als content geen bottleneck meer is." },
  { img: indRetail, label: "Retail", h: "Retail", p: "Retailers groeien sneller als elk product eruitziet alsof het verkoopt." },
];

// `knockout: true` = the artwork is already light-on-dark, so it must NOT get
// the white-out filter. Welhof is a white wordmark inside a black ellipse:
// brightness(0) + invert(1) would flatten the whole logo into a white blob and
// swallow the wordmark. Marcel's and ICON are black-on-transparent and do need
// the filter to read on the dark gradients.
const CASES = [
  { logo: logoWelhof, grad: "cwelhof", name: "Welhof", slug: "welhof", knockout: true, blurb: "Hogere conversie met AI-gegenereerde sfeerbeelden.", metrics: ["+22% conversie", "+22% orders", "+40% ROAS"] },
  { logo: logoMarcels, grad: "cmarcel", name: "Marcel's Green Soap", slug: "marcels-green-soap", knockout: false, blurb: "On-brand content in-house schalen, van refill-uitleg tot landelijke campagnes.", metrics: ["+36% contentoutput", "-60% productiekosten", "+28% engagement"] },
  { logo: logoIcon, grad: "cicon", name: "ICON Amsterdam", slug: "icon-amsterdam", knockout: false, blurb: "Schaalt on-brand ad-creatives met Floowy.ai, zonder fotoshoots.", metrics: ["-72% productiekosten", "+90% snellere flatlays", "+75% tijd bespaard"] },
];

const REVIEWS = [
  { q: "Floowy helpt ons ad-creatives sneller schalen dan ooit. In plaats van designers briefen voor elke wijziging testen we direct meerdere varianten.", who: "Simon", role: "Digital Marketing Manager bij ReloadBase" },
  { q: "Ik was sceptisch, maar het levert hoogwaardige creatives, is makkelijk in gebruik en helpt ons sneller lanceren zonder in te leveren op kwaliteit.", who: "Erik", role: "Online Marketer bij Welhof" },
  { q: "Een gamechanger voor onze bol.com-listings. Beeld in minuten en de consistentie verbeterde onze conversie merkbaar.", who: "Dirk", role: "Founder bij iCon" },
];

const FAQS = [
  { q: "Wat is de Floowy social media scraper?", a: "Een tool die TikTok, Instagram en Facebook analyseert en elke post een score geeft, zodat je vóór productie al weet welke content, hoek en format scoort.", open: true },
  { q: "Welke platforms scrapet Floowy?", a: "TikTok, Instagram en Facebook. Uit de data rolt een kant-en-klaar contentplan en inzichtenrapport." },
  { q: "Hoe werkt het €1-aanbod?", a: "Je start elk plan 3 dagen voor €1. Daarna verlengt het tegen de planprijs. Je kunt vóór verlenging altijd opzeggen." },
  { q: "Krijg ik ook een contentplan?", a: "Ja. Op basis van alle gescrapete data krijg je een contentplan en inzichtenrapport waar je meteen je volgende video's uit maakt." },
  { q: "Kan ik altijd opzeggen?", a: "Ja, er is geen lock-in. Opzeggen kan met een paar klikken vanuit je account." },
];

// Live €1-offer countdown (own storage key, 3-day window) → "DD:HH:MM:SS".
function useOfferCountdown() {
  const [txt, setTxt] = useState("03:00:00:00");
  useEffect(() => {
    const KEY = "floowy_scraper_offer_deadline";
    let end = Number(localStorage.getItem(KEY));
    if (!end || end < Date.now()) {
      end = Date.now() + 3 * 24 * 3600 * 1000;
      localStorage.setItem(KEY, String(end));
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setTxt(`${pad(Math.floor(s / 86400))}:${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return txt;
}

export default function ScraperLandingPage() {
  const clock = useOfferCountdown();
  const [videoOn, setVideoOn] = useState(false);
  const scrolledMeta = useRef(false);

  useEffect(() => {
    if (scrolledMeta.current) return;
    scrolledMeta.current = true;
    document.title = "Floowy · De social media scraper — weet wat werkt voor €1";
  }, []);

  return (
    <>
      {/* Site-wide header/navigation (same as /google-ads and the rest of the
          site). Rendered OUTSIDE .floowy-scr — the scoped reset zeroes every
          margin/padding and would wipe its Tailwind styling. */}
      <Navigation />
    <div className="floowy-scr">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* HERO */}
      <header className="hero">
        <div className="wrap">
          <div className="offerpill">Launch aanbod · €1 · eindigt over <span className="clock">{clock}</span></div>
          <div className="heyebrow">De social media scraper voor marketeers, creators &amp; agencies</div>
          <h1>Gok niet met je content. <span className="g">Weet wat werkt.</span></h1>
          <p className="lead">De social media scraper van Floowy laat zien wat scoort op TikTok, Instagram en Facebook. Elke post krijgt een score, dus je weet precies welke content, welke hoek en welk format werkt. Nog voor je eerste euro is uitgegeven.</p>
          <div className="benefits">
            <span className="b">⚡ Score per post</span>
            <span className="b">▶ TikTok · Instagram · Facebook</span>
            <span className="b">✓ Contentplan + rapport</span>
          </div>
          <div className="herocta"><a href="#pricing" className="cta">Start voor €1</a></div>

          {/* AUTHORITY BAR */}
          <div className="authbar">
            <div className="authpill">
              <span className="al">Bekend van</span>
              <img className="alogo" src={pressRtl} alt="RTL" />
              <span className="adiv" />
              <img className="alogo" src={pressVideoland} alt="Videoland" />
              <span className="adiv" />
              <img className="alogo emerce" src={pressEmerce} alt="Emerce 100" />
            </div>
          </div>
        </div>
      </header>

      {/* TRUST STRIP */}
      <div className="trustbar">
        <div className="wrap">
          <div className="inner">
            <div className="head"><img className="shopify" src={logoShopify} alt="Shopify" /> Vertrouwd door 1000+ merken met €10m omzet</div>
          </div>
          <div className="marquee">
            <div className="track">
              {[...TRUST, ...TRUST].map((l, i) => (
                <img key={i} src={l.src} alt={l.alt} className="tlogo" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HOE HET WERKT */}
      <section>
        <div className="wrap">
          <div className="eyebrow">Hoe het werkt</div>
          <h2>Data, <span className="g">geen onderbuikgevoel</span></h2>
          <p className="sub">Voordat je ook maar iets maakt, laat de scraper al zien wat werkt in jouw niche.</p>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}><div className="n">{s.n}</div><h3>{s.h}</h3><p>{s.p}</p></div>
            ))}
          </div>
          <p className="payoff">Geen giswerk. Geen weken wachten op resultaat.</p>
        </div>
      </section>

      {/* WAAROM FLOOWY */}
      <section className="softbg">
        <div className="wrap">
          <div className="why">
            <h2>Waarom grote merken kiezen voor <span className="mint">Floowy</span></h2>
            <p>Grote merken vertrouwen hun content niet zomaar aan wie dan ook toe. Ze kiezen Floowy omdat het geen losse AI-tool is. Het is gebouwd vanuit meer dan tien jaar marketingexpertise, kennis van fotografie en AI. Zo schaal je je content net zo hard als meerdere 7-figure brands.</p>
            <div className="whytags">
              <span>10+ jaar marketingexpertise</span>
              <span>Kennis van fotografie</span>
              <span>AI die weet wat werkt</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI STORM VIDEO — lazy click-to-load (protects LCP) */}
      <section>
        <div className="wrap">
          <div className="eyebrow">Gezien bij AI Storm</div>
          <h2>Floowy op het podium bij <span className="g">AI Storm</span></h2>
          <p className="sub">We deelden ons verhaal over data-gedreven content op AI Storm. Bekijk het hier.</p>
          <div className="videowrap">
            <div className="ratio">
              {videoOn ? (
                <iframe
                  src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0`}
                  title="Floowy bij AI Storm"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button className="vfacade" onClick={() => setVideoOn(true)} aria-label="Speel de AI Storm video af">
                  <img src={`https://i.ytimg.com/vi/${YT_ID}/hqdefault.jpg`} alt="Floowy bij AI Storm" loading="lazy" decoding="async" />
                  <span className="vplay">▶</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="softbg">
        <div className="wrap">
          <div className="eyebrow">Gebouwd voor jouw branche</div>
          <h2>Merken zoals die van jou, <span className="g">data-gedreven</span></h2>
          <p className="sub">Ontdek hoe merken in jouw branche Floowy gebruiken om content te maken die scoort.</p>
          <div className="inds">
            {INDUSTRIES.map((it) => (
              <div className="ind" key={it.label}>
                <div className="top" style={{ backgroundImage: `url(${it.img})` }}><span>{it.label.toUpperCase()}</span></div>
                <div className="body">
                  <div className="lbl">Branche</div>
                  <h3>{it.h}</h3>
                  <p>{it.p}</p>
                  <a href="#pricing">Ontdek →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASES */}
      <section>
        <div className="wrap">
          <div className="eyebrow">Klantcases</div>
          <h2>Echte merken, <span className="g">echte cijfers</span></h2>
          <div className="cases">
            {CASES.map((c) => (
              <Link className="case" to={`/cases/${c.slug}`} key={c.name} aria-label={`Bekijk de case van ${c.name}`}>
                <div className={`top ${c.grad}`}><img className={c.knockout ? "asis" : undefined} src={c.logo} alt={c.name} /></div>
                <div className="cbody">
                  <h3>{c.name}</h3>
                  <p>{c.blurb}</p>
                  <div className="metrics">{c.metrics.map((m) => <div className="pill" key={m}>{m}</div>)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="reviews">
        <div className="wrap">
          <div className="eyebrow">Reviews</div>
          <h2>De resultaten spreken <span className="g">voor zich</span></h2>
          <div className="score">4.7<span className="stars">★★★★★</span><small>uit 5</small></div>
          <p className="sub">Honderden merken schalen hun content op data in plaats van onderbuikgevoel. Dit is wat ze over Floowy zeggen.</p>
          <div className="quotes">
            {REVIEWS.map((r) => (
              <div className="quote" key={r.who}>
                <div className="st">★★★★★</div>
                <p>“{r.q}”</p>
                <div className="who"><b>{r.who}</b>{r.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close the scoped wrapper so the shared PricingSection renders with the
          current-tier Tailwind styling (its CSS reset would otherwise wipe it). */}
      </div>

      {/* PRICING — the current tiers UI (shared component), Dutch heading. Its
          plan CTAs already drive the €1 offer, so the single conversion action
          is preserved. */}
      <div id="pricing" className="bg-background">
        <PricingSection
          title={<>Begin binnen <span className="text-primary">enkele minuten</span></>}
          subtitle="Probeer elk plan 3 dagen voor €1. Daarna vanaf €19 per maand, of zeg met één klik op."
        />
      </div>

      <div className="floowy-scr">
      {/* FAQ */}
      <section className="softbg">
        <div className="wrap">
          <div className="eyebrow">Goed om te weten</div>
          <h2>Veelgestelde <span className="g">vragen</span></h2>
          <div className="faq">
            {FAQS.map((f) => (
              <details key={f.q} open={f.open}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="wrap">
          <div className="final">
            <h2>Waar wacht je op?</h2>
            <p>Geen giswerk, geen weken wachten. Weet wat werkt en schaal je content op data.</p>
            <a href="#pricing" className="cta">Start vandaag voor €1</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">© 2026 Floowy.ai &nbsp;·&nbsp; <Link to="/privacy-policy">Privacy</Link> <Link to="/terms-conditions">Voorwaarden</Link></div>
      </footer>
    </div>
    </>
  );
}

const CSS = `
.floowy-scr{--ink:#0E1A14;--body:#48544D;--muted:#7B857F;--line:#E6ECE8;--page:#fff;--mint:#E8F6EE;--soft:#FAFCFB;--green:#1E9E6A;--green-deep:#1E7C5A;--vivid:#22C177;--green-timer:#1E7150;--coral:#FF5B3F;--coral-deep:#E8412A;--coral-soft:#FFF1EE;--coral-shadow:rgba(255,91,63,.28);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--page);color:var(--ink);-webkit-font-smoothing:antialiased;line-height:1.5;}
.floowy-scr *{box-sizing:border-box;margin:0;padding:0;}
.floowy-scr .wrap{max-width:1080px;margin:0 auto;padding:0 24px;}
.floowy-scr h2{font-size:30px;font-weight:800;letter-spacing:-.8px;text-align:center;line-height:1.15;}
.floowy-scr h2 .g,.floowy-scr .g{color:var(--green);}
.floowy-scr .mint{color:#CFFFE5;}
.floowy-scr .sub{text-align:center;color:var(--body);font-size:15px;max-width:620px;margin:12px auto 0;}
.floowy-scr section{padding:56px 0;}
.floowy-scr .softbg{background:var(--soft);}
.floowy-scr .eyebrow{text-align:center;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:10px;}
.floowy-scr .cta{display:inline-block;background:var(--coral);color:#fff;font-weight:700;font-size:16px;border:none;border-radius:12px;padding:15px 34px;cursor:pointer;text-decoration:none;box-shadow:0 10px 22px var(--coral-shadow);transition:transform .15s ease,box-shadow .15s ease;}
.floowy-scr .cta:hover{transform:translateY(-2px);box-shadow:0 14px 28px var(--coral-shadow);background:var(--coral-deep);}
.floowy-scr .hero{background:linear-gradient(180deg,var(--mint),#fff);padding:26px 0 50px;text-align:center;}
.floowy-scr .offerpill{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #C7E6D4;border-radius:999px;padding:7px 14px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--green-deep);margin-bottom:18px;}
.floowy-scr .offerpill .clock{color:var(--green-timer);font-variant-numeric:tabular-nums;}
.floowy-scr .offerpill::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--coral);}
.floowy-scr .heyebrow{font-size:12px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:var(--green);margin-bottom:12px;}
.floowy-scr h1{font-size:46px;font-weight:800;letter-spacing:-1.6px;line-height:1.06;max-width:780px;margin:0 auto;}
.floowy-scr h1 .g{color:var(--green);}
.floowy-scr .hero p.lead{font-size:17px;color:var(--body);max-width:640px;margin:16px auto 0;}
.floowy-scr .benefits{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px;}
.floowy-scr .benefits .b{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #C7E6D4;color:var(--green-deep);font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;}
.floowy-scr .herocta{margin-top:24px;}
.floowy-scr .authbar{padding:26px 0 0;text-align:center;}
.floowy-scr .authpill{display:inline-flex;align-items:center;gap:16px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 20px;box-shadow:0 4px 14px rgba(14,26,20,.06);}
.floowy-scr .authpill .al{font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);}
.floowy-scr .authpill .alogo{height:22px;width:auto;display:block;object-fit:contain;}
.floowy-scr .authpill .alogo.emerce{height:26px;}
.floowy-scr .authpill .adiv{width:1px;height:20px;background:var(--line);}
.floowy-scr .trustbar{background:var(--mint);padding:22px 0;overflow:hidden;}
.floowy-scr .trustbar .inner{display:flex;align-items:center;justify-content:center;gap:26px;flex-wrap:wrap;}
.floowy-scr .trustbar .head{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:600;color:var(--body);}
.floowy-scr .trustbar .shopify{height:22px;width:auto;}
.floowy-scr .marquee{position:relative;margin-top:16px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);}
.floowy-scr .track{display:flex;align-items:center;gap:52px;width:max-content;animation:floowyscr-scroll 30s linear infinite;}
.floowy-scr .tlogo{height:30px;width:auto;opacity:.75;filter:grayscale(1);flex:0 0 auto;}
@keyframes floowyscr-scroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}
.floowy-scr .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:920px;margin:34px auto 0;}
.floowy-scr .step{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;}
.floowy-scr .step .n{width:34px;height:34px;border-radius:10px;background:var(--mint);color:var(--green-deep);font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px;margin-bottom:14px;}
.floowy-scr .step h3{font-size:17px;font-weight:700;margin-bottom:5px;}
.floowy-scr .step p{font-size:14px;color:var(--body);}
.floowy-scr .payoff{text-align:center;font-size:16px;font-weight:600;margin-top:26px;color:var(--ink);}
.floowy-scr .why{background:linear-gradient(120deg,var(--green-deep),var(--vivid));border-radius:24px;color:#fff;padding:44px 40px;max-width:1000px;margin:0 auto;}
.floowy-scr .why h2{color:#fff;text-align:left;}
.floowy-scr .why p{color:#E4F6EC;font-size:15.5px;line-height:1.6;margin-top:14px;max-width:640px;}
.floowy-scr .whytags{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;}
.floowy-scr .whytags span{background:rgba(255,255,255,.16);border-radius:999px;padding:9px 16px;font-size:13.5px;font-weight:600;}
.floowy-scr .videowrap{max-width:860px;margin:30px auto 0;}
.floowy-scr .ratio{position:relative;width:100%;padding-top:56.25%;border-radius:18px;overflow:hidden;box-shadow:0 16px 44px rgba(14,26,20,.14);background:#000;}
.floowy-scr .ratio iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
.floowy-scr .vfacade{position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;cursor:pointer;background:#000;display:block;}
.floowy-scr .vfacade img{width:100%;height:100%;object-fit:cover;display:block;opacity:.86;transition:opacity .2s;}
.floowy-scr .vfacade:hover img{opacity:1;}
.floowy-scr .vplay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:66px;height:66px;border-radius:50%;background:var(--coral);color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px var(--coral-shadow);padding-left:4px;}
.floowy-scr .inds{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1000px;margin:34px auto 0;}
.floowy-scr .ind{border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#fff;}
.floowy-scr .ind .top{height:200px;position:relative;background-size:cover;background-position:center;}
.floowy-scr .ind .top::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,26,20,.15),rgba(14,26,20,.45));}
.floowy-scr .ind .top span{position:absolute;left:14px;top:14px;z-index:1;font-size:12px;font-weight:800;color:rgba(255,255,255,.95);letter-spacing:1px;}
.floowy-scr .ind .body{padding:18px 20px 22px;}
.floowy-scr .ind .lbl{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--green);}
.floowy-scr .ind h3{font-size:19px;font-weight:700;margin:5px 0 6px;}
.floowy-scr .ind p{font-size:13.5px;color:var(--body);min-height:40px;}
.floowy-scr .ind a{display:inline-flex;align-items:center;gap:7px;margin-top:12px;background:var(--green);color:#fff;font-size:13px;font-weight:700;padding:9px 16px;border-radius:10px;text-decoration:none;}
.floowy-scr .cases{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1000px;margin:34px auto 0;}
.floowy-scr .case{display:block;text-decoration:none;color:inherit;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(14,26,20,.06);background:#fff;transition:transform .15s ease,box-shadow .15s ease;}
.floowy-scr .case:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(14,26,20,.12);}
.floowy-scr .case:focus-visible{outline:3px solid var(--green);outline-offset:3px;}
.floowy-scr .case .top{height:150px;position:relative;display:flex;align-items:center;justify-content:center;}
.floowy-scr .case .top img{max-height:52px;max-width:62%;width:auto;filter:brightness(0) invert(1);opacity:.95;}
/* Already light-on-dark artwork — keep it as-is (see CASES knockout note). */
.floowy-scr .case .top img.asis{filter:none;max-height:64px;}
.floowy-scr .cwelhof{background:linear-gradient(150deg,#173A6B,#2E5C8A);}
.floowy-scr .cmarcel{background:linear-gradient(150deg,#C6742E,#E0A05A);}
.floowy-scr .cicon{background:linear-gradient(150deg,#4A3B31,#7A6656);}
.floowy-scr .case .cbody{background:linear-gradient(160deg,#3FAE78,#63C48E);padding:22px 22px 24px;color:#fff;}
.floowy-scr .case .cbody h3{font-size:20px;font-weight:800;margin-bottom:8px;}
.floowy-scr .case .cbody p{font-size:13.5px;color:rgba(255,255,255,.92);line-height:1.5;min-height:60px;}
.floowy-scr .metrics{display:flex;flex-direction:column;gap:9px;margin-top:14px;}
.floowy-scr .metrics .pill{background:rgba(255,255,255,.18);border-radius:999px;padding:9px 16px;font-size:14px;font-weight:700;}
.floowy-scr .reviews{background:var(--soft);}
.floowy-scr .score{text-align:center;font-size:44px;font-weight:800;letter-spacing:-1px;margin-top:14px;}
.floowy-scr .score .stars{display:block;color:#3FAE78;font-size:18px;letter-spacing:2px;margin-top:2px;}
.floowy-scr .score small{font-size:14px;color:var(--muted);font-weight:500;}
.floowy-scr .quotes{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1000px;margin:30px auto 0;}
.floowy-scr .quote{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;}
.floowy-scr .quote .st{color:#3FAE78;letter-spacing:2px;font-size:14px;}
.floowy-scr .quote p{font-size:14px;color:var(--ink);line-height:1.55;margin-top:10px;}
.floowy-scr .quote .who{margin-top:16px;font-size:12.5px;color:var(--muted);font-weight:600;}
.floowy-scr .quote .who b{display:block;color:var(--ink);font-size:13.5px;}
.floowy-scr .switchline{text-align:center;font-size:14px;color:var(--body);max-width:560px;margin:12px auto 0;}
.floowy-scr .togwrap{text-align:center;margin-top:18px;}
.floowy-scr .toggle{display:inline-flex;align-items:center;gap:4px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:4px;}
.floowy-scr .toggle button{border:none;background:none;font:inherit;font-size:13px;font-weight:600;color:var(--body);padding:8px 16px;border-radius:999px;cursor:pointer;display:flex;align-items:center;gap:7px;}
.floowy-scr .toggle button.on{background:var(--green);color:#fff;}
.floowy-scr .toggle .save{background:var(--mint);color:var(--green-deep);font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;}
.floowy-scr .toggle button.on .save{background:rgba(255,255,255,.24);color:#fff;}
.floowy-scr .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:start;max-width:940px;margin:24px auto 0;}
.floowy-scr .card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px 24px;display:flex;flex-direction:column;}
.floowy-scr .plan{font-size:18px;font-weight:700;display:flex;align-items:center;gap:10px;}
.floowy-scr .tag1{font-size:10px;font-weight:700;color:var(--green-deep);background:var(--mint);border:1px solid #C7E6D4;padding:3px 8px;border-radius:999px;}
.floowy-scr .price{margin:14px 0 4px;display:flex;align-items:baseline;gap:6px;}
.floowy-scr .price .amt{font-size:38px;font-weight:800;letter-spacing:-1.5px;}
.floowy-scr .price .cur{font-size:14px;font-weight:600;color:var(--muted);}
.floowy-scr .price .per{font-size:13px;color:var(--muted);}
.floowy-scr .desc{font-size:13px;color:var(--body);min-height:36px;margin-bottom:16px;}
.floowy-scr .feats{list-style:none;display:flex;flex-direction:column;gap:10px;}
.floowy-scr .feats li{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;}
.floowy-scr .feats li.off{color:#AEB6B1;}
.floowy-scr .ic{width:18px;height:18px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;margin-top:1px;}
.floowy-scr .ic.y{background:var(--mint);color:var(--green);}
.floowy-scr .ic.n{background:#F0F2F1;color:#B7BFBA;}
.floowy-scr .btn-ghost{margin-top:20px;text-align:center;background:#fff;color:var(--green-deep);font-weight:700;font-size:14px;border:1.5px solid #CDE5D8;border-radius:12px;padding:13px;cursor:pointer;text-decoration:none;}
.floowy-scr .btn-ghost:hover{background:var(--mint);}
.floowy-scr .card.best{border:2px solid var(--coral);box-shadow:0 22px 44px rgba(232,65,42,.14),0 4px 12px rgba(14,26,20,.04);transform:translateY(-12px);position:relative;padding-top:30px;}
.floowy-scr .ribbon{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--coral);color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 16px;border-radius:999px;box-shadow:0 8px 16px var(--coral-shadow);display:flex;align-items:center;gap:6px;white-space:nowrap;}
.floowy-scr .best .tag1{color:var(--coral-deep);background:var(--coral-soft);border-color:#F8CFC5;}
.floowy-scr .best .ic.y{background:var(--coral-soft);color:var(--coral-deep);}
.floowy-scr .btn-primary{margin-top:20px;text-align:center;background:var(--coral);color:#fff;font-weight:700;font-size:15px;border:none;border-radius:12px;padding:15px;cursor:pointer;text-decoration:none;box-shadow:0 12px 24px var(--coral-shadow);transition:transform .15s,box-shadow .15s;}
.floowy-scr .btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 30px var(--coral-shadow);background:var(--coral-deep);}
.floowy-scr .salesline{text-align:center;font-size:13px;color:var(--muted);margin-top:20px;}
.floowy-scr .salesline a{color:var(--green);font-weight:600;text-decoration:none;}
.floowy-scr .faq{max-width:720px;margin:30px auto 0;}
.floowy-scr .faq details{border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:10px;background:#fff;}
.floowy-scr .faq summary{font-size:15px;font-weight:600;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;}
.floowy-scr .faq summary::-webkit-details-marker{display:none;}
.floowy-scr .faq summary::after{content:"+";color:var(--green);font-weight:700;font-size:18px;}
.floowy-scr .faq details[open] summary::after{content:"–";}
.floowy-scr .faq p{font-size:14px;color:var(--body);margin-top:10px;}
.floowy-scr .final{background:linear-gradient(120deg,var(--green-deep),var(--vivid));border-radius:24px;text-align:center;padding:54px 24px;color:#fff;}
.floowy-scr .final h2{color:#fff;}
.floowy-scr .final p{color:#D8F5E4;margin:10px auto 22px;font-size:15px;max-width:520px;}
.floowy-scr footer{padding:32px 0;text-align:center;font-size:12.5px;color:var(--muted);}
.floowy-scr footer a{color:var(--muted);text-decoration:none;margin:0 8px;}
@media (max-width:880px){
  .floowy-scr .steps,.floowy-scr .inds,.floowy-scr .cases,.floowy-scr .quotes,.floowy-scr .cards{grid-template-columns:1fr;}
  .floowy-scr .card.best{transform:none;}
  .floowy-scr h1{font-size:33px;}
  .floowy-scr h2{font-size:25px;}
  .floowy-scr .why{padding:32px 24px;}
  .floowy-scr .why h2{text-align:center;}
  .floowy-scr .why p{margin-left:auto;margin-right:auto;}
}
@media (prefers-reduced-motion:reduce){.floowy-scr *{transition:none!important;animation:none!important;}}
`;
