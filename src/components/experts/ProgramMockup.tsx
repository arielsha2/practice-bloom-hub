import type { ReactNode } from "react";
import { Mic, MonitorUp, PlayCircle, Video } from "lucide-react";
import zoomEliana from "@/assets/experts/zoom-eliana.webp";
import guideModule from "@/assets/experts/guide-module.jpg";
import guidePageA from "@/assets/experts/guide-page-a.jpg";
import guidePageB from "@/assets/experts/guide-page-b.jpg";

// "What you get", as one picture: a laptop with a live Zoom lesson, a tablet with the mentor (Neri, as in the
// challenge), a phone with the recorded lessons, and the program guide (a new cover in the guide's own teal design,
// real inner pages behind it). Drawn in HTML/CSS, not a flat image, so the text stays sharp at every size: the whole
// scene is sized in container units (cqw), so it scales as one piece. The conversation on the tablet is an
// illustration of how the mentor works, not a real client's conversation.

const TEAL = "#0f4148";
const TEAL_2 = "#17656f";
const CREAM = "#f6f1e3";

const LESSONS = ["להכיר במומחיות שלך", "להיות הכתובת הנכונה", "לפתוח את הדלת למטופלים חדשים", "לדבר כך שיבינו את הערך שלך", "לתת למומחיות שלך קול"];

