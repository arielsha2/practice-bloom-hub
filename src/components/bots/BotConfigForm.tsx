import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BotConfiguration, BotConfigurationInsert } from '@/hooks/useBotConfigurations';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  bot_key: z.string().min(2, 'מזהה הבוט חייב להיות לפחות 2 תווים').regex(/^[a-z0-9-]+$/, 'מזהה הבוט יכול להכיל רק אותיות קטנות, מספרים ומקפים'),
  name_he: z.string().min(2, 'שם הבוט חייב להיות לפחות 2 תווים'),
  name_en: z.string().min(2, 'Bot name must be at least 2 characters'),
  description_he: z.string().optional(),
  description_en: z.string().optional(),
  system_prompt: z.string().min(10, 'ה-System Prompt חייב להיות לפחות 10 תווים'),
  welcome_message_he: z.string().optional(),
  welcome_message_en: z.string().optional(),
  model: z.string(),
  temperature: z.coerce.number().min(0).max(2),
  max_tokens: z.coerce.number().min(100).max(8000),
  is_active: z.boolean(),
  icon: z.string(),
  color: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const models = [
  { value: 'openai/gpt-4o', label: 'GPT-4o (מומלץ)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (מהיר)' },
  { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (מאוזן)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (מתקדם)' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (מהיר)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (מאוזן)' },
  { value: 'openai/gpt-5', label: 'GPT-5 (מתקדם)' },
];

const icons = [
  { value: 'Compass', label: '🧭 מצפן' },
  { value: 'Map', label: '🗺️ מפה' },
  { value: 'PenTool', label: '✏️ עט' },
  { value: 'Bot', label: '🤖 בוט' },
];

interface BotConfigFormProps {
  bot?: BotConfiguration;
  onSubmit: (data: BotConfigurationInsert) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BotConfigForm({ bot, onSubmit, onCancel, isSubmitting }: BotConfigFormProps) {
  const { isRTL } = useLanguage();
  const isEditing = !!bot;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bot_key: bot?.bot_key ?? '',
      name_he: bot?.name_he ?? '',
      name_en: bot?.name_en ?? '',
      description_he: bot?.description_he ?? '',
      description_en: bot?.description_en ?? '',
      system_prompt: bot?.system_prompt ?? '',
      welcome_message_he: bot?.welcome_message_he ?? '',
      welcome_message_en: bot?.welcome_message_en ?? '',
      model: bot?.model ?? 'google/gemini-3-flash-preview',
      temperature: bot?.temperature ?? 0.7,
      max_tokens: bot?.max_tokens ?? 2000,
      is_active: bot?.is_active ?? true,
      icon: bot?.icon ?? 'Compass',
      color: bot?.color ?? '#829281',
    },
  });
  
  const handleSubmit = async (data: FormValues) => {
    const submitData: BotConfigurationInsert = {
      bot_key: data.bot_key,
      name_he: data.name_he,
      name_en: data.name_en,
      description_he: data.description_he || null,
      description_en: data.description_en || null,
      system_prompt: data.system_prompt,
      welcome_message_he: data.welcome_message_he || null,
      welcome_message_en: data.welcome_message_en || null,
      model: data.model,
      temperature: data.temperature,
      max_tokens: data.max_tokens,
      is_active: data.is_active,
      icon: data.icon,
      color: data.color,
    };
    await onSubmit(submitData);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="bot_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מזהה הבוט (bot_key)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="niche-finder" 
                    disabled={isEditing}
                    className="font-mono text-left"
                    dir="ltr"
                  />
                </FormControl>
                <FormDescription>מזהה ייחודי באותיות קטנות ומקפים</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">בוט פעיל</FormLabel>
                  <FormDescription>
                    האם הבוט זמין למשתמשים
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name_he"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שם (עברית)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="בוט מציאת הנישה" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שם (אנגלית)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Niche Finder Bot" dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="description_he"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תיאור (עברית)</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="מסייע למטפלים לגלות את הנישה הייחודית שלהם" rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תיאור (אנגלית)</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Helps therapists discover their unique niche" rows={2} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* System Prompt */}
        <FormField
          control={form.control}
          name="system_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="אתה עוזר AI מקצועי..." 
                  className="min-h-64 max-h-[500px] overflow-y-auto text-sm"
                  dir="auto"
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormDescription>
                  ההנחיות הראשיות שמגדירות את אופי הבוט. ניתן להדביק תמלולים ודוגמאות שאלה-תשובה
                </FormDescription>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {field.value?.length || 0} תווים
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Welcome Messages */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="welcome_message_he"
            render={({ field }) => (
              <FormItem>
                <FormLabel>הודעת פתיחה (עברית)</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="שלום! אני כאן לעזור לך..." rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="welcome_message_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>הודעת פתיחה (אנגלית)</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Hello! I'm here to help you..." rows={3} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Advanced Settings */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger>הגדרות מתקדמות</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מודל AI</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר מודל" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.1" min="0" max="2" dir="ltr" />
                        </FormControl>
                        <FormDescription>0 = מדויק, 1 = יצירתי</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="max_tokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="100" max="8000" dir="ltr" />
                        </FormControl>
                        <FormDescription>אורך תשובה מקסימלי</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>אייקון</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר אייקון" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {icons.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value}>
                                {icon.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>צבע</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} type="text" placeholder="#829281" dir="ltr" />
                          </FormControl>
                          <Input 
                            type="color" 
                            value={field.value} 
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-12 p-1 h-10"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            ביטול
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            {isEditing ? 'שמור שינויים' : 'צור בוט'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
