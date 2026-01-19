import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, 
  Image as ImageIcon, Heading1, Heading2, Heading3, Undo, Redo,
  Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  Highlighter, ExternalLink, Square
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const { t, isRTL } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [linkAsButton, setLinkAsButton] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || t('contents.form.contentPlaceholder'),
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[300px] p-4 focus:outline-none leading-relaxed',
        dir: isRTL ? 'rtl' : 'ltr',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const handleAddLink = () => {
    if (!linkUrl) return;
    
    const attrs: any = { href: linkUrl };
    if (linkNewTab) {
      attrs.target = '_blank';
      attrs.rel = 'noopener noreferrer';
    }
    if (linkAsButton) {
      attrs.class = 'cta-button';
    }
    
    editor.chain().focus().setLink(attrs).run();
    setLinkUrl('');
    setLinkAsButton(false);
    setShowLinkPopover(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName);

      editor.chain().focus().setImage({ src: publicUrl }).run();
      toast.success(t('contents.editor.imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('contents.editor.imageUploadError'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        {/* Text formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-muted' : ''}
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
          className={editor.isActive('highlight') ? 'bg-muted' : ''}
        >
          <Highlighter className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
        >
          <Heading3 className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Link with popover */}
        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={editor.isActive('link') ? 'bg-muted' : ''}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{isRTL ? 'כתובת URL' : 'URL'}</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="newTab" 
                  checked={linkNewTab}
                  onCheckedChange={(checked) => setLinkNewTab(!!checked)}
                />
                <Label htmlFor="newTab" className="font-normal text-sm">
                  <ExternalLink className="w-3 h-3 inline me-1" />
                  {isRTL ? 'פתח בלשונית חדשה' : 'Open in new tab'}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="asButton" 
                  checked={linkAsButton}
                  onCheckedChange={(checked) => setLinkAsButton(!!checked)}
                />
                <Label htmlFor="asButton" className="font-normal text-sm">
                  <Square className="w-3 h-3 inline me-1" />
                  {isRTL ? 'הצג ככפתור CTA' : 'Display as CTA button'}
                </Label>
              </div>
              <Button size="sm" onClick={handleAddLink} className="w-full">
                {isRTL ? 'הוסף קישור' : 'Add Link'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <EditorContent editor={editor} />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}
