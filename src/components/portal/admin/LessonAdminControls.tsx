import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, FolderOpen, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { LessonEditDialog } from './LessonEditDialog';
import { LessonMediaDialog } from './LessonMediaDialog';

interface LessonAdminControlsProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
  };
  onUpdate: () => void;
}

export function LessonAdminControls({ lesson, onUpdate }: LessonAdminControlsProps) {
  const navigate = useNavigate();
  const { isRTL, t } = useLanguage();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // First delete related records
      await supabase.from('lesson_media_links').delete().eq('lesson_id', lesson.id);
      await supabase.from('user_lesson_progress').delete().eq('lesson_id', lesson.id);
      await supabase.from('qa_threads').delete().eq('lesson_id', lesson.id);

      // Then delete the lesson
      const { error } = await supabase.from('lessons').delete().eq('id', lesson.id);
      
      if (error) throw error;

      toast.success(t('portal.admin.lessonDeleted'));
      navigate('/portal/admin');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error(t('portal.admin.deleteError'));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
            <Shield className="w-3 h-3 mr-1" />
            {isRTL ? 'מצב ניהול' : 'Admin Mode'}
          </Badge>
          
          <div className="flex-1" />
          
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setEditDialogOpen(true)}
          >
            <Pencil className="w-3 h-3 mr-1" />
            {isRTL ? 'ערוך פרטים' : 'Edit Details'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setMediaDialogOpen(true)}
          >
            <FolderOpen className="w-3 h-3 mr-1" />
            {isRTL ? 'נהל מדיה' : 'Manage Media'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            {isRTL ? 'מחק' : 'Delete'}
          </Button>
        </div>
      </div>

      <LessonEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lesson={lesson}
        onSaved={onUpdate}
      />

      <LessonMediaDialog
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
        lessonId={lesson.id}
        onUpdate={onUpdate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? 'מחק שיעור?' : 'Delete Lesson?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? 'פעולה זו תמחק את השיעור, כל המדיה המקושרת והשאלות. לא ניתן לבטל.'
                : 'This will delete the lesson, all linked media, and questions. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRTL ? 'ביטול' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (isRTL ? 'מוחק...' : 'Deleting...') : (isRTL ? 'מחק' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
