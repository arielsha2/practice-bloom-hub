import { useEffect } from "react";

// The therapist's own page, in one of three styles. Everything the page says comes from the content object (built
// from the Mentor deliverables and approved by the therapist); the style only decides how it looks.

export type SiteStyle = "warm" | "modern" | "classic";

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
  phone?: string;
  email?: string;
  location?: string; // city and format, e.g. "תל אביב · גם אונליין"
  calendarLink?: string;
}

interface Theme {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
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
    bg: "#F7F0E7", surface: "#FFFFFF", ink: "#2B2420", muted: "#6F645B", accent: "#B4583C", accentInk: "#FFFFFF",
    band: "#34292A", bandInk: "#F7F0E7", line: "#E6D9CB",
    head: `"Frank Ruhl Libre", "David Libre", Georgia, serif`, body: `"Assistant", "Heebo", system-ui, sans-serif`,
    radius: 22, headWeight: 500, fonts: "Frank+Ruhl+Libre:wght@400;500;700&family=Assistant:wght@300;400;600;700",
  },
  modern: {
    bg: "#F4F7FA", surface: "#FFFFFF", ink: "#0F1B2D", muted: "#5B6B80", accent: "#2563A8", accentInk: "#FFFFFF",
    band: "#0F1B2D", bandInk: "#F4F7FA", line: "#DCE4EE",
    head: `"Rubik", "Heebo", system-ui, sans-serif`, body: `"Heebo", "Assistant", system-ui, sans-serif`,
    radius: 14, headWeight: 600, fonts: "Rubik:wght@400;500;600;700&family=Heebo:wght@300;400;500;700",
  },
  classic: {
    bg: "#FBF8F2", surface: "#FFFFFF", ink: "#1B2438", muted: "#5F6675", accent: "#A47E3B", accentInk: "#FFFFFF",
    band: "#1B2438", bandInk: "#FBF8F2", line: "#E7DFCF",
    head: `"Frank Ruhl Libre", "David Libre", Georgia, serif`, body: `"Assistant", "Heebo", system-ui, sans-serif`,
    radius: 4, headWeight: 700, fonts: "Frank+Ruhl+Libre:wght@400;500;700;900&family=Assistant:wght@300;400;600;700",
  },
};

