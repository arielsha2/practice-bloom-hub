import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Bot, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Fast)' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (Best)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'openai/gpt-5', label: 'GPT-5' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano (Fast)' },
];

interface QASettings {
  id: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

export function QASettingsCard() {
  const { isRTL } = useLanguage();
  const [settings, setSettings] = useState<QASettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('qa_ai_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(data as QASettings);
    } catch (error) {
      console.error('Error fetching QA AI settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
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
      toast.success(isRTL ? 'הגדרות AI נשמרו בהצלחה' : 'AI settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(isRTL ? 'שגיאה בשמירת ההגדרות' : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
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
            className="min-h-32 font-mono text-sm"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">
            {isRTL
              ? 'ההנחיה תישלח יחד עם שאלת הסטודנט כדי ליצור תשובה בסגנון שלך'
              : 'This prompt is sent along with student questions to generate answers in your style'}
          </p>
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
            max={4000}
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
      </CardContent>
    </Card>
  );
}
