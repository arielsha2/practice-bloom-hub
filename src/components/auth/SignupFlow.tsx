import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { SignupStepper } from "./SignupStepper";
import { OtpResendButton } from "./OtpResendButton";

type Step = 1 | 2 | 3;

const normalizeEmail = (e: string) => e.trim().toLowerCase();

interface SignupFlowProps {
  /** Force-start at a specific step (e.g. resume password setup after page reload). */
  startStep?: Step;
  /** Existing email when resuming (won't be editable). */
  initialEmail?: string;
  /** Where to land once signup is actually done — /mentor by default. */
  redirectTo?: string;
  /**
   * Skip step 3 (password) entirely — used by the diagnosis entry point so a
   * new visitor goes straight from "enter your details" to the conversation
   * instead of being stopped by a mandatory password screen. Safe to skip:
   * verifyOtp already mints a real session (see handleVerifyOtp below), and
   * OTP-based login ("מייל + קוד") already exists as a way to return later
   * without ever needing a password at all.
   */
  skipPassword?: boolean;
}

export function SignupFlow({ startStep = 1, initialEmail = "", redirectTo = "/mentor", skipPassword = false }: SignupFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(startStep);
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [mailingConsent, setMailingConsent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

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
    if (skipPassword) {
      // Mark signup as "done" (no password, OTP login covers returning here)
      // so Auth.tsx's resume-incomplete-signup check doesn't nag this user
      // for a password next time they land on /auth — that check only looks
      // at password_set, it has no way to know skipping was intentional.
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user?.id) {
        await supabase.from("profiles").update({ password_set: true }).eq("id", auth.user.id);
      }
      trackEvent("signup_complete", { skipped_password: true });
      navigate(redirectTo);
      return;
    }
    setStep(3);
  };


  // Step 3 — set password (final step; signup completes here for all plans)
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
      }
      trackEvent("signup_step_complete", { step: 3 });
      trackEvent("signup_complete");
      toast.success("ההרשמה הושלמה");
      navigate(redirectTo);
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
      <SignupStepper current={step} showStep4={false} skipPassword={skipPassword} />

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
              <span className="block text-xs text-muted-foreground mt-1">
                * אישור זה הוא תנאי {skipPassword ? "להתנסות באבחון" : "לשימוש במנטור"}.
              </span>
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
          <p className="text-xs text-muted-foreground">
            לא מוצא/ת את המייל? כדאי לבדוק גם בתיקיית הספאם/קידומים — לפעמים זה לוקח דקה-שתיים.
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
            סיים/י הרשמה
          </Button>
        </form>
      )}
    </div>
  );
}
