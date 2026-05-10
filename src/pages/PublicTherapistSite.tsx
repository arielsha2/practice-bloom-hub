import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

const STYLES = {
  bg: "#FAF8F5",
  card: "#FFFFFF",
  accent: "#6B5B8B",
  cta: "#E8917A",
  text: "#2D2D2D",
  muted: "#6B6B6B",
};

export default function PublicTherapistSite() {
  const { slug } = useParams<{ slug: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  // Update <title>
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
      <div dir="rtl" style={{ background: STYLES.bg }} className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: STYLES.accent }} />
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div dir="rtl" style={{ background: STYLES.bg, color: STYLES.text, fontFamily: "Assistant, Heebo, sans-serif" }} className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">הדף לא נמצא</h1>
          <p style={{ color: STYLES.muted }}>הקישור שגוי או שהדף לא פורסם.</p>
        </div>
      </div>
    );
  }

  const c = site.content;

  return (
    <div
      dir="rtl"
      style={{
        background: STYLES.bg,
        color: STYLES.text,
        fontFamily: "Assistant, Heebo, sans-serif",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* HERO */}
        <section style={{ padding: "48px 24px", textAlign: "center" }}>
          {c.avatarUrl && (
            <img
              src={c.avatarUrl}
              alt={c.fullName}
              style={{
                width: 120, height: 120, borderRadius: "50%", objectFit: "cover",
                margin: "0 auto 24px", display: "block",
                border: `3px solid ${STYLES.card}`, boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            />
          )}
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>{c.fullName}</h1>
          <p style={{ color: STYLES.muted, fontSize: 16, margin: "0 0 24px" }}>{c.title}</p>
          <p style={{ fontSize: 18, lineHeight: 1.5, margin: "0 0 32px" }}>{c.keyPhrase}</p>
          <a
            href="#contact"
            style={{
              display: "inline-block",
              background: STYLES.cta,
              color: "#fff",
              padding: "14px 32px",
              borderRadius: 999,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            דברו איתי ↓
          </a>
        </section>

        {/* ABOUT */}
        <section style={{ padding: "48px 24px" }}>
          <div
            style={{
              background: STYLES.card,
              borderRadius: 16,
              padding: 32,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            {c.about}
          </div>
        </section>

        {/* FOR YOU IF */}
        <section style={{ padding: "48px 24px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24, textAlign: "center" }}>
            הדף הזה בשבילך אם...
          </h2>
          <div
            style={{
              background: "rgba(107, 91, 139, 0.06)",
              borderRadius: 16,
              padding: 28,
            }}
          >
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {c.forYouIf.map((line, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "10px 0",
                    fontSize: 16,
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: STYLES.accent, fontWeight: 700, fontSize: 18, flexShrink: 0 }}>✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" style={{ padding: "48px 24px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24, textAlign: "center" }}>
            דברו איתי
          </h2>

          {site.contact_method === "calendar" && site.calendar_link ? (
            <div style={{ textAlign: "center" }}>
              <a
                href={site.calendar_link}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  background: STYLES.cta,
                  color: "#fff",
                  padding: "14px 32px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                קבעו שיחה ביומן
              </a>
            </div>
          ) : submitted ? (
            <div
              style={{
                background: STYLES.card,
                borderRadius: 16,
                padding: 32,
                textAlign: "center",
                fontSize: 16,
              }}
            >
              תודה! הפנייה נשלחה ואני אחזור אליך בהקדם.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                background: STYLES.card,
                borderRadius: 16,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 14,
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
                  background: STYLES.cta,
                  color: "#fff",
                  border: "none",
                  padding: "14px",
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "שולח..." : "שלחו"}
              </button>
            </form>
          )}

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 15, color: STYLES.muted }}>
            <div>
              <a href={`tel:${c.phone}`} style={{ color: STYLES.accent, textDecoration: "none" }}>
                {c.phone}
              </a>
            </div>
            <div style={{ marginTop: 4 }}>
              <a href={`mailto:${c.email}`} style={{ color: STYLES.accent, textDecoration: "none" }}>
                {c.email}
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: "24px", textAlign: "center", fontSize: 12, color: STYLES.muted }}>
          therapykeys.co.il
        </footer>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #E5E1D8",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 15,
  outline: "none",
  background: "#fff",
};