const digits = (s: string) => s.replace(/[^\d+]/g, "");
const initials = (name: string) =>
  name.replace(/^(ד["״]ר|דר)\s*/, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");

export function TherapistSite({ site, style = "warm" }: { site: SiteView; style?: SiteStyle }) {
  const t = THEMES[style];

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

  const css = `
    .tk-site{background:${t.bg};color:${t.ink};font-family:${t.body};line-height:1.75;font-size:17px;-webkit-font-smoothing:antialiased}
    .tk-site *{box-sizing:border-box}
    .tk-site h1,.tk-site h2,.tk-site h3{font-family:${t.head};font-weight:${t.headWeight};line-height:1.2;margin:0;letter-spacing:-0.01em}
    .tk-site .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
    .tk-site .btn{white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:15px 28px;border-radius:${t.radius}px;font-weight:600;text-decoration:none;font-size:16px;transition:transform .15s ease,box-shadow .15s ease}
    .tk-site .btn:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(0,0,0,.14)}
    .tk-site .btn.primary{background:${t.accent};color:${t.accentInk}}
    .tk-site .btn.ghost{border:1.5px solid ${t.ink};color:${t.ink};background:transparent}
    .tk-site section{padding:84px 0}
    .tk-site .eyebrow{font-size:13px;letter-spacing:.14em;color:${t.accent};font-weight:700;margin-bottom:14px}
    .tk-site .card{background:${t.surface};border:1px solid ${t.line};border-radius:${t.radius}px;padding:28px}
    .tk-site details{border-bottom:1px solid ${t.line};padding:20px 0}
    .tk-site summary{cursor:pointer;font-family:${t.head};font-size:20px;font-weight:${t.headWeight};list-style:none;display:flex;justify-content:space-between;gap:16px}
    .tk-site summary::-webkit-details-marker{display:none}
    .tk-site summary::after{content:"+";color:${t.accent};font-size:26px;line-height:1}
    .tk-site details[open] summary::after{content:"−"}
    .tk-site details p{margin:12px 0 0;color:${t.muted}}
    .tk-site .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
    .tk-site .hero-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:56px;align-items:center}
    .tk-site .sticky{display:none}
    @media(max-width:820px){
      .tk-site section{padding:56px 0}
      .tk-site .grid3{grid-template-columns:1fr}
      .tk-site .hero-grid{grid-template-columns:1fr;gap:32px}
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

  return (
    <div className="tk-site" dir="rtl" lang="he">
      <style>{css}</style>

      <header style={{ padding: "22px 0" }}>
        <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ fontFamily: t.head, fontSize: 19, fontWeight: 600 }}>
            {site.fullName}
            <span className="role" style={{ color: t.muted, fontWeight: 400, fontSize: 15 }}> · {site.title}</span>
          </div>
          <a className="btn primary" href={cta} style={{ padding: "10px 20px", fontSize: 15 }}>לתיאום שיחה</a>
        </div>
      </header>

      <section style={{ paddingTop: 48 }}>
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">{site.title}{site.location ? ` · ${site.location}` : ""}</div>
            <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)" }}>{site.keyPhrase}</h1>
            {site.heroLine && <p style={{ fontSize: 20, color: t.muted, margin: "22px 0 0", maxWidth: 560 }}>{site.heroLine}</p>}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 34 }}>
              <a className="btn primary" href={cta}>לשיחה ראשונה</a>
              {site.phone && <a className="btn ghost" href={`tel:${digits(site.phone)}`}>{site.phone}</a>}
            </div>
          </div>
          <div className="hero-photo">
            {site.avatarUrl ? (
              <img src={site.avatarUrl} alt={site.fullName} style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", borderRadius: photoRadius, display: "block", boxShadow: "0 24px 60px rgba(0,0,0,.16)" }} />
            ) : (
              <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: photoRadius, background: `linear-gradient(160deg, ${t.accent}, ${t.band})`, display: "flex", alignItems: "center", justifyContent: "center", color: t.accentInk, fontFamily: t.head, fontSize: 72, boxShadow: "0 24px 60px rgba(0,0,0,.16)" }}>
                {initials(site.fullName)}
              </div>
            )}
          </div>
        </div>
      </section>

      {site.forYouIf.length > 0 && (
        <section style={{ background: t.band, color: t.bandInk }}>
          <div className="wrap">
            <div className="eyebrow" style={{ color: t.bandInk, opacity: 0.7 }}>למי זה מתאים</div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 38px)", marginBottom: 36 }}>אולי זה מה שאת או אתה מרגישים</h2>
            <div className="grid3">
              {site.forYouIf.slice(0, 3).map((line, i) => (
                <div key={i} style={{ border: `1px solid rgba(255,255,255,.18)`, borderRadius: t.radius, padding: 28, fontSize: 18, lineHeight: 1.7 }}>
                  <div style={{ fontFamily: t.head, fontSize: 30, color: t.accent, marginBottom: 12 }}>{`0${i + 1}`}</div>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="eyebrow">קצת עליי</div>
          <h2 style={{ fontSize: "clamp(26px, 3.6vw, 38px)", marginBottom: 22 }}>{site.fullName}</h2>
          <p style={{ fontSize: 19, color: t.ink, whiteSpace: "pre-wrap", margin: 0 }}>{site.about}</p>
        </div>
      </section>

      {steps.length > 0 && (
        <section style={{ background: t.surface, borderBlock: `1px solid ${t.line}` }}>
          <div className="wrap">
            <div className="eyebrow">איך מתחילים</div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 38px)", marginBottom: 36 }}>שלושה צעדים פשוטים</h2>
            <div className="grid3">
              {steps.slice(0, 3).map((s, i) => (
                <div key={i} className="card" style={{ background: t.bg }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: t.accent, color: t.accentInk, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginBottom: 16 }}>{i + 1}</div>
                  <div style={{ fontSize: 18 }}>{s}</div>
                </div>
              ))}
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

      <section id="contact" style={{ background: t.band, color: t.bandInk, textAlign: "center" }}>
        <div className="wrap" style={{ maxWidth: 680 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>מוכנים לדבר?</h2>
          <p style={{ opacity: 0.8, margin: "16px 0 32px", fontSize: 19 }}>שיחה ראשונה קצרה, בלי התחייבות, כדי להבין אם אני המקום הנכון.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn primary" href={cta}>לתיאום שיחה</a>
            {site.phone && <a className="btn" href={`tel:${digits(site.phone)}`} style={{ border: "1.5px solid rgba(255,255,255,.5)", color: t.bandInk }}>{site.phone}</a>}
            {site.email && <a className="btn" href={`mailto:${site.email}`} style={{ border: "1.5px solid rgba(255,255,255,.5)", color: t.bandInk }}>{site.email}</a>}
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: t.muted }}>
        <div className="wrap">{site.fullName} · {site.title}</div>
      </footer>

      <div className="sticky"><a className="btn primary" href={cta}>לתיאום שיחה</a></div>
    </div>
  );
}
