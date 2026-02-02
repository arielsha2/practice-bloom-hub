import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, FolderOpen, FileText, Users } from 'lucide-react';

export function AdminQuickActions() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const actions = [
    {
      id: 'users',
      title: isRTL ? 'ניהול משתמשים' : 'Manage Users',
      description: isRTL ? 'שייך משתמשים לקורסים' : 'Assign users to courses',
      icon: Users,
      path: '/admin/users',
    },
    {
      id: 'lessons',
      title: isRTL ? 'ניהול שיעורים' : 'Manage Lessons',
      description: isRTL ? 'הוסף, ערוך ומחק שיעורים' : 'Add, edit and delete lessons',
      icon: GraduationCap,
      path: '/portal/admin',
    },
    {
      id: 'media',
      title: isRTL ? 'ספריית מדיה' : 'Media Library',
      description: isRTL ? 'נהל וידאו וקבצים' : 'Manage videos and files',
      icon: FolderOpen,
      path: '/media-library',
    },
    {
      id: 'contents',
      title: isRTL ? 'ניהול תכנים' : 'Manage Contents',
      description: isRTL ? 'מאמרים ומשאבים' : 'Articles and resources',
      icon: FileText,
      path: '/contents',
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        {isRTL ? 'גישה מהירה' : 'Quick Actions'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Card
            key={action.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <action.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {action.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
