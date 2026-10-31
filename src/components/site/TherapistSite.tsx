import { useEffect, type ReactNode } from "react";
import { CalendarCheck, Compass, Heart, Leaf, MapPin, Mail, MessageCircle, Moon, Phone, Quote, Sparkles, Sun } from "lucide-react";

// The therapist's own page, in one of three styles. Everything the page says comes from the content object (built
// from the Mentor deliverables and approved by the therapist); the style only decides how it looks.

export type SiteStyle = "warm" | "modern" | "classic";
export const SITE_STYLES: SiteStyle[] = ["warm", "modern", "classic"];
export const SITE_STYLE_LABELS: Record<SiteStyle, string> = { warm: "חם ורגוע", modern: "מודרני נקי", classic: "קלאסי ומקצועי" };

export interface SiteFaq {
  q: string;
  a: string;
}
export interface SiteView {
  fullName: string;
  title: string;
  avatarUrl?: string;
  keyPhrase: string;
  heroLine?: string;
  about: string;
  forYouIf: string[];
  firstSession?: string[]; // up to three short steps: what happens when you reach out
  faq?: SiteFaq[];
  contactLine?: string;
  phone?: string;
  email?: string;
  location?: string; // city and format, e.g. "תל אביב · גם אונליין"
  calendarLink?: string;
}

export interface Theme {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  soft: string; // a pale tint of the accent
  band: string; // the dark section
  bandInk: string;
  line: string;
  head: string;
  body: string;
  radius: number;
  headWeight: number;
  fonts: string; // Google Fonts families
}

const THEMES: Record<SiteStyle, Theme> = {
  warm: {
    bg: "#F7F0E7", surface: "#FFFFFF", ink: "#2B2420", muted: "#6F645B", accent: "#B4583C", accentInk: "#FFFFFF", soft: "#F0DDD0",
    band: "#34292A", bandInk: "#F7F0E7", line: "#E6D9CB",
    head: `"Frank Ruhl Libre", "David Libre", Georgia, serif`, body: `"Assistant", "Heebo", system-ui, sans-serif`,
    radius: 22, headWeight: 500, fonts: "Frank+Ruhl+Libre:wght@400;500;700&family=Assistant:wght@300;400;600;700",
  },
  modern: {
    bg: "#F4F7FA", surface: "#FFFFFF", ink: "#0F1B2D", muted: "#5B6B80", accent: "#2563A8", accentInk: "#FFFFFF", soft: "#DDE9F6",
    band: "#0F1B2D", bandInk: "#F4F7FA", line: "#DCE4EE",
    head: `"Rubik", "Heebo", system-ui, sans-serif`, body: `"Heebo", "Assistant", system-ui, sans-serif`,
    radius: 14, headWeight: 600, fonts: "Rubik:wght@400;500;600;700&family=Heebo:wght@300;400;500;700",
  },
  classic: {
    bg: "#FBF8F2", surface: "#FFFFFF", ink: "#1B2438", muted: "#5F6675", accent: "#A47E3B", accentInk: "#FFFFFF", soft: "#F1E6D0",
    band: "#1B2438", bandInk: "#FBF8F2", line: "#E7DFCF",
    head: `"Frank Ruhl Libre", "David Libre", Georgia, serif`, body: `"Assistant", "Heebo", system-ui, sans-serif`,
    radius: 4, headWeight: 700, fonts: "Frank+Ruhl+Libre:wght@400;500;700;900&family=Assistant:wght@300;400;600;700",
  },
};

