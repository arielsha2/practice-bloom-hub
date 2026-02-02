import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, Check } from 'lucide-react';

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
}

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
}

interface CourseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  courses: Course[];
  enrolledCourseKeys: string[];
  onAssign: (courseKey: string) => void;
  isAssigning: boolean;
}

export function CourseAssignmentDialog({
  open,
  onOpenChange,
  user,
  courses,
  enrolledCourseKeys,
  onAssign,
  isAssigning,
}: CourseAssignmentDialogProps) {
  const { isRTL } = useLanguage();

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRTL ? 'שיוך לקורס' : 'Assign to Course'}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? `בחר קורס לשייך את ${user.email || 'המשתמש'}`
              : `Select a course to assign ${user.email || 'the user'} to`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {courses.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {isRTL ? 'אין קורסים זמינים' : 'No courses available'}
            </p>
          ) : (
            courses.map((course) => {
              const isEnrolled = enrolledCourseKeys.includes(course.course_key);
              
              return (
                <div
                  key={course.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isEnrolled 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'hover:bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isEnrolled ? 'bg-primary/10' : 'bg-muted'}`}>
                      <GraduationCap className={`w-5 h-5 ${isEnrolled ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium">
                        {isRTL ? course.name_he : course.name_en}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course.course_key}
                      </p>
                    </div>
                  </div>

                  {isEnrolled ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">{isRTL ? 'רשום' : 'Enrolled'}</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onAssign(course.course_key)}
                      disabled={isAssigning}
                    >
                      {isAssigning 
                        ? (isRTL ? 'משייך...' : 'Assigning...') 
                        : (isRTL ? 'שייך' : 'Assign')
                      }
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
