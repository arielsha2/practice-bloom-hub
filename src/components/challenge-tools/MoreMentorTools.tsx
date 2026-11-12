import { Link } from "react-router-dom";
import { ArrowLeft, CalendarCheck, Lock, MessageCircle, Mic, Search, Tag, Users } from "lucide-react";
import { SERIF } from "@/components/challenge-tools/ToolUI";

// Shown only AFTER the therapist has seen what the tool produced: the other Mentor tools and the deliverable each
// one gives. Never on the way in.
const LOCKED = [
  { Icon: Search, name: "מציאת נישה", gives: "משפט מיקוד, כותרת לדף ובדיקה מול עמית" },
  { Icon: Tag, name: "תמחור", gives: "משפט מחיר ותשובה למי שמהסס" },
  { Icon: Mic, name: "הצגה עצמית", gives: "היכרות של 30 שניות ופסקה לאתר" },
  { Icon: Users, name: "רשת הפניות", gives: "הודעה פותחת לשלושה סוגי מפנים, ומעקב", next: true },
  { Icon: MessageCircle, name: "גישור קשר", gives: "הודעת פנייה לעמית שעוד לא מכיר אותך" },
  { Icon: CalendarCheck, name: "תרגול שיחה ראשונה", gives: "מבנה שיחה ותשובה לשאלה על המחיר" },
];

export function MoreMentorTools({ afterTool, onClick }: { afterTool: "card" | "note"; onClick?: () => void }) {
  return (
    <section className="mt-12 border-t border-mentor-border pt-10">
      <p className="section-eyebrow">במנטור</p>
      <h2 className="mt-1 text-2xl text-primary" style={{ fontFamily: SERIF }}>
        ועוד שישה כלים שמייצרים תוצרים כאלה
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {afterTool === "card"
          ? "זה חלק קטן ממה שהמנטור עושה. לכל כלי נוסף יש תוצר מוכן לשימוש, והצעד הבא אחרי הכרטיס הוא למצוא למי לשלוח אותו."
          : "זה חלק קטן ממה שהמנטור עושה. לכל כלי נוסף יש תוצר מוכן לשימוש."}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LOCKED.map(({ Icon, name, gives, next }) => (
          <div key={name} className={`relative rounded-xl border p-4 ${next && afterTool === "card" ? "border-mentor-accent bg-mentor-accent/5" : "border-mentor-border bg-card/70"}`}>
            {next && afterTool === "card" && (
              <span className="absolute -top-2.5 start-4 rounded-full bg-mentor-accent px-2.5 py-0.5 text-[11px] text-white">הצעד הבא אחרי הכרטיס</span>
            )}
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mentor-surface text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center justify-between font-semibold" style={{ fontFamily: SERIF }}>
                  {name}
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">תוצר: {gives}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/mentor"
        onClick={onClick}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        לפרטים על המנטור <ArrowLeft className="h-4 w-4" />
      </Link>
    </section>
  );
}
