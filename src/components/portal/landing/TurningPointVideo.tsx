import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export function TurningPointVideo() {
  return (
    <section className="py-12 md:py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Play className="w-5 h-5 text-accent" />
            <h2 className="text-xl md:text-2xl font-display text-foreground">
              צפו בהדרכה המיוחדת שלנו
            </h2>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-elevated border border-border/50">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/L5R3kMOqIYc"
              title="הדרכה – נקודת המפנה"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            לכל מי שהשתתף בהדרכה המיוחדת שלנו – שמחים להזמין אתכם להצטרף לתוכנית "נקודת המפנה"
          </p>
        </motion.div>
      </div>
    </section>
  );
}
