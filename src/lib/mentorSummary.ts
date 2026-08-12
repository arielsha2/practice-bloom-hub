// Fetches a structured wrap-up of the mentor conversation and renders it
// as a downloadable PDF or a copyable text block. Reuses the same brand
// styling as mentorExport so the summary feels like part of the product.
import { supabase } from "@/integrations/supabase/client";

export type SummaryMsg = { role: "user" | "assistant"; content: string };

export type MentorSummary = {
  title?: string;
  goals?: string[];
  key_points?: string[];
  action_items?: string[];
  next_focus?: string;
};

// Lets a caller render its own labeled sections instead of the fixed
// goals/key_points/action_items/next_focus slots above — e.g. the diagnosis
// result dialog, whose content doesn't map cleanly onto those generic names.
// Optional everywhere it's accepted below; omitting it keeps today's exact
// behavior for existing callers (Mentor.tsx's "My chat" dropdown).
export type SummarySection = { label: string; content: string | string[] };

export async function generateMentorSummary(
  messages: SummaryMsg[],
  opts: { isRTL: boolean },
): Promise<MentorSummary> {
  const { data, error } = await supabase.functions.invoke("mentor-summary", {
    body: { messages, language: opts.isRTL ? "he" : "en" },
  });
  if (error) throw new Error(error.message || "summary_failed");
  return (data ?? {}) as MentorSummary;
}

export function summaryToText(
  summary: MentorSummary,
  opts: { isRTL: boolean },
  customSections?: SummarySection[],
): string {
  const isHe = opts.isRTL;
  const list = (arr?: string[]) =>
    (arr ?? []).map((s, i) => `${i + 1}. ${s}`).join("\n");

  if (customSections?.length) {
    const parts: string[] = [];
    if (summary.title) parts.push(`**${summary.title}**`);
    for (const { label, content } of customSections) {
      if (!content || (Array.isArray(content) && content.length === 0)) continue;
      const body = Array.isArray(content) ? list(content) : content;
      parts.push(`**${label}:**\n${body}`);
    }
    return parts.join("\n\n");
  }

  // Unchanged from before customSections existed — exact original behavior.
  const L = {
    title: isHe ? "סיכום השיחה" : "Conversation Summary",
    goals: isHe ? "מטרות החלק הזה" : "Goals of this part",
    key: isHe ? "נקודות מרכזיות שעלו" : "Key points",
    actions: isHe ? "דגשים לפעולה" : "Action highlights",
    next: isHe ? "מוקד להמשך" : "Next focus",
  };
  const parts: string[] = [];
  parts.push(`**${L.title}${summary.title ? `: ${summary.title}` : ""}**`);
  if (summary.goals?.length) parts.push(`**${L.goals}:**\n${list(summary.goals)}`);
  if (summary.key_points?.length) parts.push(`**${L.key}:**\n${list(summary.key_points)}`);
  if (summary.action_items?.length) parts.push(`**${L.actions}:**\n${list(summary.action_items)}`);
  if (summary.next_focus) parts.push(`**${L.next}:**\n${summary.next_focus}`);
  return parts.join("\n\n");
}

export async function copySummaryText(
  summary: MentorSummary,
  opts: { isRTL: boolean },
  customSections?: SummarySection[],
): Promise<void> {
  await navigator.clipboard.writeText(summaryToText(summary, opts, customSections));
}

