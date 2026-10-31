import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { TherapistSite, type SiteStyle, type SiteView } from "@/components/site/TherapistSite";

// Design aid: the three styles on invented sample content (not a real therapist). Not linked from anywhere.
const SAMPLE: SiteView = {
  fullName: "ד״ר מאיה לוין",
  title: "פסיכולוגית קלינית, טיפול זוגי",
  keyPhrase: "אני מלווה זוגות אחרי לידה ראשונה לחזור לדבר, ולמצוא שוב זמן זה לזה",
  heroLine: "טיפול זוגי ממוקד רגש להורים טריים, בקליניקה בחיפה ובאונליין.",
  about:
    "אחרי הלידה הראשונה הרבה זוגות מגלים שהם כבר לא מזהים את עצמם. הריבים מתרבים, אין זמן, וכל אחד מרגיש לבד באותו בית.\n\nאני עובדת עם זוגות בדיוק בנקודה הזו. העבודה שלנו קטנה ומעשית: להבין מה קורה ביניכם כשאתם עייפים, ללמוד לדבר בלי להתפוצץ, ולבנות שוב רגעים של קרבה.",
  forYouIf: [
    "הריבים התרבו מאז שהתינוק נולד, ואתם לא מצליחים לעצור אותם",
    "אין לכם זמן אחד לשני, ואתם מרגישים שהקשר הולך לאיבוד",
    "אתם רוצים לחזור להרגיש צוות, ולא רק שני אנשים עייפים",
  ],
  firstSession: [
    "שיחה טלפונית קצרה, בלי עלות, כדי להבין אם אנחנו מתאימות",
    "פגישה ראשונה לשניכם, שבה מספרים מה קרה ומה היה רוצים לשנות",
    "תוכנית עבודה קצרה ומעשית, שמתחילים ממנה כבר בשבוע הבא",
  ],
  faq: [
    { q: "כמה פגישות צריך?", a: "זה משתנה מזוג לזוג. בדרך כלל כבר אחרי כמה פגישות מרגישים שינוי, ובפגישה השנייה אנחנו מסכמים יחד איך להמשיך." },
    { q: "אפשר להגיע רק אחד מאיתנו?", a: "אפשר. לפעמים מתחילים בפגישה אחת לבד, ומצרפים את בן או בת הזוג כשמרגישים מוכנים." },
    { q: "מה עם התינוק?", a: "אפשר להביא אותו, ואפשר גם לקיים את הפגישות באונליין מהבית, בשעה שנוחה בין האכלות." },
    { q: "איך קובעים?", a: "בהודעה בווצאפ או בשיחת טלפון. אענה בתוך יום." },
  ],
  phone: "050-1234567",
  email: "maya@example.com",
  location: "חיפה · גם אונליין",
};

export default function SiteStylesPreview() {
  const [params, setParams] = useSearchParams();
  const style = (["warm", "modern", "classic"].includes(params.get("v") ?? "") ? params.get("v") : "warm") as SiteStyle;
  const labels: Record<SiteStyle, string> = { warm: "חם ורגוע", modern: "מודרני נקי", classic: "קלאסי ומקצועי" };
  return (
    <div>
      <SEOHead title="תצוגת סגנונות" description="תצוגה פנימית" canonicalUrl="https://therapykeys.co.il/" noindex />
      <div dir="rtl" style={{ position: "sticky", top: 0, zIndex: 50, background: "#111", color: "#fff", padding: "10px 16px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, opacity: 0.7 }}>תוכן לדוגמה (לא מטפל אמיתי):</span>
        {(Object.keys(labels) as SiteStyle[]).map((k) => (
          <button
            key={k}
            onClick={() => setParams({ v: k })}
            style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid #fff", background: k === style ? "#fff" : "transparent", color: k === style ? "#111" : "#fff", cursor: "pointer" }}
          >
            {labels[k]}
          </button>
        ))}
      </div>
      <TherapistSite site={SAMPLE} style={style} />
    </div>
  );
}
