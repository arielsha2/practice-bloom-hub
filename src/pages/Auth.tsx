import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const { user, signIn, signUp, loading, resetPasswordForEmail, updatePassword } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Handle password reset tokens from URL hash
  useEffect(() => {
    const handleRecoveryToken = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        if (accessToken && refreshToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error) {
            setMode('reset');
            setSessionReady(true);
            window.history.replaceState({}, '', '/auth?mode=reset');
          } else {
            toast.error(t('auth.sessionError') || 'Session error');
          }
        }
      } else if (searchParams.get('mode') === 'reset') {
        // If already in reset mode without hash, session should already exist
        setMode('reset');
        setSessionReady(true);
      }
    };
    
    handleRecoveryToken();
  }, [searchParams, t]);

  useEffect(() => {
    // Don't redirect if in reset mode (user needs to set new password)
    if (user && !loading && mode !== 'reset') {
      navigate('/');
    }
  }, [user, loading, navigate, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t('auth.loginSuccess'));
          navigate('/');
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error(t('auth.alreadyRegistered'));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(t('auth.signupSuccess'));
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          toast.error(error.message);
        } else {
          setResetSent(true);
        }
      } else if (mode === 'reset') {
        if (password !== confirmPassword) {
          toast.error(t('auth.passwordMismatch'));
          return;
        }
        const { error } = await updatePassword(password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t('auth.passwordUpdated'));
          navigate('/');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return t('auth.loginTitle');
      case 'signup': return t('auth.signupTitle');
      case 'forgot': return t('auth.forgotTitle');
      case 'reset': return t('auth.resetTitle');
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return t('auth.loginSubtitle');
      case 'signup': return t('auth.signupSubtitle');
      case 'forgot': return t('auth.forgotSubtitle');
      case 'reset': return t('auth.resetSubtitle');
    }
  };

  const getButtonText = () => {
    if (isSubmitting) return t('auth.loading');
    switch (mode) {
      case 'login': return t('auth.loginButton');
      case 'signup': return t('auth.signupButton');
      case 'forgot': return t('auth.sendResetLink');
      case 'reset': return t('auth.updatePassword');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              {getTitle()}
            </CardTitle>
            <CardDescription>
              {getSubtitle()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'forgot' && resetSent ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-muted-foreground">{t('auth.resetSent')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setResetSent(false);
                  }}
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  {t('auth.backToLogin')}
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email field - shown for login, signup, forgot */}
                  {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  )}
                  
                  {/* Password field - shown for login, signup */}
                  {(mode === 'login' || mode === 'signup') && (
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('auth.password')}</Label>
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

                  {/* Reset mode - wait for session */}
                  {mode === 'reset' && !sessionReady && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      <p className="mt-2 text-muted-foreground">{t('auth.preparingReset')}</p>
                    </div>
                  )}

                  {/* Password fields for reset - only when session is ready */}
                  {mode === 'reset' && sessionReady && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="password">{t('auth.newPassword')}</Label>
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
                        <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
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
                  {(mode !== 'reset' || sessionReady) && (
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {getButtonText()}
                    </Button>
                  )}
                </form>

                {/* Forgot password link - only on login */}
                {mode === 'login' && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                {/* Toggle between login/signup */}
                {(mode === 'login' || mode === 'signup') && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                    </button>
                  </div>
                )}

                {/* Back to login - for forgot and reset modes */}
                {(mode === 'forgot' || mode === 'reset') && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {t('auth.backToLogin')}
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
