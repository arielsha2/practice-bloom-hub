import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Compass, Map, PenTool, Bot } from 'lucide-react';
import { BotConfiguration, useUpdateBotConfiguration, useDeleteBotConfiguration } from '@/hooks/useBotConfigurations';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Map,
  PenTool,
  Bot,
};

interface BotConfigCardProps {
  bot: BotConfiguration;
  onEdit: (bot: BotConfiguration) => void;
}

export function BotConfigCard({ bot, onEdit }: BotConfigCardProps) {
  const { isRTL } = useLanguage();
  const updateMutation = useUpdateBotConfiguration();
  const deleteMutation = useDeleteBotConfiguration();
  
  const Icon = iconMap[bot.icon] || Bot;
  
  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({
        id: bot.id,
        updates: { is_active: !bot.is_active },
      });
      toast.success(bot.is_active ? 'הבוט הושבת' : 'הבוט הופעל');
    } catch (error) {
      toast.error('שגיאה בעדכון הבוט');
    }
  };
  
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(bot.id);
      toast.success('הבוט נמחק בהצלחה');
    } catch (error) {
      toast.error('שגיאה במחיקת הבוט');
    }
  };
  
  return (
    <Card className={`relative overflow-hidden ${isRTL ? 'text-right' : ''}`}>
      <div 
        className="absolute top-0 left-0 right-0 h-1" 
        style={{ backgroundColor: bot.color }} 
      />
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${bot.color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: bot.color }} />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">
              {isRTL ? bot.name_he : bot.name_en}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {bot.bot_key}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={bot.is_active}
            onCheckedChange={handleToggleActive}
            disabled={updateMutation.isPending}
          />
          <Badge variant={bot.is_active ? 'default' : 'secondary'}>
            {bot.is_active ? 'פעיל' : 'לא פעיל'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {isRTL ? bot.description_he : bot.description_en}
        </p>
        <div className="text-xs text-muted-foreground mb-4">
          <span>מודל: </span>
          <span className="font-mono">{bot.model}</span>
        </div>
        <div className="flex gap-2 justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
              <AlertDialogHeader>
                <AlertDialogTitle>מחיקת בוט</AlertDialogTitle>
                <AlertDialogDescription>
                  האם אתה בטוח שברצונך למחוק את הבוט "{bot.name_he}"? 
                  פעולה זו תמחק גם את כל השיחות והזיכרונות הקשורים לבוט זה.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  מחק
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" onClick={() => onEdit(bot)}>
            <Pencil className="w-4 h-4 ml-2" />
            עריכה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
