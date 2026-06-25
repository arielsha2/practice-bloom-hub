// Utilities for exporting the mentor conversation as PDF or plain text.
// PDF rendering is done client-side via html2pdf.js (lazy-loaded) so Hebrew/RTL
// renders naturally using the Heebo font already loaded on the page.

export type ExportMsg = { role: "user" | "assistant"; content: string };

// Strip internal markup that should never appear in user-facing exports.
const cleanContent = (raw: string): string =>
  (raw || "")
    .replace(/\[HANDOFF:[a-z-]+\]/gi, "")
    .replace(/\[INSIGHT\]/gi, "")
    .trim();

export function conversationToText(
  messages: ExportMsg[],
  opts: { isRTL: boolean; userLabel?: string; mentorLabel?: string }
): string {
  const userLabel = opts.userLabel ?? (opts.isRTL ? "את/ה" : "You");
  const mentorLabel = opts.mentorLabel ?? (opts.isRTL ? "המנטור" : "Mentor");
  return messages
    .map((m) => {
      const label = m.role === "user" ? userLabel : mentorLabel;
      return `**${label}:**\n${cleanContent(m.content)}`;
    })
    .filter((s) => s.trim().length > 0)
    .join("\n\n---\n\n");
}

export async function copyConversationText(
  messages: ExportMsg[],
  opts: { isRTL: boolean }
): Promise<void> {
  const text = conversationToText(messages, opts);
  await navigator.clipboard.writeText(text);
}

// Build an off-screen HTML container styled with brand tokens, render it to PDF.
export async function downloadConversationPdf(
  messages: ExportMsg[],
  opts: { isRTL: boolean; displayName?: string | null }
): Promise<void> {
  const { default: html2pdf } = await import("html2pdf.js");

  const dir = opts.isRTL ? "rtl" : "ltr";
  const align = opts.isRTL ? "right" : "left";
  const today = new Date();
  const dateStr = today.toLocaleDateString(opts.isRTL ? "he-IL" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fileName = `therapykeys-mentor-${today.toISOString().slice(0, 10)}.pdf`;

  const title = opts.isRTL
    ? `שיחה עם המנטור${opts.displayName ? ` — ${opts.displayName}` : ""}`
    : `Mentor conversation${opts.displayName ? ` — ${opts.displayName}` : ""}`;
  const subtitle = opts.isRTL ? `נשמר ב-${dateStr}` : `Saved on ${dateStr}`;
  const userLabel = opts.isRTL ? "את/ה" : "You";
  const mentorLabel = opts.isRTL ? "המנטור" : "Mentor";

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const rows = messages
    .map((m) => {
      const content = cleanContent(m.content);
      if (!content) return "";
      const isUser = m.role === "user";
      const label = isUser ? userLabel : mentorLabel;
      const bg = isUser ? "#58005a" : "#f5f2ff";
      const color = isUser ? "#ffffff" : "#1f1233";
      const border = isUser ? "#58005a" : "#e3dafc";
      return `
        <div style="margin:0 0 14px 0;">
          <div style="font-size:11px;color:#6b5b7a;margin-bottom:4px;text-align:${align};">${escapeHtml(label)}</div>
          <div style="background:${bg};color:${color};border:1px solid ${border};border-radius:14px;padding:12px 16px;font-size:13px;line-height:1.7;white-space:pre-wrap;text-align:${align};">${escapeHtml(content)}</div>
        </div>`;
    })
    .filter(Boolean)
    .join("");

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
      <div style="font-size:22px;font-weight:700;color:#58005a;">${escapeHtml(title)}</div>
      <div style="font-size:12px;color:#6b5b7a;margin-top:4px;">${escapeHtml(subtitle)}</div>
    </div>
    ${rows}
    <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e3dafc;font-size:11px;color:#9c8bb0;text-align:${align};">
      TherapyKeys · therapykeys.co.il
    </div>
  `;
  // Off-screen but rendered for html2canvas
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
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
