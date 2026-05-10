import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, ExternalLink } from "lucide-react";

function romanize(s: string) {
  // Simple Hebrew → latin mapping; falls back to slugified ascii of whatever's left.
  const map: Record<string, string> = {
    "א": "a", "ב": "b", "ג": "g", "ד": "d", "ה": "h", "ו": "v", "ז": "z",
    "ח": "ch", "ט": "t", "י": "y", "כ": "k", "ך": "k", "ל": "l", "מ": "m",
    "ם": "m", "נ": "n", "ן": "n", "ס": "s", "ע": "a", "פ": "p", "ף": "f",
    "צ": "tz", "ץ": "tz", "ק": "k", "ר": "r", "ש": "sh", "ת": "t",
  };
  return s
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "therapist";
}

export default function WebsiteBuilder() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [keyPhrase, setKeyPhrase] = useState("");
  const [about, setAbout] = useState("");
  const [forYouIf, setForYouIf] = useState<string[]>(["", "", ""]);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hasCalendly, setHasCalendly] = useState(false);
  const [calendarLink, setCalendarLink] = useState("");

  const [existingSlug, setExistingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      // Load existing site (if any)
      const { data: existing } = await supabase
        .from("therapist_websites")
        .select("slug, content, contact_method, calendar_link")
        .eq("user_id", user.id)
        .maybeSingle();

      const c = (existing?.content as any) ?? {};

      setFullName(c.fullName ?? "");
      setTitle(c.title ?? "");
      setAvatarUrl(c.avatarUrl ?? "");
      setPhone(c.phone ?? "");
      setEmail(c.email ?? user.email ?? "");
      setExistingSlug(existing?.slug ?? null);
      setHasCalendly(existing?.contact_method === "calendar");
      setCalendarLink(existing?.calendar_link ?? "");

      if (c.keyPhrase || c.about || c.forYouIf) {
        setKeyPhrase(c.keyPhrase ?? "");
        setAbout(c.about ?? "");
        setForYouIf(Array.isArray(c.forYouIf) && c.forYouIf.length === 3 ? c.forYouIf : ["", "", ""]);
        setLoading(false);
        return;
      }

      // First-time: ask AI for a draft
      try {
        const { data, error } = await supabase.functions.invoke("website-generate-content", {});
        if (error) throw error;
        setKeyPhrase(data?.keyPhrase ?? "");
        setAbout(data?.about ?? "");
        setForYouIf(Array.isArray(data?.forYouIf) && data.forYouIf.length === 3 ? data.forYouIf : ["", "", ""]);
      } catch (e) {
        console.error(e);
        toast.error("לא הצלחנו לייצר טיוטה אוטומטית. אפשר למלא ידנית.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, navigate]);

  async function handlePhotoUpload(file: File) {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("therapist-websites")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("therapist-websites").getPublicUrl(path);
      setAvatarUrl(pub.publicUrl);
      toast.success("התמונה הועלתה");
    } catch (e: any) {
      console.error(e);
      toast.error("העלאת התמונה נכשלה");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let n = 1;
    while (true) {
      const { data } = await supabase
        .from("therapist_websites")
        .select("user_id")
        .eq("slug", candidate)
        .maybeSingle();
      if (!data || (existingSlug === candidate)) return candidate;
      n++;
      candidate = `${base}-${n}`;
      if (n > 50) return `${base}-${Date.now()}`;
    }
  }

  async function handlePublish() {
    if (!user) return;
    if (!fullName.trim() || !title.trim() || !phone.trim() || !email.trim() || !keyPhrase.trim()) {
      toast.error("חסרים שדות חובה");
      return;
    }
    if (forYouIf.some((s) => !s.trim())) {
      toast.error("מלאו את שלושת המשפטים של 'הדף הזה בשבילך אם...'");
      return;
    }
    setSubmitting(true);
    try {
      const baseSlug = romanize(fullName);
      const slug = existingSlug ?? (await uniqueSlug(baseSlug));

      const content = {
        fullName, title, avatarUrl, keyPhrase, about, forYouIf, phone, email,
      };

      const { error } = await supabase
        .from("therapist_websites")
        .upsert(
          {
            user_id: user.id,
            slug,
            is_published: true,
            content,
            contact_method: hasCalendly && calendarLink.trim() ? "calendar" : "form",
            calendar_link: hasCalendly ? calendarLink.trim() || null : null,
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      toast.success("הדף שלך פורסם!");
      navigate(`/t/${slug}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "פרסום נכשל");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          מכין טיוטה אוטומטית מהמסע שלך...
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-secondary py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif font-semibold mb-2">בניית הדף האישי שלך</h1>
        <p className="text-muted-foreground mb-8">
          השדות הטקסטואליים נכתבו אוטומטית מהמסע שלך. ערוך רק מה שלא מרגיש לך נכון.
        </p>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>שם מלא *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ד״ר ישראל ישראלי" />
          </div>

          <div className="space-y-2">
            <Label>תואר מקצועי *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="פסיכותרפיסט מוסמך" />
          </div>

          <div className="space-y-2">
            <Label>תמונת פרופיל</Label>
            <div className="flex items-center gap-4">
              {avatarUrl && (
                <img src={avatarUrl} alt="profile" className="w-20 h-20 rounded-full object-cover border" />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent transition-colors text-sm">
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {avatarUrl ? "החלף תמונה" : "העלה תמונה"}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>משפט מפתח * <span className="text-xs text-muted-foreground">(עד 100 תווים)</span></Label>
            <Input
              value={keyPhrase}
              onChange={(e) => setKeyPhrase(e.target.value.slice(0, 100))}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>פסקה אישית * <span className="text-xs text-muted-foreground">(עד 250 תווים)</span></Label>
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value.slice(0, 250))}
              maxLength={250}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>הדף הזה בשבילך אם... *</Label>
            {forYouIf.map((line, i) => (
              <Input
                key={i}
                value={line}
                onChange={(e) => {
                  const next = [...forYouIf];
                  next[i] = e.target.value;
                  setForYouIf(next);
                }}
                className="mb-2"
                placeholder={`משפט ${i + 1}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>טלפון *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>אימייל *</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" type="email" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">יש לי קישור Calendly או יומן חיצוני</Label>
              <p className="text-xs text-muted-foreground mt-1">
                במקום טופס יצירת קשר, נציג כפתור שמעביר ליומן שלך.
              </p>
            </div>
            <Switch checked={hasCalendly} onCheckedChange={setHasCalendly} />
          </div>

          {hasCalendly && (
            <div className="space-y-2">
              <Label>קישור היומן</Label>
              <Input
                value={calendarLink}
                onChange={(e) => setCalendarLink(e.target.value)}
                placeholder="https://calendly.com/..."
                dir="ltr"
              />
            </div>
          )}

          <Button
            onClick={handlePublish}
            disabled={submitting}
            size="lg"
            className="w-full bg-primary text-primary-foreground"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : existingSlug ? (
              "עדכן ופרסם מחדש"
            ) : (
              "פרסם את הדף שלי"
            )}
          </Button>

          {existingSlug && (
            <a
              href={`/t/${existingSlug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              צפייה בדף החי
            </a>
          )}
        </Card>
      </div>
    </div>
  );
}
