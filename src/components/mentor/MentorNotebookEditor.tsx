import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Highlighter, List, ListOrdered, Undo, Redo, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";


interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isRTL?: boolean;
  disabled?: boolean;
}

export interface NotebookEditorHandle {
  appendHTML: (html: string) => void;
  deleteLastSegment: () => void;
}


// Convert legacy plain text (with --- separators) to HTML once on first load.
function normalizeInitial(raw: string): string {
  if (!raw) return "";
  if (/<\/?[a-z][^>]*>/i.test(raw)) return raw; // already HTML
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return raw
    .split(/\n?---\n?/)
    .map((chunk) => {
      const paragraphs = chunk
        .split(/\n{2,}/)
        .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
        .join("");
      return paragraphs;
    })
    .join("<hr/>");
}

export const MentorNotebookEditor = forwardRef<NotebookEditorHandle, Props>(
  ({ value, onChange, placeholder, isRTL, disabled }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Highlight.configure({ multicolor: false, HTMLAttributes: { class: "notebook-highlight" } }),
        Placeholder.configure({ placeholder: placeholder || "" }),
      ],
      content: normalizeInitial(value),
      editable: !disabled,
      editorProps: {
        attributes: {
          class: `prose prose-sm max-w-none focus:outline-none min-h-full p-4 leading-relaxed ${
            isRTL ? "text-right" : "text-left"
          }`,
          dir: isRTL ? "rtl" : "ltr",
        },
      },
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    // Keep editor in sync when initial value loads asynchronously
    useEffect(() => {
      if (!editor) return;
      const current = editor.getHTML();
      const incoming = normalizeInitial(value);
      // Only reset if editor is empty and we got initial content
      if ((current === "<p></p>" || current === "") && incoming) {
        editor.commands.setContent(incoming, { emitUpdate: false });
      }
    }, [editor, value]);

    useEffect(() => {
      if (editor) editor.setEditable(!disabled);
    }, [editor, disabled]);

    useImperativeHandle(ref, () => ({
      appendHTML: (html: string) => {
        if (!editor) return;
        editor.chain().focus("end").insertContent(html).run();
      },
      deleteLastSegment: () => {
        if (!editor) return;
        const html = editor.getHTML();
        const empty =
          !html ||
          html === "<p></p>" ||
          html === "<p><br></p>" ||
          html === '<p><br class="ProseMirror-trailingBreak"></p>';
        if (empty) return;

        const hrs = html.match(/<hr[^>]*>/gi);
        if (!hrs || hrs.length === 0) {
          editor.commands.clearContent(true);
          return;
        }

        const lastHr = hrs[hrs.length - 1];
        const idx = html.lastIndexOf(lastHr);
        const newHtml = html.slice(0, Math.max(0, idx)).trim();
        editor.commands.setContent(newHtml || "<p></p>", { emitUpdate: true });
      },
    }), [editor]);


    if (!editor) return null;

    const btn = (active: boolean) =>
      `h-8 w-8 p-0 ${active ? "bg-mentor-accent/20 text-mentor-accent" : ""}`;

    return (
      <div className="flex flex-col h-full border border-border rounded-md overflow-hidden bg-background">
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-muted/40">
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bold"))}
            onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("italic"))}
            onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("underline"))}
            onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
            <UnderlineIcon className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`${btn(editor.isActive("highlight"))} relative`}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="absolute bottom-1 left-1.5 right-1.5 h-0.5 rounded-full bg-yellow-300" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bulletList"))}
            onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("orderedList"))}
            onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
            <Eraser className="w-3.5 h-3.5" />
          </Button>

          <div className="flex-1" />

          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    );
  },
);
MentorNotebookEditor.displayName = "MentorNotebookEditor";
