import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import floowyLogo from "@/assets/floowy-logo.png";

// Press logos — the exact base64 image sources decoded from the build mockup.
import pressRtl from "@/assets/press-rtl.png";
import pressVideoland from "@/assets/press-videoland.png";
import pressEmerce from "@/assets/press-emerce.png";
// Real social-proof (customer + Shopify) logos — the same marks used site-wide.
import shopifyLogo from "@/assets/logo-shopify.svg";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import nimaniLogo from "@/assets/logo-nimani.png";
// Studio card previews — real Floowy output (product photo, on-model, UGC video).
import studioProduct from "@/assets/ads-studio-product.png";
import studioOnModel from "@/assets/ads-studio-onmodel.png";
import studioVideo from "@/assets/ads-studio-video.mp4";
// Case brand logos.
import marcelsLogo from "@/assets/logo-marcels.png";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";

/* ────────────────────────────────────────────────────────────────────────────
   Ads landing page — faithful port of floowy-ads-landing-page-mockup-v4.html.
   The mockup's CSS is embedded below, scoped under `.floowy-ads` so its global
   resets/element rules never leak into the rest of the app. Interactivity
   (countdown, monthly/yearly toggle, message-match token) is wired in React.
   Real behaviour vs the static mockup:
     • the headline token comes from ?tool= (keyword insertion), allow-listed;
       default "Pebblely" like the mockup (no demo auto-cycling on a live page).
     • the "Start for €1" buttons link to the real €1 signup offer.
   ──────────────────────────────────────────────────────────────────────────── */

const TOOL_ALLOWLIST: Record<string, string> = {
  pebblely: "Pebblely", flair: "Flair", botika: "Botika",
  vmodel: "VModel", arcads: "Arcads", creatify: "Creatify",
};

// Demo rotation for the dynamic headline token (same order/tools as the mockup).
// Used when no allow-listed ?tool= is present, so the message-match effect is
// visible; a real searched term pins the word instead of cycling.
const BRANDS = ["Pebblely", "Botika", "Arcads", "Flair", "VModel", "Creatify"];
const ROTATE_MS = 2200;

