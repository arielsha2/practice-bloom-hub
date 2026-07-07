import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const KEY = "mentor_trial_open_to_all";

export function TrialAccessToggleCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      setEnabled(data?.value === "true");
      setLoading(false);
    })();
  }, []);

  async function toggle(next: boolean) {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: KEY,
      value: next ? "true" : "false",
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
      return;
    }
    setEnabled(next);
    toast({
      title: next ? "התנסות חינם הופעלה לכולם" : "התנסות חינם כובתה",
      description: next
        ? "משתמשים חדשים יקבלו התנסות של 24 שעות באופן אוטומטי."
        : "משתמשים חדשים לא יקבלו התנסות אוטומטית. אפשר להעניק ידנית דרך ניהול משתמשים.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>התנסות חינם במנטור</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-muted-foreground max-w-xl">
          כאשר כפתור זה פעיל, כל משתמש/ת שנרשם/ת חדש/ה מקבל/ת אוטומטית 24 שעות התנסות
          חינם במנטור, וקישור "להתנסות חינם" יופיע בעמוד המכירה.
          כאשר כבוי, אפשר עדיין להעניק התנסות ידנית למשתמש/ת בודד/ת מדף ניהול המשתמשים.
        </div>
        <div className="flex items-center gap-3">
          {(loading || saving) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <Label htmlFor="trial-toggle" className="text-sm">
            {enabled ? "פעיל לכולם" : "כבוי"}
          </Label>
          <Switch
            id="trial-toggle"
            checked={enabled}
            disabled={loading || saving}
            onCheckedChange={toggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}
