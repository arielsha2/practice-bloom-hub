import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Bot, Save, Loader2, History, RotateCcw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AVAILABLE_MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o (Recommended)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
  { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'openai/gpt-5', label: 'GPT-5' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
];

interface QASettings {
  id: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

interface HistoryEntry {
  id: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
}

export function QASettingsCard() {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [settings, setSettings] = useState<QASettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<QASettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchHistory();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('qa_ai_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(data as QASettings);
        setOriginalSettings(data as QASettings);
      }
    } catch (error) {
      console.error('Error fetching QA AI settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('qa_ai_settings_history' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) setHistory(data as unknown as HistoryEntry[]);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleSave = async () => {
    if (!settings || !originalSettings) return;
    setIsSaving(true);
    try {
      // Save current settings to history before updating
      await supabase.from('qa_ai_settings_history' as any).insert({
        system_prompt: originalSettings.system_prompt,
        model: originalSettings.model,
        temperature: originalSettings.temperature,
        max_tokens: originalSettings.max_tokens,
        changed_by: user?.id || null,
      });

      const { error } = await supabase
        .from('qa_ai_settings')
        .update({
          system_prompt: settings.system_prompt,
          model: settings.model,
          temperature: settings.temperature,
          max_tokens: settings.max_tokens,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;
      setOriginalSettings({ ...settings });
      toast.success(isRTL ? 'הגדרות AI נשמרו בהצלחה' : 'AI settings saved');
      fetchHistory();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(isRTL ? 'שגיאה בשמירת ההגדרות' : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = (entry: HistoryEntry) => {
    if (!settings) return;
    setSettings({
      ...settings,
      system_prompt: entry.system_prompt,
      model: entry.model,
      temperature: entry.temperature,
      max_tokens: entry.max_tokens,
    });
    toast.info(isRTL ? 'הגדרות שוחזרו — לחצי "שמור" כדי להחיל' : 'Settings restored — click "Save" to apply');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          {isRTL ? 'הגדרות AI לשאלות ותשובות' : 'QA AI Settings'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Prompt */}
        <div className="space-y-2">
          <Label>{isRTL ? 'הנחיית מערכת (System Prompt)' : 'System Prompt'}</Label>
          <Textarea
            value={settings.system_prompt}
            onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            className="min-h-64 max-h-[500px] overflow-y-auto text-sm"
            dir="auto"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {isRTL
                ? 'ההנחיה תישלח יחד עם שאלת הסטודנט כדי ליצור תשובה בסגנון שלך. ניתן להדביק כאן תמלולים ודוגמאות שאלה-תשובה.'
                : 'This prompt is sent with student questions. You can paste transcripts and Q&A examples here.'}
            </span>
            <span className="shrink-0 ms-2">{settings.system_prompt.length.toLocaleString()} {isRTL ? 'תווים' : 'chars'}</span>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label>{isRTL ? 'מודל AI' : 'AI Model'}</Label>
          <Select
            value={settings.model}
            onValueChange={(value) => setSettings({ ...settings, model: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <Label>
            {isRTL ? 'יצירתיות (Temperature)' : 'Temperature'}: {settings.temperature}
          </Label>
          <Slider
            value={[settings.temperature]}
            onValueChange={([v]) => setSettings({ ...settings, temperature: v })}
            min={0}
            max={1}
            step={0.1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{isRTL ? 'מדויק' : 'Precise'}</span>
            <span>{isRTL ? 'יצירתי' : 'Creative'}</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label>
            {isRTL ? 'אורך תשובה מקסימלי' : 'Max Response Length'}: {settings.max_tokens}
          </Label>
          <Slider
            value={[settings.max_tokens]}
            onValueChange={([v]) => setSettings({ ...settings, max_tokens: v })}
            min={200}
            max={8000}
            step={100}
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin me-2" />
          ) : (
            <Save className="w-4 h-4 me-2" />
          )}
          {isRTL ? 'שמור הגדרות' : 'Save Settings'}
        </Button>

        {/* History */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                {isRTL ? 'היסטוריית גרסאות' : 'Version History'}
                {history.length > 0 && <span className="text-xs text-muted-foreground">({history.length})</span>}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRTL ? 'אין היסטוריה עדיין' : 'No history yet'}
              </p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')} · {AVAILABLE_MODELS.find(m => m.value === entry.model)?.label || entry.model}
                    </div>
                    <p className="truncate text-muted-foreground" dir="auto">
                      {entry.system_prompt.slice(0, 120)}...
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(entry)}
                    className="shrink-0"
                  >
                    <RotateCcw className="w-3 h-3 me-1" />
                    {isRTL ? 'שחזר' : 'Restore'}
                  </Button>
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
