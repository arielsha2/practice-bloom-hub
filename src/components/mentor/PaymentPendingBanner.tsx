import { Clock, ExternalLink } from "lucide-react";

const MENTOR_SALES_URL = "https://meshulam.co.il/s/7e0acf30-e444-60ce-c935-fc7bfe8b7510";

export function PaymentPendingBanner() {
  return (
    <div
      dir="rtl"
      className="max-w-3xl mx-auto mt-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 p-4 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">ההרשמה הושלמה — עדיין אין לך גישה פעילה למנטור</h3>
          <p className="text-sm leading-relaxed">
            אם שילמת/ה לאחרונה, אישור התשלום עשוי לקחת כמה דקות והגישה תיפתח אוטומטית — אין צורך לרענן את הדף.
            אם עוד לא רכשת גישה, אפשר לעשות זאת למטה.
          </p>
          <a
            href={MENTOR_SALES_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium underline hover:no-underline"
          >
            לפרטי תשלום והרשמה <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