const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
function useCountdown() {
  const [txt, setTxt] = useState("02:23:55:40");
  useEffect(() => {
    const KEY = "floowy_ads_offer_deadline";
    let deadline = Number(localStorage.getItem(KEY) || 0);
    const now = Date.now();
    if (!deadline || deadline <= now) { deadline = now + WINDOW_MS; localStorage.setItem(KEY, String(deadline)); }
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const s = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTxt(`${pad(Math.floor(s / 86400))}:${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return txt;
}

const CSS = `
.floowy-ads{
  --ink:#0E1A14; --body:#48544D; --muted:#7B857F; --line:#E6ECE8; --page:#FFFFFF;
  --mint:#E8F6EE; --mint2:#D8F0E1; --minth:#CFFFE5; --soft:#FAFCFB;
  --green:#1E9E6A; --green-deep:#1E7C5A; --vivid:#22C177; --green-timer:#1E7150;
  --coral:#FF5B3F; --coral-deep:#E8412A; --coral-soft:#FFF1EE; --coral-shadow:rgba(255,91,63,.28);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  background:var(--page); color:var(--ink); -webkit-font-smoothing:antialiased; line-height:1.5;
  scroll-behavior:smooth;
}
.floowy-ads *{box-sizing:border-box; margin:0; padding:0;}
.floowy-ads .wrap{max-width:1080px; margin:0 auto; padding:0 24px;}
.floowy-ads .authbar{background:transparent; padding:30px 0 0; text-align:center;}
.floowy-ads .authpill{display:inline-flex; align-items:center; gap:16px; background:#fff; border:1px solid var(--line); border-radius:999px; padding:8px 20px; box-shadow:0 4px 14px rgba(14,26,20,.06);}
.floowy-ads .authpill .al{font-size:10.5px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:var(--muted);}
.floowy-ads .authpill .alogo{height:22px; width:auto; display:block;}
.floowy-ads .authpill .alogo.emerce{height:26px;}
.floowy-ads .authpill .adiv{width:1px; height:20px; background:var(--line);}
@media (max-width:560px){ .floowy-ads .authpill{flex-wrap:wrap; justify-content:center; gap:12px; border-radius:22px;} }
/* Section titles follow the site's section-title scale (text-3xl → 4xl → 5xl). */
.floowy-ads h2{font-size:1.875rem; font-weight:700; letter-spacing:-0.8px; text-align:center; line-height:1.15;}
@media (min-width:640px){ .floowy-ads h2{font-size:2.25rem;} }
@media (min-width:768px){ .floowy-ads h2{font-size:3rem; line-height:1.1;} }
.floowy-ads h2 .g{color:var(--green);}
.floowy-ads .sub{text-align:center; color:var(--body); font-size:15px; max-width:600px; margin:12px auto 0;}
.floowy-ads section{padding:56px 0;}
.floowy-ads .eyebrow{text-align:center; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--green); margin-bottom:10px;}
.floowy-ads .cta{display:inline-block; background:var(--coral); color:#fff; font-weight:700; font-size:16px; border:none; border-radius:12px; padding:15px 34px; cursor:pointer; text-decoration:none; box-shadow:0 10px 22px var(--coral-shadow); transition:transform .15s ease, box-shadow .15s ease;}
.floowy-ads .cta:hover{transform:translateY(-2px); box-shadow:0 14px 28px var(--coral-shadow);}
.floowy-ads nav{display:flex; align-items:center; justify-content:space-between; padding:18px 0;}
.floowy-ads .logo{display:flex; align-items:center; gap:9px; font-weight:700; font-size:17px;}
.floowy-ads .logo .mark{width:26px; height:26px; border-radius:8px; background:linear-gradient(135deg,var(--green-deep),var(--vivid)); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:15px;}
.floowy-ads nav .login{font-size:14px; font-weight:600; color:var(--body); text-decoration:none;}
.floowy-ads .hero{background:linear-gradient(180deg,var(--mint),#fff); padding:26px 0 46px; text-align:center;}
.floowy-ads .offerpill{display:inline-flex; align-items:center; gap:8px; background:#fff; border:1px solid #C7E6D4; border-radius:999px; padding:7px 14px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--green-deep); margin-bottom:18px;}
.floowy-ads .offerpill .clock{color:var(--green-timer); font-variant-numeric:tabular-nums;}
.floowy-ads .offerpill::before{content:""; width:7px; height:7px; border-radius:50%; background:var(--coral);}
.floowy-ads .heyebrow{font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--green); margin-bottom:12px;}
/* Headline stays on a single line at every width: nowrap + a viewport-scaled
   font that shrinks to fit instead of wrapping (fits the longest tool token). */
.floowy-ads h1{font-size:clamp(15px,4.9vw,46px); font-weight:800; letter-spacing:-1.6px; line-height:1.08; margin:0 auto; white-space:nowrap;}
.floowy-ads h1 .g{color:var(--green); white-space:nowrap;}
.floowy-ads .dyn{color:var(--green-deep); border-bottom:2px dotted var(--green); padding-bottom:1px;}
.floowy-ads .dyncap{font-size:12px; color:var(--muted); margin-top:14px;}
.floowy-ads .hero p.lead{font-size:17px; color:var(--body); max-width:600px; margin:16px auto 0;}
.floowy-ads .benefits{display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:20px;}
.floowy-ads .benefits .b{display:inline-flex; align-items:center; gap:7px; background:#fff; border:1px solid #C7E6D4; color:var(--green-deep); font-size:13px; font-weight:600; padding:8px 14px; border-radius:999px;}
.floowy-ads .herocta{margin-top:24px;}
.floowy-ads .trustbar{background:var(--mint); padding:22px 0;}
.floowy-ads .trustbar .inner{display:flex; align-items:center; justify-content:center; gap:28px; flex-wrap:wrap;}
.floowy-ads .trustbar .head{display:flex; align-items:center; gap:9px; font-size:15px; font-weight:600; color:var(--body);}
.floowy-ads .trustbar .shopify{width:24px; height:24px; border-radius:6px; background:#95BF47; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:14px;}
.floowy-ads .trustbar .brands{display:flex; align-items:center; gap:26px; flex-wrap:wrap;}
.floowy-ads .trustbar .brand{font-size:16px; font-weight:800; color:#5C6A63; letter-spacing:.3px; opacity:.8;}
.floowy-ads .trustbar .brandlogo{height:26px; width:auto; object-fit:contain; opacity:.85; filter:grayscale(1);}
.floowy-ads .trustbar .head .shopmark{height:20px; width:auto; object-fit:contain;}
.floowy-ads .ph{font-size:9px; color:var(--muted); text-align:center; margin-top:10px; letter-spacing:.4px;}
.floowy-ads .studios{display:grid; grid-template-columns:repeat(3,1fr); gap:18px; max-width:900px; margin:34px auto 0;}
.floowy-ads .studio{border:1px solid var(--line); border-radius:16px; overflow:hidden; background:#fff;}
.floowy-ads .studio .thumb{height:260px;}
.floowy-ads .studio video.thumb{width:100%; object-fit:cover; display:block; background:#0E1A14;}
.floowy-ads .studio .body{padding:18px 20px;}
.floowy-ads .studio .k{font-size:11px; font-weight:700; letter-spacing:.6px; text-transform:uppercase; color:var(--green); display:block; margin-bottom:6px;}
.floowy-ads .studio h3{font-size:16px; font-weight:700; margin-bottom:4px;}
.floowy-ads .studio p{font-size:13.5px; color:var(--body);}
.floowy-ads .t1{background:linear-gradient(140deg,#1E7C5A,#22C177);}
.floowy-ads .t2{background:linear-gradient(140deg,#2BBBA7,#7ED9A0);}
.floowy-ads .t3{background:linear-gradient(140deg,#146C4E,#37C07E);}
.floowy-ads .problem{text-align:center; font-size:clamp(1.25rem,3vw,1.75rem); font-weight:700; line-height:1.3; letter-spacing:-0.5px; margin-top:34px; color:var(--ink);}
.floowy-ads .matrix-wrap{max-width:760px; margin:34px auto 0; overflow-x:auto;}
.floowy-ads table.matrix{width:100%; border-collapse:separate; border-spacing:0; font-size:14px; min-width:520px;}
.floowy-ads table.matrix th, .floowy-ads table.matrix td{padding:13px 16px; border-bottom:1px solid var(--line); vertical-align:middle; text-align:left;}
.floowy-ads table.matrix thead th{font-size:13px; font-weight:700; vertical-align:bottom; line-height:1.3; color:var(--ink);}
.floowy-ads table.matrix thead th small{display:block; font-size:10.5px; color:var(--muted); font-weight:500; margin-top:3px;}
.floowy-ads table.matrix thead .fcol small{color:rgba(255,255,255,.85);}
.floowy-ads table.matrix td.cap, .floowy-ads table.matrix th.cap{width:32%; font-weight:600; color:var(--ink);}
.floowy-ads table.matrix .fcol{background:var(--mint);}
.floowy-ads table.matrix thead .fcol{background:var(--green); color:#fff; border-radius:12px 12px 0 0; display:flex; align-items:center; gap:8px; flex-wrap:wrap;}
.floowy-ads .fmark{width:22px; height:22px; border-radius:6px; background:rgba(255,255,255,.2); display:inline-flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:12px;}
.floowy-ads .fmark-logo{width:24px; height:24px; border-radius:6px; background:#fff; padding:3px; object-fit:contain; display:inline-block; flex:0 0 auto;}
.floowy-ads table.matrix tbody tr:last-child td{border-bottom:none;}
.floowy-ads table.matrix .fcol.last{border-radius:0 0 12px 12px;}
.floowy-ads .cell{display:flex; align-items:flex-start; gap:9px; line-height:1.35;}
.floowy-ads .cell .m{width:18px; height:18px; border-radius:50%; flex:0 0 auto; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; margin-top:1px;}
.floowy-ads .cell.pos{color:var(--ink); font-weight:600;} .floowy-ads .cell.pos .m{background:#fff; color:var(--green);}
.floowy-ads .fcol .cell.pos .m{background:#fff; color:var(--green-deep);}
.floowy-ads .cell.neg{color:#8A938E;} .floowy-ads .cell.neg .m{background:#EEF0EF; color:#B7BFBA;}
.floowy-ads .inds{display:grid; grid-template-columns:repeat(3,1fr); gap:20px; max-width:1000px; margin:34px auto 0;}
.floowy-ads .ind{border:1px solid var(--line); border-radius:18px; overflow:hidden; background:#fff;}
.floowy-ads .ind .top{height:340px; position:relative;}
.floowy-ads .ind .top span{position:absolute; left:14px; top:14px; font-size:12px; font-weight:800; color:rgba(255,255,255,.85); letter-spacing:1px;}
.floowy-ads .i1{background:linear-gradient(160deg,#8A8170,#C9C3B4);}
.floowy-ads .i2{background:linear-gradient(160deg,#C7D8E8,#9DBBD6);}
.floowy-ads .i3{background:linear-gradient(160deg,#C0554B,#E39084);}
.floowy-ads .ind .body{padding:18px 20px 22px;}
.floowy-ads .ind .lbl{font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--green);}
.floowy-ads .ind h3{font-size:19px; font-weight:700; margin:5px 0 6px;}
.floowy-ads .ind p{font-size:13.5px; color:var(--body); min-height:40px;}
.floowy-ads .ind a{display:inline-flex; align-items:center; gap:7px; margin-top:12px; background:var(--green); color:#fff; font-size:13px; font-weight:700; padding:9px 16px; border-radius:10px; text-decoration:none;}
.floowy-ads .cases{display:grid; grid-template-columns:repeat(3,1fr); gap:20px; max-width:1000px; margin:34px auto 0;}
.floowy-ads .case{border-radius:18px; overflow:hidden; box-shadow:0 8px 24px rgba(14,26,20,.06); background:#fff;}
.floowy-ads .case .top{height:180px; position:relative; background:#fff; border-bottom:1px solid var(--line);}
.floowy-ads .case .top .caselogo{position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:24px;}
.floowy-ads .case .top .caselogo img{max-height:110px; max-width:200px; width:auto; height:auto; object-fit:contain; display:block;}
.floowy-ads .cwelhof{background:linear-gradient(150deg,#173A6B,#2E5C8A);}
.floowy-ads .cmarcel{background:linear-gradient(150deg,#C6742E,#E0A05A);}
.floowy-ads .cicon{background:linear-gradient(150deg,#4A3B31,#7A6656);}
.floowy-ads .case .body{background:linear-gradient(160deg,#3FAE78,#63C48E); padding:22px 22px 24px; color:#fff;}
.floowy-ads .case .body h3{font-size:20px; font-weight:800; margin-bottom:8px;}
.floowy-ads .case .body p{font-size:13.5px; color:rgba(255,255,255,.92); line-height:1.5; min-height:60px;}
.floowy-ads .metrics{display:flex; flex-direction:column; gap:9px; margin-top:14px;}
.floowy-ads .metrics .pill{background:rgba(255,255,255,.18); border-radius:999px; padding:9px 16px; font-size:14px; font-weight:700;}
.floowy-ads .reviews{background:var(--soft);}
.floowy-ads .score{text-align:center; font-size:44px; font-weight:800; letter-spacing:-1px;}
.floowy-ads .score .stars{display:block; color:#3FAE78; font-size:18px; letter-spacing:2px; margin-top:2px;}
.floowy-ads .score small{font-size:14px; color:var(--muted); font-weight:500;}
.floowy-ads .quotes{display:grid; grid-template-columns:repeat(3,1fr); gap:18px; max-width:1000px; margin:30px auto 0;}
.floowy-ads .quote{background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px;}
.floowy-ads .quote .st{color:#3FAE78; letter-spacing:2px; font-size:14px;}
.floowy-ads .quote p{font-size:14px; color:var(--ink); line-height:1.55; margin-top:10px;}
.floowy-ads .quote .who{margin-top:16px; font-size:12.5px; color:var(--muted); font-weight:600;}
.floowy-ads .quote .who b{display:block; color:var(--ink); font-size:13.5px;}
.floowy-ads .pricing{background:#fff;}
.floowy-ads .switchline{text-align:center; font-size:14px; color:var(--body); max-width:560px; margin:12px auto 0;}
.floowy-ads .togwrap{text-align:center; margin-top:18px;}
.floowy-ads .toggle{display:inline-flex; align-items:center; gap:4px; background:#fff; border:1px solid var(--line); border-radius:999px; padding:4px;}
.floowy-ads .toggle button{border:none; background:none; font:inherit; font-size:13px; font-weight:600; color:var(--body); padding:8px 16px; border-radius:999px; cursor:pointer; display:flex; align-items:center; gap:7px;}
.floowy-ads .toggle button.on{background:var(--green); color:#fff;}
.floowy-ads .toggle .save{background:var(--coral-soft); color:var(--coral-deep); font-size:10px; font-weight:700; padding:2px 7px; border-radius:999px;}
.floowy-ads .toggle button.on .save{background:rgba(255,255,255,.24); color:#fff;}
.floowy-ads .cards{display:grid; grid-template-columns:repeat(3,1fr); gap:20px; align-items:start; max-width:940px; margin:24px auto 0;}
.floowy-ads .card{background:#fff; border:1px solid var(--line); border-radius:20px; padding:26px 24px; display:flex; flex-direction:column;}
.floowy-ads .plan{font-size:18px; font-weight:700; display:flex; align-items:center; gap:10px;}
.floowy-ads .tag1{font-size:10px; font-weight:700; color:var(--green-deep); background:var(--mint); border:1px solid #C7E6D4; padding:3px 8px; border-radius:999px;}
.floowy-ads .price{margin:14px 0 4px; display:flex; align-items:baseline; gap:6px;}
.floowy-ads .price .amt{font-size:38px; font-weight:800; letter-spacing:-1.5px;}
.floowy-ads .price .cur{font-size:14px; font-weight:600; color:var(--muted);}
.floowy-ads .price .per{font-size:13px; color:var(--muted);}
.floowy-ads .desc{font-size:13px; color:var(--body); min-height:36px; margin-bottom:16px;}
.floowy-ads .feats{list-style:none; display:flex; flex-direction:column; gap:10px;}
.floowy-ads .feats li{display:flex; align-items:flex-start; gap:10px; font-size:13.5px;}
.floowy-ads .feats li.off{color:#AEB6B1;}
.floowy-ads .ic{width:18px; height:18px; border-radius:50%; flex:0 0 auto; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; margin-top:1px;}
.floowy-ads .ic.y{background:var(--mint); color:var(--green);} .floowy-ads .ic.n{background:#F0F2F1; color:#B7BFBA;}
.floowy-ads .btn-ghost{margin-top:20px; text-align:center; background:#fff; color:var(--green-deep); font-weight:700; font-size:14px; border:1.5px solid #CDE5D8; border-radius:12px; padding:13px; cursor:pointer; text-decoration:none; display:block;}
.floowy-ads .btn-ghost:hover{background:var(--mint);}
.floowy-ads .card.best{border:2px solid var(--coral); box-shadow:0 22px 44px rgba(232,65,42,.14), 0 4px 12px rgba(14,26,20,.04); transform:translateY(-12px); position:relative; padding-top:30px;}
.floowy-ads .ribbon{position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:var(--coral); color:#fff; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:7px 16px; border-radius:999px; box-shadow:0 8px 16px var(--coral-shadow); display:flex; align-items:center; gap:6px; white-space:nowrap;}
.floowy-ads .best .tag1{color:var(--coral-deep); background:var(--coral-soft); border-color:#F8CFC5;}
.floowy-ads .best .ic.y{background:var(--coral-soft); color:var(--coral-deep);}
.floowy-ads .btn-primary{margin-top:20px; text-align:center; background:var(--coral); color:#fff; font-weight:700; font-size:15px; border:none; border-radius:12px; padding:15px; cursor:pointer; text-decoration:none; display:block; box-shadow:0 12px 24px var(--coral-shadow); transition:transform .15s, box-shadow .15s;}
.floowy-ads .btn-primary:hover{transform:translateY(-2px); box-shadow:0 16px 30px var(--coral-shadow);}
.floowy-ads .salesline{text-align:center; font-size:13px; color:var(--muted); margin-top:20px;}
.floowy-ads .salesline a{color:var(--green); font-weight:600; text-decoration:none;}
.floowy-ads .faq{max-width:720px; margin:30px auto 0;}
.floowy-ads .faq details{border:1px solid var(--line); border-radius:12px; padding:16px 18px; margin-bottom:10px; background:#fff;}
.floowy-ads .faq summary{font-size:15px; font-weight:600; cursor:pointer; list-style:none; display:flex; justify-content:space-between; align-items:center;}
.floowy-ads .faq summary::-webkit-details-marker{display:none;}
.floowy-ads .faq summary::after{content:"+"; color:var(--green); font-weight:700; font-size:18px;}
.floowy-ads .faq details[open] summary::after{content:"–";}
.floowy-ads .faq p{font-size:14px; color:var(--body); margin-top:10px;}
.floowy-ads .final{background:linear-gradient(120deg,var(--green-deep),var(--vivid)); border-radius:24px; text-align:center; padding:54px 24px; color:#fff;}
.floowy-ads .final h2{color:#fff;} .floowy-ads .final p{color:#D8F5E4; margin:10px auto 22px; font-size:15px;}
.floowy-ads footer{padding:32px 0; text-align:center; font-size:12.5px; color:var(--muted);}
.floowy-ads footer a{color:var(--muted); text-decoration:none; margin:0 8px;}
@media (max-width:880px){
  .floowy-ads .studios,.floowy-ads .inds,.floowy-ads .cases,.floowy-ads .quotes,.floowy-ads .cards{grid-template-columns:1fr;}
  .floowy-ads .card.best{transform:none;}
  .floowy-ads .trustbar .inner{gap:16px;} .floowy-ads .ind .top{height:300px;}
}
@media (prefers-reduced-motion:reduce){ .floowy-ads *{transition:none!important; scroll-behavior:auto;} }
`;

const STUDIOS: { img?: string; video?: string; k: string; h: string; p: string }[] = [
  { img: studioProduct, k: "Product Photography", h: "Studio-Grade Packshots", p: "Clean product shots and styled scenes, no shoot required." },
  { img: studioOnModel, k: "On-Model & Try-On", h: "Your Product On Models", p: "Real-looking on-model and try-on visuals in any setting." },
  { video: studioVideo, k: "UGC Video Ads", h: "Scroll-Stopping Video", p: "Ad-ready UGC video, with no creators to book or brief." },
];
// Industry card covers — the exact hero images used on the /industries page.
const IND_COVER_BASE = "https://wjihknoszyjwmpotsnda.supabase.co/storage/v1/object/public/user-uploads/admin-uploads/industries/";
const INDUSTRIES = [
  { img: `${IND_COVER_BASE}1779895394768-1b3hru5nhkv.webp`, label: "FASHION", h: "Fashion", p: "AI-powered visuals for fashion brands that move fast." },
  { img: `${IND_COVER_BASE}1779892388671-mb1s5ln3fr.webp`, label: "E-COMMERCE", h: "E-Commerce", p: "Online brands grow faster when content production stops being the bottleneck." },
  { img: `${IND_COVER_BASE}1779894731952-6ccps1uoqnj.webp`, label: "RETAIL", h: "Retail", p: "Retailers grow faster when every product looks like it deserves to sell." },
];
const CASES = [
  { logo: welhofLogo, grad: "cwelhof", name: "Welhof", blurb: "Boosting conversion rates with AI generated Atmosphere Photos.", metrics: ["+22% Conversion Rate", "+22% Orders", "+40% ROAS"] },
  { logo: marcelsLogo, grad: "cmarcel", name: "Marcel's Green Soap", blurb: "Scaling on-brand content in-house, from refill explainers to national campaigns.", metrics: ["+36% Content Output", "+60% Lower Production Costs", "+28% Engagement Rate"] },
  { logo: iconAmsterdamLogo, grad: "cicon", name: "ICON Amsterdam", blurb: "ICON Amsterdam scales on-brand ad creatives with Floowy.ai, no photoshoots needed.", metrics: ["+72% Production Costs Saved", "+90% Faster Flatlay Production", "+75% Time Saved Per Shoot"] },
];
// Trust-strip logos — customer order: ICON, Cetaphil, Marcel's, Curly, Welhof,
// Nimani, Loth. Rendered twice for a seamless marquee (same slider as the homepage).
const TRUST_LOGOS = [
  { src: iconAmsterdamLogo, alt: "ICON Amsterdam" },
  { src: cetaphilLogo, alt: "Cetaphil" },
  { src: marcelsLogo, alt: "Marcel's Green Soap" },
  { src: curlyGirlLogo, alt: "Curly Girl Movement" },
  { src: welhofLogo, alt: "Welhof" },
  { src: nimaniLogo, alt: "Nimani" },
  { src: lothLogo, alt: "LOTH · Fabenim" },
];

const studioBg = (img: string) => ({ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" });
const indBg = (img: string) => ({ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.42),rgba(0,0,0,.06)), url(${img})`, backgroundSize: "cover", backgroundPosition: "center" });

const AdsLandingPage = () => {
  const [params] = useSearchParams();
  const clock = useCountdown();

  const raw = (params.get("tool") || params.get("kw") || "").trim().toLowerCase();
  const pinned = TOOL_ALLOWLIST[raw]; // the exact searched tool, if allow-listed
  const brand = pinned || "Pebblely";

  // Dynamic headline token. An allow-listed ?tool= pins the word to the searched
  // term (message match); otherwise it cycles through common tools like the
  // mockup, so the "adapts to what you searched" effect is visible.
  const [displayBrand, setDisplayBrand] = useState(brand);
  useEffect(() => {
    if (pinned) { setDisplayBrand(pinned); return; }
    setDisplayBrand(BRANDS[0]);
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % BRANDS.length; setDisplayBrand(BRANDS[i]); }, ROTATE_MS);
    return () => clearInterval(id);
  }, [pinned]);

  useEffect(() => { document.title = `The ${brand} alternative that does it all — Floowy.ai`; }, [brand]);

  return (
    <>
      {/* Site-wide header/navigation (same as the other pages). */}
      <Navigation />
      <div className="floowy-ads">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* 1. HERO */}
      <header className="hero">
        <div className="wrap">
          <div className="offerpill">Launch offer · €1 · ends in <span className="clock">{clock}</span></div>
          <div className="heyebrow">The AI content platform for e-commerce</div>
          <h1>The <span className="dyn">{displayBrand}</span> alternative that <span className="g">does it all</span></h1>
          <p className="lead">For e-commerce brands. Product photos, on-model shots and UGC video ads, without the photoshoot. Pick a studio, click, and in one minute you have studio-grade output.</p>
          <div className="benefits">
            <span className="b">⚡ Live in 1 minute</span>
            <span className="b">★ Studio-grade quality</span>
            <span className="b">✓ One platform, not five tools</span>
          </div>
          <div className="herocta"><a href="#pricing" className="cta">Start for €1</a></div>
          <div className="authbar">
            <div className="authpill">
              <span className="al">As featured in</span>
              <img className="alogo" src={pressRtl} alt="RTL" />
              <span className="adiv" />
              <img className="alogo" src={pressVideoland} alt="Videoland" />
              <span className="adiv" />
              <img className="alogo emerce" src={pressEmerce} alt="Emerce 100" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. LOGO STRIP — scrolling marquee, same as the homepage. */}
      <div className="trustbar">
        <div className="wrap">
          <div className="head" style={{ justifyContent: "center", marginBottom: "16px" }}>
            <img className="shopmark" src={shopifyLogo} alt="Shopify" /> Trusted by 1000+ brands with €10m in revenue
          </div>
          <div className="relative max-w-2xl overflow-hidden" style={{ marginLeft: "auto", marginRight: "auto" }}>
            <div className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-[#E8F6EE] to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-[#E8F6EE] to-transparent" />
            <div className="flex w-max items-center gap-10 animate-[scroll-left_28s_linear_infinite]">
              {[...TRUST_LOGOS, ...TRUST_LOGOS].map((l, i) => (
                <img key={i} src={l.src} alt={l.alt} className="h-8 w-auto shrink-0 opacity-90" loading="lazy" decoding="async" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. WHAT WE DO */}
      <section>
        <div className="wrap">
          <div className="eyebrow">What we do</div>
          <h2>Content Production, <span className="g">Without The Bottleneck</span></h2>
          <p className="sub">Photoshoots are slow and expensive. Floowy turns your product into every visual you need, in minutes.</p>
          <div className="studios">
            {STUDIOS.map((s) => (
              <div className="studio" key={s.k}>
                {s.video
                  ? <video className="thumb" src={s.video} autoPlay muted loop playsInline preload="metadata" />
                  : <div className="thumb" style={studioBg(s.img as string)} />}
                <div className="body"><span className="k">{s.k}</span><h3>{s.h}</h3><p>{s.p}</p></div>
              </div>
            ))}
          </div>
          <h2 className="problem">One platform for all three. No photoshoot, no crew, no editing skills.</h2>

          <div className="matrix-wrap">
            <table className="matrix">
              <thead>
                <tr>
                  <th className="cap"></th>
                  <th className="fcol"><img className="fmark-logo" src={floowyLogo} alt="Floowy" /> Floowy<small>one platform</small></th>
                  <th>Other toolings<small>Separate single-purpose tools</small></th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["What it covers", "Photos, on-model and video", "One job per tool"],
                  ["Tools to manage", "One dashboard, one login", "A separate tool for each job"],
                  ["Learning curve", "Guided studios, no expertise", "A new tool to learn each time"],
                  ["Ready to publish", "Sized and export-ready", "Often needs extra editing"],
                  ["Price for all three jobs", "One subscription, from €19/mo", "Pay for two or three tools", true],
                ].map(([cap, pos, neg, last]) => (
                  <tr key={cap as string}>
                    <td className="cap">{cap}</td>
                    <td className={`fcol${last ? " last" : ""}`}><div className="cell pos"><span className="m">✓</span>{pos}</div></td>
                    <td><div className="cell neg"><span className="m">✗</span>{neg}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. INDUSTRIES */}
      <section style={{ background: "var(--soft)" }}>
        <div className="wrap">
          <div className="eyebrow">Built for your industry</div>
          <h2>Brands Like Yours, <span className="g">Creating At Scale</span></h2>
          <p className="sub">See how brands in your space use Floowy to create on-brand visuals at scale.</p>
          <div className="inds">
            {INDUSTRIES.map((i) => (
              <div className="ind" key={i.label}>
                <div className="top" style={indBg(i.img)}><span>{i.label}</span></div>
                <div className="body"><div className="lbl">Industry</div><h3>{i.h}</h3><p>{i.p}</p><a href="#pricing">Explore →</a></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CASES */}
      <section>
        <div className="wrap">
          <div className="eyebrow">Customer cases</div>
          <h2>Real Brands, <span className="g">Real Numbers</span></h2>
          <div className="cases">
            {CASES.map((c) => (
              <div className="case" key={c.name}>
                <div className={`top ${c.grad}`}><span className="caselogo"><img src={c.logo} alt={c.name} /></span></div>
                <div className="body">
                  <h3>{c.name}</h3>
                  <p>{c.blurb}</p>
                  <div className="metrics">{c.metrics.map((m) => <div className="pill" key={m}>{m}</div>)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      </div>

      {/* 6. REVIEWS — homepage testimonials block (header "The Results Speak for
          Themselves" + "4.7 out of 5" + review carousel), rendered outside the
          scoped .floowy-ads reset so its Tailwind styling is preserved. */}
      <TestimonialsSection />

      {/* 7. PRICING — the live product's current tiers UI (shared PricingSection,
          rendered outside the scoped .floowy-ads reset so its Tailwind spacing
          is preserved). The €1 offer, credits/images and Best-Value treatment
          all come from the single tier source of truth. */}
      <div id="pricing">
        <PricingSection
          title={<>
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.15em] text-primary">Simple pricing</span>
            <span className="text-header-dark">Start Creating in </span>
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Minutes</span>
          </>}
        />
      </div>

      <div className="floowy-ads">
      {/* 8. FAQ + FINAL CTA */}
      <section style={{ background: "var(--soft)" }}>
        <div className="wrap">
          <div className="eyebrow">Good to know</div>
          <h2>Frequently Asked <span className="g">Questions</span></h2>
          <div className="faq">
            <details open><summary>What is Floowy?</summary><p>An AI platform that turns your product into photos, on-model shots and UGC video ads. One dashboard, no photoshoot.</p></details>
            <details><summary>How does the €1 offer work?</summary><p>You start any plan for €1 for the first 3 days. After that it renews at the plan price. Cancel anytime before renewal.</p></details>
            <details><summary>Do I need any design or photo skills?</summary><p>No. Pick a studio, click, and publish. Everything is guided and export-ready.</p></details>
            <details><summary>Can I cancel anytime?</summary><p>Yes. There is no lock-in. Cancel in a couple of clicks from your account.</p></details>
            <details><summary>Do I own the content I create?</summary><p>Yes. Everything you generate is yours to use across your store, ads and socials.</p></details>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="final">
            <h2>Make Your Content In Seconds</h2>
            <p>Product photos, on-model and UGC video. Anyone can do it, no photoshoot needed.</p>
            <a href="#pricing" className="cta">Start for €1</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">© {new Date().getFullYear()} Floowy.ai &nbsp;·&nbsp; <Link to="/privacy-policy">Privacy</Link> <Link to="/terms-conditions">Terms</Link> <Link to="/contact">Contact</Link></div>
      </footer>
      </div>
    </>
  );
};

export default AdsLandingPage;
