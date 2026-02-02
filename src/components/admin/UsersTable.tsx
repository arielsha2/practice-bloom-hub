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
import { UserPlus, X, Search } from 'lucide-react';
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
  enrolled_at: string | null;
  activated_at: string | null;
  full_name: string | null;
}

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
}

interface UsersTableProps {
  users: UserProfile[];
  enrollments: Enrollment[];
  courses: Course[];
  onAssignCourse: (user: UserProfile) => void;
  onRemoveFromCourse: (enrollmentId: string) => void;
}

export function UsersTable({
  users,
  enrollments,
  courses,
  onAssignCourse,
  onRemoveFromCourse,
}: UsersTableProps) {
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const getUserEnrollments = (userId: string) => {
    return enrollments.filter(e => e.user_id === userId);
  };

  const getCourseName = (courseKey: string) => {
    const course = courses.find(c => c.course_key === courseKey);
    return course ? (isRTL ? course.name_he : course.name_en) : courseKey;
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={isRTL ? 'חפש לפי מייל או שם...' : 'Search by email or name...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRTL ? 'מייל' : 'Email'}</TableHead>
              <TableHead>{isRTL ? 'שם' : 'Name'}</TableHead>
              <TableHead>{isRTL ? 'תאריך הצטרפות' : 'Joined'}</TableHead>
              <TableHead>{isRTL ? 'קורסים' : 'Courses'}</TableHead>
              <TableHead>{isRTL ? 'פעולות' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {isRTL ? 'לא נמצאו משתמשים' : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const userEnrollments = getUserEnrollments(user.id);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email || '-'}</TableCell>
                    <TableCell>{user.display_name || (isRTL ? 'ללא שם' : 'No name')}</TableCell>
                    <TableCell>
                      {user.created_at
                        ? format(new Date(user.created_at), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userEnrollments.length === 0 ? (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAssignCourse(user)}
                      >
                        <UserPlus className="w-4 h-4 me-1" />
                        {isRTL ? 'שייך לקורס' : 'Assign'}
                      </Button>
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
          ? `סה"כ ${filteredUsers.length} משתמשים רשומים`
          : `${filteredUsers.length} registered users total`
        }
      </p>
    </div>
  );
}
