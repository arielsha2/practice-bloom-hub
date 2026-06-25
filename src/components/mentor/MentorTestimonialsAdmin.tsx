import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, Image as ImageIcon, Quote, Plus, ArrowUp, ArrowDown } from "lucide-react";

const STORAGE_BUCKET = "content-images";
const STORAGE_PREFIX = "mentor-testimonials";

type Lang = "he" | "en";

interface Row {
  id: string;
  language: Lang;
  kind: "text" | "image";
  body_text: string | null;
  author: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export function MentorTestimonialsAdmin() {
  const { toast } = useToast();
  const [lang, setLang] = useState<Lang>("he");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // new item form
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    void load();
  }, [lang]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("mentor_testimonials")
      .select("*")
      .eq("language", lang)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast({ title: "שגיאת טעינה", description: error.message, variant: "destructive" });
    setRows((data as any) || []);
    setLoading(false);
  }

  async function uploadImage(f: File): Promise<string | null> {
    const ext = f.name.split(".").pop() || "jpg";
    const path = `${STORAGE_PREFIX}/${lang}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, f, {
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) {
      toast({ title: "העלאת תמונה נכשלה", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function addItem() {
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (kind === "image") {
        if (!file) {
          toast({ title: "חסרה תמונה", variant: "destructive" });
          return;
        }
        imageUrl = await uploadImage(file);
        if (!imageUrl) return;
      } else if (!text.trim()) {
        toast({ title: "חסר טקסט", variant: "destructive" });
        return;
      }

      const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
      const { error } = await supabase.from("mentor_testimonials").insert({
        language: lang,
        kind,
        body_text: kind === "text" ? text.trim() : null,
        author: author.trim() || null,
        image_url: imageUrl,
        sort_order: maxOrder + 10,
        is_active: true,
      });
      if (error) {
        toast({ title: "שמירה נכשלה", description: error.message, variant: "destructive" });
        return;
      }
      setText("");
      setAuthor("");
      setFile(null);
      toast({ title: "נוסף" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm("למחוק את ההמלצה?")) return;
    const { error } = await supabase.from("mentor_testimonials").delete().eq("id", row.id);
    if (error) {
      toast({ title: "מחיקה נכשלה", description: error.message, variant: "destructive" });
      return;
    }
    if (row.image_url && row.image_url.includes(`/${STORAGE_BUCKET}/`)) {
      const path = row.image_url.split(`/${STORAGE_BUCKET}/`)[1];
      if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    }
    await load();
  }

  async function toggleActive(row: Row) {
    await supabase
      .from("mentor_testimonials")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    await load();
  }

  async function reorder(row: Row, dir: -1 | 1) {
    const idx = rows.findIndex((r) => r.id === row.id);
    const neighbor = rows[idx + dir];
    if (!neighbor) return;
    await Promise.all([
      supabase.from("mentor_testimonials").update({ sort_order: neighbor.sort_order }).eq("id", row.id),
      supabase.from("mentor_testimonials").update({ sort_order: row.sort_order }).eq("id", neighbor.id),
    ]);
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Quote className="w-5 h-5" /> המלצות בדף המנטור
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={lang} onValueChange={(v) => setLang(v as Lang)}>
          <TabsList>
            <TabsTrigger value="he">עברית</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>

          {(["he", "en"] as Lang[]).map((l) => (
            <TabsContent key={l} value={l} className="space-y-6">
              {/* Add new */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> הוספת המלצה ({l === "he" ? "עברית" : "אנגלית"})
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={kind === "text" ? "default" : "outline"}
                    onClick={() => setKind("text")}
                  >
                    <Quote className="w-4 h-4 ml-1" /> טקסט
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={kind === "image" ? "default" : "outline"}
                    onClick={() => setKind("image")}
                  >
                    <ImageIcon className="w-4 h-4 ml-1" /> תמונה
                  </Button>
                </div>

                {kind === "text" ? (
                  <div>
                    <Label>הטקסט</Label>
                    <Textarea
                      dir={l === "he" ? "rtl" : "ltr"}
                      className="min-h-[120px]"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={l === "he" ? "ההמלצה..." : "Testimonial..."}
                    />
                  </div>
                ) : (
                  <div>
                    <Label>קובץ תמונה (JPG/PNG/WEBP)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                )}

                <div>
                  <Label>שם / חתימה (לא חובה)</Label>
                  <Input
                    dir={l === "he" ? "rtl" : "ltr"}
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder={l === "he" ? "ל.פ, פסיכולוגית קלינית" : "Sarah J., LPC"}
                  />
                </div>

                <Button onClick={addItem} disabled={saving || lang !== l}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Upload className="w-4 h-4 ml-2" />}
                  הוספה לרשימה
                </Button>
              </div>

              {/* List */}
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> טוען...
                </div>
              ) : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין עדיין המלצות בשפה זו.</p>
              ) : (
                <div className="space-y-3">
                  {rows.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 p-3 border rounded-md bg-card"
                      dir={r.language === "he" ? "rtl" : "ltr"}
                    >
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => reorder(r, -1)}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={i === rows.length - 1}
                          onClick={() => reorder(r, 1)}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        {r.kind === "image" && r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.author || ""}
                            className="max-h-32 rounded border"
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-line line-clamp-4">{r.body_text}</p>
                        )}
                        {r.author && <p className="text-xs text-muted-foreground mt-1">— {r.author}</p>}
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                          <span>{r.is_active ? "פעיל" : "כבוי"}</span>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
