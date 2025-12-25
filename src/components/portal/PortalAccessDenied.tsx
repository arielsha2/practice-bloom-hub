import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PortalAccessDenied() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>{t('portal.noAccess')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('portal.accessDescription')}
          </p>
          {!user ? (
            <Link to="/auth">
              <Button className="w-full">{t('nav.login')}</Button>
            </Link>
          ) : (
            <Link to="/">
              <Button variant="outline" className="w-full">{t('nav.home')}</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