export async function downloadSummaryPdf(
  summary: MentorSummary,
  opts: { isRTL: boolean; displayName?: string | null },
  custom?: { heading?: string; fileNamePrefix?: string; sections?: SummarySection[] },
): Promise<void> {
  const { default: html2pdf } = await import("html2pdf.js");

  const dir = opts.isRTL ? "rtl" : "ltr";
  const align = opts.isRTL ? "right" : "left";
  const isHe = opts.isRTL;
  const today = new Date();
  const dateStr = today.toLocaleDateString(isHe ? "he-IL" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fileName = `${custom?.fileNamePrefix ?? "therapykeys-mentor-summary"}-${today.toISOString().slice(0, 10)}.pdf`;

  const L = {
    heading: custom?.heading ?? (isHe ? "סיכום שיחה עם המנטור" : "Mentor Conversation Summary"),
    subtitle: isHe ? `נשמר ב-${dateStr}` : `Saved on ${dateStr}`,
    goals: isHe ? "מטרות החלק הזה בשיחה" : "Goals of this part",
    key: isHe ? "נקודות מרכזיות שעלו" : "Key points that emerged",
    actions: isHe ? "דגשים לפעולה — צעדים קונקרטיים" : "Action highlights — concrete next steps",
    next: isHe ? "מוקד להמשך" : "Next focus",
  };

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const section = (label: string, items?: string[]) => {
    if (!items?.length) return "";
    const lis = items
      .map(
        (t) =>
          `<li style="margin:0 0 8px 0;line-height:1.7;">${escapeHtml(t)}</li>`,
      )
      .join("");
    return `
      <div style="margin:0 0 18px 0;">
        <div style="font-size:14px;font-weight:700;color:#58005a;margin-bottom:8px;text-align:${align};">${escapeHtml(label)}</div>
        <ol style="margin:0;padding-${opts.isRTL ? "right" : "left"}:22px;font-size:13px;color:#1f1233;text-align:${align};">${lis}</ol>
      </div>`;
  };

  // Custom sections render as plain paragraph blocks (string content) or the
  // same numbered-list style as the legacy sections (array content) — kept
  // deliberately simple rather than adding a second visual treatment.
  const customSection = (label: string, content: string | string[]) => {
    if (Array.isArray(content)) return section(label, content);
    if (!content) return "";
    return `
      <div style="margin:0 0 18px 0;">
        <div style="font-size:14px;font-weight:700;color:#58005a;margin-bottom:8px;text-align:${align};">${escapeHtml(label)}</div>
        <div style="font-size:13px;color:#1f1233;line-height:1.7;text-align:${align};">${escapeHtml(content)}</div>
      </div>`;
  };

  const nextBlock = summary.next_focus
    ? `
      <div style="margin:6px 0 0 0;padding:14px 16px;background:#f5f2ff;border:1px solid #e3dafc;border-radius:14px;text-align:${align};">
        <div style="font-size:12px;font-weight:700;color:#58005a;margin-bottom:4px;">${escapeHtml(L.next)}</div>
        <div style="font-size:13px;color:#1f1233;line-height:1.7;">${escapeHtml(summary.next_focus)}</div>
      </div>`
    : "";

  const titleLine = summary.title
    ? `<div style="font-size:14px;color:#6b5b7a;margin-top:4px;text-align:${align};">${escapeHtml(summary.title)}</div>`
    : "";

  const bodyHtml = custom?.sections?.length
    ? custom.sections.map((s) => customSection(s.label, s.content)).join("")
    : `
    ${section(L.goals, summary.goals)}
    ${section(L.key, summary.key_points)}
    ${section(L.actions, summary.action_items)}
    ${nextBlock}`;

  const container = document.createElement("div");
  container.setAttribute("dir", dir);
  container.style.cssText = `
    font-family: 'Heebo', 'Segoe UI', sans-serif;
    color: #1f1233;
    background: #ffffff;
    padding: 24px;
    width: 720px;
    box-sizing: border-box;
  `;
  container.innerHTML = `
    <div style="border-bottom:2px solid #58005a;padding-bottom:12px;margin-bottom:18px;text-align:${align};">
      <div style="font-size:22px;font-weight:700;color:#58005a;">${escapeHtml(L.heading)}</div>
      ${titleLine}
      <div style="font-size:12px;color:#6b5b7a;margin-top:4px;">${escapeHtml(L.subtitle)}</div>
    </div>
    ${bodyHtml}
    <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e3dafc;font-size:11px;color:#9c8bb0;text-align:${align};">
      TherapyKeys · therapykeys.co.il
    </div>
  `;
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  document.body.appendChild(container);

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as any)
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
