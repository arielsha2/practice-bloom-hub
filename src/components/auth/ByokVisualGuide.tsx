import step1Img from "@/assets/byok/step1-create-key.jpg";
import step2Img from "@/assets/byok/step2-copy-key.jpg";
import step3Img from "@/assets/byok/step3-paste.jpg";

const steps = [
  { n: 1, img: step1Img, caption: 'לחצ/י על "Create API key" ב-Google AI Studio' },
  { n: 2, img: step2Img, caption: "יופיע מפתח שמתחיל ב-AIza… — העתק/י אותו" },
  { n: 3, img: step3Img, caption: "חזור/י לכאן — נזהה אותו אוטומטית, או הדבק/י ידנית" },
];

export function ByokVisualGuide() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {steps.map((s) => (
        <div
          key={s.n}
          className="relative rounded-lg border border-border bg-card overflow-hidden"
        >
          <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
            {s.n}
          </div>
          <img
            src={s.img}
            alt={`שלב ${s.n}`}
            loading="lazy"
            width={768}
            height={512}
            className="w-full aspect-[3/2] object-cover bg-muted"
          />
          <p className="text-xs text-foreground p-2 leading-snug text-right">{s.caption}</p>
        </div>
      ))}
    </div>
  );
}

export default ByokVisualGuide;
