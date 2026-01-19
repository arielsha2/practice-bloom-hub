import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface CourseProgressHeaderProps {
  totalLessons: number;
  completedLessons: number;
  courseTitle?: string;
}

export function CourseProgressHeader({
  totalLessons,
  completedLessons,
  courseTitle
}: CourseProgressHeaderProps) {
  const { isRTL } = useLanguage();
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  return (
    <motion.div 
      className="bg-slate-900 text-white py-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Course Info */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <motion.div 
              className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <BookOpen className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-xl md:text-2xl font-medium">
                {courseTitle || (isRTL ? 'נקודת המפנה' : 'Turning Point')}
              </h1>
              <p className="text-slate-400 text-sm">
                {isRTL 
                  ? `${completedLessons} מתוך ${totalLessons} שיעורים הושלמו`
                  : `${completedLessons} of ${totalLessons} lessons completed`
                }
              </p>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <motion.div 
            className="flex items-center gap-4 md:min-w-[300px]"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex-1">
              <Progress 
                value={progressPercentage} 
                className="h-2 bg-slate-700"
                animated={true}
              />
            </div>
            <motion.div 
              className="flex items-center gap-1.5 text-sm font-medium min-w-[60px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 500 }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <motion.span 
                className="text-emerald-400"
                key={progressPercentage}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {progressPercentage}%
              </motion.span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
