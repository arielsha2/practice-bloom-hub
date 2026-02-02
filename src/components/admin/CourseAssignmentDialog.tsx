import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GraduationCap, Check, Calendar } from 'lucide-react';

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
  cohort_id: string | null;
}

interface Cohort {
  id: string;
  name_he: string;
  name_en: string;
  is_active: boolean | null;
}

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
}

interface Enrollment {
  course_key: string;
  cohort_id: string | null;
}

interface CourseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  courses: Course[];
  cohorts: Cohort[];
  enrollments: Enrollment[];
  onAssign: (courseKey: string, cohortId: string | null) => void;
  isAssigning: boolean;
}

export function CourseAssignmentDialog({
  open,
  onOpenChange,
  user,
  courses,
  cohorts,
  enrollments,
  onAssign,
  isAssigning,
}: CourseAssignmentDialogProps) {
  const { isRTL } = useLanguage();
  const [selectedCohort, setSelectedCohort] = useState<string>('all');

  if (!user) return null;

  // Filter courses by selected cohort
  const filteredCourses = selectedCohort === 'all'
    ? courses
    : courses.filter(c => c.cohort_id === selectedCohort);

  // Check if user is enrolled in a specific course+cohort combination
  const isEnrolled = (courseKey: string, cohortId: string | null) => {
    return enrollments.some(e => 
      e.course_key === courseKey && 
      (cohortId ? e.cohort_id === cohortId : !e.cohort_id)
    );
  };

  const handleAssign = (courseKey: string) => {
    const cohortId = selectedCohort === 'all' ? null : selectedCohort;
    onAssign(courseKey, cohortId);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedCohort('all');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRTL ? 'שיוך לקורס' : 'Assign to Course'}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? `בחר מחזור וקורס לשייך את ${user.email || 'המשתמש'}`
              : `Select a cohort and course to assign ${user.email || 'the user'} to`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Cohort Filter */}
        <div className="space-y-2 mt-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {isRTL ? 'בחר מחזור' : 'Select Cohort'}
          </Label>
          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger>
              <SelectValue placeholder={isRTL ? 'כל המחזורים' : 'All Cohorts'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? 'כל הקורסים (ללא מחזור)' : 'All Courses (No Cohort)'}</SelectItem>
              {cohorts.filter(c => c.is_active).map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {isRTL ? cohort.name_he : cohort.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Courses List */}
        <div className="space-y-3 mt-4">
          {filteredCourses.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {isRTL ? 'אין קורסים זמינים במחזור זה' : 'No courses available in this cohort'}
            </p>
          ) : (
            filteredCourses.map((course) => {
              const cohortId = selectedCohort === 'all' ? null : selectedCohort;
              const enrolled = isEnrolled(course.course_key, cohortId);
              const courseCohort = cohorts.find(c => c.id === course.cohort_id);
              
              return (
                <div
                  key={course.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    enrolled 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'hover:bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${enrolled ? 'bg-primary/10' : 'bg-muted'}`}>
                      <GraduationCap className={`w-5 h-5 ${enrolled ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium">
                        {isRTL ? course.name_he : course.name_en}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course.course_key}
                        {courseCohort && selectedCohort === 'all' && (
                          <span className="ms-2 text-xs">
                            ({isRTL ? courseCohort.name_he : courseCohort.name_en})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {enrolled ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">{isRTL ? 'רשום' : 'Enrolled'}</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAssign(course.course_key)}
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

        <p className="text-xs text-muted-foreground mt-2">
          {isRTL 
            ? 'ניתן לשייך את המשתמש למספר קורסים ממחזורים שונים'
            : 'You can assign the user to multiple courses from different cohorts'
          }
        </p>
      </DialogContent>
    </Dialog>
  );
}
