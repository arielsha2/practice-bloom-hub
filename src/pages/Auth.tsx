import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/SEOHead";
import { CheckCircle, User, UserPlus, Mail, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { SignupFlow } from "@/components/auth/SignupFlow";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OtpResendButton } from "@/components/auth/OtpResendButton";

type AuthMode = "login" | "signup" | "forgot" | "reset";
type ResetStatus = "idle" | "loading" | "ready" | "error";

const normalizeEmail = (e: string) => e.trim().toLowerCase();

export default function Auth() {
  const { user, signIn, loading, resetPasswordForEmail, updatePassword } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode = (searchParams.get("mode") as AuthMode) || "login";
  const [mode, setMode] = useState<AuthMode>(
    ["login", "signup", "forgot", "reset"].includes(initialMode) ? initialMode : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetStatus, setResetStatus] = useState<ResetStatus>("idle");

  // Login method: password or email code (OTP)
  const [loginMethod, setLoginMethod] = useState<"password" | "code">("password");
  const [codeStep, setCodeStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");

  // Resume incomplete signup (session exists but no password yet).
  // We detect this from profiles.password_set and route into the SignupFlow's
  // password step, so the user never gets stranded after a step-3 network failure.
  const [resumePasswordSetup, setResumePasswordSetup] = useState<{ email: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkResume = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("password_set, email")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data && data.password_set === false) {
        setResumePasswordSetup({ email: data.email ?? session.user.email ?? "" });
        setMode("signup");
      }
    };
    if (mode !== "reset") checkResume();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle password reset tokens from URL (both hash and query params)
  useEffect(() => {
    const handleRecoveryToken = async () => {
      const hash = window.location.hash;
      const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;

      const errorParam = hashParams?.get("error") || searchParams.get("error");
      if (errorParam) {
        setMode("reset");
        setResetStatus("error");
        return;
      }

      const accessToken = hashParams?.get("access_token");
      const refreshToken = hashParams?.get("refresh_token");
      const type = hashParams?.get("type");

      if (accessToken && refreshToken && (type === "recovery" || type === "invite")) {
        setMode("reset");
        setResetStatus("loading");
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setResetStatus("error");
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          setResetStatus(session ? "ready" : "error");
          if (session) navigate("/auth?mode=reset", { replace: true });
        }
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        setMode("reset");
        setResetStatus("loading");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setResetStatus("error");
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          setResetStatus(session ? "ready" : "error");
          if (session) navigate("/auth?mode=reset", { replace: true });
        }
        return;
      }

      if (searchParams.get("mode") === "reset") {
        setMode("reset");
        setResetStatus("loading");
        const { data: { session } } = await supabase.auth.getSession();
        setResetStatus(session ? "ready" : "error");
      }
    };
    handleRecoveryToken();
  }, [searchParams, navigate]);

  useEffect(() => {
    if (user && !loading && mode !== "reset" && !resumePasswordSetup) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate, mode, resumePasswordSetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const normalized = normalizeEmail(email);
        const { error } = await signIn(normalized, password);
        if (error) {
          // SECURITY DECISION: this app is publicly accessible at /auth, so we do NOT
          // distinguish between "email not found" and "wrong password" — that would
          // enable user enumeration. We show a single message and offer reset as the
          // path for users who signed up via magic link and have no password yet.
          toast.error(isRTL ? "פרטים שגויים. אם נרשמת בעבר ללא סיסמה — אפס/י סיסמה למטה." : "Invalid credentials. If you signed up without a password, reset it below.");
        } else {
          trackEvent("form_submission", { form: "login", location: "auth_page" });
          // Check if password_set is false — incomplete signup, route to step 3
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("password_set, email")
              .eq("id", session.user.id)
              .maybeSingle();
            if (prof?.password_set === false) {
              setResumePasswordSetup({ email: prof.email ?? session.user.email ?? "" });
              setMode("signup");
              return;
            }
          }
          toast.success(t("auth.loginSuccess"));
          navigate("/dashboard");
        }
      } else if (mode === "forgot") {
        const { error } = await resetPasswordForEmail(normalizeEmail(email));
        if (error) toast.error(error.message);
        else {
          trackEvent("form_submission", { form: "forgot_password", location: "auth_page" });
          setResetSent(true);
        }
      } else if (mode === "reset") {
        if (password !== confirmPassword) {
          toast.error(t("auth.passwordMismatch"));
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t("auth.resetLinkInvalidBody"));
          setResetStatus("error");
          return;
        }
        const { error } = await updatePassword(password);
        if (error) {
          toast.error(error.message);
        } else {
          // Mark password_set = true so user is no longer flagged as incomplete
          if (session.user) {
            await supabase
              .from("profiles")
              .update({ password_set: true })
              .eq("id", session.user.id);
          }
          trackEvent("form_submission", { form: "password_reset", location: "auth_page" });
          toast.success(t("auth.passwordUpdated"));
          navigate("/dashboard");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const callFn = async (fnName: string, payload: unknown) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`;
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

  const handleSendLoginCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalized = normalizeEmail(email);
    if (!normalized) return toast.error("נא להזין כתובת אימייל");
    setIsSubmitting(true);
    const { ok, status, body } = await callFn("signup-send-otp", { email: normalized });
    setIsSubmitting(false);
    if (!ok) {
      if (status === 429) return toast.error(`נסה/י שוב בעוד ${body?.retry_after ?? 60} שניות`);
      return toast.error("לא הצלחנו לשלוח את הקוד. נסה/י שוב.");
    }
    setEmail(normalized);
    setCodeStep("otp");
    toast.success("שלחנו לך קוד למייל");
  };

  const handleVerifyLoginCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) return toast.error("הזן/י את כל 6 הספרות");
    setIsSubmitting(true);
    const { ok, body } = await callFn("signup-verify-otp", { email, code: otp });
    if (!ok || !body?.token_hash) {
      setIsSubmitting(false);
      if (body?.error === "expired") return toast.error("הקוד פג תוקף — שלח/י קוד חדש");
      if (body?.error === "too_many_attempts") return toast.error("יותר מדי ניסיונות — שלח/י קוד חדש");
      return toast.error("הקוד שגוי");
    }
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: body.token_hash,
    });
    setIsSubmitting(false);
    if (verifyErr) {
      return toast.error("לא הצלחנו להשלים את ההתחברות. נסה/י שוב.");
    }
    trackEvent("form_submission", { form: "login_code", location: "auth_page" });
    toast.success(t("auth.loginSuccess"));
    navigate("/dashboard");
  };

  const resendLoginCode = async () => {
    const { ok } = await callFn("signup-send-otp", { email });
    if (!ok) {
      toast.error("השליחה נכשלה");
      throw new Error("send failed");
    }
    toast.success("שלחנו קוד חדש למייל");
  };

  const getTitle = () => {
    if (resumePasswordSetup) return "השלמת ההרשמה";
    switch (mode) {
      case "login":
        return t("auth.loginTitle");
      case "signup":
        return "הרשמה למנטור";
      case "forgot":
        return t("auth.forgotTitle");
      case "reset":
        return t("auth.resetTitle");
    }
  };

  const getSubtitle = () => {
    if (resumePasswordSetup) return "נשארה רק בחירת סיסמה כדי לסיים.";
    switch (mode) {
      case "login":
        return t("auth.loginSubtitle");
      case "signup":
        return "4 שלבים פשוטים: מייל → אימות → סיסמה → חיבור AI";
      case "forgot":
        return t("auth.forgotSubtitle");
      case "reset":
        return t("auth.resetSubtitle");
    }
  };

  const ModeIcon = (() => {
    if (resumePasswordSetup) return KeyRound;
    switch (mode) {
      case "login":
        return User;
      case "signup":
        return UserPlus;
      case "forgot":
        return Mail;
      case "reset":
        return KeyRound;
    }
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-secondary ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <SEOHead
        title="התחברות | TherapyKeys"
        description="כניסה לאזור האישי בפלטפורמת TherapyKeys."
        canonicalUrl="/auth"
        noindex
      />
      <Header />

      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <Card className="w-full max-w-md shadow-card border border-border/50 bg-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ModeIcon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif font-medium text-foreground">
              {getTitle()}
            </CardTitle>
            <CardDescription>{getSubtitle()}</CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "signup" ? (
              <SignupFlow
                startStep={resumePasswordSetup ? 3 : 1}
                initialEmail={resumePasswordSetup?.email ?? ""}
              />
            ) : mode === "forgot" && resetSent ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <p className="text-muted-foreground">{t("auth.resetSent")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setResetSent(false);
                  }}
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  {t("auth.backToLogin")}
                </button>
              </div>
            ) : (
              <>
                {mode === "login" && (
                  <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("password");
                        setCodeStep("email");
                        setOtp("");
                      }}
                      className={`rounded-md py-2 transition-colors ${
                        loginMethod === "password"
                          ? "bg-background shadow-sm font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      מייל + סיסמה
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("code");
                        setPassword("");
                      }}
                      className={`rounded-md py-2 transition-colors ${
                        loginMethod === "code"
                          ? "bg-background shadow-sm font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      מייל + קוד
                    </button>
                  </div>
                )}

                {mode === "login" && loginMethod === "code" ? (
                  codeStep === "email" ? (
                    <form onSubmit={handleSendLoginCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-code">{t("auth.email")}</Label>
                        <Input
                          id="email-code"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          required
                          autoComplete="email"
                        />
                        <p className="text-xs text-muted-foreground">
                          נשלח לכתובת זו קוד חד-פעמי בן 6 ספרות.
                        </p>
                      </div>
                      <Button type="submit" variant="cta" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Mail className="w-4 h-4 me-2" />}
                        שלח/י לי קוד
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyLoginCode} className="space-y-4 text-center">
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
                          onComplete={() => handleVerifyLoginCode()}
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
                      <Button type="submit" variant="cta" className="w-full" disabled={isSubmitting || otp.length !== 6}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
                        אמת/י והתחבר/י
                      </Button>
                      <OtpResendButton onResend={resendLoginCode} disabled={isSubmitting} />
                      <button
                        type="button"
                        onClick={() => {
                          setCodeStep("email");
                          setOtp("");
                        }}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        מייל שגוי? התחל/י מחדש
                      </button>
                    </form>
                  )
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {(mode === "login" || mode === "forgot") && (
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("auth.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  )}

                  {mode === "login" && (
                    <div className="space-y-2">
                      <Label htmlFor="password">{t("auth.password")}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        minLength={6}
                      />
                    </div>
                  )}

                  {mode === "reset" && resetStatus === "loading" && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      <p className="mt-2 text-muted-foreground">{t("auth.preparingReset")}</p>
                    </div>
                  )}

                  {mode === "reset" && resetStatus === "error" && (
                    <div className="text-center py-4 space-y-4">
                      <div className="text-destructive text-4xl">⚠️</div>
                      <h3 className="font-semibold text-foreground">{t("auth.resetLinkInvalidTitle")}</h3>
                      <p className="text-muted-foreground text-sm">{t("auth.resetLinkInvalidBody")}</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMode("forgot");
                          setResetStatus("idle");
                          setPassword("");
                          setConfirmPassword("");
                          navigate("/auth", { replace: true });
                        }}
                      >
                        {t("auth.requestNewResetLink")}
                      </Button>
                    </div>
                  )}

                  {mode === "reset" && resetStatus === "ready" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="password">{t("auth.newPassword")}</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={8}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={8}
                          autoComplete="new-password"
                        />
                      </div>
                    </>
                  )}

                  {(mode !== "reset" || resetStatus === "ready") && (
                    <Button type="submit" variant="cta" className="w-full" disabled={isSubmitting}>
                      {isSubmitting
                        ? t("auth.loading")
                        : mode === "login"
                          ? t("auth.loginButton")
                          : mode === "forgot"
                            ? t("auth.sendResetLink")
                            : t("auth.updatePassword")}
                    </Button>
                  )}
                </form>
                )}


                {mode === "login" && loginMethod === "password" && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  </div>
                )}

                {mode === "login" && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {t("auth.noAccount")}
                    </button>
                  </div>
                )}

                {(mode === "forgot" || mode === "reset") && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {t("auth.backToLogin")}
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
