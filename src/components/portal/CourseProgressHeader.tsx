import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle2 } from 'lucide-react';

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
    <div className="bg-slate-900 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Course Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
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
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4 md:min-w-[300px]">
            <div className="flex-1">
              <Progress 
                value={progressPercentage} 
                className="h-2 bg-slate-700"
              />
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium min-w-[60px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">{progressPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
