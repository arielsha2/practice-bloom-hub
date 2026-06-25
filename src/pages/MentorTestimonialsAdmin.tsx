import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Save, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

type Testimonial = {
  id: string;
  language: string;
  kind: string;
  body_text: string | null;
  author: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const BUCKET = "content-images";

export default function MentorTestimonialsAdmin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { isRTL } = useLanguage();
  const [lang, setLang] = useState<"he" | "en">("he");
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) navigate("/auth");
      else if (!isAdmin) navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mentor_testimonials")
      .select("*")
      .eq("language", lang)
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data as Testimonial[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, isAdmin]);

  const updateLocal = (id: string, patch: Partial<Testimonial>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const save = async (item: Testimonial) => {
    setSavingId(item.id);
    const { error } = await supabase
      .from("mentor_testimonials")
      .update({
        body_text: item.body_text,
        author: item.author,
        image_url: item.image_url,
        sort_order: item.sort_order,
        is_active: item.is_active,
      })
      .eq("id", item.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(isRTL ? "נשמר" : "Saved");
  };

  const remove = async (id: string) => {
    if (!confirm(isRTL ? "למחוק עדות זו?" : "Delete this testimonial?")) return;
    const { error } = await supabase.from("mentor_testimonials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success(isRTL ? "נמחק" : "Deleted");
    }
  };

  const add = async () => {
    const max = items.reduce((m, x) => Math.max(m, x.sort_order || 0), 0);
    const { data, error } = await supabase
      .from("mentor_testimonials")
      .insert({
        language: lang,
        kind: "text",
        body_text: "",
        author: "",
        image_url: null,
        sort_order: max + 1,
        is_active: true,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setItems((prev) => [...prev, data as Testimonial]);
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= items.length) return;
    const a = items[idx];
    const b = items[j];
    const newItems = [...items];
    newItems[idx] = { ...a, sort_order: b.sort_order };
    newItems[j] = { ...b, sort_order: a.sort_order };
    setItems(newItems);
    await Promise.all([
      supabase.from("mentor_testimonials").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("mentor_testimonials").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  };

  const uploadImage = async (id: string, file: File) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `mentor-testimonials/${id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    updateLocal(id, { image_url: data.publicUrl });
    await supabase.from("mentor_testimonials").update({ image_url: data.publicUrl }).eq("id", id);
    toast.success(isRTL ? "התמונה הועלתה" : "Image uploaded");
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{isRTL ? "עורך עדויות" : "Testimonials Editor"}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isRTL
                ? "ניהול עדויות המוצגות בקרוסלה בעמוד המכירה של המנטור."
                : "Manage testimonials shown in the Mentor sales-page carousel."}
            </p>
          </div>
          <Button onClick={add} className="gap-2">
            <Plus className="w-4 h-4" />
            {isRTL ? "עדות חדשה" : "New testimonial"}
          </Button>
        </div>

        <Tabs value={lang} onValueChange={(v) => setLang(v as "he" | "en")}>
          <TabsList>
            <TabsTrigger value="he">עברית</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>

          <TabsContent value={lang} className="mt-6 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                {isRTL ? "אין עדויות עדיין." : "No testimonials yet."}
              </p>
            ) : (
              items.map((item, idx) => (
                <Card key={item.id}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs text-muted-foreground">
                        #{item.sort_order} · {item.id.slice(0, 8)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => move(item.id, -1)} disabled={idx === 0}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => move(item.id, 1)}
                          disabled={idx === items.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2 mx-2">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={(v) => updateLocal(item.id, { is_active: v })}
                          />
                          <span className="text-xs text-muted-foreground">
                            {isRTL ? "פעיל" : "Active"}
                          </span>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => remove(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-[120px_1fr] gap-4">
                      <div className="flex flex-col items-center gap-2">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            className="w-24 h-24 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            {isRTL ? "ללא תמונה" : "No image"}
                          </div>
                        )}
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadImage(item.id, f);
                            }}
                          />
                          <span className="text-xs inline-flex items-center gap-1 text-primary underline">
                            <Upload className="w-3 h-3" />
                            {isRTL ? "העלאה" : "Upload"}
                          </span>
                        </label>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">{isRTL ? "טקסט העדות" : "Quote"}</Label>
                          <Textarea
                            value={item.body_text || ""}
                            onChange={(e) => updateLocal(item.id, { body_text: e.target.value })}
                            rows={4}
                            dir={lang === "he" ? "rtl" : "ltr"}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{isRTL ? "שם / תיאור" : "Name / details"}</Label>
                          <Input
                            value={item.author || ""}
                            onChange={(e) => updateLocal(item.id, { author: e.target.value })}
                            dir={lang === "he" ? "rtl" : "ltr"}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => save(item)} disabled={savingId === item.id} className="gap-2">
                        {savingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isRTL ? "שמירה" : "Save"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