function Laptop() {
  return (
    <div className="absolute" style={{ left: "17%", top: "2%", width: "58%" }}>
      <div className="rounded-[1.4cqw] bg-[#1d1d1f] p-[0.9cqw] shadow-[0_2cqw_4cqw_-1cqw_rgba(0,0,0,0.45)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.5cqw] bg-[#111]">
          <img src={zoomEliana} alt="שיעור חי בזום עם אליענה" className="absolute inset-0 h-full w-full object-cover" />
          {/* the Zoom frame around the speaker */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/55 px-[1cqw] py-[0.45cqw] text-[0.95cqw] text-white" dir="rtl">
            <span className="font-semibold">שיעור חי · המומחים</span>
            <span className="flex items-center gap-[0.4cqw]">
              <span className="h-[0.7cqw] w-[0.7cqw] rounded-full bg-red-500" />
              מוקלט
            </span>
          </div>
          <div className="absolute bottom-[3.2cqw] start-[1cqw] flex gap-[0.6cqw]" dir="ltr">
            {["ר", "מ", "ש", "ד"].map((c, i) => (
              <span
                key={c}
                className="flex h-[3.6cqw] w-[5.4cqw] items-center justify-center rounded-[0.4cqw] border border-white/20 text-[1.3cqw] font-semibold text-white/85"
                style={{ background: ["#3b4a5a", "#5a3b4a", "#3b5a4a", "#5a4f3b"][i] }}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-[1.6cqw] bg-black/70 py-[0.55cqw] text-white/85">
            <Mic className="h-[1.4cqw] w-[1.4cqw]" />
            <Video className="h-[1.4cqw] w-[1.4cqw]" />
            <MonitorUp className="h-[1.4cqw] w-[1.4cqw]" />
            <span className="rounded-[0.3cqw] bg-red-600 px-[0.8cqw] py-[0.15cqw] text-[0.85cqw] font-semibold">יציאה</span>
          </div>
        </div>
      </div>
      <div className="mx-auto h-[1.3cqw] w-[108%] -translate-x-[3.7%] rounded-b-[1.2cqw] bg-gradient-to-b from-[#c9c9cc] to-[#8e8e93] shadow-[0_1cqw_2cqw_-0.5cqw_rgba(0,0,0,0.4)]" />
    </div>
  );
}

function GuideStack() {
  return (
    <div className="absolute" style={{ right: "1.5%", top: "7%", width: "21%" }}>
      <img src={guidePageB} alt="" className="absolute inset-0 aspect-[1/1.414] w-full rounded-[0.4cqw] object-cover shadow-lg" style={{ transform: "rotate(9deg) translate(6%, 2%)" }} />
      <img src={guidePageA} alt="" className="absolute inset-0 aspect-[1/1.414] w-full rounded-[0.4cqw] object-cover shadow-lg" style={{ transform: "rotate(4deg) translate(3%, 1%)" }} />
      <img src={guideModule} alt="" className="absolute inset-0 aspect-[1/1.414] w-full rounded-[0.4cqw] object-cover shadow-lg" style={{ transform: "rotate(-3deg) translate(-4%, 3%)" }} />
      {/* the cover */}
      <div
        className="relative flex aspect-[1/1.414] w-full flex-col justify-between overflow-hidden rounded-[0.4cqw] p-[1.6cqw] text-right shadow-[0_1.5cqw_3cqw_-0.5cqw_rgba(0,0,0,0.5)]"
        style={{ background: `linear-gradient(160deg, ${TEAL_2} 0%, ${TEAL} 60%)`, color: CREAM }}
        dir="rtl"
      >
        <div>
          <p className="text-[0.85cqw] tracking-wide opacity-80">מדריך התוכנית</p>
          <div className="mt-[0.6cqw] h-[0.25cqw] w-[4cqw] bg-[#e6d98a]" />
        </div>
        <div>
          <p className="text-[3.1cqw] font-bold leading-none">המומחים</p>
          <p className="mt-[0.7cqw] text-[1.05cqw] leading-snug opacity-90">ממטפל אנונימי למומחה מבוקש</p>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[0.95cqw] opacity-85">אליענה שפירא</span>
          <span className="flex" dir="ltr">
            {[0, 1, 2].map((i) => (
              <span key={i} className="-ms-[0.5cqw] block h-[2cqw] w-[1.6cqw] bg-[#2a8b97]/70" style={{ clipPath: "polygon(100% 0, 40% 50%, 100% 100%, 60% 100%, 0 50%, 60% 0)" }} />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

function MentorTablet() {
  const me = (t: string) => (
    <div className="ms-[3cqw] rounded-[0.8cqw] rounded-tl-[0.2cqw] bg-[#f3e6dc] px-[0.9cqw] py-[0.6cqw] text-[0.92cqw] leading-snug text-[#2a211d]">{t}</div>
  );
  const neri = (t: ReactNode) => (
    <div className="flex items-start gap-[0.6cqw]">
      <img src="/images/neri-avatar.png" alt="" className="h-[2.2cqw] w-[2.2cqw] shrink-0 rounded-full object-cover" />
      <div className="rounded-[0.8cqw] rounded-tr-[0.2cqw] border border-[#e8dfd3] bg-white px-[0.9cqw] py-[0.6cqw] text-[0.92cqw] leading-snug text-[#2a211d]">{t}</div>
    </div>
  );
  return (
    <div className="absolute" style={{ right: "14%", bottom: "1%", width: "23%" }}>
      <div className="rounded-[1.6cqw] bg-[#1d1d1f] p-[0.8cqw] shadow-[0_2cqw_4cqw_-1cqw_rgba(0,0,0,0.5)]">
        <div className="flex aspect-[3/4] flex-col overflow-hidden rounded-[0.9cqw] bg-[#fbf7f1]" dir="rtl">
          <div className="flex items-center gap-[0.6cqw] border-b border-[#e8dfd3] bg-white px-[1cqw] py-[0.7cqw]">
            <img src="/images/neri-avatar.png" alt="" className="h-[2cqw] w-[2cqw] rounded-full object-cover" />
            <div className="leading-tight">
              <p className="text-[1cqw] font-bold text-[#4b0b24]">המנטור</p>
              <p className="text-[0.7cqw] text-[#7a6a60]">נרי · מדייקים את הנישה</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-[0.7cqw] p-[1cqw]">
            {me("אני עובדת עם אנשים שמתמודדים עם חרדה ורוצים להרגיש טוב יותר.")}
            {neri("״אנשים עם חרדה״ זה עוד כללי. מי האדם שהכי היית רוצה לעזור לו?")}
            {me("סטודנטיות לפני מבחנים, שלא נרדמות בלילה.")}
            {neri(
              <>
                הנה ניסוח מדויק יותר:
                <span className="mt-[0.4cqw] block font-semibold text-[#9e5a38]">״אני עוזרת לסטודנטיות שלא נרדמות לפני מבחנים לחזור לישון וללמוד בראש שקט.״</span>
              </>,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordingsPhone() {
  return (
    <div className="absolute" style={{ left: "3%", bottom: "2%", width: "14.5%" }}>
      <div className="rounded-[2cqw] bg-[#1d1d1f] p-[0.7cqw] shadow-[0_2cqw_4cqw_-1cqw_rgba(0,0,0,0.5)]">
        <div className="flex aspect-[9/19] flex-col overflow-hidden rounded-[1.4cqw] bg-white" dir="rtl">
          <div className="mx-auto mt-[0.5cqw] h-[0.6cqw] w-[4cqw] rounded-full bg-[#1d1d1f]" />
          <div className="px-[0.9cqw] pt-[0.9cqw]">
            <p className="text-[1.05cqw] font-bold text-[#4b0b24]">הקלטות השיעורים</p>
            <p className="text-[0.7cqw] text-[#7a6a60]">כל מפגש זמין לצפייה</p>
          </div>
          <div className="mt-[0.6cqw] flex-1 space-y-[0.5cqw] px-[0.7cqw]">
            {LESSONS.map((t, i) => (
              <div key={t} className="flex items-center gap-[0.5cqw] rounded-[0.6cqw] bg-[#f7efe6] px-[0.6cqw] py-[0.55cqw]">
                <PlayCircle className="h-[1.3cqw] w-[1.3cqw] shrink-0 text-[#9e5a38]" />
                <span className="text-[0.72cqw] leading-tight text-[#2a211d]">
                  <span className="font-semibold">{i + 1}. </span>
                  {t}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgramMockup() {
  return (
    <figure className="mx-auto w-full max-w-5xl" aria-label="מה מקבלים בתוכנית: שיעורים חיים בזום, הקלטות, המנטור והמדריך">
      <div className="relative w-full" style={{ containerType: "inline-size" }}>
        <div className="relative w-full" style={{ aspectRatio: "16 / 10.4" }}>
          <GuideStack />
          <Laptop />
          <MentorTablet />
          <RecordingsPhone />
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">שיעורים חיים בזום · הקלטה של כל מפגש · המנטור · מדריך התוכנית</figcaption>
    </figure>
  );
}
