import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCohortsManagement } from '@/hooks/useCohortsManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Calendar, Edit, Power, PowerOff, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function CohortsManager() {
  const { isRTL } = useLanguage();
  const { cohorts, isLoading, createCohort, updateCohort, deactivateCohort, activateCohort } = useCohortsManagement();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<typeof cohorts[0] | null>(null);
  
  const [formData, setFormData] = useState({
    name_he: '',
    name_en: '',
    start_date: '',
    end_date: '',
  });

  const handleCreate = () => {
    createCohort.mutate({
      name_he: formData.name_he,
      name_en: formData.name_en,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ name_he: '', name_en: '', start_date: '', end_date: '' });
      },
    });
  };

  const handleUpdate = () => {
    if (!editingCohort) return;
    
    updateCohort.mutate({
      id: editingCohort.id,
      name_he: formData.name_he,
      name_en: formData.name_en,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    }, {
      onSuccess: () => {
        setEditingCohort(null);
        setFormData({ name_he: '', name_en: '', start_date: '', end_date: '' });
      },
    });
  };

  const openEditDialog = (cohort: typeof cohorts[0]) => {
    setEditingCohort(cohort);
    setFormData({
      name_he: cohort.name_he,
      name_en: cohort.name_en,
      start_date: cohort.start_date || '',
      end_date: cohort.end_date || '',
    });
  };

  const handleToggleActive = (cohort: typeof cohorts[0]) => {
    if (cohort.is_active) {
      deactivateCohort.mutate(cohort.id);
    } else {
      activateCohort.mutate(cohort.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const CohortForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{isRTL ? 'שם בעברית' : 'Name (Hebrew)'}</Label>
          <Input
            value={formData.name_he}
            onChange={(e) => setFormData(prev => ({ ...prev, name_he: e.target.value }))}
            placeholder={isRTL ? 'מחזור א׳' : 'Cohort A'}
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label>{isRTL ? 'שם באנגלית' : 'Name (English)'}</Label>
          <Input
            value={formData.name_en}
            onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
            placeholder="Cohort A"
            dir="ltr"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{isRTL ? 'תאריך התחלה' : 'Start Date'}</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{isRTL ? 'תאריך סיום' : 'End Date'}</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setEditingCohort(null);
            } else {
              setCreateDialogOpen(false);
            }
            setFormData({ name_he: '', name_en: '', start_date: '', end_date: '' });
          }}
        >
          {isRTL ? 'ביטול' : 'Cancel'}
        </Button>
        <Button
          onClick={isEdit ? handleUpdate : handleCreate}
          disabled={!formData.name_he || !formData.name_en || createCohort.isPending || updateCohort.isPending}
        >
          {(createCohort.isPending || updateCohort.isPending)
            ? (isRTL ? 'שומר...' : 'Saving...')
            : (isRTL ? 'שמור' : 'Save')
          }
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {isRTL ? 'ניהול מחזורים' : 'Cohort Management'}
        </CardTitle>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 me-1" />
              {isRTL ? 'מחזור חדש' : 'New Cohort'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRTL ? 'יצירת מחזור חדש' : 'Create New Cohort'}</DialogTitle>
              <DialogDescription>
                {isRTL ? 'הוסף מחזור חדש לקורסים' : 'Add a new cohort for courses'}
              </DialogDescription>
            </DialogHeader>
            <CohortForm />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {cohorts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {isRTL ? 'אין מחזורים עדיין' : 'No cohorts yet'}
          </p>
        ) : (
          <div className="space-y-3">
            {cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  cohort.is_active ? 'border-border' : 'border-muted bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {isRTL ? cohort.name_he : cohort.name_en}
                      </span>
                      <Badge variant={cohort.is_active ? 'default' : 'secondary'}>
                        {cohort.is_active 
                          ? (isRTL ? 'פעיל' : 'Active')
                          : (isRTL ? 'לא פעיל' : 'Inactive')
                        }
                      </Badge>
                    </div>
                    {(cohort.start_date || cohort.end_date) && (
                      <p className="text-sm text-muted-foreground">
                        {cohort.start_date && format(new Date(cohort.start_date), 'dd/MM/yyyy')}
                        {cohort.start_date && cohort.end_date && ' - '}
                        {cohort.end_date && format(new Date(cohort.end_date), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(cohort)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(cohort)}
                    disabled={deactivateCohort.isPending || activateCohort.isPending}
                  >
                    {cohort.is_active 
                      ? <PowerOff className="w-4 h-4 text-muted-foreground" />
                      : <Power className="w-4 h-4 text-primary" />
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingCohort} onOpenChange={(open) => !open && setEditingCohort(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRTL ? 'עריכת מחזור' : 'Edit Cohort'}</DialogTitle>
              <DialogDescription>
                {isRTL ? 'עדכן את פרטי המחזור' : 'Update cohort details'}
              </DialogDescription>
            </DialogHeader>
            <CohortForm isEdit />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
