import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface OtpResendButtonProps {
  /** Trigger fresh send. Should return promise that resolves when send completes (or throws). */
  onResend: () => Promise<void>;
  /** Initial seconds until first resend is allowed. */
  initialSeconds?: number;
  /** Total attempts allowed before throttling message shows. */
  maxAttempts?: number;
  disabled?: boolean;
}

const LOCK_SECONDS = 60;

export function OtpResendButton({
  onResend,
  initialSeconds = LOCK_SECONDS,
  maxAttempts = 3,
  disabled,
}: OtpResendButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [attempts, setAttempts] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const tooManyAttempts = attempts >= maxAttempts;
  const locked = secondsLeft > 0 || tooManyAttempts;

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const countdown = `${String(mm).padStart(2, "0")}:${ss}`;

  const handleClick = async () => {
    if (locked || sending) return;
    setSending(true);
    try {
      await onResend();
      setAttempts((a) => a + 1);
      setSecondsLeft(LOCK_SECONDS);
    } catch {
      // swallow — caller toasted
    } finally {
      setSending(false);
    }
  };

  if (tooManyAttempts) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        שלחנו מספר קודים. בדוק/י גם בתיקיית הספאם, או חכה/י כמה דקות לפני שתנסה/י שוב.
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled || locked || sending}
      onClick={handleClick}
      className="w-full"
    >
      {sending
        ? "שולח..."
        : secondsLeft > 0
          ? `שלח/י שוב בעוד ${countdown}`
          : "שלח/י קוד חדש"}
    </Button>
  );
}
