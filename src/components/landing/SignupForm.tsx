import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, User, Phone, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email();
const phoneSchema = z.string().regex(/^[0-9+\-\s()]+$/, 'מספר טלפון לא תקין');

export function SignupForm() {
  const { t, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!emailSchema.safeParse(formData.email).success) {
      toast.error(isRTL ? 'כתובת אימייל לא תקינה' : 'Invalid email address');
      return;
    }
    
    // Validate phone
    if (!phoneSchema.safeParse(formData.phone).success) {
      toast.error(isRTL ? 'מספר טלפון לא תקין - יש להזין מספרים בלבד' : 'Invalid phone number - digits only');
      return;
    }
    
    setIsSubmitting(true);

    const { error } = await supabase
      .from('leads')
      .insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: 'landing_page'
      });

    if (error) {
      console.error('Error saving lead:', error);
      toast.error(isRTL ? 'אירעה שגיאה. נסו שוב מאוחר יותר.' : 'An error occurred. Please try again later.');
    } else {
      toast.success(isRTL ? 'תודה! הפרטים התקבלו בהצלחה.' : 'Thank you! Your details have been received.');
      setFormData({ name: '', email: '', phone: '' });
    }
    
    setIsSubmitting(false);
  };

  return (
    <section id="signup" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          {/* Form card */}
          <div className={`bg-card rounded-2xl border border-border p-8 md:p-10 shadow-card ${isRTL ? 'text-right' : ''}`}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-6">
                <Gift className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {t('form.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('form.subtitle')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name" className={`text-foreground font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <User className="w-4 h-4 text-muted-foreground" />
                  {t('form.name')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={`h-12 ${isRTL ? 'text-right' : ''}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className={`text-foreground font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {t('form.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12"
                  dir="ltr"
                />
              </div>

              {/* Phone field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className={`text-foreground font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {t('form.phone')}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-12"
                  dir="ltr"
                />
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                variant="cta" 
                size="xl" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (isRTL ? 'שולח...' : 'Submitting...') 
                  : t('form.submit')
                }
              </Button>

              {/* Privacy note */}
              <p className="text-center text-sm text-muted-foreground">
                {t('form.privacy')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
