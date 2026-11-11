import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { FONT_FAMILIES } from '@/components/challenge-tools/ToolDocuments';

// Renders a document component off-screen (in normal flow behind the page: html2canvas draws a
// detached or far-off-screen node as a blank page), waits for webfonts and images, then runs `work`
// on it. Same approach as diagnosisReportPdf.ts, so the file is the very same markup as the preview.
async function withRendered<T>(el: ReactElement, width: number, work: (node: HTMLElement) => Promise<T>): Promise<T> {
  const host = document.createElement('div');
  host.style.cssText = `position:absolute;top:0;left:0;width:${width}px;z-index:-1;pointer-events:none;background:#ffffff`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(el);
    // A background tab does not run animation frames, so a short timer backs them up (otherwise the file would wait for the tab to come back).
    await new Promise((resolve) => {
      const fin = () => resolve(null);
      requestAnimationFrame(() => requestAnimationFrame(fin));
      setTimeout(fin, 300);
    });
    // Ask for each family explicitly: a font that no element on screen uses yet is not loaded by `fonts.ready`.
    await Promise.all(FONT_FAMILIES.map((f) => document.fonts.load(`16px "${f}"`, 'אבגדהוזחטיכלמנסעפצקרשת').catch(() => [])));
    await document.fonts.ready;
    await Promise.all(
      Array.from(host.querySelectorAll('img')).map((img) =>
        img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = img.onerror = () => resolve(null); }),
      ),
    );
    return await work(host.firstElementChild as HTMLElement);
  } finally {
    root.unmount();
    host.remove();
  }
}

const save = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export async function pdfBlob(el: ReactElement, width: number): Promise<Blob> {
  const { default: html2pdf } = await import('html2pdf.js');
  return withRendered(el, width, async (node) => {
    const worker = html2pdf().set({
      margin: 0,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css'] },
    } as never); // the bundled typings omit `pagebreak`, which html2pdf.js does support
    return (await worker.from(node).outputPdf('blob')) as Blob;
  });
}

export async function pngBlob(el: ReactElement, width: number, scale = 3): Promise<Blob> {
  const { default: html2pdf } = await import('html2pdf.js');
  return withRendered(el, width, async (node) => {
    // html2pdf's worker exposes the html2canvas canvas, so html2canvas need not be imported separately.
    const canvas = (await (html2pdf() as any)
      .set({
        margin: 0,
        // a page exactly the size of the element, so the canvas is the element and nothing else
        jsPDF: {
          unit: 'mm',
          format: [(node.offsetWidth * 25.4) / 96, (node.offsetHeight * 25.4) / 96],
          orientation: node.offsetWidth > node.offsetHeight ? 'landscape' : 'portrait',
        },
        html2canvas: { scale, useCORS: true, backgroundColor: null },
      })
      .from(node)
      .toCanvas()
      .get('canvas')) as HTMLCanvasElement;
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png failed'))), 'image/png'));
  });
}

export async function downloadPdf(el: ReactElement, width: number, filename: string) {
  save(await pdfBlob(el, width), filename);
}

export async function downloadPng(el: ReactElement, width: number, filename: string, scale = 3) {
  save(await pngBlob(el, width, scale), filename);
}
