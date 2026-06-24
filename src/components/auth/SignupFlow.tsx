import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, KeyRound, Sparkles, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { SignupStepper } from "./SignupStepper";
import { OtpResendButton } from "./OtpResendButton";

type Step = 1 | 2 | 3 | 4;

const normalizeEmail = (e: string) => e.trim().toLowerCase();

interface SignupFlowProps {
  /** Force-start at a specific step (e.g. resume password setup after page reload). */
  startStep?: Step;
  /** Existing email when resuming (won't be editable). */
  initialEmail?: string;
}

export function SignupFlow({ startStep = 1, initialEmail = "" }: SignupFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(startStep);
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [mailingConsent, setMailingConsent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [byokKey, setByokKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<"free" | "paid">("free");

  const callFn = async (name: string, payload: unknown) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(payload),
    });
    const body = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, body } as const;
  };

  // Step 1 — send OTP via our edge function
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeEmail(email);
    if (!normalized) return toast.error("נא להזין כתובת אימייל");
    if (!name.trim()) return toast.error("נא למלא שם מלא");
    if (!mailingConsent) return toast.error("חובה לאשר הצטרפות לרשימת התפוצה כדי להמשיך");
    setBusy(true);
    const { ok, status, body } = await callFn("signup-send-otp", {
      email: normalized,
      name: name.trim(),
      mailing_list_consent: true,
    });
    setBusy(false);
    if (!ok) {
      if (status === 429) return toast.error(`נסה/י שוב בעוד ${body?.retry_after ?? 60} שניות`);
      if (body?.error === "email_not_configured")
        return toast.error("שירות המייל לא מוגדר — פנה/י לתמיכה");
      return toast.error("לא הצלחנו לשלוח את הקוד. נסה/י שוב.");
    }
    setEmail(normalized);
    trackEvent("signup_step_complete", { step: 1 });
    setStep(2);
  };

  const resendOtp = async () => {
    const { ok, body } = await callFn("signup-send-otp", {
      email,
      name: name.trim(),
      mailing_list_consent: true,
    });
    if (!ok) {
      trackEvent("signup_otp_failed");
      toast.error(body?.error === "rate_limited" ? "נסה/י שוב עוד מעט" : "השליחה נכשלה");
      throw new Error("send failed");
    }
    trackEvent("signup_otp_resent");
    toast.success("שלחנו קוד חדש למייל");
  };

  // Step 2 — verify OTP via our edge function and set the session
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) return toast.error("הזן/י את כל 6 הספרות");
    setBusy(true);
    const { ok, body } = await callFn("signup-verify-otp", {
      email,
      code: otp,
      name: name.trim() || undefined,
      mailing_list_consent: true,
    });
    if (!ok || !body?.token_hash) {
      setBusy(false);
      trackEvent("signup_otp_failed");
      if (body?.error === "expired") return toast.error("הקוד פג תוקף — שלח/י קוד חדש");
      if (body?.error === "too_many_attempts") return toast.error("יותר מדי ניסיונות — שלח/י קוד חדש");
      return toast.error("הקוד שגוי");
    }
    // Mint a real session in the client using the token_hash from generateLink.
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: body.token_hash,
    });
    setBusy(false);
    if (verifyErr) {
      console.error(verifyErr);
      return toast.error("לא הצלחנו להשלים את ההתחברות. נסה/י שוב.");
    }
    trackEvent("signup_step_complete", { step: 2 });
    setStep(3);
  };


  // Step 3 — set password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("הסיסמה חייבת להיות באורך של 8 תווים לפחות");
    if (password !== confirmPassword) return toast.error("הסיסמאות לא תואמות");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({ password_set: true })
          .eq("id", userId);
        const { data: prof } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .maybeSingle();
        const userPlan = (prof?.plan as "free" | "paid") ?? "free";
        setPlan(userPlan);
        trackEvent("signup_step_complete", { step: 3 });
        if (userPlan === "paid") {
          trackEvent("signup_step_4_shown", { plan: "paid" });
          setStep(4);
        } else {
          trackEvent("signup_step_4_skipped", { plan: "free" });
          trackEvent("signup_complete", { had_byok: false });
          toast.success("ההרשמה הושלמה");
          navigate("/mentor");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  // Step 4 — BYOK
  const handleSaveByok = async () => {
    const trimmed = byokKey.trim();
    if (trimmed.length < 20) return toast.error("המפתח נראה קצר מדי");
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-user-ai-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ api_key: trimmed }),
        },
      );
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok || !body?.ok) {
        const err = body?.error;
        if (err === "invalid_key") toast.error("המפתח לא תקף — בדוק/י שהעתקת נכון");
        else if (err === "quota_exhausted") toast.error("המכסה של המפתח נגמרה — צור מפתח חדש");
        else toast.error("לא הצלחנו לאמת את המפתח");
        return;
      }
      trackEvent("signup_step_4_complete");
      trackEvent("signup_complete", { had_byok: true });
      toast.success("המפתח נשמר ✓");
      navigate("/mentor");
    } catch (e) {
      console.error(e);
      toast.error("שגיאת רשת");
    } finally {
      setBusy(false);
    }
  };

  // Focus mgmt for OTP step
  const otpStarted = useRef(false);
  useEffect(() => {
    if (step === 2 && !otpStarted.current) otpStarted.current = true;
  }, [step]);

  return (
    <div dir="rtl">
      <SignupStepper current={step} showStep4={plan === "paid"} />

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">שם מלא</Label>
            <Input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="השם שלך"
              maxLength={100}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">כתובת אימייל</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">נשלח לכתובת זו קוד אימות בן 6 ספרות.</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Checkbox
              checked={mailingConsent}
              onCheckedChange={(v) => setMailingConsent(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed text-right">
              אני מאשר/ת לקבל במייל תכנים, טיפים ועדכונים מ"על שפת הקליניקה". אפשר להסיר את עצמך בכל עת.
              <span className="block text-xs text-muted-foreground mt-1">* אישור זה הוא תנאי לשימוש במנטור.</span>
            </span>
          </label>
          <Button type="submit" variant="cta" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Mail className="w-4 h-4 me-2" />}
            שלח/י לי קוד אימות
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            שלחנו קוד בן 6 ספרות ל-<span className="font-semibold text-foreground">{email}</span>
          </p>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              inputMode="numeric"
              autoFocus
              onComplete={() => handleVerifyOtp()}
              containerClassName="dir-ltr"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" variant="cta" className="w-full" disabled={busy || otp.length !== 6}>
            {busy ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
            אמת/י קוד
          </Button>
          <OtpResendButton onResend={resendOtp} disabled={busy} />
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setOtp("");
            }}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            מייל שגוי? התחל/י מחדש
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSetPassword} className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            בחר/י סיסמה לכניסות עתידיות (לפחות 8 תווים).
          </p>
          <div className="space-y-2">
            <Label htmlFor="new-pass">סיסמה חדשה</Label>
            <Input
              id="new-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoFocus
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pass">אימות סיסמה</Label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" variant="cta" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <KeyRound className="w-4 h-4 me-2" />}
            שמור/י והמשך/י
          </Button>
        </form>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">הצעד האחרון: חיבור מפתח ה-AI שלך</h3>
            <p className="text-sm text-muted-foreground">
              המנטור פועל על מפתח Gemini אישי וחינמי של Google. ייקח כ-2 דקות.
            </p>
          </div>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <div className="flex-1 space-y-2">
                <div>
                  פתח/י את Google AI Studio:
                </div>
                <button
                  type="button"
                  onClick={() => window.open("https://aistudio.google.com/apikey", "_blank", "noopener,noreferrer")}
                  className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                >
                  פתיחה בלשונית חדשה <ExternalLink className="w-3 h-3" />
                </button>
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2" dir="ltr">
                  <code className="text-xs flex-1 truncate select-all">https://aistudio.google.com/apikey</code>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText("https://aistudio.google.com/apikey");
                        toast.success("הקישור הועתק");
                      } catch {
                        toast.error("ההעתקה נכשלה");
                      }
                    }}
                    className="text-xs text-primary hover:underline whitespace-nowrap"
                  >
                    העתק/י
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  אם הקישור לא נפתח — העתק/י והדבק/י את הכתובת בלשונית חדשה בדפדפן.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>התחבר/י עם חשבון Google ולחץ/י "Create API key".</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>העתק/י את המפתח (מתחיל ב-AIza…) והדבק/י כאן:</span>
            </li>
          </ol>
          <Input
            type="password"
            value={byokKey}
            onChange={(e) => setByokKey(e.target.value)}
            placeholder="AIza..."
            dir="ltr"
            autoComplete="off"
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-md bg-muted/40 p-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>המפתח שלך מוצפן ונשמר בשרת שלנו בלבד. אפשר להחליף או להסיר אותו בכל רגע.</p>
          </div>
          <Button onClick={handleSaveByok} disabled={busy} variant="cta" className="w-full">
            {busy ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Sparkles className="w-4 h-4 me-2" />}
            שמור/י והשלמ/י הרשמה
          </Button>
        </div>
      )}
    </div>
  );
}
