/**
 * Mentor chat file attachments — client-side helpers.
 *
 * Responsibilities:
 *  - Enforce type/size limits.
 *  - Extract text from PDF (pdfjs-dist) and DOCX (mammoth) on the client.
 *  - Compress images to ~1920px max edge, JPEG quality ~0.8 before base64 send.
 *  - Detect scanned PDFs (text < 50 chars) and image-only failures.
 *  - Upload the original file to Supabase storage under `<user_id>/<uuid>.<ext>`
 *    so it can be re-downloaded from the conversation history.
 *
 * We DO NOT summarize or re-send attachment content in later turns — the file
 * content is only passed to the model on the turn where it was attached.
 */

import { supabase } from "@/integrations/supabase/client";

export const MAX_FILES_PER_MESSAGE = 3;
export const MAX_TEXT_CHARS_PER_FILE = 15_000;
export const MAX_PDF_DOCX_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_BYTES_RAW = 15 * 1024 * 1024; // 15MB raw source (we compress after)
export const MAX_IMAGE_BYTES_COMPRESSED = 4 * 1024 * 1024; // 4MB after compression
export const MIN_PDF_TEXT_CHARS = 50;
export const IMAGE_MAX_EDGE_PX = 1920;

export const ALLOWED_MIME: Record<string, "pdf" | "docx" | "text" | "image"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "text",
  "text/markdown": "text",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

export type AttachmentKind = "pdf" | "docx" | "text" | "image";

export interface MentorAttachment {
  id: string; // client-side UUID
  name: string;
  mime: string;
  kind: AttachmentKind;
  size: number; // final size in bytes (post-compression for images)
  storage_path: string; // e.g. "<user_id>/<uuid>.jpg"
  /** Extracted text (for pdf/docx/text). Truncated to MAX_TEXT_CHARS_PER_FILE. */
  extracted_text?: string;
  /** True if extracted_text was cut off. */
  truncated?: boolean;
  /** For images: a `data:image/...;base64,...` URL sent to the model. */
  image_data_url?: string;
}

const uuid = () =>
  (crypto as any).randomUUID?.() ??
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const extForMime = (mime: string): string => {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "text/markdown": "md",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[mime] ?? "bin";
};

/** Read a File as an ArrayBuffer. */
const readArrayBuffer = (file: File | Blob): Promise<ArrayBuffer> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as ArrayBuffer);
    r.onerror = () => rej(r.error);
    r.readAsArrayBuffer(file);
  });

const readText = (file: File | Blob): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result ?? ""));
    r.onerror = () => rej(r.error);
    r.readAsText(file);
  });

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result ?? ""));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });

