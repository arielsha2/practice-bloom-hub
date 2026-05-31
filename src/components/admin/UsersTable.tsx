import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, X, Search, Shield, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
}

interface Enrollment {
  id: string;
  user_id: string | null;
  email: string;
  course_key: string;
  cohort_id: string | null;
  enrolled_at: string | null;
  activated_at: string | null;
  full_name: string | null;
}

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

interface UsersTableProps {
  users: UserProfile[];
  enrollments: Enrollment[];
  courses: Course[];
  cohorts: Cohort[];
  getUserRole: (userId: string) => 'admin' | 'student' | 'none';
  getUserCohorts: (userId: string) => Cohort[];
  hasMentorAccess: (userId: string) => boolean;
  onAssignCourse: (user: UserProfile) => void;
  onRemoveFromCourse: (enrollmentId: string) => void;
  onChangeRole: (user: UserProfile) => void;
}

export function UsersTable({
  users,
  enrollments,
  courses,
  cohorts,
  getUserRole,
  getUserCohorts,
  hasMentorAccess,
  onAssignCourse,
  onRemoveFromCourse,
  onChangeRole,
}: UsersTableProps) {
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState<string>('all');

  const getUserEnrollments = (userId: string) => {
    return enrollments.filter(e => e.user_id === userId);
  };

  const getCourseName = (courseKey: string) => {
    const course = courses.find(c => c.course_key === courseKey);
    return course ? (isRTL ? course.name_he : course.name_en) : courseKey;
  };

  const getCohortName = (cohortId: string | null) => {
    if (!cohortId) return null;
    const cohort = cohorts.find(c => c.id === cohortId);
    return cohort ? (isRTL ? cohort.name_he : cohort.name_en) : null;
  };

  const getRoleBadge = (role: 'admin' | 'student' | 'none') => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="w-3 h-3" />
            {isRTL ? 'מנהל' : 'Admin'}
          </Badge>
        );
      case 'student':
        return (
          <Badge variant="default">
            {isRTL ? 'סטודנט' : 'Student'}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {isRTL ? 'לא רשום' : 'Not Enrolled'}
          </Badge>
        );
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      user.email?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query);

    // Cohort filter
    let matchesCohort = true;
    if (cohortFilter !== 'all') {
      const userCohorts = getUserCohorts(user.id);
      if (cohortFilter === 'none') {
        matchesCohort = userCohorts.length === 0;
      } else {
        matchesCohort = userCohorts.some(c => c.id === cohortFilter);
      }
    }

    return matchesSearch && matchesCohort;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? 'חפש לפי מייל או שם...' : 'Search by email or name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
        
        {/* Cohort Filter */}
        <Select value={cohortFilter} onValueChange={setCohortFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={isRTL ? 'סנן לפי מחזור' : 'Filter by cohort'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? 'כל המחזורים' : 'All Cohorts'}</SelectItem>
            <SelectItem value="none">{isRTL ? 'ללא מחזור' : 'No Cohort'}</SelectItem>
            {cohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={cohort.id}>
                {isRTL ? cohort.name_he : cohort.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRTL ? 'מייל' : 'Email'}</TableHead>
              <TableHead>{isRTL ? 'שם' : 'Name'}</TableHead>
              <TableHead>{isRTL ? 'תפקיד' : 'Role'}</TableHead>
              <TableHead>{isRTL ? 'מחזורים' : 'Cohorts'}</TableHead>
              <TableHead>{isRTL ? 'קורסים' : 'Courses'}</TableHead>
              <TableHead>{isRTL ? 'גישה למנטור' : 'Mentor Access'}</TableHead>
              <TableHead>{isRTL ? 'תאריך הצטרפות' : 'Joined'}</TableHead>
              <TableHead>{isRTL ? 'פעולות' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {isRTL ? 'לא נמצאו משתמשים' : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const userEnrollments = getUserEnrollments(user.id);
                const userCohorts = getUserCohorts(user.id);
                const role = getUserRole(user.id);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email || '-'}</TableCell>
                    <TableCell>{user.display_name || (isRTL ? 'ללא שם' : 'No name')}</TableCell>
                    <TableCell>{getRoleBadge(role)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userCohorts.length === 0 ? (
                          <span className="text-muted-foreground text-sm">
                            {isRTL ? 'ללא מחזור' : 'No cohort'}
                          </span>
                        ) : (
                          userCohorts.map((cohort) => (
                            <Badge key={cohort.id} variant="outline">
                              {isRTL ? cohort.name_he : cohort.name_en}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role === 'admin' ? (
                          <span className="text-primary text-sm font-medium">
                            {isRTL ? 'גישה לכל הקורסים' : 'Access to all courses'}
                          </span>
                        ) : userEnrollments.length === 0 ? (
                          <span className="text-muted-foreground text-sm">
                            {isRTL ? 'ללא קורסים' : 'No courses'}
                          </span>
                        ) : (
                          userEnrollments.map((enrollment) => (
                            <Badge
                              key={enrollment.id}
                              variant="secondary"
                              className="gap-1 pe-1"
                            >
                              {getCourseName(enrollment.course_key)}
                              {enrollment.cohort_id && (
                                <span className="text-xs opacity-70">
                                  ({getCohortName(enrollment.cohort_id)})
                                </span>
                              )}
                              <button
                                onClick={() => onRemoveFromCourse(enrollment.id)}
                                className="hover:bg-destructive/20 rounded p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={hasMentorAccess(user.id)}
                          onCheckedChange={(checked) => onToggleMentor(user.id, checked)}
                          aria-label={isRTL ? 'הרשאת מנטור' : 'Mentor access'}
                        />
                        {hasMentorAccess(user.id) && (
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.created_at
                        ? format(new Date(user.created_at), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAssignCourse(user)}
                        >
                          <UserPlus className="w-4 h-4 me-1" />
                          {isRTL ? 'שייך' : 'Assign'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onChangeRole(user)}
                        >
                          <Shield className="w-4 h-4 me-1" />
                          {isRTL ? 'תפקיד' : 'Role'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {isRTL 
          ? `סה"כ ${filteredUsers.length} משתמשים${filteredUsers.length !== users.length ? ` (מתוך ${users.length})` : ''}`
          : `${filteredUsers.length} users${filteredUsers.length !== users.length ? ` (of ${users.length})` : ''} total`
        }
      </p>
    </div>
  );
}
