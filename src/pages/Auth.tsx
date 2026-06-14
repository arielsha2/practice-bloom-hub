import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/SEOHead";
import { CheckCircle, User, UserPlus, Mail, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

type AuthMode = "login" | "signup" | "forgot" | "reset";
type ResetStatus = "idle" | "loading" | "ready" | "error";

export default function Auth() {
  const { user, signIn, signUp, loading, resetPasswordForEmail, updatePassword } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isTrialIntent = searchParams.get("intent") === "trial";
  const [mode, setMode] = useState<AuthMode>(
    isTrialIntent || searchParams.get("mode") === "signup" ? "signup" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [mailingConsent, setMailingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [resetStatus, setResetStatus] = useState<ResetStatus>("idle");

  // Handle password reset tokens from URL (both hash and query params)
  useEffect(() => {
    const handleRecoveryToken = async () => {
      const hash = window.location.hash;
      const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;

      // Check for error in URL (invalid/expired link)
      const errorParam = hashParams?.get("error") || searchParams.get("error");
      const errorDesc = hashParams?.get("error_description") || searchParams.get("error_description");

      if (errorParam) {
        console.log("Reset error from URL:", errorParam, errorDesc);
        setMode("reset");
        setResetStatus("error");
        return;
      }

      // Check for access_token in hash (implicit flow)
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
          console.error("Error setting session:", error);
          setResetStatus("error");
        } else {
          // Verify session was set
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            setResetStatus("ready");
            navigate("/auth?mode=reset", { replace: true });
          } else {
            setResetStatus("error");
          }
        }
        return;
      }

      // Check for code in query params (PKCE flow)
      const code = searchParams.get("code");
      if (code) {
        setMode("reset");
        setResetStatus("loading");

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Error exchanging code:", error);
          setResetStatus("error");
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            setResetStatus("ready");
            navigate("/auth?mode=reset", { replace: true });
          } else {
            setResetStatus("error");
          }
        }
        return;
      }

      // If mode=reset but no tokens, check if session already exists
      if (searchParams.get("mode") === "reset") {
        setMode("reset");
        setResetStatus("loading");

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setResetStatus("ready");
        } else {
          setResetStatus("error");
        }
      }
    };

    handleRecoveryToken();
  }, [searchParams, navigate]);

  useEffect(() => {
    // Don't redirect if in reset mode (user needs to set new password)
    if (user && !loading && mode !== "reset") {
      navigate(isTrialIntent ? "/welcome" : "/dashboard");
    }
  }, [user, loading, navigate, mode, isTrialIntent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          trackEvent("form_submission", { form: "login", location: "auth_page" });
          toast.success(t("auth.loginSuccess"));
          navigate("/dashboard");
        }
      } else if (mode === "signup") {
        if (!signupName.trim()) {
          toast.error("נא למלא שם מלא");
          return;
        }
        if (!mailingConsent) {
          toast.error("חובה לאשר הצטרפות לרשימת התפוצה כדי להמשיך");
          return;
        }
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/welcome?intent=trial`,
            data: {
              display_name: signupName.trim(),
              mailing_list_consent: true,
            },
          },
        });
        if (otpError) {
          toast.error(otpError.message);
        } else {
          trackEvent("form_submission", { form: "signup_magiclink", location: "auth_page" });
          setSignupSent(true);
        }
      } else if (mode === "forgot") {
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          toast.error(error.message);
        } else {
          trackEvent("form_submission", { form: "forgot_password", location: "auth_page" });
          setResetSent(true);
        }
      } else if (mode === "reset") {
        if (password !== confirmPassword) {
          toast.error(t("auth.passwordMismatch"));
          return;
        }
        // Verify session exists before attempting password update
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t("auth.resetLinkInvalidBody"));
          setResetStatus("error");
          return;
        }
        const { error } = await updatePassword(password);
        if (error) {
          toast.error(error.message);
        } else {
          trackEvent("form_submission", { form: "password_reset", location: "auth_page" });
          toast.success(t("auth.passwordUpdated"));
          navigate("/dashboard");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login":
        return t("auth.loginTitle");
      case "signup":
        return t("auth.signupTitle");
      case "forgot":
        return t("auth.forgotTitle");
      case "reset":
        return t("auth.resetTitle");
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login":
        return t("auth.loginSubtitle");
      case "signup":
        return t("auth.signupSubtitlePasswordless");
      case "forgot":
        return t("auth.forgotSubtitle");
      case "reset":
        return t("auth.resetSubtitle");
    }
  };

  const getButtonText = () => {
    if (isSubmitting) return t("auth.loading");
    switch (mode) {
      case "login":
        return t("auth.loginButton");
      case "signup":
        return t("auth.signupButton");
      case "forgot":
        return t("auth.sendResetLink");
      case "reset":
        return t("auth.updatePassword");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getModeIcon = () => {
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
  };

  const ModeIcon = getModeIcon();

  return (
    <div className={`min-h-screen flex flex-col bg-secondary ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead
        title="התחברות | TherapyKeys"
        description="כניסה לאזור האישי בפלטפורמת TherapyKeys — קורסים, עוזרי AI וכלים לבניית קליניקה פרטית למטפלים."
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
              {isTrialIntent && mode === "signup" ? "התחילי את 8 הימים שלך עם המנטור" : getTitle()}
            </CardTitle>
            <CardDescription>
              {isTrialIntent && mode === "signup"
                ? "ללא כרטיס אשראי. ללא מחויבות. גירסת התנסות בשלב קביעת התמחור."
                : getSubtitle()}
            </CardDescription>
            {isTrialIntent && mode === "signup" && (
              <ul className="text-sm text-foreground/80 text-start mt-4 space-y-1.5 max-w-xs mx-auto" dir="rtl">
                <li>✓ המנטור אליענה — שיחות בלי הגבלה</li>
                <li>✓ מחשבון תמחור חכם</li>
                <li>✓ כל ההיסטוריה שלך נשמרת</li>
              </ul>
            )}
          </CardHeader>
          <CardContent>
            {mode === "signup" && signupSent ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <p className="text-foreground font-medium">
                  שלחנו לך קישור כניסה ל-{email}
                </p>
                <p className="text-sm text-muted-foreground">
                  לחיצה אחת על הקישור באימייל ואת/ה בפנים — בלי סיסמה.
                  <br />
                  בדוק/י גם בתיקיית הקידום/ספאם. הקישור תקף ל-60 דקות.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true);
                    const { error } = await supabase.auth.signInWithOtp({
                      email,
                      options: {
                        shouldCreateUser: true,
                        emailRedirectTo: `${window.location.origin}/welcome?intent=trial`,
                      },
                    });
                    setIsSubmitting(false);
                    if (error) toast.error(error.message);
                    else toast.success("שלחנו שוב — בדוק/י את המייל");
                  }}
                >
                  לא קיבלתי — שלח/י שוב
                </Button>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setSignupSent(false);
                    }}
                    className="text-sm text-primary hover:underline transition-colors"
                  >
                    {t("auth.backToLogin")}
                  </button>
                </div>
              </div>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name field - signup only */}
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">שם מלא</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="השם שלך"
                        maxLength={100}
                        required
                      />
                    </div>
                  )}

                  {/* Email field - shown for login, signup, forgot */}
                  {(mode === "login" || mode === "signup" || mode === "forgot") && (
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("auth.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                      />
                      {mode === "signup" && (
                        <p className="text-sm text-muted-foreground">{t("auth.signupHelperText")}</p>
                      )}
                    </div>
                  )}

                  {/* Mailing list consent - signup only, required */}
                  {mode === "signup" && (
                    <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <Checkbox
                        checked={mailingConsent}
                        onCheckedChange={(v) => setMailingConsent(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-foreground leading-relaxed text-right">
                        אני מאשר/ת לקבל במייל תכנים, טיפים ועדכונים מ"על שפת הקליניקה". אפשר להסיר את עצמך בכל עת.
                        <span className="block text-xs text-muted-foreground mt-1">
                          * אישור זה הוא תנאי לשימוש במנטור.
                        </span>
                      </span>
                    </label>
                  )}


                  {/* Password field - shown for login only */}
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
                        minLength={6}
                      />
                    </div>
                  )}

                  {/* Reset mode - loading state */}
                  {mode === "reset" && resetStatus === "loading" && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      <p className="mt-2 text-muted-foreground">{t("auth.preparingReset")}</p>
                    </div>
                  )}

                  {/* Reset mode - error state (invalid/expired link) */}
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

                  {/* Password fields for reset - only when session is ready */}
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
                          minLength={6}
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
                          minLength={6}
                        />
                      </div>
                    </>
                  )}

                  {/* Submit button - hide for reset if session not ready */}
                  {(mode !== "reset" || resetStatus === "ready") && (
                    <Button type="submit" variant="cta" className="w-full" disabled={isSubmitting}>
                      {getButtonText()}
                    </Button>
                  )}
                </form>

                {/* Forgot password + magic link - only on login */}
                {mode === "login" && (
                  <div className="mt-4 space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">או</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isSubmitting || !email}
                      onClick={async () => {
                        if (!email) {
                          toast.error("הזינו את כתובת האימייל שלכם");
                          return;
                        }
                        setIsSubmitting(true);
                        const { error } = await supabase.auth.signInWithOtp({
                          email,
                          options: {
                            shouldCreateUser: false,
                            emailRedirectTo: `${window.location.origin}/dashboard`,
                          },
                        });
                        setIsSubmitting(false);
                        if (error) toast.error(error.message);
                        else {
                          trackEvent("form_submission", { form: "login_magiclink", location: "auth_page" });
                          setSignupSent(true);
                        }
                      }}
                    >
                      שלחו לי קישור כניסה למייל (ללא סיסמה)
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {t("auth.forgotPassword")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Toggle between login/signup */}
                {(mode === "login" || mode === "signup") && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setMode(mode === "login" ? "signup" : "login")}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
                    </button>
                  </div>
                )}

                {/* Back to login - for forgot and reset modes */}
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
