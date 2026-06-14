import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const COPY = {
  he: {
    title: "רגע לפני שנתחיל",
    description:
      'כדי להתחיל לעבוד עם המנטור, נשמח להכיר אותך ולצרף אותך לרשימת התפוצה של "על שפת הקליניקה" — שם נשלח טיפים, עדכונים ותכנים שיעזרו לך בקליניקה.',
    nameLabel: "שם מלא",
    namePlaceholder: "השם שלך",
    errorName: "נא למלא שם מלא",
    errorConsent: "חובה לאשר הצטרפות לרשימת התפוצה כדי להמשיך",
    consent:
      'אני מאשר/ת לקבל במייל תכנים, טיפים ועדכונים מ"על שפת הקליניקה". אפשר להסיר את עצמך בכל עת.',
    consentNote: "* אישור זה הוא תנאי לשימוש במנטור. אם תסגור/י את החלון תוחזר/י למסך הבית.",
    submit: "המשך למנטור",
    close: "לא כרגע — חזרה למסך הבית",
    success: "תודה! אפשר להתחיל לעבוד עם המנטור",
  },
  en: {
    title: "One quick step before we start",
    description:
      'To start working with the mentor, we\'d love to get to know you and add you to the "Al Sfat HaClinica" mailing list — we\'ll send tips, updates, and content to help you in your clinic.',
    nameLabel: "Full name",
    namePlaceholder: "Your name",
    errorName: "Please enter your full name",
    errorConsent: "You must agree to join the mailing list to continue",
    consent:
      'I agree to receive content, tips, and updates by email from "Al Sfat HaClinica". You can unsubscribe at any time.',
    consentNote: "* This consent is required to use the mentor. If you close the window you\'ll be returned to the home page.",
    submit: "Continue to mentor",
    close: "Not now — back to home",
    success: "Thanks! You can start working with the mentor",
  },
};

/**
 * Asks users who signed up before mailing consent existed to opt in.
 * If they close the dialog, we redirect them home — mentor access requires consent.
 */
export function MailingConsentGate() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const t = COPY[language] || COPY.he;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("mailing_list_consent, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setChecked(true);
      if (data?.display_name) setName(data.display_name);
      if (!data?.mailing_list_consent) setOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function submit() {
    if (!user) return;
    if (!name.trim()) {
      toast.error(t.errorName);
      return;
    }
    if (!consent) {
      toast.error(t.errorConsent);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim(),
        mailing_list_consent: true,
        mailing_list_consent_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.success);
    setOpen(false);
  }

  function handleClose() {
    setOpen(false);
    navigate("/");
  }

  if (!user || !checked) return null;

  const dir = isRTL ? "rtl" : "ltr";
  const textAlign = isRTL ? "text-right" : "text-left";
  const marginIcon = isRTL ? "ml-2" : "mr-2";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent dir={dir} className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <MailCheck className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className={textAlign}>{t.title}</DialogTitle>
          <DialogDescription className={textAlign}>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="consent-name">{t.nameLabel}</Label>
            <Input
              id="consent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              maxLength={100}
              required
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground leading-relaxed">
              {t.consent}
              <span className="block text-xs text-muted-foreground mt-1">{t.consentNote}</span>
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <Button
              onClick={submit}
              disabled={saving || !consent || !name.trim()}
              className="w-full"
              size="lg"
            >
              {saving ? <Loader2 className={`w-4 h-4 animate-spin ${marginIcon}`} /> : null}
              {t.submit}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="w-full text-muted-foreground"
            >
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
