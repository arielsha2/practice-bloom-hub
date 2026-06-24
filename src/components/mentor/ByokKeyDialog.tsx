import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink, KeyRound, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ByokKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional reason — e.g. "invalid" | "quota" — to show a tailored banner. */
  reason?: "missing" | "invalid" | "quota";
  /** Called after a key was saved successfully. The mentor will retry the pending send. */
  onSaved?: () => void;
}

export function ByokKeyDialog({ open, onOpenChange, reason = "missing", onSaved }: ByokKeyDialogProps) {
  const { isRTL } = useLanguage();
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("user_ai_keys")
        .select("key_hint")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (data?.key_hint) setHint(data.key_hint);
    })();
  }, [open]);

  const handleSave = async () => {
    const trimmed = key.trim();
    if (trimmed.length < 20) {
      toast.error(isRTL ? "המפתח נראה קצר מדי" : "That key looks too short");
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-user-ai-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ api_key: trimmed }),
        },
      );
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok || !body?.ok) {
        const err = body?.error;
        if (err === "invalid_key") {
          toast.error(isRTL ? "המפתח לא תקף — בדוק שהעתקת נכון" : "Invalid key — double-check you copied it correctly");
        } else if (err === "quota_exhausted") {
          toast.error(isRTL ? "המכסה של המפתח נגמרה — צור מפתח חדש" : "This key is out of quota — create a new one");
        } else {
          toast.error(isRTL ? "לא הצלחנו לאמת את המפתח" : "Couldn't validate the key");
        }
        setSaving(false);
        return;
      }
      toast.success(isRTL ? "המפתח נשמר ✓" : "Key saved ✓");
      setKey("");
      setHint(body.hint ?? null);
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? "שגיאת רשת" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const banner = reason === "invalid"
    ? (isRTL ? "המפתח שלך הפסיק לעבוד. אנא הזן מפתח חדש." : "Your Gemini key stopped working. Please paste a new one.")
    : reason === "quota"
    ? (isRTL ? "המכסה החודשית של המפתח שלך נגמרה. צור מפתח חדש או בדוק את חשבון Google AI Studio שלך." : "Your key hit its monthly quota. Create a new key or check your Google AI Studio account.")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-lg">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {isRTL ? "הפעלה אחרונה: חיבור מפתח ה-AI שלך" : "One last step: connect your AI key"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isRTL
              ? "המנטור שלך פועל על מפתח Gemini אישי וחינמי של Google. ייקח כ-2 דקות."
              : "Your mentor runs on your own free Google Gemini key. Takes ~2 minutes."}
          </DialogDescription>
        </DialogHeader>

        {banner && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3">
            {banner}
          </div>
        )}

        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">1</span>
            <div className="flex-1">
              <p className="font-medium">
                {isRTL ? "פתח את Google AI Studio" : "Open Google AI Studio"}
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-1"
              >
                aistudio.google.com/apikey <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="flex-1">
              {isRTL
                ? "התחבר עם כל חשבון Google ולחץ ״Create API key״."
                : 'Sign in with any Google account and click "Create API key".'}
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="flex-1">
              {isRTL
                ? "העתק את המפתח (מתחיל ב-AIza…) והדבק כאן:"
                : "Copy the key (starts with AIza…) and paste below:"}
            </p>
          </li>
        </ol>

        {hint && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {isRTL ? `מפתח נוכחי: ••••${hint}` : `Current key: ••••${hint}`}
          </p>
        )}

        <Input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza..."
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !saving) handleSave();
          }}
        />

        <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-md bg-muted/40 p-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            {isRTL
              ? "המפתח שלך מוצפן ונשמר בשרת שלנו בלבד. אפשר להחליף או להסיר אותו בכל רגע."
              : "Your key is encrypted and stored on our server only. You can replace or remove it any time."}
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
          {saving ? (
            <><Loader2 className="w-4 h-4 me-2 animate-spin" />{isRTL ? "מאמת..." : "Validating..."}</>
          ) : (
            <><Sparkles className="w-4 h-4 me-2" />{isRTL ? "שמור והמשך" : "Save & continue"}</>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default ByokKeyDialog;