const digits = (s: string) => s.replace(/[^\d+]/g, "");
const initials = (name: string) =>
  name.replace(/^(ד["״]ר|דר)\s*/, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");

// Decorative shapes behind the hero, different for each style. Pure SVG, no images to load.
function HeroDecor({ style, t }: { style: SiteStyle; t: Theme }) {
  const common = { position: "absolute" as const, inset: 0, width: "100%", height: "100%", pointerEvents: "none" as const };
  if (style === "warm") {
    return (
      <svg style={common} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <circle cx="1020" cy="140" r="260" fill={t.soft} opacity="0.75" />
        <circle cx="140" cy="620" r="200" fill={t.soft} opacity="0.55" />
        <path d="M1080 520c60-90 20-190-60-230 10 90-20 150-70 190 40 10 90 30 130 40z" fill={t.accent} opacity="0.13" />
        <path d="M1010 600c40-60 10-130-45-155 5 60-15 100-48 128 28 8 62 20 93 27z" fill={t.accent} opacity="0.1" />
        <path d="M60 90c40-60 10-130-45-155" stroke={t.accent} strokeWidth="2" fill="none" opacity="0.25" transform="translate(40 120)" />
      </svg>
    );
  }
  if (style === "modern") {
    return (
      <svg style={common} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill={t.accent} opacity="0.22" /></pattern>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={t.accent} stopOpacity="0.28" /><stop offset="100%" stopColor={t.accent} stopOpacity="0" /></radialGradient>
        </defs>
        <rect x="40" y="40" width="300" height="220" fill="url(#dots)" />
        <circle cx="1000" cy="260" r="330" fill="url(#glow)" />
        <circle cx="1000" cy="260" r="210" fill="none" stroke={t.accent} strokeWidth="1.5" opacity="0.25" />
        <circle cx="1000" cy="260" r="290" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.15" />
      </svg>
    );
  }
  return (
    <svg style={common} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="28" y="28" width="1144" height="644" fill="none" stroke={t.accent} strokeWidth="1.5" opacity="0.5" />
      <rect x="40" y="40" width="1120" height="620" fill="none" stroke={t.accent} strokeWidth="0.8" opacity="0.4" />
      {[[28, 28], [1172, 28], [28, 672], [1172, 672]].map(([x, y], i) => (
        <rect key={i} x={x - 7} y={y - 7} width="14" height="14" fill={t.bg} stroke={t.accent} strokeWidth="1.5" transform={`rotate(45 ${x} ${y})`} />
      ))}
    </svg>
  );
}

// A soft curve between two sections.
function Wave({ from, to, flip = false }: { from: string; to: string; flip?: boolean }) {
  return (
    <div style={{ background: to, lineHeight: 0, transform: flip ? "scaleY(-1)" : undefined }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: "100%", height: 56, display: "block" }} aria-hidden="true">
        <path d="M0 0h1440v30c-180 40-360 50-540 30S540 20 360 36 90 70 0 50z" fill={from} />
      </svg>
    </div>
  );
}

function Orn({ style, t }: { style: SiteStyle; t: Theme }) {
  if (style === "classic")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", color: t.accent, margin: "0 0 18px" }} aria-hidden="true">
        <span style={{ height: 1, width: 56, background: t.accent, opacity: 0.6 }} />
        <span style={{ width: 8, height: 8, background: t.accent, transform: "rotate(45deg)" }} />
        <span style={{ height: 1, width: 56, background: t.accent, opacity: 0.6 }} />
      </div>
    );
  return null;
}

const FOR_YOU_ICONS = [Heart, Compass, Moon, Sun, Leaf, Sparkles];
const STEP_ICONS = [Phone, CalendarCheck, Compass];

