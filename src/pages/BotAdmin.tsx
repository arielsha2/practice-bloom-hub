import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useBotConfigurations, 
  useCreateBotConfiguration, 
  useUpdateBotConfiguration,
  BotConfiguration,
  BotConfigurationInsert,
} from '@/hooks/useBotConfigurations';
import { BotConfigCard } from '@/components/bots/BotConfigCard';
import { BotConfigForm } from '@/components/bots/BotConfigForm';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowRight, Plus, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BotAdmin() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: bots, isLoading: botsLoading } = useBotConfigurations();
  const createMutation = useCreateBotConfiguration();
  const updateMutation = useUpdateBotConfiguration();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<BotConfiguration | null>(null);
  
  // Redirect non-admins
  if (!authLoading && !adminLoading && (!user || !isAdmin)) {
    navigate('/');
    return null;
  }
  
  const isLoading = authLoading || adminLoading || botsLoading;
  
  const handleOpenCreate = () => {
    setEditingBot(null);
    setIsDialogOpen(true);
  };
  
  const handleOpenEdit = (bot: BotConfiguration) => {
    setEditingBot(bot);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBot(null);
  };
  
  const handleSubmit = async (data: BotConfigurationInsert) => {
    try {
      if (editingBot) {
        await updateMutation.mutateAsync({
          id: editingBot.id,
          updates: data,
        });
        toast.success('הבוט עודכן בהצלחה');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('הבוט נוצר בהצלחה');
      }
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בשמירת הבוט');
    }
  };
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard')}
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">ניהול בוטים</h1>
                  <p className="text-sm text-muted-foreground">הגדרת והתאמת עוזרי ה-AI</p>
                </div>
              </div>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 ml-2" />
              הוספת בוט חדש
            </Button>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bots && bots.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <BotConfigCard 
                key={bot.id} 
                bot={bot} 
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין בוטים עדיין</h3>
            <p className="text-muted-foreground mb-6">
              התחל ביצירת הבוט הראשון שלך
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 ml-2" />
              הוספת בוט חדש
            </Button>
          </div>
        )}
      </main>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {editingBot ? `עריכת בוט: ${editingBot.name_he}` : 'הוספת בוט חדש'}
            </DialogTitle>
            <DialogDescription>
              {editingBot 
                ? 'ערוך את הגדרות הבוט, כולל ה-System Prompt והודעת הפתיחה'
                : 'צור בוט AI חדש עם הגדרות מותאמות אישית'
              }
            </DialogDescription>
          </DialogHeader>
          <BotConfigForm
            bot={editingBot ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
