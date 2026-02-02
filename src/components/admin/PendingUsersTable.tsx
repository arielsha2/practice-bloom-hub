import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Trash2, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface PendingEnrollment {
  id: string;
  email: string;
  full_name: string | null;
  course_key: string;
  cohort_id: string | null;
  pending_role: string | null;
  notes: string | null;
  enrolled_at: string | null;
}

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
}

interface Cohort {
  id: string;
  name_he: string;
  name_en: string;
}

interface PendingUsersTableProps {
  pendingEnrollments: PendingEnrollment[];
  courses: Course[];
  cohorts: Cohort[];
  onDelete: (enrollmentId: string) => void;
  isDeleting: boolean;
}

export function PendingUsersTable({
  pendingEnrollments,
  courses,
  cohorts,
  onDelete,
  isDeleting,
}: PendingUsersTableProps) {
  const { isRTL } = useLanguage();

  const getCourseName = (courseKey: string) => {
    const course = courses.find(c => c.course_key === courseKey);
    return course ? (isRTL ? course.name_he : course.name_en) : courseKey;
  };

  const getCohortName = (cohortId: string | null) => {
    if (!cohortId) return isRTL ? 'ללא מחזור' : 'No cohort';
    const cohort = cohorts.find(c => c.id === cohortId);
    return cohort ? (isRTL ? cohort.name_he : cohort.name_en) : cohortId;
  };

  const getRoleBadge = (pendingRole: string | null) => {
    if (pendingRole === 'admin') {
      return (
        <Badge variant="destructive" className="gap-1">
          <Shield className="w-3 h-3" />
          {isRTL ? 'מנהל' : 'Admin'}
        </Badge>
      );
    }
    return (
      <Badge variant="default">
        {isRTL ? 'סטודנט' : 'Student'}
      </Badge>
    );
  };

  if (pendingEnrollments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-medium">
          {isRTL ? `רשימת המתנה (${pendingEnrollments.length})` : `Pending Users (${pendingEnrollments.length})`}
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">
        {isRTL 
          ? 'משתמשים אלה יקבלו הרשאות אוטומטית כשיירשמו עם כתובת המייל שלהם'
          : 'These users will automatically receive permissions when they sign up with their email'}
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRTL ? 'מייל' : 'Email'}</TableHead>
              <TableHead>{isRTL ? 'שם' : 'Name'}</TableHead>
              <TableHead>{isRTL ? 'תפקיד מתוכנן' : 'Planned Role'}</TableHead>
              <TableHead>{isRTL ? 'מחזור' : 'Cohort'}</TableHead>
              <TableHead>{isRTL ? 'קורס' : 'Course'}</TableHead>
              <TableHead>{isRTL ? 'תאריך הוספה' : 'Added'}</TableHead>
              <TableHead>{isRTL ? 'פעולות' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingEnrollments.map((enrollment) => (
              <TableRow key={enrollment.id}>
                <TableCell className="font-medium">{enrollment.email}</TableCell>
                <TableCell>
                  {enrollment.full_name || (
                    <span className="text-muted-foreground">
                      {isRTL ? 'לא צוין' : 'Not specified'}
                    </span>
                  )}
                </TableCell>
                <TableCell>{getRoleBadge(enrollment.pending_role)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getCohortName(enrollment.cohort_id)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getCourseName(enrollment.course_key)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {enrollment.enrolled_at
                    ? format(new Date(enrollment.enrolled_at), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(enrollment.id)}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 me-1" />
                    {isRTL ? 'מחק' : 'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
