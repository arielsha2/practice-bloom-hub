import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { ByokVisualGuide } from "@/components/auth/ByokVisualGuide";
import { useByokClipboard, isLikelyGeminiKey } from "@/hooks/useByokClipboard";

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
  const looksValid = isLikelyGeminiKey(key);

  const { arm } = useByokClipboard({
    currentValue: key,
    onDetected: (k) => {
      setKey(k);
      toast.success(isRTL ? "זיהינו מפתח ב-clipboard ✓" : "Detected a key in your clipboard ✓");
    },
  });

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

  const handleOpenAIStudio = async () => {
    window.open("https://aistudio.google.com/apikey", "_blank", "noopener,noreferrer");
    await arm();
  };

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!isLikelyGeminiKey(trimmed)) {
      toast.error(
        isRTL
          ? "ודא/י שהעתקת את מפתח ה-API המלא מ-Google AI Studio ולא את ה-URL של הדף."
          : "Make sure you copied the full API key from Google AI Studio, not the page URL.",
      );
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
          toast.error(
            isRTL
              ? "ודא/י שהעתקת את מפתח ה-API המלא מ-Google AI Studio ולא את ה-URL של הדף."
              : "Make sure you copied the full API key from Google AI Studio, not the page URL.",
          );
        } else if (err === "quota_exhausted") {
          toast.error(
            isRTL
              ? "המכסה החודשית של המפתח נגמרה. צור/י מפתח חדש ב-Google AI Studio."
              : "This key is out of quota — create a new one in Google AI Studio.",
          );
        } else if (err === "invalid_format") {
          toast.error(isRTL ? "המפתח קצר מדי. ודא/י שהעתקת את כולו." : "Key too short — make sure you copied all of it.");
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
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <ByokVisualGuide />

        <div className="space-y-2">
          <Button type="button" onClick={handleOpenAIStudio} variant="cta-burgundy" size="lg" className="w-full text-base">
            <ExternalLink className="w-5 h-5 me-2" />
            {isRTL ? "פתח/י Google AI Studio בלשונית חדשה" : "Open Google AI Studio in a new tab"}
          </Button>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2" dir="ltr">
            <code className="text-xs flex-1 truncate select-all">https://aistudio.google.com/apikey</code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText("https://aistudio.google.com/apikey");
                  toast.success(isRTL ? "הקישור הועתק" : "Link copied");
                } catch {
                  toast.error(isRTL ? "ההעתקה נכשלה" : "Copy failed");
                }
              }}
              className="text-xs text-primary hover:underline whitespace-nowrap"
            >
              {isRTL ? "העתק/י" : "Copy"}
            </button>
          </div>
        </div>

        {hint && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {isRTL ? `מפתח נוכחי: ••••${hint}` : `Current key: ••••${hint}`}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="byok-dialog-input" className="text-sm">
            {isRTL ? "הדבק/י כאן את המפתח" : "Paste your key here"}
          </Label>
          <div className="relative">
            <Input
              id="byok-dialog-input"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={isRTL ? "הדבק/י כאן את מפתח ה-API שלך" : "Paste your API key here"}
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              className={`h-12 text-base ${looksValid ? "pe-10 border-green-500 focus-visible:ring-green-500" : "pe-10"}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving && looksValid) handleSave();
              }}
            />
            {looksValid && (
              <CheckCircle2 className="w-5 h-5 text-green-600 absolute end-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          {key && !looksValid && (
            <p className="text-xs text-amber-600">
              {isRTL
                ? "ודא/י שהעתקת את מפתח ה-API המלא מ-Google AI Studio ולא את ה-URL של הדף."
                : "Make sure you copied the full API key from Google AI Studio, not the page URL."}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-md bg-muted/40 p-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            {isRTL
              ? "המפתח שלך מוצפן ונשמר בשרת שלנו בלבד. אפשר להחליף או להסיר אותו בכל רגע."
              : "Your key is encrypted and stored on our server only. You can replace or remove it any time."}
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !looksValid}
          size="lg"
          className={`w-full ${looksValid && !saving ? "animate-pulse" : ""}`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 me-2 animate-spin" />{isRTL ? "מאמת מול Google..." : "Validating with Google..."}</>
          ) : (
            <><Sparkles className="w-4 h-4 me-2" />{isRTL ? "שמור והמשך" : "Save & continue"}</>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default ByokKeyDialog;