/** ---------- PDF ---------- */
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjs as any).version}/pdf.worker.min.mjs`;
  const buf = await readArrayBuffer(file);
  const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: any) => ("str" in it ? it.str : ""))
      .join(" ");
    out += pageText + "\n";
    if (out.length > MAX_TEXT_CHARS_PER_FILE * 1.2) break;
  }
  return out.trim();
}

/** ---------- DOCX ---------- */
async function extractDocxText(file: File): Promise<string> {
  const mammoth = (await import("mammoth")).default ?? (await import("mammoth"));
  const buf = await readArrayBuffer(file);
  const result = await (mammoth as any).extractRawText({ arrayBuffer: buf });
  return String(result?.value ?? "").trim();
}

/** ---------- Image compression (canvas → JPEG) ---------- */
async function compressImage(
  file: File,
): Promise<{ blob: Blob; dataUrl: string; mime: string }> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      URL.revokeObjectURL(url);
      res(el);
    };
    el.onerror = (e) => {
      URL.revokeObjectURL(url);
      rej(e);
    };
    el.src = url;
  });

  const scale = Math.min(1, IMAGE_MAX_EDGE_PX / Math.max(img.width, img.height));
  const targetW = Math.max(1, Math.round(img.width * scale));
  const targetH = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Progressive quality steps until we hit the size cap.
  const qualities = [0.8, 0.7, 0.6, 0.5, 0.4];
  for (const q of qualities) {
    const blob: Blob = await new Promise((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
        "image/jpeg",
        q,
      ),
    );
    if (blob.size <= MAX_IMAGE_BYTES_COMPRESSED || q === qualities[qualities.length - 1]) {
      const dataUrl = await blobToDataUrl(blob);
      return { blob, dataUrl, mime: "image/jpeg" };
    }
  }
  // Should be unreachable.
  const fallback: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.4),
  );
  return {
    blob: fallback,
    dataUrl: await blobToDataUrl(fallback),
    mime: "image/jpeg",
  };
}

/**
 * Validate + extract + upload a single file.
 * Throws Error with human-readable message on validation failure.
 */
export async function processMentorAttachment(
  file: File,
  userId: string,
  strings: {
    unsupported: string;
    tooLarge: string;
    scannedPdf: string;
    emptyContent: string;
    unreadable: string;
    uploadFailed: string;
  },
): Promise<MentorAttachment> {
  const kind = ALLOWED_MIME[file.type];
  if (!kind) throw new Error(strings.unsupported);

  if (kind === "image") {
    if (file.size > MAX_IMAGE_BYTES_RAW) throw new Error(strings.tooLarge);
  } else if (file.size > MAX_PDF_DOCX_BYTES) {
    throw new Error(strings.tooLarge);
  }

  const id = uuid();
  let extracted_text: string | undefined;
  let truncated = false;
  let uploadBlob: Blob = file;
  let uploadMime = file.type;
  let uploadExt = extForMime(file.type);
  let image_data_url: string | undefined;
  let finalSize = file.size;

  if (kind === "pdf") {
    let text = "";
    try {
      text = await extractPdfText(file);
    } catch (e) {
      console.error("pdf extract failed", e);
      throw new Error(strings.unreadable);
    }
    if (text.length < MIN_PDF_TEXT_CHARS) throw new Error(strings.scannedPdf);
    if (text.length > MAX_TEXT_CHARS_PER_FILE) {
      truncated = true;
      text = text.slice(0, MAX_TEXT_CHARS_PER_FILE);
    }
    extracted_text = text;
  } else if (kind === "docx") {
    let text = "";
    try {
      text = await extractDocxText(file);
    } catch (e) {
      console.error("docx extract failed", e);
      throw new Error(strings.unreadable);
    }
    if (text.trim().length < 1) throw new Error(strings.emptyContent);
    if (text.length > MAX_TEXT_CHARS_PER_FILE) {
      truncated = true;
      text = text.slice(0, MAX_TEXT_CHARS_PER_FILE);
    }
    extracted_text = text;
  } else if (kind === "text") {
    let text = "";
    try {
      text = await readText(file);
    } catch {
      throw new Error(strings.unreadable);
    }
    if (text.trim().length < 1) throw new Error(strings.emptyContent);
    if (text.length > MAX_TEXT_CHARS_PER_FILE) {
      truncated = true;
      text = text.slice(0, MAX_TEXT_CHARS_PER_FILE);
    }
    extracted_text = text;
  } else if (kind === "image") {
    let compressed: { blob: Blob; dataUrl: string; mime: string };
    try {
      compressed = await compressImage(file);
    } catch (e) {
      console.error("image compress failed", e);
      throw new Error(strings.unreadable);
    }
    uploadBlob = compressed.blob;
    uploadMime = compressed.mime;
    uploadExt = "jpg";
    image_data_url = compressed.dataUrl;
    finalSize = compressed.blob.size;
  }

  const storage_path = `${userId}/${id}.${uploadExt}`;
  const { error: upErr } = await supabase.storage
    .from("mentor-attachments")
    .upload(storage_path, uploadBlob, {
      contentType: uploadMime,
      upsert: false,
    });
  if (upErr) {
    console.error("mentor-attachments upload failed", upErr);
    throw new Error(strings.uploadFailed);
  }

  return {
    id,
    name: file.name,
    mime: uploadMime,
    kind,
    size: finalSize,
    storage_path,
    extracted_text,
    truncated,
    image_data_url,
  };
}

/** Build a signed URL (for downloading from the conversation history bubble). */
export async function getMentorAttachmentSignedUrl(
  storage_path: string,
  expiresIn = 60 * 60,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("mentor-attachments")
    .createSignedUrl(storage_path, expiresIn);
  if (error) {
    console.error("signed url failed", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
