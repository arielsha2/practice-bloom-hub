import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserProgress {
  id: string;
  email: string | null;
  displayName: string | null;
  watchedCount: number;
  totalLessons: number;
  lastActivity: string | null;
}

interface RecentUsersTableProps {
  users: UserProgress[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function RecentUsersTable({ 
  users, 
  currentPage, 
  totalPages, 
  onPageChange 
}: RecentUsersTableProps) {
  const { t, isRTL } = useLanguage();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{t('dashboard.admin.recentUsers')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.admin.user')}</TableHead>
                <TableHead>{t('dashboard.admin.progress')}</TableHead>
                <TableHead>{t('dashboard.admin.lastActivity')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    {t('dashboard.admin.noUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const percent = user.totalLessons > 0 
                    ? Math.round((user.watchedCount / user.totalLessons) * 100) 
                    : 0;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-muted rounded-full">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {user.displayName || user.email || t('dashboard.admin.anonymous')}
                            </p>
                            {user.displayName && user.email && (
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={percent} className="h-2 flex-1" />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {user.watchedCount}/{user.totalLessons}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.lastActivity)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('dashboard.admin.previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('dashboard.admin.page')} {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              {t('dashboard.admin.next')}
              <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
