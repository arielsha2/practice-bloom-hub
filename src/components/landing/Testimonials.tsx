import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Quote } from 'lucide-react';

const testimonials = [
  { key: 'testimonial1', initials: 'ר.כ' },
  { key: 'testimonial2', initials: 'מ.ש' },
  { key: 'testimonial3', initials: 'א.ל' },
];

export function Testimonials() {
  const { t, isRTL } = useLanguage();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div 
          className={`text-center max-w-2xl mx-auto mb-16 ${isRTL ? 'text-right md:text-center' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-primary font-medium text-sm mb-4 tracking-wider uppercase">
            {t('testimonials.label')}
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 tracking-wide">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className={`grid md:grid-cols-3 gap-8 max-w-6xl mx-auto ${isRTL ? 'text-right' : ''}`}>
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.key}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-card h-full relative">
                {/* Quote icon */}
                <Quote className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} w-10 h-10 text-primary/10`} />
                
                {/* Quote text */}
                <blockquote className="text-foreground leading-relaxed mb-6 relative z-10">
                  "{t(`testimonials.${testimonial.key}.quote`)}"
                </blockquote>

                {/* Author */}
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))`
                    }}
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t(`testimonials.${testimonial.key}.name`)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(`testimonials.${testimonial.key}.role`)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
