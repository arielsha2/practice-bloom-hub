import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { DiagnosisReportDocument } from '@/components/diagnosis/DiagnosisReportDocument';
import type { DiagnosisReport } from '@/lib/diagnosisReport';

// A4 minus 10mm margins on each side is 190mm, about 718 CSS px at 96dpi.
const PAGE_CONTENT_WIDTH_PX = 718;

// Renders the same DiagnosisReportDocument the dialog shows into an off-screen
// container and rasterises it onto A4 pages (html2pdf = html2canvas + jsPDF, so
// the text in the PDF is an image and cannot be selected). Block-level pieces
// carry the `dr-avoid` class so a page break never cuts through one.
export async function downloadDiagnosisReportPdf(
  report: DiagnosisReport,
  opts: { isRTL: boolean; displayName?: string | null },
): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');

  // In normal flow behind the page (not at a far-off-screen offset): html2canvas
  // renders a detached or far-off-screen node as a blank page.
  const host = document.createElement('div');
  host.style.cssText = `position:absolute;top:0;left:0;width:${PAGE_CONTENT_WIDTH_PX}px;z-index:-1;pointer-events:none;background:#ffffff`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(
      createElement(DiagnosisReportDocument, {
        report,
        isRTL: opts.isRTL,
        displayName: opts.displayName,
        showAppendix: true,
        width: PAGE_CONTENT_WIDTH_PX,
      }),
    );
    // Let React commit, then wait for webfonts and the logo so the capture is final.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await document.fonts.ready;
    await Promise.all(
      Array.from(host.querySelectorAll('img')).map((img) =>
        img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = img.onerror = () => resolve(null); }),
      ),
    );

    const date = (report.generatedAt ? new Date(report.generatedAt) : new Date()).toISOString().slice(0, 10);
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `therapykeys-diagnosis-${date}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.dr-avoid'] },
      } as never) // the bundled typings omit `pagebreak`, which html2pdf.js does support
      .from(host.firstElementChild as HTMLElement)
      .save();
  } finally {
    root.unmount();
    host.remove();
  }
}
