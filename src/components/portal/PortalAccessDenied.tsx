import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Users, ClipboardCheck, BookOpen, Infinity as InfinityIcon, FileText, Heart, MessageCircle, Gift, ArrowLeft, ArrowRight, Play, FileDown, Phone, Lock } from 'lucide-react';
import { PaymentOptionsDialog } from './PaymentOptionsDialog';
import { PortalTestimonials } from './PortalTestimonials';

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
    icon: InfinityIcon, 
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Hero Section - Solid Wine Background */}
      <section className="bg-primary pt-24 pb-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-accent/10 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Lock icon for logged-in users without access */}
            {user && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Lock className="w-10 h-10 text-accent" />
                </div>
              </motion.div>
            )}
            
            <span className="inline-block text-accent font-medium text-sm mb-4 tracking-wider uppercase">
              {t('howItWorks.label')}
            </span>
            <h1 className="text-4xl md:text-5xl font-display text-primary-foreground mb-6 tracking-wide">
              {user ? (isRTL ? 'אין לך גישה לקורס זה' : 'No Access to This Course') : t('portal.course.title')}
            </h1>
            <p className="text-xl text-primary-foreground/80">
              {user 
                ? (isRTL ? 'נראה שאינך רשום/ה לקורס זה. פנה/י למנהל המערכת לקבלת גישה.' : 'You are not enrolled in this course. Contact the administrator for access.')
                : t('portal.course.subtitle')
              }
            </p>
            
            {/* CTA in Hero */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8"
              >
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  {t('portal.course.signup')}
                  <ArrowIcon className="w-5 h-5 ms-2" />
                </Button>
              </motion.div>
            )}

            {/* Button for logged-in users to go home */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8"
              >
                <Link to="/">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    {isRTL ? 'חזרה לדף הבית' : 'Back to Home'}
                  </Button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Video Highlight Section - Teal Background */}
      <section className="py-16 bg-teal relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal to-teal-light/80 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Video Card */}
            <div className="bg-card rounded-2xl shadow-elevated p-4 md:p-6">
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40" />
                <motion.div 
                  className="w-20 h-20 rounded-full bg-accent flex items-center justify-center shadow-lg z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-8 h-8 text-accent-foreground ms-1" fill="currentColor" />
                </motion.div>
                <p className="absolute bottom-4 text-primary-foreground/90 text-sm font-medium">
                  צפי בסרטון ההיכרות
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 flex-grow relative overflow-hidden bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="container mx-auto px-4 relative z-10">
          <motion.h2 
            className={`text-2xl md:text-3xl font-display text-foreground mb-12 text-center ${isRTL ? 'text-right md:text-center' : ''}`}
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
                  <div className={`flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50 hover:border-teal/20 hover:shadow-card transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal/15 to-teal/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-teal" />
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

      {/* Syllabus Download Section */}
      <section className="py-16 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-card rounded-2xl p-8 md:p-12 border border-border/50 shadow-card">
              <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-6">
                <FileDown className="w-8 h-8 text-teal" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-display text-foreground mb-4">
                רוצה לדעת בדיוק מה תלמדי?
              </h2>
              
              <p className="text-muted-foreground font-body mb-8 max-w-md mx-auto">
                הורידי את הסילבוס המלא של התוכנית וגלי את כל התכנים, המפגשים והבונוסים שמחכים לך
              </p>
              
              <Button 
                size="lg"
                className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground mb-6"
                onClick={() => window.open('/syllabus.pdf', '_blank')}
              >
                <FileDown className="w-5 h-5 me-2" />
                הורדת סילבוס התוכנית
              </Button>
              
              <div className={`flex items-center justify-center gap-2 text-muted-foreground text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Phone className="w-4 h-4" />
                <span>או התקשרי אלינו:</span>
                <a href="tel:050-0000000" className="text-teal hover:underline font-medium">
                  050-000-0000
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - Wine Background */}
      <PortalTestimonials />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-secondary via-background to-accent/5 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {!user ? (
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  {t('portal.course.signup')}
                  <ArrowIcon className="w-5 h-5 ms-2" />
                </Button>
                <p className="text-muted-foreground text-sm">
                  {t('portal.course.alreadyMember')}{' '}
                  <Link to="/auth" className="text-teal hover:underline">
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

      <PaymentOptionsDialog 
        open={showPaymentDialog} 
        onOpenChange={setShowPaymentDialog} 
      />
    </div>
  );
}