// themeOverride lets a page keep one of the three layouts but take its own colours, fonts and corner radius (for
// "inspired by a page I like": the values come from that page's palette, never its text or images).
export function TherapistSite({ site, style = "warm", themeOverride }: { site: SiteView; style?: SiteStyle; themeOverride?: Partial<Theme> }) {
  const t: Theme = { ...THEMES[style], ...themeOverride };

  useEffect(() => {
    const id = `tk-site-fonts-${style}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${t.fonts}&display=swap`;
    document.head.appendChild(link);
  }, [style, t.fonts]);

  const wa = site.phone ? `https://wa.me/${digits(site.phone).replace(/^0/, "972")}` : "";
  const cta = site.calendarLink || wa || (site.email ? `mailto:${site.email}` : "#contact");
  const steps = (site.firstSession ?? []).filter(Boolean);
  const faq = (site.faq ?? []).filter((f) => f.q && f.a);
  const contactLine = site.contactLine?.trim() || "אפשר לכתוב או להתקשר, ואחזור אליך.";

  const css = `
    .tk-site{background:${t.bg};color:${t.ink};font-family:${t.body};line-height:1.75;font-size:17px;-webkit-font-smoothing:antialiased;overflow-x:hidden}
    .tk-site *{box-sizing:border-box}
    .tk-site h1,.tk-site h2,.tk-site h3{font-family:${t.head};font-weight:${t.headWeight};line-height:1.2;margin:0;letter-spacing:-0.01em}
    .tk-site .wrap{max-width:1080px;margin:0 auto;padding:0 24px;position:relative}
    .tk-site .btn{white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:15px 28px;border-radius:${t.radius}px;font-weight:600;text-decoration:none;font-size:16px;transition:transform .15s ease,box-shadow .15s ease}
    .tk-site .btn:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(0,0,0,.14)}
    .tk-site .btn.primary{background:${t.accent};color:${t.accentInk}}
    .tk-site .btn.ghost{border:1.5px solid ${t.ink};color:${t.ink};background:transparent}
    .tk-site section{padding:84px 0;position:relative}
    .tk-site .eyebrow{font-size:13px;letter-spacing:.14em;color:${t.accent};font-weight:700;margin-bottom:14px}
    .tk-site .card{background:${t.surface};border:1px solid ${t.line};border-radius:${t.radius}px;padding:28px}
    .tk-site .ico{width:52px;height:52px;border-radius:${style === "classic" ? "4px" : "999px"};display:flex;align-items:center;justify-content:center;background:${t.soft};color:${t.accent}}
    .tk-site details{border-bottom:1px solid ${t.line};padding:20px 0}
    .tk-site summary{cursor:pointer;font-family:${t.head};font-size:20px;font-weight:${t.headWeight};list-style:none;display:flex;justify-content:space-between;gap:16px}
    .tk-site summary::-webkit-details-marker{display:none}
    .tk-site summary::after{content:"+";color:${t.accent};font-size:26px;line-height:1}
    .tk-site details[open] summary::after{content:"−"}
    .tk-site details p{margin:12px 0 0;color:${t.muted}}
    .tk-site .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
    .tk-site .hero-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:56px;align-items:center}
    .tk-site .about-grid{display:grid;grid-template-columns:.7fr 1.3fr;gap:56px;align-items:center}
    .tk-site .chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}
    .tk-site .chip{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:${t.surface};border:1px solid ${t.line};font-size:14px;color:${t.muted}}
    .tk-site .sticky{display:none}
    @media(max-width:820px){
      .tk-site section{padding:56px 0}
      .tk-site .grid3{grid-template-columns:1fr}
      .tk-site .hero-grid,.tk-site .about-grid{grid-template-columns:1fr;gap:32px}
      .tk-site .hero-photo{order:-1;max-width:260px;margin:0 auto}
      .tk-site{font-size:16px}
      .tk-site .role{display:none}
      .tk-site header .btn{padding:9px 16px!important;font-size:14px!important}
      .tk-site .sticky{display:flex;position:fixed;inset-inline:12px;bottom:12px;z-index:20}
      .tk-site .sticky .btn{flex:1;box-shadow:0 10px 30px rgba(0,0,0,.25)}
      .tk-site footer{padding-bottom:96px!important}
    }
  `;

  const photoRadius = style === "warm" ? "999px 999px 24px 24px" : style === "classic" ? "4px" : "28px";
  const photoShadow = "0 24px 60px rgba(0,0,0,.16)";
  const photo = (extra?: ReactNode) => (
    <div style={{ position: "relative" }}>
      {/* an offset frame behind the photo */}
      <div style={{ position: "absolute", inset: 0, transform: "translate(-14px, 14px)", borderRadius: photoRadius, border: `2px solid ${t.accent}`, opacity: 0.55 }} aria-hidden="true" />
      {site.avatarUrl ? (
        <img src={site.avatarUrl} alt={site.fullName} style={{ position: "relative", width: "100%", aspectRatio: "4/5", objectFit: "cover", borderRadius: photoRadius, display: "block", boxShadow: photoShadow }} />
      ) : (
        <div style={{ position: "relative", width: "100%", aspectRatio: "4/5", borderRadius: photoRadius, background: `linear-gradient(160deg, ${t.accent}, ${t.band})`, display: "flex", alignItems: "center", justifyContent: "center", color: t.accentInk, fontFamily: t.head, fontSize: 72, boxShadow: photoShadow }}>
          {initials(site.fullName)}
        </div>
      )}
      {extra}
    </div>
  );

  return (
    <div className="tk-site" dir="rtl" lang="he">
      <style>{css}</style>

      <header style={{ padding: "22px 0", position: "relative", zIndex: 2 }}>
        <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ fontFamily: t.head, fontSize: 19, fontWeight: 600 }}>
            {site.fullName}
            <span className="role" style={{ color: t.muted, fontWeight: 400, fontSize: 15 }}> · {site.title}</span>
          </div>
          <a className="btn primary" href={cta} style={{ padding: "10px 20px", fontSize: 15 }}>לתיאום שיחה</a>
        </div>
      </header>

      <div style={{ position: "relative" }}>
        <HeroDecor style={style} t={t} />
        <section style={{ paddingTop: 48, paddingBottom: 96 }}>
          <div className="wrap hero-grid">
            <div>
              <Orn style={style} t={t} />
              <div className="eyebrow">{site.title}</div>
              <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)" }}>{site.keyPhrase}</h1>
              {site.heroLine && <p style={{ fontSize: 20, color: t.muted, margin: "22px 0 0", maxWidth: 560 }}>{site.heroLine}</p>}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
                <a className="btn primary" href={cta}><MessageCircle size={18} />לשיחה ראשונה</a>
                {site.phone && <a className="btn ghost" href={`tel:${digits(site.phone)}`}><Phone size={18} />{site.phone}</a>}
              </div>
              {site.location && (
                <div className="chips">
                  <span className="chip"><MapPin size={16} color={t.accent} />{site.location}</span>
                </div>
              )}
            </div>
            <div className="hero-photo">{photo()}</div>
          </div>
        </section>
      </div>

      {site.forYouIf.length > 0 && (
        <>
          <Wave from={t.bg} to={t.band} flip />
          <section style={{ background: t.band, color: t.bandInk, paddingTop: 40 }}>
            <div className="wrap">
              <div className="eyebrow" style={{ color: t.bandInk, opacity: 0.7 }}>למי זה מתאים</div>
              <h2 style={{ fontSize: "clamp(26px, 3.6vw, 38px)", marginBottom: 36 }}>אולי זה מה שאת או אתה מרגישים</h2>
              <div className="grid3">
                {site.forYouIf.slice(0, 3).map((line, i) => {
                  const Icon = FOR_YOU_ICONS[i % FOR_YOU_ICONS.length];
                  return (
                    <div key={i} style={{ border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.04)", borderRadius: t.radius, padding: 28, fontSize: 18, lineHeight: 1.7 }}>
                      <div className="ico" style={{ background: "rgba(255,255,255,.1)", color: t.accent, marginBottom: 18 }}><Icon size={24} /></div>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          <Wave from={t.band} to={t.bg} />
        </>
      )}

      <section style={{ paddingTop: 40 }}>
        <div className="wrap about-grid">
          <div className="hero-photo" style={{ maxWidth: 320, width: "100%", margin: "0 auto" }}>{photo()}</div>
          <div>
            <div className="eyebrow">קצת עליי</div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 38px)", marginBottom: 22 }}>{site.fullName}</h2>
            <div style={{ position: "relative", paddingInlineStart: 0 }}>
              <Quote size={44} color={t.accent} style={{ opacity: 0.22, position: "absolute", top: -26, insetInlineStart: -6 }} aria-hidden="true" />
              <p style={{ fontSize: 19, color: t.ink, whiteSpace: "pre-wrap", margin: 0, position: "relative" }}>{site.about}</p>
            </div>
          </div>
        </div>
      </section>

      {steps.length > 0 && (
        <section style={{ background: t.surface, borderBlock: `1px solid ${t.line}` }}>
          <div className="wrap">
            <div className="eyebrow">איך מתחילים</div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 38px)", marginBottom: 40 }}>שלושה צעדים פשוטים</h2>
            <div className="grid3">
              {steps.slice(0, 3).map((s, i) => {
                const Icon = STEP_ICONS[i % STEP_ICONS.length];
                return (
                  <div key={i} className="card" style={{ background: t.bg, position: "relative" }}>
                    <div style={{ position: "absolute", top: 18, insetInlineEnd: 22, fontFamily: t.head, fontSize: 54, color: t.accent, opacity: 0.18, lineHeight: 1 }}>{`0${i + 1}`}</div>
                    <div className="ico" style={{ marginBottom: 18 }}><Icon size={24} /></div>
                    <div style={{ fontSize: 18 }}>{s}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {faq.length > 0 && (
        <section>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <div className="eyebrow">שאלות נפוצות</div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 38px)", marginBottom: 18 }}>מה שרוב האנשים שואלים</h2>
            {faq.map((f, i) => (
              <details key={i} open={i === 0}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <Wave from={t.bg} to={t.band} flip />
      <section id="contact" style={{ background: t.band, color: t.bandInk, textAlign: "center", paddingTop: 40, overflow: "hidden" }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <circle cx="160" cy="320" r="220" fill={t.accent} opacity="0.12" />
          <circle cx="1060" cy="60" r="170" fill={t.accent} opacity="0.1" />
        </svg>
        <div className="wrap" style={{ maxWidth: 680 }}>
          <Orn style={style} t={t} />
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>מוכנים לדבר?</h2>
          <p style={{ opacity: 0.85, margin: "16px 0 32px", fontSize: 19 }}>{contactLine}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn primary" href={cta}><CalendarCheck size={18} />לתיאום שיחה</a>
            {site.phone && <a className="btn" href={`tel:${digits(site.phone)}`} style={{ border: "1.5px solid rgba(255,255,255,.5)", color: t.bandInk }}><Phone size={18} />{site.phone}</a>}
            {site.email && <a className="btn" href={`mailto:${site.email}`} style={{ border: "1.5px solid rgba(255,255,255,.5)", color: t.bandInk }}><Mail size={18} />{site.email}</a>}
          </div>
          {site.location && <p style={{ opacity: 0.7, marginTop: 28, fontSize: 15, display: "inline-flex", gap: 8, alignItems: "center" }}><MapPin size={16} />{site.location}</p>}
        </div>
      </section>

      <footer style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: t.muted }}>
        <div className="wrap">{site.fullName} · {site.title}</div>
      </footer>

      <div className="sticky"><a className="btn primary" href={cta}>לתיאום שיחה</a></div>
    </div>
  );
}
