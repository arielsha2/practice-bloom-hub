import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";
import { FileContentImport } from "./FileContentImport";
import { isValidSlug, slugify, uniqueSlug } from "../../../netlify/edge-functions/lib/slug";

interface Category {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
}

interface ContentFormProps {
  content?: {
    id: string;
    slug?: string | null;
    published_at?: string | null;
    title: string;
    content: string;
    language: string;
    category_id?: string | null;
    status?: string;
    excerpt?: string | null;
    featured_image_url?: string | null;
  };
  onSaved: () => void;
  onCancel: () => void;
}

export function ContentForm({ content, onSaved, onCancel }: ContentFormProps) {
  const { t, language: currentLanguage, isRTL } = useLanguage();

  const [title, setTitle] = useState(content?.title || "");
  const [contentText, setContentText] = useState(content?.content || "");
  const [language, setLanguage] = useState(content?.language || currentLanguage);
  const [categoryId, setCategoryId] = useState<string | null>(content?.category_id || null);
  const [status, setStatus] = useState(content?.status || "draft");
  const [excerpt, setExcerpt] = useState(content?.excerpt || "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(content?.featured_image_url || null);
  const [slug, setSlug] = useState(content?.slug || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .order('display_order');
      
      if (!error && data) {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // The article's address. Typed by hand it is cleaned up; left empty it is made from the title (and, once it
    // exists, it never changes by itself when the title is edited, so links that were shared keep working).
    let finalSlug = slugify(slug);
    if (slug.trim() && !isValidSlug(finalSlug)) {
      toast.error(isRTL ? "הכתובת אינה תקינה" : "The address is not valid");
      setIsSubmitting(false);
      return;
    }
    if (!finalSlug) {
      const { data: rows } = await supabase.from("contents").select("slug").not("slug", "is", null);
      finalSlug = uniqueSlug(title, (rows ?? []).map((r) => r.slug as string));
    }

    const contentData = {
      title,
      slug: finalSlug,
      content: contentText,
      language,
      category_id: categoryId,
      status,
      excerpt: excerpt || null,
      featured_image_url: featuredImageUrl,
      // an edit keeps the original publish date (it used to be reset to "now" on every save)
      published_at: status === 'published' ? (content?.published_at ?? new Date().toISOString()) : null,
    };

    try {
      if (content) {
        // Update existing content
        const { error } = await supabase
          .from("contents")
          .update(contentData)
          .eq("id", content.id);

        if (error) {
          toast.error(error.code === "23505" ? (isRTL ? "הכתובת כבר תפוסה במאמר אחר" : "That address is already used by another article") : t("contents.admin.saveError"));
          console.error("Error updating content:", error);
        } else {
          toast.success(t("contents.admin.saveSuccess"));
          onSaved();
        }
      } else {
        // Create new content
        const { error } = await supabase.from("contents").insert(contentData);

        if (error) {
          toast.error(error.code === "23505" ? (isRTL ? "הכתובת כבר תפוסה במאמר אחר" : "That address is already used by another article") : t("contents.admin.saveError"));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
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

      {/* Address (slug) */}
      <div className="space-y-2">
        <Label htmlFor="slug">{isRTL ? "כתובת המאמר (slug)" : "Article address (slug)"}</Label>
        <Input
          id="slug"
          dir="ltr"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={isRTL ? "ריק = נוצר אוטומטית מהכותרת" : "empty = made from the title"}
        />
        <p className="text-xs text-muted-foreground">
          {content?.slug
            ? isRTL
              ? "שינוי הכתובת ישבור קישורים שכבר פורסמו למאמר. עריכת הכותרת לא משנה אותה."
              : "Changing the address breaks links already shared. Editing the title does not change it."
            : isRTL
              ? "מילים בעברית או באנגלית מופרדות במקפים, למשל: שיווק-למטפלים"
              : "Words separated by hyphens, e.g. marketing-for-therapists"}
        </p>
      </div>

      {/* Category, Language, Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">{t("contents.form.category")}</Label>
          <Select value={categoryId || ""} onValueChange={(val) => setCategoryId(val || null)}>
            <SelectTrigger>
              <SelectValue placeholder={t("contents.form.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {currentLanguage === 'he' ? cat.name_he : cat.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">{t("contents.form.language")}</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="he">עברית</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t("contents.form.status")}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t("contents.status.draft")}</SelectItem>
              <SelectItem value="published">{t("contents.status.published")}</SelectItem>
              <SelectItem value="archived">{t("contents.status.archived")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">{t("contents.form.excerpt")}</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder={t("contents.form.excerptPlaceholder")}
          rows={2}
        />
      </div>

      {/* Featured Image */}
      <div className="space-y-2">
        <Label>{t("contents.form.featuredImage")}</Label>
        <ImageUpload 
          imageUrl={featuredImageUrl} 
          onImageChange={setFeaturedImageUrl} 
        />
      </div>

      {/* File Import (PDF / DOCX) */}
      <div className="space-y-2">
        <Label>{isRTL ? 'ייבוא מקובץ' : 'Import from file'}</Label>
        <FileContentImport
          onContentImported={({ title: importedTitle, content: importedContent }) => {
            if (!title && importedTitle) setTitle(importedTitle);
            setContentText(importedContent);
          }}
        />
      </div>

      {/* Rich Text Content */}
      <div className="space-y-2">
        <Label htmlFor="content">{t("contents.form.content")}</Label>
        <RichTextEditor
          content={contentText}
          onChange={setContentText}
          placeholder={t("contents.form.contentPlaceholder")}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("contents.admin.cancel")}
        </Button>
        <Button 
          type="button" 
          variant="secondary"
          onClick={() => {
            setStatus('draft');
            handleSubmit(new Event('submit') as any);
          }}
          disabled={isSubmitting}
        >
          {t("contents.admin.saveDraft")}
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          onClick={() => setStatus('published')}
        >
          {isSubmitting ? t("contents.admin.saving") : t("contents.admin.publish")}
        </Button>
      </div>
    </form>
  );
}
