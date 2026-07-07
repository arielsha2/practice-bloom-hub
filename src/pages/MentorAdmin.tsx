import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, History, Save, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ResetMentorButton } from "@/components/mentor/ResetMentorButton";
import { TherapistHealthScores } from "@/components/mentor/TherapistHealthScores";
import { MailingListExport } from "@/components/mentor/MailingListExport";
import { TrialAccessToggleCard } from "@/components/mentor/TrialAccessToggleCard";

interface Settings {
  id?: string;
  system_prompt_he: string;
  system_prompt_en: string;
  model: string;
  temperature: number;
  max_tokens: number;
  updated_at?: string;
}

const DEFAULTS: Settings = {
  system_prompt_he: "",
  system_prompt_en: "",
  model: "google/gemini-2.5-flash",
  temperature: 0.7,
  max_tokens: 2000,
};

export default function MentorAdmin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    void load();
  }, [user, isAdmin, authLoading, adminLoading]);

  async function load() {
    setLoading(true);
    const [{ data: s }, { data: h }] = await Promise.all([
      supabase.from("mentor_ai_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("mentor_ai_settings_history").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (s) setSettings(s as any);
    setHistory(h || []);
    setLoading(false);
  }

  async function save() {
    if (!settings.system_prompt_he.trim() || !settings.system_prompt_en.trim()) {
      toast({ title: "שגיאה", description: "שני הפרומפטים חייבים להיות מלאים", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      system_prompt_he: settings.system_prompt_he,
      system_prompt_en: settings.system_prompt_en,
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    };
    const { data, error } = settings.id
      ? await supabase.from("mentor_ai_settings").update(payload).eq("id", settings.id).select().maybeSingle()
      : await supabase.from("mentor_ai_settings").insert(payload).select().maybeSingle();

    if (error) {
      toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    await supabase.from("mentor_ai_settings_history").insert({
      system_prompt_he: payload.system_prompt_he,
      system_prompt_en: payload.system_prompt_en,
      model: payload.model,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens,
      changed_by: user?.id,
    });

    if (data) setSettings(data as any);
    toast({ title: "נשמר בהצלחה", description: "הגדרות המנטור עודכנו" });
    setSaving(false);
    void load();
  }

  function restore(h: any) {
    setSettings({
      ...settings,
      system_prompt_he: h.system_prompt_he,
      system_prompt_en: h.system_prompt_en,
      model: h.model,
      temperature: Number(h.temperature),
      max_tokens: h.max_tokens,
    });
    toast({ title: "גרסה נטענה", description: "לחץ 'שמור' כדי להחיל" });
  }

  if (loading || authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ניהול המנטור</h1>
            <p className="text-muted-foreground mt-1">ערוך את ההנחיות, המודל וההגדרות של המנטור</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>חזרה</Button>
        </div>

        <TherapistHealthScores />

        <MailingListExport />

        <TrialAccessToggleCard />





        <Card>
          <CardHeader>
            <CardTitle>בדיקת חוויית מטפל חדש</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              איפוס מלא של המסע שלך במנטור (שלבים, פלטים, זיכרון בוטים והיסטוריית שיחות), כדי
              להתחיל מאפס ולחוות את המנטור כמטפל חדש לחלוטין.
            </p>
            <ResetMentorButton variant="card" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הגדרות מודל</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>מודל</Label>
              <Input value={settings.model} onChange={(e) => setSettings({ ...settings, model: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">לדוגמה: google/gemini-2.5-flash, google/gemini-2.5-pro</p>
            </div>
            <div>
              <Label>Temperature ({settings.temperature})</Label>
              <Input
                type="number" min={0} max={2} step={0.1}
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number" min={100} max={8000}
                value={settings.max_tokens}
                onChange={(e) => setSettings({ ...settings, max_tokens: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הנחיות (System Prompt)</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="he">
              <TabsList>
                <TabsTrigger value="he">עברית</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>
              <TabsContent value="he">
                <Textarea
                  dir="rtl"
                  className="min-h-[500px] font-mono text-sm"
                  value={settings.system_prompt_he}
                  onChange={(e) => setSettings({ ...settings, system_prompt_he: e.target.value })}
                />
              </TabsContent>
              <TabsContent value="en">
                <Textarea
                  dir="ltr"
                  className="min-h-[500px] font-mono text-sm"
                  value={settings.system_prompt_en}
                  onChange={(e) => setSettings({ ...settings, system_prompt_en: e.target.value })}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
            שמור שינויים
          </Button>
        </div>

        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" /> היסטוריית גרסאות ({history.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="text-sm">
                    <div className="font-medium">{format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}</div>
                    <div className="text-muted-foreground text-xs">
                      {h.model} · temp {h.temperature} · {h.max_tokens} tokens · {h.system_prompt_he?.length || 0} תווים HE
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => restore(h)}>
                    <RotateCcw className="w-4 h-4 ml-1" /> טען גרסה
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
