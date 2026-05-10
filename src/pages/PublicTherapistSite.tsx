import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

interface SiteContent {
  fullName: string;
  title: string;
  avatarUrl?: string;
  keyPhrase: string;
  about: string;
  forYouIf: string[];
  phone: string;
  email: string;
}

interface Site {
  slug: string;
  content: SiteContent;
  contact_method: "form" | "calendar";
  calendar_link: string | null;
}

// Editorial "boutique therapist" palette (warm cream + deep charcoal + soft blush)
const C = {
  cream: "#F4EFE7",
  creamSoft: "#EAE3D6",
  blush: "#E9D9CC",
  ink: "#2A2D2C",
  inkSoft: "#3A3D3C",
  text: "#26272A",
  muted: "#6E6B66",
  line: "#D9D2C5",
  white: "#FFFFFF",
};

const FONT_HEAD = `"Playfair Display", "Cormorant Garamond", Georgia, "David Libre", serif`;
const FONT_BODY = `"Assistant", "Heebo", system-ui, sans-serif`;

export default function PublicTherapistSite() {
  const { slug } = useParams<{ slug: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Inject Playfair Display once
  useEffect(() => {
    const id = "tk-public-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Assistant:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("therapist_websites")
        .select("slug, content, contact_method, calendar_link")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!data) setNotFound(true);
      else setSite(data as unknown as Site);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (site?.content?.fullName) {
      document.title = `${site.content.fullName} — ${site.content.title}`;
    }
  }, [site]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 9) {
      toast.error("שם וטלפון תקפים נדרשים");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("website-submit-lead", {
        body: { therapistSlug: slug, name, phone, message },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("השליחה נכשלה. אפשר לחייג ישירות.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ background: C.cream }} className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.ink }} />
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div
        dir="rtl"
        style={{ background: C.cream, color: C.text, fontFamily: FONT_BODY }}
        className="min-h-screen flex items-center justify-center px-6 text-center"
      >
        <div>
          <h1 style={{ fontFamily: FONT_HEAD }} className="text-3xl mb-2">הדף לא נמצא</h1>
          <p style={{ color: C.muted }}>הקישור שגוי או שהדף לא פורסם.</p>
        </div>
      </div>
    );
  }

  const c = site.content;
  const initials = (c.fullName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");

  const seoDescRaw = (c.keyPhrase || c.about || "").replace(/\s+/g, " ").trim();
  const seoDesc = seoDescRaw.length > 160 ? seoDescRaw.slice(0, 157) + "..." : seoDescRaw;
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: c.fullName,
    jobTitle: c.title,
    description: seoDesc,
    url: `https://therapykeys.co.il/t/${site.slug}`,
    image: c.avatarUrl,
    address: { "@type": "PostalAddress", addressCountry: "IL" },
  };

  const showCalendar = site.contact_method === "calendar" && !!site.calendar_link;
  const ctaHref = showCalendar ? site.calendar_link! : "#contact";
  const ctaTarget = showCalendar ? "_blank" : undefined;

  return (
    <div
      dir="rtl"
      style={{
        background: C.cream,
        color: C.text,
        fontFamily: FONT_BODY,
        minHeight: "100vh",
        lineHeight: 1.6,
      }}
    >
      <SEOHead
        title={`${c.fullName} — ${c.title}`}
        description={seoDesc || `${c.fullName} — ${c.title}. קביעת שיחת היכרות.`}
        canonicalUrl={`/t/${site.slug}`}
        ogImage={c.avatarUrl}
        ogType="profile"
        jsonLd={personLd}
      />

      {/* TOP BAR */}
      <header
        style={{
          background: C.cream,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.ink, letterSpacing: 0.5 }}>
            {c.fullName}
          </div>
          <a
            href={ctaHref}
            target={ctaTarget}
            rel={ctaTarget ? "noreferrer" : undefined}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              border: `1px solid ${C.ink}`,
              color: C.ink,
              textDecoration: "none",
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
              background: "transparent",
            }}
          >
            קביעת פגישה
          </a>
        </div>
      </header>

      {/* HERO — split */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "70vh",
          background: C.cream,
        }}
        className="tk-hero"
      >
        <div
          style={{
            background: C.creamSoft,
            position: "relative",
            minHeight: 480,
            overflow: "hidden",
          }}
        >
          {c.avatarUrl ? (
            <img
              src={c.avatarUrl}
              alt={c.fullName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                position: "absolute",
                inset: 0,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_HEAD,
                fontSize: 96,
                color: C.ink,
                background: `linear-gradient(135deg, ${C.blush}, ${C.creamSoft})`,
              }}
            >
              {initials || "•"}
            </div>
          )}
        </div>

        <div
          style={{
            background: C.ink,
            color: C.cream,
            padding: "80px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
          className="tk-hero-right"
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.7,
              marginBottom: 24,
            }}
          >
            {c.title}
          </div>
          <h1
            style={{
              fontFamily: FONT_HEAD,
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 500,
              lineHeight: 1.15,
              margin: 0,
              color: C.cream,
            }}
          >
            {c.keyPhrase}
          </h1>
          <div
            style={{
              width: 64,
              height: 1,
              background: C.cream,
              opacity: 0.5,
              margin: "32px 0",
            }}
          />
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              color: C.cream,
              opacity: 0.85,
              maxWidth: 480,
              margin: 0,
            }}
          >
            {c.about}
          </p>
          <div style={{ marginTop: 40 }}>
            <a
              href={ctaHref}
              target={ctaTarget}
              rel={ctaTarget ? "noreferrer" : undefined}
              style={{
                display: "inline-block",
                padding: "16px 36px",
                border: `1px solid ${C.cream}`,
                color: C.cream,
                textDecoration: "none",
                fontSize: 13,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              {showCalendar ? "קבעו שיחת היכרות" : "השאירו פרטים"}
            </a>
          </div>
        </div>
      </section>

      {/* SIGNATURE STRIP */}
      <div
        style={{
          background: C.blush,
          padding: "56px 32px",
          textAlign: "center",
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontStyle: "italic",
            fontSize: "clamp(20px, 2.4vw, 28px)",
            color: C.ink,
            maxWidth: 760,
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          “המקום שבו את/ה נמצא/ת היום — הוא לא בהכרח המקום שבו את/ה צריך/ה להישאר.”
        </div>
      </div>

      {/* FOR YOU IF */}
      <section style={{ padding: "96px 32px", background: C.cream }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: C.muted,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            למי זה מתאים
          </div>
          <h2
            style={{
              fontFamily: FONT_HEAD,
              fontSize: "clamp(28px, 3.4vw, 42px)",
              fontWeight: 500,
              textAlign: "center",
              margin: 0,
              color: C.ink,
            }}
          >
            הדף הזה בשבילך אם...
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
              marginTop: 56,
            }}
          >
            {c.forYouIf.map((line, i) => (
              <div
                key={i}
                style={{
                  background: C.white,
                  border: `1px solid ${C.line}`,
                  padding: "36px 28px",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_HEAD,
                    fontStyle: "italic",
                    fontSize: 36,
                    color: C.blush,
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.7, color: C.text }}>{line}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT — full width quote-style */}
      <section
        style={{
          background: C.creamSoft,
          padding: "96px 32px",
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: 16,
            }}
          >
            על הדרך שלי
          </div>
          <h2
            style={{
              fontFamily: FONT_HEAD,
              fontSize: "clamp(28px, 3.4vw, 42px)",
              fontWeight: 500,
              color: C.ink,
              margin: "0 0 32px",
            }}
          >
            {c.fullName}
          </h2>
          <p
            style={{
              fontFamily: FONT_HEAD,
              fontStyle: "italic",
              fontSize: "clamp(18px, 2vw, 22px)",
              lineHeight: 1.7,
              color: C.inkSoft,
              margin: 0,
            }}
          >
            {c.about}
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: "96px 32px", background: C.cream }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: C.muted,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            יצירת קשר
          </div>
          <h2
            style={{
              fontFamily: FONT_HEAD,
              fontSize: "clamp(28px, 3.4vw, 42px)",
              fontWeight: 500,
              textAlign: "center",
              margin: "0 0 16px",
              color: C.ink,
            }}
          >
            בואו נדבר
          </h2>
          <p style={{ textAlign: "center", color: C.muted, marginBottom: 48 }}>
            שיחת היכרות קצרה, ללא התחייבות.
          </p>

          {showCalendar ? (
            <div style={{ textAlign: "center" }}>
              <a
                href={site.calendar_link!}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  background: C.ink,
                  color: C.cream,
                  padding: "18px 44px",
                  textDecoration: "none",
                  fontSize: 13,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                קביעת פגישה ביומן
              </a>
            </div>
          ) : submitted ? (
            <div
              style={{
                background: C.white,
                border: `1px solid ${C.line}`,
                padding: 48,
                textAlign: "center",
                fontFamily: FONT_HEAD,
                fontSize: 22,
                color: C.ink,
              }}
            >
              תודה. אחזור אליך בהקדם.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                background: C.white,
                border: `1px solid ${C.line}`,
                padding: 40,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם מלא"
                required
                style={inputStyle}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="טלפון"
                required
                dir="ltr"
                style={{ ...inputStyle, textAlign: "right" }}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כמה מילים על מה שמביא אותך... (לא חובה)"
                rows={4}
                style={{ ...inputStyle, resize: "vertical" as const, fontFamily: "inherit" }}
              />
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: C.ink,
                  color: C.cream,
                  border: "none",
                  padding: "16px",
                  fontSize: 13,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "שולח..." : "שליחה"}
              </button>
            </form>
          )}

          <div
            style={{
              marginTop: 56,
              display: "flex",
              justifyContent: "center",
              gap: 48,
              flexWrap: "wrap",
              fontSize: 14,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: C.muted,
                  marginBottom: 8,
                }}
              >
                טלפון
              </div>
              <a href={`tel:${c.phone}`} style={{ color: C.ink, textDecoration: "none", fontSize: 16 }}>
                {c.phone}
              </a>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: C.muted,
                  marginBottom: 8,
                }}
              >
                אימייל
              </div>
              <a href={`mailto:${c.email}`} style={{ color: C.ink, textDecoration: "none", fontSize: 16 }}>
                {c.email}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: C.ink,
          color: C.cream,
          padding: "48px 32px",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: FONT_HEAD, fontSize: 22, marginBottom: 8 }}>{c.fullName}</div>
        <div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", opacity: 0.6 }}>
          therapykeys.co.il
        </div>
      </footer>

      <style>{`
        @media (max-width: 820px) {
          .tk-hero { grid-template-columns: 1fr !important; }
          .tk-hero > div:first-child { min-height: 360px !important; }
          .tk-hero-right { padding: 56px 28px !important; }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${C.line}`,
  borderRadius: 0,
  padding: "14px 16px",
  fontSize: 15,
  outline: "none",
  background: C.white,
  fontFamily: FONT_BODY,
  color: C.text,
};
