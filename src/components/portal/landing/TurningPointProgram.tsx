import { motion } from "framer-motion";
import {
  Video,
  Users,
  ClipboardCheck,
  BookOpen,
  Infinity as InfinityIcon,
  FileText,
  Heart,
  Bot,
  Gift,
} from "lucide-react";

const programFeatures = [
  {
    icon: Video,
    title: "8 מפגשי למידה מעשית",
    desc: "תוכן מקצועי ומעשי בשפה טיפולית",
  },
  {
    icon: Users,
    title: "4 מפגשי הטמעה",
    desc: "לתרגול ומענה לשאלות",
  },
  {
    icon: ClipboardCheck,
    title: "משימות תרגול שבועיות",
    desc: "ליישום שלב אחר שלב",
  },
  {
    icon: InfinityIcon,
    title: "גישה פתוחה ללא הגבלה",
    desc: "לתכני הקורס – לתמיד",
  },
  {
    icon: FileText,
    title: "חוברות תרגול פרקטיות",
    desc: "שהכל יהיה ברור וישים",
  },
  {
    icon: Heart,
    title: "קבוצה קטנה ואיכותית",
    desc: "יחס אישי והתקדמות מהירה",
  },
  {
    icon: Bot,
    title: "בוטים ייחודיים",
    desc: "לעזרה בשיווק הקליניקה",
  },
  {
    icon: Gift,
    title: "בונוס: חוברת תסריטים",
    desc: "תסריטים מוכנים לשימוש מיידי",
  },
];

export function TurningPointProgram() {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          className="text-2xl md:text-3xl font-display text-foreground mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          מה כוללת התוכנית?
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {programFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <div className="flex flex-col items-center text-center p-5 rounded-xl bg-card border border-border/50 hover:border-teal/30 hover:shadow-card transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal/15 to-teal/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-teal" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
