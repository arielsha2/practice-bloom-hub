import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ContentFormProps {
  content?: {
    id: string;
    title: string;
    content: string;
    language: string;
  };
  onSaved: () => void;
  onCancel: () => void;
}

export function ContentForm({ content, onSaved, onCancel }: ContentFormProps) {
  const { t, language: currentLanguage } = useLanguage();

  const [title, setTitle] = useState(content?.title || "");
  const [contentText, setContentText] = useState(content?.content || "");
  const [language, setLanguage] = useState(content?.language || currentLanguage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (content) {
        // Update existing content
        const { error } = await supabase
          .from("contents")
          .update({
            title,
            content: contentText,
            language,
          })
          .eq("id", content.id);

        if (error) {
          toast.error(t("contents.admin.saveError"));
          console.error("Error updating content:", error);
        } else {
          toast.success(t("contents.admin.saveSuccess"));
          onSaved();
        }
      } else {
        // Create new content
        const { error } = await supabase.from("contents").insert({
          title,
          content: contentText,
          language,
          is_published: true,
        });

        if (error) {
          toast.error(t("contents.admin.saveError"));
          console.error("Error creating content:", error);
        } else {
          toast.success(t("contents.admin.saveSuccess"));
          onSaved();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t("contents.form.title")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("contents.form.titlePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">{t("contents.form.language")}</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="he">ע</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">{t("contents.form.content")}</Label>
        <Textarea
          id="content"
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          placeholder={t("contents.form.contentPlaceholder")}
          rows={10}
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("contents.admin.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("contents.admin.saving") : t("contents.admin.save")}
        </Button>
      </div>
    </form>
  );
}
