import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Users, ClipboardCheck, BookOpen, Infinity, FileText, Heart, MessageCircle, Gift, ArrowLeft, ArrowRight } from 'lucide-react';

const programFeatures = [
  { 
    icon: Video, 
    title: '6 שיעורי וידאו מוקלטים', 
    desc: 'תוכן מקצועי ומעשי שתוכלי לצפות בזמן שנוח לך' 
  },
  { 
    icon: Users, 
    title: '6 מפגשי לייב בזום', 
    desc: 'סימולציות ותרגול קבוצתי עם משוב אישי' 
  },
  { 
    icon: ClipboardCheck, 
    title: 'משימות שבועיות', 
    desc: 'לתרגול ויישום מעשי של מה שלמדת' 
  },
  { 
    icon: BookOpen, 
    title: 'מדריך מקצועי מקיף', 
    desc: 'יעזור לך להתמצא בכל התכנים' 
  },
  { 
    icon: Infinity, 
    title: 'גישה פתוחה ללא הגבלה', 
    desc: 'צפי בתכנים מתי שרק תרצי, לתמיד' 
  },
  { 
    icon: FileText, 
    title: 'חוברות תרגול פרקטיות', 
    desc: 'לסיכום והטמעה של כל מה שלמדת' 
  },
  { 
    icon: Heart, 
    title: 'קבוצה קטנה של 4 משתתפים', 
    desc: 'יחס אישי לתרגול מעמיק והתקדמות מהירה' 
  },
  { 
    icon: MessageCircle, 
    title: 'קבוצת וואטסאפ ייעודית', 
    desc: 'תמיכה מתמשכת בין המפגשים' 
  },
  { 
    icon: Gift, 
    title: 'בונוס: חוברת תסריטים', 
    desc: 'לניהול שיחות עם מתעניינים וקולגות' 
  },
];

export function PortalAccessDenied() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-secondary pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-primary font-medium text-sm mb-4 tracking-wider uppercase">
              {t('howItWorks.label')}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-6 tracking-wide">
              {t('portal.course.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('portal.course.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 flex-grow">
        <div className="container mx-auto px-4">
          <motion.h2 
            className={`text-2xl md:text-3xl font-serif font-medium text-foreground mb-12 text-center ${isRTL ? 'text-right md:text-center' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {t('portal.course.includes')}
          </motion.h2>

          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto ${isRTL ? 'text-right' : ''}`}>
            {programFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <div className={`flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-card transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-0.5">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {!user ? (
              <div className="space-y-4">
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8 py-6">
                    {t('portal.course.signup')}
                    <ArrowIcon className="w-5 h-5 ms-2" />
                  </Button>
                </Link>
                <p className="text-muted-foreground text-sm">
                  {t('portal.course.alreadyMember')}{' '}
                  <Link to="/auth" className="text-primary hover:underline">
                    {t('nav.login')}
                  </Link>
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-8 border border-border/50">
                <p className="text-muted-foreground mb-4">
                  {t('portal.accessDescription')}
                </p>
                <Link to="/">
                  <Button variant="outline">{t('nav.home')}</Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
