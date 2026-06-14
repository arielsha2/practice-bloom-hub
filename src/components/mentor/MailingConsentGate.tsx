import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Blocks mentor usage until the user has consented to join the
 * "על שפת הקליניקה" mailing list. Required by privacy/marketing compliance.
 */
export function MailingConsentGate() {
  const { user } = useAuth();
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
      toast.error("נא למלא שם מלא");
      return;
    }
    if (!consent) {
      toast.error("חובה לאשר הצטרפות לרשימת התפוצה כדי להמשיך");
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
    toast.success("תודה! אפשר להתחיל לעבוד עם המנטור");
    setOpen(false);
  }

  if (!user || !checked) return null;

  return (
    <Dialog open={open} onOpenChange={() => { /* not dismissible */ }}>
      <DialogContent
        dir="rtl"
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <MailCheck className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-right">רגע לפני שנתחיל</DialogTitle>
          <DialogDescription className="text-right">
            כדי להתחיל לעבוד עם המנטור, נשמח להכיר אותך ולצרף אותך לרשימת התפוצה של
            "על שפת הקליניקה" — שם נשלח טיפים, עדכונים ותכנים שיעזרו לך בקליניקה.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="consent-name">שם מלא</Label>
            <Input
              id="consent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="השם שלך"
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
              אני מאשר/ת לקבל במייל תכנים, טיפים ועדכונים מ"על שפת הקליניקה".
              אפשר להסיר את עצמך בכל עת.
              <span className="block text-xs text-muted-foreground mt-1">
                * אישור זה הוא תנאי לשימוש במנטור.
              </span>
            </span>
          </label>

          <Button
            onClick={submit}
            disabled={saving || !consent || !name.trim()}
            className="w-full"
            size="lg"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            המשך למנטור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
