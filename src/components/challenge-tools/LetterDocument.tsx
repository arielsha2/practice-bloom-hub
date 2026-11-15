import { forwardRef } from "react";
import { PAGE_H, PAGE_W } from "@/components/challenge-tools/ToolDocuments";

// The day-2 personal letter as a printable A4 page (rasterised by challengeToolsExport.downloadPdf, the same way as
// the day-1 card). Fixed hex colours and inline styles only: the PDF is drawn by html2canvas, outside the app theme.
// A letter longer than one page simply continues on a second page. No footer or site name: the letter is the
// therapist's own, meant to be sent to clients.

const C = { ink: "#1e1a18", burgundy: "#4b0b24", terracotta: "#9e5a38", paper: "#fdfaf4" };
const SERIF = "'Frank Ruhl Libre', 'Miriam Libre', serif";

export const LetterPdfDocument = forwardRef<HTMLDivElement, { letter: string }>(({ letter }, ref) => {
  const paragraphs = letter
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const words = letter.trim().split(/\s+/).length;
  const size = words > 300 ? 16 : words > 230 ? 17.5 : 19;
  return (
    <div
      ref={ref}
      dir="rtl"
      style={{ width: PAGE_W, minHeight: PAGE_H, boxSizing: "border-box", background: C.paper, color: C.ink, padding: "88px 96px 72px", fontFamily: SERIF }}
    >
      <div style={{ height: 3, width: 64, background: C.terracotta, marginBottom: 48 }} />
      {paragraphs.map((p, i) => (
        <p key={i} style={{ fontSize: size, lineHeight: 1.85, margin: "0 0 18px", whiteSpace: "pre-wrap" }}>
          {p}
        </p>
      ))}
    </div>
  );
});
LetterPdfDocument.displayName = "LetterPdfDocument";
