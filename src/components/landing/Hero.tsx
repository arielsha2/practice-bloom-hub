import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function Hero() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section 
      id="home" 
      className="min-h-screen flex items-center justify-center pt-16 bg-secondary relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
      </div>
      
      <div className={`container mx-auto px-4 py-32 relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="text-primary text-sm font-medium">
              {isRTL ? 'לפסיכותרפיסטים בפרקטיקה פרטית' : 'For Private Practice Psychotherapists'}
            </span>
          </div>

          {/* Main heading */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-foreground mb-6 leading-tight animate-fade-in tracking-wide"
            style={{ animationDelay: '0.2s' }}
          >
            {t('hero.title')}
          </h1>

          {/* Subheading */}
          <p 
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            {t('hero.subtitle')}
          </p>

          {/* CTA Button */}
          <div 
            className="animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <Button 
              variant="cta" 
              size="xl" 
              className="group"
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('hero.cta')}
              <Arrow className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
