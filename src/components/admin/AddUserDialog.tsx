import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, User, Calendar, BookOpen, Shield, FileText, Loader2, Sparkles } from 'lucide-react';

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

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  cohorts: Cohort[];
  onAddUser: (data: {
    email: string;
    fullName: string | null;
    courseKey: string | null;
    cohortId: string | null;
    pendingRole: 'admin' | 'course_member' | null;
    pendingMentor: boolean;
    notes: string | null;
  }) => void;
  isAdding: boolean;
}

export function AddUserDialog({
  open,
  onOpenChange,
  courses,
  cohorts,
  onAddUser,
  isAdding,
}: AddUserDialogProps) {
  const { isRTL } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [accessType, setAccessType] = useState<'course_member' | 'admin' | 'mentor_only'>('course_member');
  const [pendingMentor, setPendingMentor] = useState(false);
  const [notes, setNotes] = useState('');

  // Filter courses by selected cohort
  const filteredCourses = selectedCohort
    ? courses.filter(c => c.cohort_id === selectedCohort || !c.cohort_id)
    : courses;

  // Active cohorts only
  const activeCohorts = cohorts.filter(c => c.is_active);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canSubmit = email.trim() && isValidEmail(email) && selectedCourse;

  const handleSubmit = () => {
    if (!canSubmit) return;
    
    onAddUser({
      email: email.trim().toLowerCase(),
      fullName: fullName.trim() || null,
      courseKey: selectedCourse,
      cohortId: selectedCohort || null,
      pendingRole,
      pendingMentor,
      notes: notes.trim() || null,
    });
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setSelectedCohort('');
    setSelectedCourse('');
    setPendingRole('course_member');
    setPendingMentor(false);
    setNotes('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {isRTL ? 'הוסף משתמש חדש' : 'Add New User'}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? 'הוסף משתמש לרשימת ההרשאה מראש. כשהמשתמש יירשם עם המייל הזה, ההרשאות יופעלו אוטומטית.'
              : 'Pre-authorize a user by email. When they sign up with this email, permissions will be automatically applied.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {isRTL ? 'כתובת מייל *' : 'Email Address *'}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRTL ? 'user@example.com' : 'user@example.com'}
              dir="ltr"
            />
            {email && !isValidEmail(email) && (
              <p className="text-sm text-destructive">
                {isRTL ? 'כתובת מייל לא תקינה' : 'Invalid email address'}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {isRTL ? 'שם מלא' : 'Full Name'}
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isRTL ? 'ישראל ישראלי' : 'John Doe'}
            />
          </div>

          {/* Cohort */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {isRTL ? 'מחזור' : 'Cohort'}
            </Label>
            <Select value={selectedCohort} onValueChange={setSelectedCohort}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'בחר מחזור...' : 'Select cohort...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isRTL ? 'ללא מחזור' : 'No cohort'}</SelectItem>
                {activeCohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {isRTL ? cohort.name_he : cohort.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {isRTL ? 'קורס *' : 'Course *'}
            </Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'בחר קורס...' : 'Select course...'} />
              </SelectTrigger>
              <SelectContent>
                {filteredCourses.map((course) => (
                  <SelectItem key={course.id} value={course.course_key}>
                    {isRTL ? course.name_he : course.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {isRTL ? 'הרשאה' : 'Permission'}
            </Label>
            <RadioGroup
              value={pendingRole}
              onValueChange={(value) => setPendingRole(value as 'admin' | 'course_member')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="course_member" id="student" />
                <Label htmlFor="student" className="cursor-pointer">
                  {isRTL ? 'סטודנט' : 'Student'}
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="cursor-pointer">
                  {isRTL ? 'מנהל' : 'Admin'}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mentor access */}
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
            <Checkbox
              id="pending-mentor"
              checked={pendingMentor}
              onCheckedChange={(checked) => setPendingMentor(checked === true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="pending-mentor" className="flex items-center gap-1.5 cursor-pointer font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                {isRTL ? 'גם גישה למנטור' : 'Also grant mentor access'}
              </Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isRTL
                  ? 'מאפשר למשתמש להשתמש בכלי המנטור AI בנוסף לתפקיד שנבחר'
                  : 'Allows the user to use the AI mentor tool in addition to the selected role'}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {isRTL ? 'הערות' : 'Notes'}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRTL ? 'הערות פנימיות (אופציונלי)' : 'Internal notes (optional)'}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isAdding}
          >
            {isRTL ? 'ביטול' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {isRTL ? 'מוסיף...' : 'Adding...'}
              </>
            ) : (
              isRTL ? 'הוסף משתמש' : 'Add User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
